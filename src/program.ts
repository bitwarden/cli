import * as chk from 'chalk';
import * as program from 'commander';

import { Main } from './bw';

import { CreateCommand } from './commands/create.command';
import { DeleteCommand } from './commands/delete.command';
import { EditCommand } from './commands/edit.command';
import { EncodeCommand } from './commands/encode.command';
import { GenerateCommand } from './commands/generate.command';
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

function writeLn(s: string) {
    process.stdout.write(s + '\n');
}

export class Program {
    constructor(private main: Main) { }

    run() {
        program
            .version(this.main.platformUtilsService.getApplicationVersion(), '-v, --version')
            .option('--pretty', 'Format stdout.')
            .option('--raw', 'Raw output instead a descriptive message.')
            .option('--quiet', 'Do not write anything to stdout.')
            .option('--session <session>', 'Pass in a session key instead of reading from env.');

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

        program.on('command:*', () => {
            writeLn(chalk.redBright('Invalid command: ' + program.args.join(' ')));
            process.stdout.write('See --help for a list of available commands.');
            process.exit(1);
        });

        program.on('--help', () => {
            writeLn('\n  Examples:');
            writeLn('');
            writeLn('    bw login');
            writeLn('    bw lock');
            writeLn('    bw unlock myPassword321');
            writeLn('    bw list items --search google');
            writeLn('    bw get item 99ee88d2-6046-4ea7-92c2-acac464b1412');
            writeLn('    bw get password google.com');
            writeLn('    echo \'{"name":"My Folder"}\' | bw encode');
            writeLn('    bw create folder eyJuYW1lIjoiTXkgRm9sZGVyIn0K');
            writeLn('    bw edit folder c7c7b60b-9c61-40f2-8ccd-36c49595ed72 eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg==');
            writeLn('    bw delete item 99ee88d2-6046-4ea7-92c2-acac464b1412');
            writeLn('    bw generate -lusn --length 18');
            writeLn('');
        });

        program
            .command('login [email] [password]')
            .description('Log into a user account.')
            .option('--method <method>', 'Two-step login method.')
            .option('--code <code>', 'Two-step login code.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    See docs for valid `method` enum values.');
                writeLn('');
                writeLn('    Pass `--raw` option to only get session token.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw login');
                writeLn('    bw login john@example.com myPassword321 --raw');
                writeLn('    bw login john@example.com myPassword321 --method 1 --code 249213');
                writeLn('');
            })
            .action(async (email: string, password: string, cmd: program.Command) => {
                await this.exitIfAuthed();
                const command = new LoginCommand(this.main.authService, this.main.apiService,
                    this.main.cryptoFunctionService, this.main.syncService);
                const response = await command.run(email, password, cmd);
                this.processResponse(response);
            });

        program
            .command('logout')
            .description('Log out of the current user account.')
            .on('--help', () => {
                writeLn('\n  Examples:');
                writeLn('');
                writeLn('    bw logout');
                writeLn('');
            })
            .action(async (cmd) => {
                await this.exitIfNotAuthed();
                const command = new LogoutCommand(this.main.authService, async () => await this.main.logout());
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('lock')
            .description('Lock the vault and destroy the current session token.')
            .on('--help', () => {
                writeLn('\n  Examples:');
                writeLn('');
                writeLn('    bw lock');
                writeLn('');
            })
            .action(async (cmd) => {
                await this.exitIfNotAuthed();
                const command = new LockCommand(this.main.lockService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('unlock [password]')
            .description('Unlock the vault and obtain a new session token.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    After unlocking, any previous session tokens will no longer be valid.');
                writeLn('');
                writeLn('    Pass `--raw` option to only get session token.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw unlock');
                writeLn('    bw unlock myPassword321');
                writeLn('    bw unlock myPassword321 --raw');
                writeLn('');
            })
            .action(async (password, cmd) => {
                await this.exitIfNotAuthed();
                const command = new UnlockCommand(this.main.cryptoService, this.main.userService,
                    this.main.cryptoFunctionService);
                const response = await command.run(password, cmd);
                this.processResponse(response);
            });

        program
            .command('sync')
            .description('Sync vault from server.')
            .option('-f, --force', 'Force a full sync.')
            .option('--last', 'Get the last sync date.')
            .on('--help', () => {
                writeLn('\n  Examples:');
                writeLn('');
                writeLn('    bw sync');
                writeLn('    bw sync -f');
                writeLn('    bw sync --last');
                writeLn('');
            })
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
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    items');
                writeLn('    folders');
                writeLn('    collections');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('    Combining multiple filters performs a logical OR operation.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw list items');
                writeLn('    bw list items --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2');
                writeLn('    bw list items --search google --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2');
                writeLn('    bw list items --folderid null');
                writeLn('    bw list items --organizationid !null');
                writeLn('    bw list items --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2 --organizationid !null');
                writeLn('    bw list folders --search email');
                writeLn('');
            })
            .action(async (object, cmd) => {
                await this.exitIfLocked();
                const command = new ListCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService);
                const response = await command.run(object, cmd);
                this.processResponse(response);
            });

        program
            .command('get <object> <id>')
            .description('Get an object.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    username');
                writeLn('    password');
                writeLn('    uri');
                writeLn('    totp');
                writeLn('    folder');
                writeLn('    collection');
                writeLn('    template');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Search term or GUID.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw get item 99ee88d2-6046-4ea7-92c2-acac464b1412');
                writeLn('    bw get password https://google.com');
                writeLn('    bw get totp google.com');
                writeLn('    bw get folder email');
                writeLn('    bw get template folder');
                writeLn('');
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('create <object> [encodedJson]')
            .description('Create an object.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    folder');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('    `encodedJson` can be piped into stdin.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw create folder eyJuYW1lIjoiTXkgRm9sZGVyIn0K');
                writeLn('    echo \'eyJuYW1lIjoiTXkgRm9sZGVyIn0K\' | bw create folder');
                writeLn('');
            })
            .action(async (object, encodedJson, cmd) => {
                await this.exitIfLocked();
                const command = new CreateCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, encodedJson, cmd);
                this.processResponse(response);
            });

        program
            .command('edit <object> <id> [encodedJson]')
            .description('Edit an object.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    folder');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Must be a GUID.');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('    `encodedJson` can be piped into stdin.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw edit folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02 eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg==');
                writeLn('    echo \'eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg==\' | ' +
                    'bw edit folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02');
                writeLn('');
            })
            .action(async (object, id, encodedJson, cmd) => {
                await this.exitIfLocked();
                const command = new EditCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, id, encodedJson, cmd);
                this.processResponse(response);
            });

        program
            .command('delete <object> <id>')
            .description('Delete an object.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    folder');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Must be a GUID.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw delete folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02');
                writeLn('');
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new DeleteCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('generate')
            .description('Generate a password.')
            .option('-u, --uppercase', 'Include uppercase characters.')
            .option('-l, --lowercase', 'Include lowercase characters.')
            .option('-n, --number', 'Include numeric characters.')
            .option('-s, --special', 'Include special characters.')
            .option('--length <length>', 'Length of the password.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    Default options are `-uln --length 14`.');
                writeLn('');
                writeLn('    Minimum `length` is 5.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw generate');
                writeLn('    bw generate -u -l --length 18');
                writeLn('    bw generate -ulns --length 25');
                writeLn('    bw generate -ul');
                writeLn('');
            })
            .action(async (cmd) => {
                const command = new GenerateCommand(this.main.passwordGenerationService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('encode')
            .description('Base 64 encode stdin.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    Use to create `encodedJson` for `create` and `edit` commands.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    echo \'{"name":"My Folder"}\' | bw encode');
                writeLn('');
            })
            .action(async (object, id, cmd) => {
                const command = new EncodeCommand();
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('update')
            .description('Check for updates.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    Returns the URL to download the newest version of this CLI tool.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw update');
                writeLn('');
            })
            .action(async (object, id, cmd) => {
                // TODO
            });

        program
            .parse(process.argv);

        if (process.argv.slice(2).length === 0) {
            program.outputHelp();
        }
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
