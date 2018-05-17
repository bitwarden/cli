import * as program from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline-sync';

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
            password = readline.question('Master password: ', {
                hideEchoBack: true,
                mask: '*',
            });
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
        let p: string = null;
        let mkdir = false;
        if (cmd.output != null && cmd.output !== '') {
            const osOutput = path.join(cmd.output);
            if (osOutput.indexOf(path.sep) === -1) {
                p = path.join(process.cwd(), osOutput);
            } else {
                mkdir = true;
                if (osOutput.endsWith(path.sep)) {
                    p = path.join(osOutput, this.exportService.getFileName());
                } else {
                    p = osOutput;
                }
            }
        } else {
            p = path.join(process.cwd(), this.exportService.getFileName());
        }

        p = path.resolve(p);
        if (mkdir) {
            const dir = p.substring(0, p.lastIndexOf(path.sep));
            if (!fs.existsSync(dir)) {
                CliUtils.mkdirpSync(dir, 755);
            }
        }

        return new Promise<Response>((resolve, reject) => {
            fs.writeFile(p, csv, (err) => {
                if (err != null) {
                    reject(Response.error('Cannot save file to ' + p));
                }
                const res = new MessageResponse('Saved ' + p + '', null);
                resolve(Response.success(res));
            });
        });
    }
}
