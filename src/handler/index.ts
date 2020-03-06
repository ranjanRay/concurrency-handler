import { app } from "../app";
import {
  OPERATION_LOCATION,
  RESOURCE_LOCK_STATUS,
  RESOURCE_LOCK_ATTEMPT,
  OPERATION_NAME,
  CONTEXT_NAME
} from "../interfaces/application-interfaces";
import {
  MUTEX_RESOURCE_TYPE,
  ISharedMap,
  SHARED_RESOURCE,
  MUTEX_RESOURCE
} from "../interfaces/build-interfaces";

let resource: Uint32Array | Uint16Array | Uint8Array;

export const createMutexResource = (
  size: number,
  type: MUTEX_RESOURCE_TYPE = MUTEX_RESOURCE_TYPE.U_INT_8
): Uint32Array | Uint16Array | Uint8Array | null => {
  if (size <= 0) {
    return null;
  }
  const sab = new SharedArrayBuffer(size);
  switch (type) {
    case MUTEX_RESOURCE_TYPE.U_INT_8:
      resource = new Uint8Array(sab);
      return resource;
    case MUTEX_RESOURCE_TYPE.U_INT_16:
      resource = new Uint16Array(sab);
      return resource;
    case MUTEX_RESOURCE_TYPE.U_INT_32:
      resource = new Uint32Array(sab);
      return resource;
    default:
      return null;
  }
};

export const createSharedMap = (context: CONTEXT_NAME = CONTEXT_NAME.TEST) => {
  const sharedMap: ISharedMap = {
    [context]: {}
  };
  return sharedMap;
};

export const putIfAbsent = async (
  context: CONTEXT_NAME = CONTEXT_NAME.TEST,
  operationName: OPERATION_NAME | string,
  values: (number | string)[],
  requestId: number | string
): Promise<boolean> => {
  const mutexResource = app.get(SHARED_RESOURCE.MUTEX);
  const dataStore = app.get(SHARED_RESOURCE.DATA_STORE) as ISharedMap;
  const location = parseInt(OPERATION_LOCATION[operationName], 10);
  let locked = lockImmediatelyIfAvailable(mutexResource, location);
  if (!locked) {
    locked = await acquireLock(mutexResource, location);
  }
  if (!locked) {
    console.warn(
      `REQUEST-ID: ${requestId} FAILED TO ACQUIRE LOCK @location: ${location}`
    );
    return false;
  }
  console.warn(`REQUEST-ID: ${requestId} ACQUIRED LOCK @location: ${location}`);

  let doesExist = false;
  for (const val of values) {
    if (
      Boolean(dataStore[context]) &&
      Boolean(dataStore[context][operationName]) &&
      dataStore[context][operationName].has(val)
    ) {
      doesExist = true;
      break;
    }
  }
  if (!doesExist) {
    if (!dataStore[context]) {
      dataStore[context] = {
        operationName: new Set()
      };
    } else if (!dataStore[context][operationName]) {
      dataStore[context][operationName] = new Set();
    }
    values.forEach(el => dataStore[context][operationName].add(el));
    console.warn(
      `REQUEST-ID: ${requestId} SUCCESSFULLY WROTE: ${JSON.stringify(
        values
      )} INTO DATA-STORE.`
    );
  } else {
    console.warn(
      `REQUEST-ID: ${requestId} FOUND OVERLAPPING DATA: ${JSON.stringify(
        values
      )} INTO DATA-STORE.`
    );
  }
  releaseLock(mutexResource, location, requestId);
  return !doesExist;
};

const lockImmediatelyIfAvailable = (
  mutex: Uint8Array | Uint16Array,
  location: number,
  oldExpectedValue: number = MUTEX_RESOURCE.OLD_VALUE,
  newValue: number = MUTEX_RESOURCE.NEW_VALUE
): boolean =>
  Atomics.compareExchange(mutex, location, oldExpectedValue, newValue) ===
  oldExpectedValue;

const acquireLock = async (
  resource_: Uint8Array | Uint16Array | Uint32Array,
  location: number,
  attempts: number = 0,
  oldExpectedValue: number = MUTEX_RESOURCE.OLD_VALUE,
  newValue: number = MUTEX_RESOURCE.NEW_VALUE
) => {
  // acquire lock on the resource.
  if (attempts > RESOURCE_LOCK_ATTEMPT.ATTEMPT_ACQUIRING_LOCK_COUNT) {
    return false;
  }
  return _acquireLock(resource_, location, oldExpectedValue, newValue).then(
    res => {
      if (res) {
        console.warn(RESOURCE_LOCK_STATUS.LOCKED);
        return true;
      }
      return acquireLock(
        resource_,
        location,
        ++attempts,
        oldExpectedValue,
        newValue
      );
    }
  );
};

const _acquireLock = async (
  _resource: Uint8Array | Uint16Array | Uint32Array,
  index: number,
  oldExpectedValue: number,
  newValue: number
): Promise<boolean> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (
        Atomics.compareExchange(
          _resource,
          index,
          oldExpectedValue,
          newValue
        ) === oldExpectedValue
      ) {
        resolve(true);
      }
      resolve(false);
    }, RESOURCE_LOCK_ATTEMPT.TIMEOUT_LIMIT);
  });

const releaseLock = (
  res: Uint8Array | Uint16Array,
  location: number,
  requestId?: number | string
): boolean => {
  try {
    Atomics.store(res, location, MUTEX_RESOURCE.OLD_VALUE);
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteFromMap = async (
  context: CONTEXT_NAME = CONTEXT_NAME.TEST,
  operationName: string,
  values: (number | string)[],
  requestId: number | string
): Promise<boolean> => {
  const mutexRes = app.get(SHARED_RESOURCE.MUTEX);
  const map = app.get(SHARED_RESOURCE.DATA_STORE) as ISharedMap;
  const location = parseInt(OPERATION_LOCATION[operationName], 10);
  let locked = lockImmediatelyIfAvailable(mutexRes, location);
  if (!locked) {
    locked = await acquireLock(resource, location);
  }
  if (!locked) {
    console.error("Unable to acquire lock.. Initiating force delete from map.");
  }
  console.warn(
    `REQUEST-ID: ${requestId} LOCKED location: ${location} BEFORE ATTEMPTING DELETE.`
  );
  values.forEach(val => map[context][operationName].delete(val));
  console.warn(
    `REQUEST-ID: ${requestId} SUCCESSFULLY DELETED DATA: ${JSON.stringify(
      values
    )} FROM DATA-STORE.`
  );
  releaseLock(mutexRes, location, requestId);
  console.warn(
    `REQUEST-ID: ${requestId} un-LOCKED location: ${location} POST SUCCESSFUL DELETION FROM DATA-STORE.`
  );
  return true;
};
