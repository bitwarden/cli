import * as chk from 'chalk';
import * as program from 'commander';

import { Main } from './bw';

import { CreateCommand } from './commands/create.command';
import { DeleteCommand } from './commands/delete.command';
import { EditCommand } from './commands/edit.command';
import { EncodeCommand } from './commands/encode.command';
import { GetCommand } from './commands/get.command';
import { ListCommand } from './commands/list.command';
import { LockCommand } from './commands/lock.command';
import { LoginCommand } from './commands/login.command';
import { LogoutCommand } from './commands/logout.command';
import { SyncCommand } from './commands/sync.command';
import { UnlockCommand } from './commands/unlock.command';

import { Response } from './models/response';
import { ListResponse } from './models/response/listResponse';
import { MessageResponse } from './models/response/messageResponse';
import { StringResponse } from './models/response/stringResponse';
import { TemplateResponse } from './models/response/templateResponse';

const chalk = chk.default;

export class Program {
    constructor(private main: Main) { }

    run() {
        program
            .version(this.main.platformUtilsService.getApplicationVersion(), '-v, --version')
            .option('--pretty', 'Format stdout.')
            .option('--raw', 'Raw output instead a descriptive message.')
            .option('--quiet', 'Do not write anything to stdout.')
            .option('--session <session>', 'Session key.');

        program.on('option:pretty', () => {
            process.env.BW_PRETTY = 'true';
        });

        program.on('option:raw', () => {
            process.env.BW_RAW = 'true';
        });

        program.on('option:quiet', () => {
            process.env.BW_QUIET = 'true';
        });

        program.on('option:session', (key) => {
            process.env.BW_SESSION = key;
        });

        program
            .command('login [email] [password]')
            .description('Log into a Bitwarden user account.')
            .option('-m, --method <method>', 'Two-step login method.')
            .option('-c, --code <code>', 'Two-step login code.')
            .action(async (email: string, password: string, cmd: program.Command) => {
                await this.exitIfAuthed();
                const command = new LoginCommand(this.main.authService, this.main.apiService,
                    this.main.cryptoFunctionService);
                const response = await command.run(email, password, cmd);
                this.processResponse(response);
            });

        program
            .command('logout')
            .description('Log out of the current Bitwarden user account.')
            .action(async (cmd) => {
                await this.exitIfNotAuthed();
                const command = new LogoutCommand(this.main.authService, async () => await this.main.logout());
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('lock')
            .description('Lock the vault and destroy the current session token.')
            .action(async (cmd) => {
                await this.exitIfNotAuthed();
                const command = new LockCommand(this.main.lockService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('unlock [password]')
            .description('Unlock the vault and obtain a new session token.')
            .action(async (password, cmd) => {
                await this.exitIfNotAuthed();
                const command = new UnlockCommand(this.main.cryptoService, this.main.userService,
                    this.main.cryptoFunctionService);
                const response = await command.run(password, cmd);
                this.processResponse(response);
            });

        program
            .command('sync')
            .description('Sync user\'s vault from server.')
            .option('-f, --force', 'Force a full sync.')
            .action(async (cmd) => {
                await this.exitIfLocked();
                const command = new SyncCommand(this.main.syncService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('list <object>')
            .description('List objects.')
            .option('--search <search>', 'Perform a search on the listed objects.')
            .option('--folderid <folderid>', 'Filter items by folder id.')
            .option('--collectionid <collectionid>', 'Filter items by collection id.')
            .option('--organizationid <organizationid>', 'Filter items or collections by organization id.')
            .action(async (object, cmd) => {
                await this.exitIfLocked();
                const command = new ListCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService);
                const response = await command.run(object, cmd);
                this.processResponse(response);
            });

        program
            .command('get <object> [id]')
            .description('Get an object.')
            .option('--uppercase', 'Include uppercase characters.')
            .option('--lowercase', 'Include lowercase characters.')
            .option('--number', 'Include numeric characters.')
            .option('--special', 'Include special characters.')
            .option('--length <length>', 'Password length.')
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService, this.main.syncService,
                    this.main.passwordGenerationService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('create <object> <encodedData>')
            .description('Create an object.')
            .action(async (object, encodedData, cmd) => {
                await this.exitIfLocked();
                const command = new CreateCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, encodedData, cmd);
                this.processResponse(response);
            });

        program
            .command('edit <object> <id> <encodedData>')
            .description('Edit an object.')
            .action(async (object, id, encodedData, cmd) => {
                await this.exitIfLocked();
                const command = new EditCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, id, encodedData, cmd);
                this.processResponse(response);
            });

        program
            .command('delete <object> <id>')
            .description('Delete an object.')
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
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
            .command('update')
            .description('Check for updates.')
            .action(async (object, id, cmd) => {
                console.log('Checking...');
            });

        program
            .parse(process.argv);
    }

    private processResponse(response: Response) {
        if (!response.success) {
            if (process.env.BW_QUIET !== 'true') {
                process.stdout.write(chalk.redBright(response.message));
            }
            process.exit(1);
            return;
        }

        if (response.data != null) {
            let out: string = null;
            if (response.data.object === 'string') {
                const data = (response.data as StringResponse).data;
                if (data != null) {
                    out = data;
                }
            } else if (response.data.object === 'list') {
                out = this.getJson((response.data as ListResponse).data);
            } else if (response.data.object === 'template') {
                out = this.getJson((response.data as TemplateResponse).template);
            } else if (response.data.object === 'message') {
                out = this.getMessage(response);
            } else {
                out = this.getJson(response.data);
            }

            if (out != null && process.env.BW_QUIET !== 'true') {
                process.stdout.write(out);
            }
        }
        process.exit();
    }

    private getJson(obj: any): string {
        if (process.env.BW_PRETTY === 'true') {
            return JSON.stringify(obj, null, '  ');
        } else {
            return JSON.stringify(obj);
        }
    }

    private getMessage(response: Response) {
        const message = (response.data as MessageResponse);
        if (process.env.BW_RAW === 'true' && message.raw != null) {
            return message.raw;
        }

        let out: string = '';
        if (message.title != null) {
            out = chalk.greenBright(message.title);
        }
        if (message.message != null) {
            if (message.title != null) {
                out += '\n';
            }
            out += message.message;
        }
        return out.trim() === '' ? null : out;
    }

    private async exitIfLocked() {
        await this.exitIfNotAuthed();
        const key = await this.main.cryptoService.getKey();
        if (key == null) {
            process.stdout.write(chalk.redBright('Vault is locked.'));
            process.exit(1);
        }
    }

    private async exitIfAuthed() {
        const authed = await this.main.userService.isAuthenticated();
        if (authed) {
            const email = await this.main.userService.getEmail();
            process.stdout.write(chalk.redBright('You are already logged in as ' + email + '.'));
            process.exit(1);
        }
    }

    private async exitIfNotAuthed() {
        const authed = await this.main.userService.isAuthenticated();
        if (!authed) {
            process.stdout.write(chalk.redBright('You are not logged in.'));
            process.exit(1);
        }
    }
}
