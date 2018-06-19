import * as program from 'commander';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as path from 'path';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { ExportService } from 'jslib/abstractions/export.service';
import { UserService } from 'jslib/abstractions/user.service';

import { Response } from '../models/response';
import { MessageResponse } from '../models/response/messageResponse';

import { Utils } from 'jslib/misc/utils';
import { CliUtils } from '../utils';

export class ExportCommand {
    constructor(private cryptoService: CryptoService, private userService: UserService,
        private exportService: ExportService) { }

    async run(password: string, cmd: program.Command): Promise<Response> {
        if (password == null || password === '') {
            const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
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

        const email = await this.userService.getEmail();
        const key = await this.cryptoService.makeKey(password, email);
        const keyHash = await this.cryptoService.hashPassword(password, key);
        const storedKeyHash = await this.cryptoService.getKeyHash();
        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            const csv = await this.exportService.getCsv();
            return await this.saveFile(csv, cmd);
        } else {
            return Response.error('Invalid master password.');
        }
    }

    async saveFile(csv: string, cmd: program.Command): Promise<Response> {
        try {
            const filePath = await CliUtils.saveFile(csv, cmd.output, this.exportService.getFileName());
            const res = new MessageResponse('Saved ' + filePath, null);
            res.raw = filePath;
            return Response.success(res);
        } catch (e) {
            return Response.error(e.toString());
        }
    }
}
