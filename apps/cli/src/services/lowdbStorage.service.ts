import * as lock from "proper-lockfile";
import { OperationOptions } from "retry";

import { LogService } from "jslib-common/abstractions/log.service";
import { Utils } from "jslib-common/misc/utils";
import { LowdbStorageService as LowdbStorageServiceBase } from "jslib-node/services/lowdbStorage.service";

const retries: OperationOptions = {
  retries: 50,
  minTimeout: 100,
  maxTimeout: 250,
  factor: 2,
};

export class LowdbStorageService extends LowdbStorageServiceBase {
  constructor(
    logService: LogService,
    defaults?: any,
    dir?: string,
    allowCache = false,
    private requireLock = false
  ) {
    super(logService, defaults, dir, allowCache);
  }

  protected async lockDbFile<T>(action: () => T): Promise<T> {
    if (this.requireLock && !Utils.isNullOrWhitespace(this.dataFilePath)) {
      this.logService.info("acquiring db file lock");
      return await lock.lock(this.dataFilePath, { retries: retries }).then((release) => {
        try {
          return action();
        } finally {
          release();
        }
      });
    } else {
      return action();
    }
  }
}
