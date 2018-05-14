import * as program from 'commander';

import { SyncService } from 'jslib/abstractions/sync.service';

import { Response } from '../models/response';

export class SyncCommand {
    constructor(private syncService: SyncService) { }

    async run(cmd: program.Command): Promise<Response> {
        try {
            const result = await this.syncService.fullSync(false);
            return Response.success();
        } catch (e) {
            return Response.success(e.toString());
        }
    }
}
