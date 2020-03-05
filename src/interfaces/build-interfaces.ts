export enum MUTEX_RESOURCE_TYPE {
  U_INT_8 = "Uint8",
  U_INT_16 = "Uint16",
  U_INT_32 = "Uint32"
}

export enum SHARED_RESOURCE {
  MUTEX = "mutex",
  DATA_STORE = "dataStore"
}

export interface ISharedMap {
  [contextName: string]: {
    [operationName: string]: Set<number | string>
  }
}

export interface IMutex {
  resourceName: SHARED_RESOURCE.MUTEX
  resourceType: MUTEX_RESOURCE_TYPE
  size: number
}

export enum MUTEX_RESOURCE {
  OLD_VALUE = 0,
  NEW_VALUE = 1
}