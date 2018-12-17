import * as program from 'commander';
import * as inquirer from 'inquirer';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { ExportService } from 'jslib/abstractions/export.service';

import { Response } from '../models/response';
import { MessageResponse } from '../models/response/messageResponse';

import { CliUtils } from '../utils';

export class ExportCommand {
    constructor(private cryptoService: CryptoService, private exportService: ExportService) { }

    async run(password: string, cmd: program.Command): Promise<Response> {
        if (password == null || password === '') {
            const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                type: 'password',
                name: 'password',
                message: 'Master password:',
            });
            password = answer.password;
        }
        if (password == null || password === '') {
            return Response.badRequest('Master password is required.');
        }

        const keyHash = await this.cryptoService.hashPassword(password, null);
        const storedKeyHash = await this.cryptoService.getKeyHash();
        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            const format = cmd.format !== 'json' ? 'csv' : 'json';
            const csv = await this.exportService.getExport(format);
            return await this.saveFile(csv, cmd, format);
        } else {
            return Response.error('Invalid master password.');
        }
    }

    async saveFile(csv: string, cmd: program.Command, format: string): Promise<Response> {
        try {
            const filePath = await CliUtils.saveFile(csv, cmd.output, this.exportService.getFileName(null, format));
            const res = new MessageResponse('Saved ' + filePath, null);
            res.raw = filePath;
            return Response.success(res);
        } catch (e) {
            return Response.error(e.toString());
        }
    }
}
