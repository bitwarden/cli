import * as program from 'commander';
import * as inquirer from 'inquirer';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { ImportOptions, ImportService } from 'jslib/abstractions/import.service';
import { UserService } from 'jslib/abstractions/user.service';

import { Response } from '../models/response';

import { CliUtils } from '../utils';

const writeLn = CliUtils.writeLn;

export class ImportCommand {
    constructor(private cryptoService: CryptoService, private userService: UserService,
        private importService: ImportService) { }

    async list() {
        const options: ImportOptions = this.importService.getOptions().sort((a, b) => {
            if (a.id < b.id) { return -1; }
            if (a.id > b.id) { return 1; }
            return 0;
        });
        writeLn('\nSupported input formats:\n');
        options.forEach((option) => {
            writeLn('    ' + option.id);
        });
        return Response.success();
    }

    async run(type: string, path: string, password: string, cmd: program.Command): Promise<Response> {
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
        const importer = await this.importService.getImporter(type);
        if (importer === null) {
            return Response.badRequest('Proper importer type required.');
        }
        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            return CliUtils.readFile(path).then(async (contents) => {
                const submitResult = await this.importService.submit(importer, contents);
                if (submitResult !== null) {
                    return Response.success();
                } else {
                    return Response.badRequest(submitResult.message);
                }
            }).catch((err) => {
                return Response.badRequest(err);
            });
        } else {
            return Response.badRequest('Invalid master password.');
        }
    }
}
