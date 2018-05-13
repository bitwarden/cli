import * as program from 'commander';

import { AuthResult } from 'jslib/models/domain/authResult';

import { AuthService } from 'jslib/abstractions/auth.service';

export class LoginCommand {
    constructor(private authService: AuthService) {

    }

    run(email: string, password: string, cmd: program.Command) {

    }
}
