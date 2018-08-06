import * as chk from 'chalk';
import * as program from 'commander';

import { Main } from './bw';

import { ConfigCommand } from './commands/config.command';
import { CreateCommand } from './commands/create.command';
import { DeleteCommand } from './commands/delete.command';
import { EditCommand } from './commands/edit.command';
import { EncodeCommand } from './commands/encode.command';
import { ExportCommand } from './commands/export.command';
import { GenerateCommand } from './commands/generate.command';
import { GetCommand } from './commands/get.command';
import { ImportCommand } from './commands/import.command';
import { ListCommand } from './commands/list.command';
import { LockCommand } from './commands/lock.command';
import { LoginCommand } from './commands/login.command';
import { LogoutCommand } from './commands/logout.command';
import { SyncCommand } from './commands/sync.command';
import { UnlockCommand } from './commands/unlock.command';
import { UpdateCommand } from './commands/update.command';

import { Response } from './models/response';
import { ListResponse } from './models/response/listResponse';
import { MessageResponse } from './models/response/messageResponse';
import { StringResponse } from './models/response/stringResponse';
import { TemplateResponse } from './models/response/templateResponse';
import { CliUtils } from './utils';

const chalk = chk.default;
const writeLn = CliUtils.writeLn;

export class Program {
    constructor(private main: Main) { }

    run() {
        program
            .option('--pretty', 'Format output. JSON is tabbed with two spaces.')
            .option('--raw', 'Return raw output instead of a descriptive message.')
            .option('--response', 'Return a JSON formatted version of response output.')
            .option('--quiet', 'Don\'t return anything to stdout.')
            .option('--session <session>', 'Pass session key instead of reading from env.')
            .version(this.main.platformUtilsService.getApplicationVersion(), '-v, --version');

        program.on('option:pretty', () => {
            process.env.BW_PRETTY = 'true';
        });

        program.on('option:raw', () => {
            process.env.BW_RAW = 'true';
        });

        program.on('option:quiet', () => {
            process.env.BW_QUIET = 'true';
        });

        program.on('option:response', () => {
            process.env.BW_RESPONSE = 'true';
        });

        program.on('option:session', (key) => {
            process.env.BW_SESSION = key;
        });

        program.on('command:*', () => {
            writeLn(chalk.redBright('Invalid command: ' + program.args.join(' ')));
            writeLn('See --help for a list of available commands.', true);
            process.exitCode = 1;
        });

        program.on('--help', () => {
            writeLn('\n  Examples:');
            writeLn('');
            writeLn('    bw login');
            writeLn('    bw lock');
            writeLn('    bw unlock myPassword321');
            writeLn('    bw list --help');
            writeLn('    bw list items --search google');
            writeLn('    bw get item 99ee88d2-6046-4ea7-92c2-acac464b1412');
            writeLn('    bw get password google.com');
            writeLn('    echo \'{"name":"My Folder"}\' | bw encode');
            writeLn('    bw create folder eyJuYW1lIjoiTXkgRm9sZGVyIn0K');
            writeLn('    bw edit folder c7c7b60b-9c61-40f2-8ccd-36c49595ed72 eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg==');
            writeLn('    bw delete item 99ee88d2-6046-4ea7-92c2-acac464b1412');
            writeLn('    bw generate -lusn --length 18');
            writeLn('', true);
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
                writeLn('    Pass `--raw` option to only return the session key.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw login');
                writeLn('    bw login john@example.com myPassword321 --raw');
                writeLn('    bw login john@example.com myPassword321 --method 1 --code 249213');
                writeLn('', true);
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
                writeLn('', true);
            })
            .action(async (cmd) => {
                await this.exitIfNotAuthed();
                const command = new LogoutCommand(this.main.authService, async () => await this.main.logout());
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('lock')
            .description('Lock the vault and destroy active session keys.')
            .on('--help', () => {
                writeLn('\n  Examples:');
                writeLn('');
                writeLn('    bw lock');
                writeLn('', true);
            })
            .action(async (cmd) => {
                await this.exitIfNotAuthed();
                const command = new LockCommand(this.main.lockService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('unlock [password]')
            .description('Unlock the vault and return a new session key.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    After unlocking, any previous session keys will no longer be valid.');
                writeLn('');
                writeLn('    Pass `--raw` option to only return the session key.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw unlock');
                writeLn('    bw unlock myPassword321');
                writeLn('    bw unlock myPassword321 --raw');
                writeLn('', true);
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
            .description('Pull the latest vault data from server.')
            .option('-f, --force', 'Force a full sync.')
            .option('--last', 'Get the last sync date.')
            .on('--help', () => {
                writeLn('\n  Examples:');
                writeLn('');
                writeLn('    bw sync');
                writeLn('    bw sync -f');
                writeLn('    bw sync --last');
                writeLn('', true);
            })
            .action(async (cmd) => {
                await this.exitIfLocked();
                const command = new SyncCommand(this.main.syncService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('list <object>')
            .description('List an array of objects from the vault.')
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
                writeLn('    organizations');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('    Combining search with a filter performs a logical AND operation.');
                writeLn('');
                writeLn('    Combining multiple filters performs a logical OR operation.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw list items');
                writeLn('    bw list items --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2');
                writeLn('    bw list items --search google --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2');
                writeLn('    bw list items --folderid null');
                writeLn('    bw list items --organizationid notnull');
                writeLn('    bw list items --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2 --organizationid notnull');
                writeLn('    bw list folders --search email');
                writeLn('', true);
            })
            .action(async (object, cmd) => {
                await this.exitIfLocked();
                const command = new ListCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.userService);
                const response = await command.run(object, cmd);
                this.processResponse(response);
            });

        program
            .command('get <object> <id>')
            .description('Get an object from the vault.')
            .option('--itemid <itemid>', 'Attachment\'s item id.')
            .option('--output <output>', 'Output directory or filename for attachment.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    username');
                writeLn('    password');
                writeLn('    uri');
                writeLn('    totp');
                writeLn('    exposed');
                writeLn('    attachment');
                writeLn('    folder');
                writeLn('    collection');
                writeLn('    organization');
                writeLn('    template');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Search term or object\'s globally unique `id`.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw get item 99ee88d2-6046-4ea7-92c2-acac464b1412');
                writeLn('    bw get password https://google.com');
                writeLn('    bw get totp google.com');
                writeLn('    bw get exposed yahoo.com');
                writeLn('    bw get attachment b857igwl1dzrs2 --itemid 99ee88d2-6046-4ea7-92c2-acac464b1412 ' +
                    '--output ./photo.jpg');
                writeLn('    bw get attachment photo.jpg --itemid 99ee88d2-6046-4ea7-92c2-acac464b1412 --raw');
                writeLn('    bw get folder email');
                writeLn('    bw get template folder');
                writeLn('', true);
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService, this.main.auditService,
                    this.main.cryptoService, this.main.tokenService, this.main.userService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('create <object> [encodedJson]')
            .option('--file <file>', 'Path to file for attachment.')
            .option('--itemid <itemid>', 'Attachment\'s item id.')
            .description('Create an object in the vault.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    attachment');
                writeLn('    folder');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('    `encodedJson` can also be piped into stdin.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw create folder eyJuYW1lIjoiTXkgRm9sZGVyIn0K');
                writeLn('    echo \'eyJuYW1lIjoiTXkgRm9sZGVyIn0K\' | bw create folder');
                writeLn('    bw create attachment --file ./myfile.csv ' +
                    '--itemid 16b15b89-65b3-4639-ad2a-95052a6d8f66');
                writeLn('', true);
            })
            .action(async (object, encodedJson, cmd) => {
                await this.exitIfLocked();
                const command = new CreateCommand(this.main.cipherService, this.main.folderService,
                    this.main.tokenService, this.main.cryptoService);
                const response = await command.run(object, encodedJson, cmd);
                this.processResponse(response);
            });

        program
            .command('edit <object> <id> [encodedJson]')
            .description('Edit an object from the vault.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    folder');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Object\'s globally unique `id`.');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('    `encodedJson` can also be piped into stdin.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw edit folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02 eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg==');
                writeLn('    echo \'eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg==\' | ' +
                    'bw edit folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02');
                writeLn('', true);
            })
            .action(async (object, id, encodedJson, cmd) => {
                await this.exitIfLocked();
                const command = new EditCommand(this.main.cipherService, this.main.folderService);
                const response = await command.run(object, id, encodedJson, cmd);
                this.processResponse(response);
            });

        program
            .command('delete <object> <id>')
            .option('--itemid <itemid>', 'Attachment\'s item id.')
            .description('Delete an object from the vault.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    attachment');
                writeLn('    folder');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Object\'s globally unique `id`.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw delete item 7063feab-4b10-472e-b64c-785e2b870b92');
                writeLn('    bw delete folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02');
                writeLn('    bw delete attachment b857igwl1dzrs2 --itemid 310d5ffd-e9a2-4451-af87-ea054dce0f78');
                writeLn('', true);
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new DeleteCommand(this.main.cipherService, this.main.folderService,
                    this.main.tokenService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('import [format] [input] [password]')
            .description('Import vault data from a file.')
            .option('--formats', 'List formats')
            .on('--help', () => {
                writeLn('\n Examples:');
                writeLn('');
                writeLn('    bw import --formats');
                writeLn('    bw import bitwardencsv ./from/source.csv');
                writeLn('    bw import keepass2xml keepass_backup.xml myPassword123');
            })
            .action(async (format, filepath, password, cmd) => {
                await this.exitIfLocked();
                const command = new ImportCommand(this.main.cryptoService,
                    this.main.userService, this.main.importService);
                const response = await command.run(format, filepath, password, cmd);
                this.processResponse(response);
            });

        program
            .command('export [password]')
            .description('Export vault data to a CSV file.')
            .option('--output <output>', 'Output directory or filename.')
            .on('--help', () => {
                writeLn('\n  Examples:');
                writeLn('');
                writeLn('    bw export');
                writeLn('    bw export myPassword321');
                writeLn('    bw export --output ./exp/bw.csv');
                writeLn('    bw export myPassword321 --output bw.csv');
                writeLn('', true);
            })
            .action(async (password, cmd) => {
                await this.exitIfLocked();
                const command = new ExportCommand(this.main.cryptoService, this.main.userService,
                    this.main.exportService);
                const response = await command.run(password, cmd);
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
                writeLn('', true);
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
                writeLn('', true);
            })
            .action(async (object, id, cmd) => {
                const command = new EncodeCommand();
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('config <setting> <value>')
            .description('Configure CLI settings.')
            .on('--help', () => {
                writeLn('\n  Settings:');
                writeLn('');
                writeLn('    server - On-premise hosted installation URL.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw config server https://bw.company.com');
                writeLn('    bw config server bitwarden.com');
                writeLn('', true);
            })
            .action(async (setting, value, cmd) => {
                const command = new ConfigCommand(this.main.environmentService);
                const response = await command.run(setting, value, cmd);
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
                writeLn('    Use the `--raw` option to return only the download URL for the update.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw update');
                writeLn('    bw update --raw');
                writeLn('', true);
            })
            .action(async (cmd) => {
                const command = new UpdateCommand(this.main.platformUtilsService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .parse(process.argv);

        if (process.argv.slice(2).length === 0) {
            program.outputHelp();
        }
    }

    private processResponse(response: Response, exitImmediately = false) {
        if (!response.success) {
            if (process.env.BW_QUIET !== 'true') {
                if (process.env.BW_RESPONSE === 'true') {
                    writeLn(this.getJson(response), true);
                } else {
                    writeLn(chalk.redBright(response.message), true);
                }
            }
            if (exitImmediately) {
                process.exit(1);
            } else {
                process.exitCode = 1;
            }
            return;
        }

        if (process.env.BW_RESPONSE === 'true') {
            writeLn(this.getJson(response), true);
        } else if (response.data != null) {
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
                writeLn(out, true);
            }
        }
        if (exitImmediately) {
            process.exit(0);
        } else {
            process.exitCode = 0;
        }
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
            if (message.noColor) {
                out = message.title;
            } else {
                out = chalk.greenBright(message.title);
            }
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
        const hasKey = await this.main.cryptoService.hasKey();
        if (!hasKey) {
            this.processResponse(Response.error('Vault is locked.'), true);
        }
    }

    private async exitIfAuthed() {
        const authed = await this.main.userService.isAuthenticated();
        if (authed) {
            const email = await this.main.userService.getEmail();
            this.processResponse(Response.error('You are already logged in as ' + email + '.'), true);
        }
    }

    private async exitIfNotAuthed() {
        const authed = await this.main.userService.isAuthenticated();
        if (!authed) {
            this.processResponse(Response.error('You are not logged in.'), true);
        }
    }
}
