import * as program from 'commander';

import { EnvironmentService, SyncService, UserService, VaultTimeoutService } from 'jslib/abstractions';
import { Response } from 'jslib/cli/models/response';
import { TemplateResponse } from '../models/response/templateResponse';

export class StatusCommand {
    constructor(
        private envService: EnvironmentService,
        private syncService: SyncService,
        private userService: UserService,
        private vaultTimeoutService: VaultTimeoutService) {
    }

    async run(cmd: program.Command): Promise<Response> {
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
        const isAuthed = await this.userService.isAuthenticated();
        if (!isAuthed) {
            return 'unauthenticated';
        }

        const isLocked = await this.vaultTimeoutService.isLocked();
        if (isLocked) {
            return 'locked';
        } else {
            return 'unlocked';
        }
    }
}
