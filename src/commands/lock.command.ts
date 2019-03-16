import * as program from 'commander';

import { LockService } from 'jslib/abstractions/lock.service';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';

export class LockCommand {
    constructor(private lockService: LockService) { }

    async run(cmd: program.Command) {
        await this.lockService.lock();
        process.env.BW_SESSION = null;
        const res = new MessageResponse('Your vault is locked.', null);
        return Response.success(res);
    }
}
