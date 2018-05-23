import * as program from 'commander';
import * as inquirer from 'inquirer';

import { TwoFactorProviderType } from 'jslib/enums/twoFactorProviderType';

import { AuthResult } from 'jslib/models/domain/authResult';
import { TwoFactorEmailRequest } from 'jslib/models/request/twoFactorEmailRequest';

import { ApiService } from 'jslib/abstractions/api.service';
import { AuthService } from 'jslib/abstractions/auth.service';
import { CryptoFunctionService } from 'jslib/abstractions/cryptoFunction.service';
import { SyncService } from 'jslib/abstractions/sync.service';

import { Response } from '../models/response';
import { MessageResponse } from '../models/response/messageResponse';

import { Utils } from 'jslib/misc/utils';

export class LoginCommand {
    constructor(private authService: AuthService, private apiService: ApiService,
        private cryptoFunctionService: CryptoFunctionService, private syncService: SyncService) { }

    async run(email: string, password: string, cmd: program.Command) {
        if (email == null || email === '') {
            const answer = await inquirer.prompt<any>({
                type: 'input',
                name: 'email',
                message: 'Email address:',
            });
            email = answer.email;
        }
        if (email == null || email.trim() === '') {
            return Response.badRequest('Email address is required.');
        }
        if (email.indexOf('@') === -1) {
            return Response.badRequest('Email address is invalid.');
        }

        if (password == null || password === '') {
            const answer = await inquirer.prompt<any>({
                type: 'password',
                name: 'password',
                message: 'Master password:',
                mask: '*',
            });
            password = answer.password;
        }
        if (password == null || password === '') {
            return Response.badRequest('Master password is required.');
        }

        let twoFactorToken: string = cmd.code;
        let twoFactorMethod: TwoFactorProviderType = null;
        try {
            if (cmd.method != null) {
                twoFactorMethod = parseInt(cmd.method, null);
            }
        } catch (e) {
            return Response.error('Invalid two-step login method.');
        }

        try {
            await this.setNewSessionKey();
            let response: AuthResult = null;
            if (twoFactorToken != null && twoFactorMethod != null) {
                response = await this.authService.logInComplete(email, password, twoFactorMethod,
                    twoFactorToken, false);
            } else {
                response = await this.authService.logIn(email, password);
                if (response.twoFactor) {
                    let selectedProvider: any = null;
                    const twoFactorProviders = this.authService.getSupportedTwoFactorProviders(null);
                    if (twoFactorProviders.length === 0) {
                        return Response.badRequest('No providers available for this client.');
                    }

                    if (twoFactorMethod != null) {
                        try {
                            selectedProvider = twoFactorProviders.filter((p) => p.type === twoFactorMethod)[0];
                        } catch (e) {
                            return Response.error('Invalid two-step login method.');
                        }
                    }

                    if (selectedProvider == null) {
                        if (twoFactorProviders.length === 1) {
                            selectedProvider = twoFactorProviders[0];
                        } else {
                            const options = twoFactorProviders.map((p) => p.name);
                            options.push(new inquirer.Separator());
                            options.push('Cancel');
                            const answer = await inquirer.prompt<any>({
                                type: 'list',
                                name: 'method',
                                message: 'Two-step login method:',
                                choices: options,
                            });
                            const i = options.indexOf(answer.method);
                            if (i === (options.length - 1)) {
                                return Response.error('Login failed.');
                            }
                            selectedProvider = twoFactorProviders[i];
                        }
                    }

                    if (twoFactorToken == null && response.twoFactorProviders.size > 1 &&
                        selectedProvider.type === TwoFactorProviderType.Email) {
                        const emailReq = new TwoFactorEmailRequest(this.authService.email,
                            this.authService.masterPasswordHash);
                        await this.apiService.postTwoFactorEmail(emailReq);
                    }

                    if (twoFactorToken == null) {
                        const answer = await inquirer.prompt<any>({
                            type: 'input',
                            name: 'token',
                            message: 'Two-step login code:',
                        });
                        twoFactorToken = answer.token;
                        if (twoFactorToken == null || twoFactorToken === '') {
                            return Response.badRequest('Code is required.');
                        }
                    }

                    const twoFactorResponse = await this.authService.logInTwoFactor(selectedProvider.type,
                        twoFactorToken, false);
                    if (twoFactorResponse.twoFactor) {
                        return Response.error('Login failed.');
                    }
                }
            }

            await this.syncService.fullSync(true);
            const res = new MessageResponse('You are logged in!', '\n' +
                'To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex:\n' +
                '$ export BW_SESSION="' + process.env.BW_SESSION + '"\n' +
                '> $env:BW_SESSION="' + process.env.BW_SESSION + '"\n\n' +
                'You can also pass the session key to any command with the `--session` option. ex:\n' +
                '$ bw list items --session ' + process.env.BW_SESSION);
            res.raw = process.env.BW_SESSION;
            return Response.success(res);
        } catch (e) {
            return Response.error(e);
        }
    }

    private async setNewSessionKey() {
        const key = await this.cryptoFunctionService.randomBytes(64);
        process.env.BW_SESSION = Utils.fromBufferToB64(key);
    }
}
