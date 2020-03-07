import * as program from 'commander';
import * as inquirer from 'inquirer';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { ExportService } from 'jslib/abstractions/export.service';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';

import { CliUtils } from '../utils';

import { Utils } from 'jslib/misc/utils';

export class ExportCommand {
    constructor(private cryptoService: CryptoService, private exportService: ExportService) { }

    async run(password: string, cmd: program.Command): Promise<Response> {
        const canInteract = process.stdout.isTTY && process.env.BW_NOINTERACTION !== 'true';
        if ((password == null || password === '') && canInteract) {
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
            if (cmd.organizationid != null && !Utils.isGuid(cmd.organizationid)) {
                return Response.error('`' + cmd.organizationid + '` is not a GUID.');
            }
            let result: string = null;
            try {
                result = cmd.organizationid != null ?
                    await this.exportService.getOrganizationExport(cmd.organizationid, format) :
                    await this.exportService.getExport(format);
            } catch (e) {
                return Response.error(e);
            }
            return await this.outputResult(result, cmd, format);
        } else {
            return Response.error('Invalid master password.');
        }
    }

    async outputResult(result: string, cmd: program.Command, format: string): Promise<Response> {
        try {
            if (cmd.toStdout === true) {
                process.stdout.write(result + '\n');
                return Response.success();
            } else {
                const filePath = await CliUtils.saveFile(result, cmd.output,
                    this.exportService.getFileName(cmd.organizationid != null ? 'org' : null, format));
                const res = new MessageResponse('Saved ' + filePath, null);
                res.raw = filePath;
                return Response.success(res);
            }
        } catch (e) {
            return Response.error(e.toString());
        }
    }
}
