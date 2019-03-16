import * as program from 'commander';

import { AuthService } from 'jslib/abstractions/auth.service';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';

export class LogoutCommand {
    constructor(private authService: AuthService, private logoutCallback: () => Promise<void>) { }

    async run(cmd: program.Command) {
        await this.logoutCallback();
        this.authService.logOut(() => { /* Do nothing */ });
        const res = new MessageResponse('You have logged out.', null);
        return Response.success(res);
    }
}
