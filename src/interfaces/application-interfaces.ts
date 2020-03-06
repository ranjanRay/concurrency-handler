export enum CONTEXT_NAME {
  TEST = "TEST"
}

export enum OPERATION_NAME {
  TEST = "TEST"
}

export enum OPERATION_LOCATION {
  TEST = 0
}

export const RESOURCE_LOCK_STATUS = {
  LOCKED: "locked",
  UNLOCKED: "unlocked",
  FAILED_TRYING: "failedTrying"
};

export enum RESOURCE_LOCK_ATTEMPT {
  TIMEOUT_LIMIT = 4,
  ATTEMPT_ACQUIRING_LOCK_COUNT = 1000
}
