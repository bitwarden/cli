import * as program from 'commander';

import { SyncService } from 'jslib/abstractions/sync.service';

export class SyncCommand {
    constructor(private syncService: SyncService) { }

    async run(cmd: program.Command) {
        try {
            const result = await this.syncService.fullSync(false);
            console.log(result);
        } catch (e) {
            console.log(e);
        }
    }
}
