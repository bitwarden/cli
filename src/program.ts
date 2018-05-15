import * as program from 'commander';

import { Main } from './bw';

import { DeleteCommand } from './commands/delete.command';
import { GetCommand } from './commands/get.command';
import { ListCommand } from './commands/list.command';
import { LoginCommand } from './commands/login.command';
import { SyncCommand } from './commands/sync.command';

import { Response } from './models/response';
import { CreateCommand } from './commands/create.command';
import { EncodeCommand } from './commands/encode.command';
import { ListResponse } from './models/response/listResponse';
import { StringResponse } from './models/response/stringResponse';
import { TemplateResponse } from './models/response/templateResponse';

export class Program {
    constructor(private main: Main) { }

    run() {
        program
            .version('1.0.0', '-v, --version');

        program
            .command('login <email> <password>')
            .description('Log into a Bitwarden user account.')
            .option('-m, --method <method>', '2FA method.')
            .option('-c, --code <code>', '2FA code.')
            .action(async (email: string, password: string, cmd: program.Command) => {
                const command = new LoginCommand(this.main.authService);
                const response = await command.run(email, password, cmd);
                this.processResponse(response);
            });

        program
            .command('logout')
            .description('Log out of the current Bitwarden user account.')
            .action((cmd) => {
                console.log('Logging out...');
                process.exit();
            });

        program
            .command('sync')
            .description('Sync user\'s vault from server.')
            .option('-f, --force', 'Force a full sync.')
            .action(async (cmd) => {
                const command = new SyncCommand(this.main.syncService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('list <object>')
            .description('List objects.')
            .action(async (object, cmd) => {
                const command = new ListCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService);
                const response = await command.run(object, cmd);
                this.processResponse(response);
            });

        program
            .command('get <object> <id>')
            .description('Get an object.')
            .action(async (object, id, cmd) => {
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('create <object> <encodedData>')
            .description('Create an object.')
            .action(async (object, encodedData, cmd) => {
                const command = new CreateCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, encodedData, cmd);
                this.processResponse(response);
            });

        program
            .command('edit <object> <id>')
            .description('Edit an object.')
            .action((object, id, cmd) => {
                console.log('Editing...');
                console.log(object);
                console.log(id);
            });

        program
            .command('delete <object> <id>')
            .description('Delete an object.')
            .action(async (object, id, cmd) => {
                const command = new DeleteCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('encode')
            .description('Base64 encode stdin.')
            .action(async (object, id, cmd) => {
                const command = new EncodeCommand();
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .parse(process.argv);
    }

    private processResponse(response: Response) {
        if (response.success) {
            if (response.data != null) {
                if (response.data.object === 'string') {
                    console.log((response.data as StringResponse).data);
                } else if (response.data.object === 'list') {
                    console.log(JSON.stringify((response.data as ListResponse).data));
                } else if (response.data.object === 'template') {
                    console.log(JSON.stringify((response.data as TemplateResponse).template));
                } else {
                    console.log(JSON.stringify(response.data));
                }
            }
            process.exit();
        } else {
            console.log(response.message);
            process.exit(1);
        }
    }
}
