import * as chk from 'chalk';
import * as program from 'commander';

import { Main } from './bw';

import { CreateCommand } from './commands/create.command';
import { DeleteCommand } from './commands/delete.command';
import { EditCommand } from './commands/edit.command';
import { EncodeCommand } from './commands/encode.command';
import { GetCommand } from './commands/get.command';
import { ListCommand } from './commands/list.command';
import { LoginCommand } from './commands/login.command';
import { SyncCommand } from './commands/sync.command';

import { ListResponse } from './models/response/listResponse';
import { StringResponse } from './models/response/stringResponse';
import { TemplateResponse } from './models/response/templateResponse';

import { Response } from './models/response';

const chalk = chk.default;

export class Program {
    constructor(private main: Main) { }

    run() {
        program
            .version(this.main.platformUtilsService.getApplicationVersion(), '-v, --version')
            .option('--pretty', 'Format stdout.');

        program
            .command('login [email] [password]')
            .description('Log into a Bitwarden user account.')
            .option('-m, --method <method>', 'Two-step login method.')
            .option('-c, --code <code>', 'Two-step login code.')
            .action(async (email: string, password: string, cmd: program.Command) => {
                const command = new LoginCommand(this.main.authService, this.main.apiService,
                    this.main.cryptoFunctionService);
                const response = await command.run(email, password, cmd);
                this.processResponse(response, cmd);
            });

        program
            .command('logout')
            .description('Log out of the current Bitwarden user account.')
            .action((cmd) => {
                // TODO
            });

        program
            .command('lock')
            .description('Lock the vault and destroy the current session token.')
            .action((cmd) => {
                // TODO
            });

        program
            .command('unlock [password]')
            .description('Unlock the vault and obtain a new session token.')
            .action((cmd) => {
                // TODO
            });

        program
            .command('sync')
            .description('Sync user\'s vault from server.')
            .option('-f, --force', 'Force a full sync.')
            .action(async (cmd) => {
                const command = new SyncCommand(this.main.syncService);
                const response = await command.run(cmd);
                this.processResponse(response, cmd);
            });

        program
            .command('list <object>')
            .description('List objects.')
            .action(async (object, cmd) => {
                const command = new ListCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService);
                const response = await command.run(object, cmd);
                this.processResponse(response, cmd);
            });

        program
            .command('get <object> <id>')
            .description('Get an object.')
            .action(async (object, id, cmd) => {
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response, cmd);
            });

        program
            .command('create <object> <encodedData>')
            .description('Create an object.')
            .action(async (object, encodedData, cmd) => {
                const command = new CreateCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, encodedData, cmd);
                this.processResponse(response, cmd);
            });

        program
            .command('edit <object> <id> <encodedData>')
            .description('Edit an object.')
            .action(async (object, id, encodedData, cmd) => {
                const command = new EditCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, id, encodedData, cmd);
                this.processResponse(response, cmd);
            });

        program
            .command('delete <object> <id>')
            .description('Delete an object.')
            .action(async (object, id, cmd) => {
                const command = new DeleteCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response, cmd);
            });

        program
            .command('encode')
            .description('Base64 encode stdin.')
            .action(async (object, id, cmd) => {
                const command = new EncodeCommand();
                const response = await command.run(cmd);
                this.processResponse(response, cmd);
            });

        program
            .parse(process.argv);
    }

    private processResponse(response: Response, cmd: program.Command) {
        if (!response.success) {
            process.stdout.write(chalk.redBright(response.message));
            process.exit(1);
            return;
        }

        if (response.data != null) {
            if (response.data.object === 'string') {
                process.stdout.write((response.data as StringResponse).data);
            } else if (response.data.object === 'list') {
                this.printJson((response.data as ListResponse).data, cmd);
            } else if (response.data.object === 'template') {
                this.printJson((response.data as TemplateResponse).template, cmd);
            } else {
                this.printJson(response.data, cmd);
            }
        }
        process.exit();
    }

    private printJson(obj: any, cmd: program.Command) {
        if (this.hasGlobalOption('pretty', cmd)) {
            process.stdout.write(JSON.stringify(obj, null, '  '));
        } else {
            process.stdout.write(JSON.stringify(obj));
        }
    }

    private hasGlobalOption(option: string, cmd: program.Command): boolean {
        if (cmd[option] || false) {
            return true;
        }

        if (cmd.parent == null) {
            return false;
        }

        return this.hasGlobalOption(option, cmd.parent);
    }
}
