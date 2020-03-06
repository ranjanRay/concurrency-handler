import * as express from "express";
import {
  createMutexResource,
  createSharedMap,
  putIfAbsent,
  deleteFromMap
} from "./handler";
import {
  SHARED_RESOURCE,
  MUTEX_RESOURCE_TYPE
} from "./interfaces/build-interfaces";
import { executeAsyncOp } from "./api/mock-async-operation";
import {
  CONTEXT_NAME,
  OPERATION_NAME
} from "./interfaces/application-interfaces";
import * as bodyParser from "body-parser";
export const app: express.Application = express();
const port = 4040;

app.use(bodyParser());
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(JSON.stringify(err));
  next();
});
const resource = createMutexResource(1);
const serializer = createMutexResource(4, MUTEX_RESOURCE_TYPE.U_INT_32);
if (!resource) {
  console.error(`resource allocation failed.. exiting.`);
  process.exit(1);
}
const sharedMap = createSharedMap();
app.set(SHARED_RESOURCE.MUTEX, resource);
app.set(SHARED_RESOURCE.DATA_STORE, sharedMap);
app.set("serializer", serializer);
app.post("/execute-async-operation/:timeout", async (req, res) => {
  const requestId = Atomics.add(app.get("serializer"), 0, 1);
  const mapContents = req.body.data as any[];
  const timeout = parseFloat(req.params.timeout) * 1000;
  if (isNaN(timeout)) {
    return res.status(400).send({
      success: false,
      many: false,
      data: {
        message: `timeout is ${timeout}`
      }
    });
  }

  const success = await putIfAbsent(
    CONTEXT_NAME.TEST,
    OPERATION_NAME.TEST,
    mapContents,
    requestId
  );
  if (!success) {
    console.error(
      `REQUEST-ID: ${requestId} CONFLICTS WITH AN ONGOING OPERATION. ${JSON.stringify(
        mapContents
      )}`
    );
    return res
      .status(400)
      .send(
        `\n*************   CONFLICT!: similar request already in process. Please retry later.  ************\n`
      );
  }
  try {
    console.info(
      `REQUEST-ID: ${requestId} STORED DATA: ${JSON.stringify(
        mapContents
      )} INTO THE DATA-STORE.`
    );
    console.warn(`REQUEST-ID: ${requestId} TO EXECUTE AN ASYNC OPERATION NOW.`);
    const asyncOpPromise = executeAsyncOp(mapContents, timeout);
    console.warn(`REQUEST-ID: ${requestId} EXECUTING AN ASYNC OPERATION NOW.`);
    res.status(200).send({
      success: true,
      many: false,
      data: {
        shouldCompleteIn: timeout + " ms."
      }
    });
    await asyncOpPromise;
    console.warn(
      `REQUEST-ID: ${requestId} FINISHED EXECUTION. ATTEMPTING DELETE OPERATION OF ${JSON.stringify(
        mapContents
      )}.`
    );
  } finally {
    await deleteFromMap(
      CONTEXT_NAME.TEST,
      OPERATION_NAME.TEST,
      mapContents,
      requestId
    );
    console.info(`REQUEST-ID: ${requestId} CLEARED IT'S DATA FROM DATA-STORE.`);
  }
});

app.listen(port, () => {
  console.info(`concurrency-handler running on port ${port}`);
});
