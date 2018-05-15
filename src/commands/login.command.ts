import * as program from 'commander';
import * as readline from 'readline-sync';

import { AuthResult } from 'jslib/models/domain/authResult';

import { AuthService } from 'jslib/abstractions/auth.service';

import { Response } from '../models/response';

export class LoginCommand {
    constructor(private authService: AuthService) { }

    async run(email: string, password: string, cmd: program.Command) {
        if (email == null || email === '') {
            email = readline.question('Email Address: ');
        }
        if (email == null || email.trim() === '') {
            return Response.badRequest('Email address is required.');
        }
        if (email.indexOf('@') === -1) {
            return Response.badRequest('Email address is invalid.');
        }

        if (password == null || password === '') {
            password = readline.question('Master Password: ', {
                hideEchoBack: true,
                mask: '*',
            });
        }
        if (password == null || password === '') {
            return Response.badRequest('Master password is required.');
        }

        try {
            const response = await this.authService.logIn(email, password);
            if (response.twoFactor) {
                let selectedProvider: any = null;
                const twoFactorProviders = this.authService.getSupportedTwoFactorProviders(null);
                if (twoFactorProviders.length === 0) {
                    return Response.badRequest('No providers available for this client.');
                }

                if (twoFactorProviders.length === 1) {
                    selectedProvider = twoFactorProviders[0];
                } else {
                    const options = twoFactorProviders.map((p) => p.name);
                    const i = readline.keyInSelect(options, 'Two-step login method: ', { cancel: 'Cancel' });
                    if (i < 0) {
                        return Response.error('Login failed.');
                    }
                    selectedProvider = twoFactorProviders[i];
                }

                const twoFactorToken = readline.question('Two-step login token for ' + selectedProvider.name + ': ');
                if (twoFactorToken == null || twoFactorToken === '') {
                    return Response.badRequest('Token is required.');
                }

                const twoFactorResponse = await this.authService.logInTwoFactor(selectedProvider.type,
                    twoFactorToken, false);
                if (twoFactorResponse.twoFactor) {
                    return Response.error('Login failed.');
                }
            }
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }
}
