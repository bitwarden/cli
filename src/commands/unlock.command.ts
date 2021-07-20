import * as program from 'commander';
import * as inquirer from 'inquirer';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { Response } from 'jslib-node/cli/models/response';
import { MessageResponse } from 'jslib-node/cli/models/response/messageResponse';

import { PasswordVerificationRequest } from 'jslib-common/models/request/passwordVerificationRequest';

import { Utils } from 'jslib-common/misc/utils';

import { HashPurpose } from 'jslib-common/enums/hashPurpose';
import { NodeUtils } from 'jslib-common/misc/nodeUtils';
import { ConsoleLogService } from 'jslib-common/services/consoleLog.service';

export class UnlockCommand {
    private logService: ConsoleLogService;

    constructor(private cryptoService: CryptoService, private userService: UserService,
        private cryptoFunctionService: CryptoFunctionService, private apiService: ApiService) {
        this.logService = new ConsoleLogService(false);
    }

    async run(password: string, options: program.OptionValues) {
        const canInteract = process.env.BW_NOINTERACTION !== 'true';
        if (password == null || password === '') {
            if (options?.passwordfile) {
                password = await NodeUtils.readFirstLine(options.passwordfile);
            } else if (options?.passwordenv) {
                if (process.env[options.passwordenv]) {
                    password = process.env[options.passwordenv];
                } else {
                    this.logService.warning(`Warning: Provided passwordenv ${options.passwordenv} is not set`);
                }
            }
        }

        if (password == null || password === '') {
            if (canInteract) {
                const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                    type: 'password',
                    name: 'password',
                    message: 'Master password:',
                });

                password = answer.password;
            } else {
                return Response.badRequest('Master password is required.');
            }
        }

        this.setNewSessionKey();
        const email = await this.userService.getEmail();
        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();
        const key = await this.cryptoService.makeKey(password, email, kdf, kdfIterations);
        const storedKeyHash = await this.cryptoService.getKeyHash();

        let passwordValid = false;
        if (key != null) {
            if (storedKeyHash != null) {
                passwordValid = await this.cryptoService.compareAndUpdateKeyHash(password, key);
            } else {
                const serverKeyHash = await this.cryptoService.hashPassword(password, key, HashPurpose.ServerAuthorization);
                const request = new PasswordVerificationRequest();
                request.masterPasswordHash = serverKeyHash;
                try {
                    await this.apiService.postAccountVerifyPassword(request);
                    passwordValid = true;
                    const localKeyHash = await this.cryptoService.hashPassword(password, key,
                        HashPurpose.LocalAuthorization);
                    await this.cryptoService.setKeyHash(localKeyHash);
                } catch { }
            }
        }

        if (passwordValid) {
            await this.cryptoService.setKey(key);
            const res = new MessageResponse('Your vault is now unlocked!', '\n' +
                'To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex:\n' +
                '$ export BW_SESSION="' + process.env.BW_SESSION + '"\n' +
                '> $env:BW_SESSION="' + process.env.BW_SESSION + '"\n\n' +
                'You can also pass the session key to any command with the `--session` option. ex:\n' +
                '$ bw list items --session ' + process.env.BW_SESSION);
            res.raw = process.env.BW_SESSION;
            return Response.success(res);
        } else {
            return Response.error('Invalid master password.');
        }
    }

    private async setNewSessionKey() {
        const key = await this.cryptoFunctionService.randomBytes(64);
        process.env.BW_SESSION = Utils.fromBufferToB64(key);
    }
}
