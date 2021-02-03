import * as program from 'commander';

import { SyncService } from 'jslib/abstractions/sync.service';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';
import { StringResponse } from 'jslib/cli/models/response/stringResponse';

export class SyncCommand {
    constructor(private syncService: SyncService) { }

    async run(options: program.OptionValues): Promise<Response> {
        if (options.last || false) {
            return await this.getLastSync();
        }

        try {
            const result = await this.syncService.fullSync(options.force || false, true);
            const res = new MessageResponse('Syncing complete.', null);
            return Response.success(res);
        } catch (e) {
            return Response.error('Syncing failed: ' + e.toString());
        }
    }

    private async getLastSync() {
        const lastSyncDate = await this.syncService.getLastSync();
        const res = new StringResponse(lastSyncDate == null ? null : lastSyncDate.toISOString());
        return Response.success(res);
    }
}
