import * as program from 'commander';

import { UserService, VaultTimeoutService } from 'jslib/abstractions';
import { Response } from 'jslib/cli/models/response';
import { TemplateResponse } from '../models/response/templateResponse';

export class StatusCommand {
    constructor(private userService: UserService, private vaultTimeoutService: VaultTimeoutService) {
    }

    async run(cmd: program.Command): Promise<Response> {
        const status = await this.status();
        return Response.success(new TemplateResponse({
            status: status,
        }));
    }

    async status(): Promise<string> {
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
