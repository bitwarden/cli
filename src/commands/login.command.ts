import * as program from 'commander';

import { AuthResult } from 'jslib/models/domain/authResult';

import { AuthService } from 'jslib/abstractions/auth.service';

import { Response } from '../models/response';

export class LoginCommand {
    constructor(private authService: AuthService) { }

    async run(email: string, password: string, cmd: program.Command) {
        try {
            const result = await this.authService.logIn(email, password);
            // TODO: 2FA
            return Response.success();
        } catch (e) {
            return Response.success(e.toString());
        }
    }
}
