import * as program from 'commander';

import { ActiveAccountService } from 'jslib-common/abstractions/activeAccount.service';
import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { SyncService } from 'jslib-common/abstractions/sync.service';
import { VaultTimeoutService } from 'jslib-common/abstractions/vaultTimeout.service';

import { Response } from 'jslib-node/cli/models/response';

import { TemplateResponse } from '../models/response/templateResponse';

export class StatusCommand {
    constructor(private envService: EnvironmentService, private syncService: SyncService,
        private activeAccount: ActiveAccountService, private vaultTimeoutService: VaultTimeoutService) {
    }

    async run(): Promise<Response> {
        try {
            return Response.success(new TemplateResponse({
                serverUrl: this.baseUrl(),
                lastSync: await this.syncService.getLastSync(),
                userEmail: this.activeAccount.email,
                userId: this.activeAccount.userId,
                status: await this.status(),
            }));
        } catch (e) {
            return Response.error(e);
        }
    }

    private baseUrl(): string {
        return this.envService.getUrls().base;
    }

    private async status(): Promise<string> {
        if (!this.activeAccount.isAuthenticated) {
            return 'unauthenticated';
        }

        const isLocked = await this.vaultTimeoutService.isLocked();
        return isLocked ? 'locked' : 'unlocked';
    }
}
