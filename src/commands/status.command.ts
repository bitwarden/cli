import * as program from 'commander';

import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { SyncService } from 'jslib/abstractions/sync.service';
import { UserService } from 'jslib/abstractions/user.service';
import { VaultTimeoutService } from 'jslib/abstractions/vaultTimeout.service';

import { Response } from 'jslib/cli/models/response';

import { TemplateResponse } from '../models/response/templateResponse';

export class StatusCommand {
    constructor(private envService: EnvironmentService, private syncService: SyncService,
        private userService: UserService, private vaultTimeoutService: VaultTimeoutService) {
    }

    async run(): Promise<Response> {
        try {
            const baseUrl = this.baseUrl();
            const status = await this.status();
            const lastSync = await this.syncService.getLastSync();
            const userId = await this.userService.getUserId();
            const email = await this.userService.getEmail();

            return Response.success(new TemplateResponse({
                serverUrl: baseUrl,
                lastSync: lastSync,
                userEmail: email,
                userId: userId,
                status: status,
            }));
        } catch (e) {
            return Response.error(e);
        }
    }

    private baseUrl(): string {
        let url = this.envService.baseUrl;
        if (url == null) {
            url = 'https://bitwarden.com';
        }
        return url;
    }

    private async status(): Promise<string> {
        const authed = await this.userService.isAuthenticated();
        if (!authed) {
            return 'unauthenticated';
        }

        const isLocked = await this.vaultTimeoutService.isLocked();
        return isLocked ? 'locked' : 'unlocked';
    }
}
