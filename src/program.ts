import * as chk from 'chalk';
import * as program from 'commander';

import { Main } from './bw';

import { ConfigCommand } from './commands/config.command';
import { ConfirmCommand } from './commands/confirm.command';
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
import { RestoreCommand } from './commands/restore.command';
import { ShareCommand } from './commands/share.command';
import { StatusCommand } from './commands/status.command';
import { SyncCommand } from './commands/sync.command';
import { UnlockCommand } from './commands/unlock.command';

import { CompletionCommand } from './commands/completion.command';

import { LogoutCommand } from 'jslib/cli/commands/logout.command';
import { UpdateCommand } from 'jslib/cli/commands/update.command';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';

import { TemplateResponse } from './models/response/templateResponse';
import { CliUtils } from './utils';

import { BaseProgram } from 'jslib/cli/baseProgram';

const chalk = chk.default;
const writeLn = CliUtils.writeLn;

export class Program extends BaseProgram {
    constructor(private main: Main) {
        super(main.userService, writeLn);
    }

    run() {
        program
            .option('--pretty', 'Format output. JSON is tabbed with two spaces.')
            .option('--raw', 'Return raw output instead of a descriptive message.')
            .option('--response', 'Return a JSON formatted version of response output.')
            .option('--quiet', 'Don\'t return anything to stdout.')
            .option('--nointeraction', 'Do not prompt for interactive user input.')
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

        program.on('option:nointeraction', () => {
            process.env.BW_NOINTERACTION = 'true';
        });

        program.on('option:session', (key) => {
            process.env.BW_SESSION = key;
        });

        program.on('command:*', () => {
            writeLn(chalk.redBright('Invalid command: ' + program.args.join(' ')), false, true);
            writeLn('See --help for a list of available commands.', true, true);
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
            writeLn('    bw config server https://bitwarden.example.com');
            writeLn('', true);
        });

        program
            .command('login [email] [password]')
            .description('Log into a user account.')
            .option('--method <method>', 'Two-step login method.')
            .option('--code <code>', 'Two-step login code.')
            .option('--sso', 'Log in with Single-Sign On.')
            .option('--apikey', 'Log in with an Api Key.')
            .option('--check', 'Check login status.', async () => {
                const authed = await this.main.userService.isAuthenticated();
                if (authed) {
                    const res = new MessageResponse('You are logged in!', null);
                    this.processResponse(Response.success(res), true);
                }
                this.processResponse(Response.error('You are not logged in.'), true);
            })
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
                writeLn('    bw login --sso');
                writeLn('', true);
            })
            .action(async (email: string, password: string, cmd: program.Command) => {
                if (!cmd.check) {
                    await this.exitIfAuthed();
                    const command = new LoginCommand(this.main.authService, this.main.apiService,
                        this.main.cryptoFunctionService, this.main.syncService, this.main.i18nService,
                        this.main.environmentService, this.main.passwordGenerationService,
                        this.main.platformUtilsService);
                    const response = await command.run(email, password, cmd);
                    this.processResponse(response);
                }
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
                const command = new LogoutCommand(this.main.authService, this.main.i18nService,
                    async () => await this.main.logout());
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
                const command = new LockCommand(this.main.vaultTimeoutService);
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
            .option('--check', 'Check lock status.', async () => {
                const locked = await this.main.vaultTimeoutService.isLocked();
                if (!locked) {
                    const res = new MessageResponse('Vault is unlocked!', null);
                    this.processResponse(Response.success(res), true);
                }
                this.processResponse(Response.error('Vault is locked.'), true);
            })
            .action(async (password, cmd) => {
                if (!cmd.check) {
                    await this.exitIfNotAuthed();
                    const command = new UnlockCommand(this.main.cryptoService, this.main.userService,
                        this.main.cryptoFunctionService, this.main.apiService);
                    const response = await command.run(password, cmd);
                    this.processResponse(response);
                }
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
            .option('--url <url>', 'Filter items of type login with a url-match search.')
            .option('--folderid <folderid>', 'Filter items by folder id.')
            .option('--collectionid <collectionid>', 'Filter items by collection id.')
            .option('--organizationid <organizationid>', 'Filter items or collections by organization id.')
            .option('--trash', 'Filter items that are deleted and in the trash.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    items');
                writeLn('    folders');
                writeLn('    collections');
                writeLn('    organizations');
                writeLn('    org-collections');
                writeLn('    org-members');
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
                writeLn('    bw list items --url https://google.com');
                writeLn('    bw list items --folderid null');
                writeLn('    bw list items --organizationid notnull');
                writeLn('    bw list items --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2 --organizationid notnull');
                writeLn('    bw list items --trash');
                writeLn('    bw list folders --search email');
                writeLn('    bw list org-members --organizationid 60556c31-e649-4b5d-8daf-fc1c391a1bf2');
                writeLn('    bw list sends')
                writeLn('', true);
            })
            .action(async (object, cmd) => {
                await this.exitIfLocked();
                const command = new ListCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.userService, this.main.searchService, this.main.apiService,
                    this.main.sendService, this.main.environmentService);
                const response = await command.run(object, cmd);
                this.processResponse(response);
            });

        program
            .command('get <object> <id>')
            .description('Get an object from the vault.')
            .option('--itemid <itemid>', 'Attachment\'s item id.')
            .option('--output <output>', 'Output directory or filename for attachment.')
            .option('--organizationid <organizationid>', 'Organization id for an organization object.')
            .option('--text', 'Specifies to return the text content of a Send')
            .option('--file', 'Specifies to return the file content of a Send. This can be paired with --output or --raw to output to stdout')
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
                writeLn('    org-collection');
                writeLn('    organization');
                writeLn('    template');
                writeLn('    fingerprint');
                writeLn('    send')
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Search term or object\'s globally unique `id`.');
                writeLn('');
                writeLn('    If raw output is specified and no output filename or directory is given for');
                writeLn('    an attachment query, the attachment content is written to stdout.');
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
                writeLn('    bw get send searchText');
                writeLn('    bw get send id');
                writeLn('    bw get send searchText --text');
                writeLn('    bw get send searchText --file');
                writeLn('    bw get send searchText --file --output ../Photos/photo.jpg');
                writeLn('    bw get send searchText --file --raw')
                writeLn('    bw get folder email');
                writeLn('    bw get template folder');
                writeLn('', true);
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService, this.main.auditService,
                    this.main.cryptoService, this.main.userService, this.main.searchService,
                    this.main.apiService, this.main.sendService, this.main.environmentService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('create <object> [encodedJson]')
            .option('--file <file>', 'Path to file for attachment.')
            .option('--itemid <itemid>', 'Attachment\'s item id.')
            .option('--organizationid <organizationid>', 'Organization id for an organization object.')
            .description('Create an object in the vault.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    attachment');
                writeLn('    folder');
                writeLn('    org-collection');
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
                    this.main.userService, this.main.cryptoService, this.main.apiService);
                const response = await command.run(object, encodedJson, cmd);
                this.processResponse(response);
            });

        program
            .command('edit <object> <id> [encodedJson]')
            .option('--organizationid <organizationid>', 'Organization id for an organization object.')
            .description('Edit an object from the vault.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    item-collections');
                writeLn('    folder');
                writeLn('    org-collection');
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
                writeLn('    bw edit item-collections 78307355-fd25-416b-88b8-b33fd0e88c82 ' +
                    'WyI5NzQwNTNkMC0zYjMzLTRiOTgtODg2ZS1mZWNmNWM4ZGJhOTYiXQ==');
                writeLn('', true);
            })
            .action(async (object, id, encodedJson, cmd) => {
                await this.exitIfLocked();
                const command = new EditCommand(this.main.cipherService, this.main.folderService,
                    this.main.cryptoService, this.main.apiService);
                const response = await command.run(object, id, encodedJson, cmd);
                this.processResponse(response);
            });

        program
            .command('delete <object> <id>')
            .option('--itemid <itemid>', 'Attachment\'s item id.')
            .option('--organizationid <organizationid>', 'Organization id for an organization object.')
            .option('-p, --permanent', 'Permanently deletes the item instead of soft-deleting it (item only).')
            .description('Delete an object from the vault.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('    attachment');
                writeLn('    folder');
                writeLn('    org-collection');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Object\'s globally unique `id`.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw delete item 7063feab-4b10-472e-b64c-785e2b870b92');
                writeLn('    bw delete item 89c21cd2-fab0-4f69-8c6e-ab8a0168f69a --permanent');
                writeLn('    bw delete folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02');
                writeLn('    bw delete attachment b857igwl1dzrs2 --itemid 310d5ffd-e9a2-4451-af87-ea054dce0f78');
                writeLn('', true);
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new DeleteCommand(this.main.cipherService, this.main.folderService,
                    this.main.userService, this.main.apiService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('restore <object> <id>')
            .description('Restores an object from the trash.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    item');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Object\'s globally unique `id`.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw restore item 7063feab-4b10-472e-b64c-785e2b870b92');
                writeLn('', true);
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new RestoreCommand(this.main.cipherService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('share <id> <organizationId> [encodedJson]')
            .description('Share an item to an organization.')
            .on('--help', () => {
                writeLn('\n  Id:');
                writeLn('');
                writeLn('    Item\'s globally unique `id`.');
                writeLn('');
                writeLn('  Organization Id:');
                writeLn('');
                writeLn('    Organization\'s globally unique `id`.');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('    `encodedJson` can also be piped into stdin. `encodedJson` contains ' +
                    'an array of collection ids.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw share 4af958ce-96a7-45d9-beed-1e70fabaa27a 6d82949b-b44d-468a-adae-3f3bacb0ea32 ' +
                    'WyI5NzQwNTNkMC0zYjMzLTRiOTgtODg2ZS1mZWNmNWM4ZGJhOTYiXQ==');
                writeLn('    echo \'["974053d0-3b33-4b98-886e-fecf5c8dba96"]\' | bw encode | ' +
                    'bw share 4af958ce-96a7-45d9-beed-1e70fabaa27a 6d82949b-b44d-468a-adae-3f3bacb0ea32');
                writeLn('', true);
            })
            .action(async (id, organizationId, encodedJson, cmd) => {
                await this.exitIfLocked();
                const command = new ShareCommand(this.main.cipherService);
                const response = await command.run(id, organizationId, encodedJson, cmd);
                this.processResponse(response);
            });

        program
            .command('confirm <object> <id>')
            .option('--organizationid <organizationid>', 'Organization id for an organization object.')
            .description('Confirm an object to the organization.')
            .on('--help', () => {
                writeLn('\n  Objects:');
                writeLn('');
                writeLn('    org-member');
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Object\'s globally unique `id`.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw confirm org-member 7063feab-4b10-472e-b64c-785e2b870b92 ' +
                    '--organizationid 310d5ffd-e9a2-4451-af87-ea054dce0f78');
                writeLn('', true);
            })
            .action(async (object, id, cmd) => {
                await this.exitIfLocked();
                const command = new ConfirmCommand(this.main.apiService, this.main.cryptoService);
                const response = await command.run(object, id, cmd);
                this.processResponse(response);
            });

        program
            .command('import [format] [input]')
            .description('Import vault data from a file.')
            .option('--formats', 'List formats')
            .on('--help', () => {
                writeLn('\n Examples:');
                writeLn('');
                writeLn('    bw import --formats');
                writeLn('    bw import bitwardencsv ./from/source.csv');
                writeLn('    bw import keepass2xml keepass_backup.xml');
            })
            .action(async (format, filepath, cmd) => {
                await this.exitIfLocked();
                const command = new ImportCommand(this.main.importService);
                const response = await command.run(format, filepath, cmd);
                this.processResponse(response);
            });

        program
            .command('export [password]')
            .description('Export vault data to a CSV or JSON file.')
            .option('--output <output>', 'Output directory or filename.')
            .option('--format <format>', 'Export file format.')
            .option('--organizationid <organizationid>', 'Organization id for an organization.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    Valid formats are `csv`, `json`, `encrypted_json`. Default format is `csv`.');
                writeLn('');
                writeLn('    If --raw option is specified and no output filename or directory is given, the');
                writeLn('    result is written to stdout.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw export');
                writeLn('    bw --raw export');
                writeLn('    bw export myPassword321');
                writeLn('    bw export myPassword321 --format json');
                writeLn('    bw export --output ./exp/bw.csv');
                writeLn('    bw export myPassword321 --output bw.json --format json');
                writeLn('    bw export myPassword321 --organizationid 7063feab-4b10-472e-b64c-785e2b870b92');
                writeLn('', true);
            })
            .action(async (password, cmd) => {
                await this.exitIfLocked();
                const command = new ExportCommand(this.main.cryptoService, this.main.exportService);
                const response = await command.run(password, cmd);
                this.processResponse(response);
            });

        program
            .command('generate')
            .description('Generate a password/passphrase.')
            .option('-u, --uppercase', 'Include uppercase characters.')
            .option('-l, --lowercase', 'Include lowercase characters.')
            .option('-n, --number', 'Include numeric characters.')
            .option('-s, --special', 'Include special characters.')
            .option('-p, --passphrase', 'Generate a passphrase.')
            .option('--length <length>', 'Length of the password.')
            .option('--words <words>', 'Number of words.')
            .option('--separator <separator>', 'Word separator.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    Default options are `-uln --length 14`.');
                writeLn('');
                writeLn('    Minimum `length` is 5.');
                writeLn('');
                writeLn('    Minimum `words` is 3.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw generate');
                writeLn('    bw generate -u -l --length 18');
                writeLn('    bw generate -ulns --length 25');
                writeLn('    bw generate -ul');
                writeLn('    bw generate -p --separator _');
                writeLn('    bw generate -p --words 5 --separator space');
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
            .command('config <setting> [value]')
            .description('Configure CLI settings.')
            .option('--web-vault <url>', 'Provides a custom web vault URL that differs from the base URL.')
            .option('--api <url>', 'Provides a custom API URL that differs from the base URL.')
            .option('--identity <url>', 'Provides a custom identity URL that differs from the base URL.')
            .option('--icons <url>', 'Provides a custom icons service URL that differs from the base URL.')
            .option('--notifications <url>', 'Provides a custom notifications URL that differs from the base URL.')
            .option('--events <url>', 'Provides a custom events URL that differs from the base URL.')
            .on('--help', () => {
                writeLn('\n  Settings:');
                writeLn('');
                writeLn('    server - On-premises hosted installation URL.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw config server');
                writeLn('    bw config server https://bw.company.com');
                writeLn('    bw config server bitwarden.com');
                writeLn('    bw config server --api http://localhost:4000 --identity http://localhost:33656');
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
                const command = new UpdateCommand(this.main.platformUtilsService, this.main.i18nService,
                    'cli', 'bw', true);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('completion')
            .description('Generate shell completions.')
            .option('--shell <shell>', 'Shell to generate completions for.')
            .on('--help', () => {
                writeLn('\n  Notes:');
                writeLn('');
                writeLn('    Valid shells are `zsh`.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw completion --shell zsh');
                writeLn('', true);
            })
            .action(async (cmd: program.Command) => {
                const command = new CompletionCommand();
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .command('status')
            .description('Show server, last sync, user information, and vault status.')
            .on('--help', () => {
                writeLn('');
                writeLn('');
                writeLn('  Example return value:');
                writeLn('');
                writeLn('    {');
                writeLn('      "serverUrl": "https://bitwarden.example.com",');
                writeLn('      "lastSync": "2020-06-16T06:33:51.419Z",');
                writeLn('      "userEmail": "user@example.com,');
                writeLn('      "userId": "00000000-0000-0000-0000-000000000000",');
                writeLn('      "status": "locked"');
                writeLn('    }');
                writeLn('');
                writeLn('  Notes:');
                writeLn('');
                writeLn('  `status` is one of:');
                writeLn('    - `unauthenticated` when you are not logged in');
                writeLn('    - `locked` when you are logged in and the vault is locked');
                writeLn('    - `unlocked` when you are logged in and the vault is unlocked');
                writeLn('', true);
            })
            .action(async (cmd: program.Command) => {
                const command = new StatusCommand(
                    this.main.environmentService,
                    this.main.syncService,
                    this.main.userService,
                    this.main.vaultTimeoutService);
                const response = await command.run(cmd);
                this.processResponse(response);
            });

        program
            .parse(process.argv);

        if (process.argv.slice(2).length === 0) {
            program.outputHelp();
        }
    }

    protected processResponse(response: Response, exitImmediately = false) {
        super.processResponse(response, exitImmediately, () => {
            if (response.data.object === 'template') {
                return this.getJson((response.data as TemplateResponse).template);
            }
            return null;
        });
    }

    private async exitIfLocked() {
        await this.exitIfNotAuthed();
        const hasKey = await this.main.cryptoService.hasKey();
        if (!hasKey) {
            const canInteract = process.env.BW_NOINTERACTION !== 'true';
            if (canInteract) {
                const command = new UnlockCommand(this.main.cryptoService, this.main.userService,
                    this.main.cryptoFunctionService, this.main.apiService);
                const response = await command.run(null, null);
                if (!response.success) {
                    this.processResponse(response, true);
                }
            } else {
                this.processResponse(Response.error('Vault is locked.'), true);
            }
        }
    }
}
