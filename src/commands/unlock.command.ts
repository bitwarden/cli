import * as program from 'commander';
import * as inquirer from 'inquirer';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { CryptoFunctionService } from 'jslib/abstractions/cryptoFunction.service';
import { UserService } from 'jslib/abstractions/user.service';

import { Response } from '../models/response';
import { MessageResponse } from '../models/response/messageResponse';

import { Utils } from 'jslib/misc/utils';

export class UnlockCommand {
    constructor(private cryptoService: CryptoService, private userService: UserService,
        private cryptoFunctionService: CryptoFunctionService) { }

    async run(password: string, cmd: program.Command) {
        if (password == null || password === '') {
            const answer = await (inquirer as any).createPromptModule({ output: process.stderr })({
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

        this.setNewSessionKey();
        const email = await this.userService.getEmail();
        const key = await this.cryptoService.makeKey(password, email);
        const keyHash = await this.cryptoService.hashPassword(password, key);
        const storedKeyHash = await this.cryptoService.getKeyHash();
        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
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
