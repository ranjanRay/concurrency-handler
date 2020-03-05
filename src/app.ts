import * as express from 'express'
import * as logger from 'winston'
import { createMutexResource, createSharedMap, putIfAbsent, deleteFromMap } from './handler'
import { SHARED_RESOURCE, MUTEX_RESOURCE_TYPE } from './interfaces/build-interfaces'
import { execute1, execute3 } from './apis/mock-async-operation'
import { CONTEXT_NAME, OPERATION_NAME } from './interfaces/application-interfaces'
import * as bodyParser from "body-parser"
export const app: express.Application = express()
const port = 4040

app.use(bodyParser())
app.use((err, req, res, next) => {
    logger.error(err)
    res.status(500).send(JSON.stringify(err))
    next()
})
const resource = createMutexResource(16)
const serializer = createMutexResource(4, MUTEX_RESOURCE_TYPE.U_INT_32)
if(!resource) {
    logger.error(`resource allocation failed.. exiting.`)
    process.exit(1)
}
const sharedMap = createSharedMap()
app.set(SHARED_RESOURCE.MUTEX, resource)
app.set(SHARED_RESOURCE.DATA_STORE, sharedMap)
app.set("serializer", serializer)
app.post('/execute-test', async (req, res) => {

    const requestId = Atomics.add(app.get('serializer'), 0, 1)
    const mapContents = req.body.data as any[]
    
    const success = await putIfAbsent(
      CONTEXT_NAME.TEST,
      OPERATION_NAME.TEST,
      mapContents,
      requestId
    )
    if (!success) {
      console.error(
        `REQUEST-ID: ${requestId} FAILED. ${JSON.stringify(mapContents)}`
      )
      // throw new Error(`similar request already in process. Please retry later.`)
      return res.status(400).send(`\n*************   ERROR!: similar request already in process. Please retry later.  ************\n`)
    }
    try{
      console.warn(
        `REQUEST-ID: ${requestId} EXECUTING AN ASYNC OPERATION NOW.`
      )
        await execute1(mapContents)
        console.warn(
          `REQUEST-ID: ${requestId} FINISHED EXECUTION. ATTEMPTING DELETE OPERATION OF ${JSON.stringify(mapContents)}.`
        )
        return res.status(200).send(`\n*************   SUCCESS: Executed successfully.  ************\n`)
    } finally {
      await deleteFromMap(CONTEXT_NAME.TEST, OPERATION_NAME.TEST, mapContents, requestId)
      console.info(
        `REQUEST-ID: ${requestId} RETURNING SUCCESS TO CLIENT.`
      )
      return
    }
})

app.listen(port, () => {
    console.info(`concurrency-handler running on port ${port}`)
})
