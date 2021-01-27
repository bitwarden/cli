import * as chk from 'chalk';
import * as program from 'commander';

import { Main } from './bw';

import { ConfirmCommand } from './commands/confirm.command';
import { CreateCommand } from './commands/create.command';
import { DeleteCommand } from './commands/delete.command';
import { EditCommand } from './commands/edit.command';
import { ExportCommand } from './commands/export.command';
import { GetCommand } from './commands/get.command';
import { ImportCommand } from './commands/import.command';
import { ListCommand } from './commands/list.command';
import { RestoreCommand } from './commands/restore.command';
import { ShareCommand } from './commands/share.command';

import { CliUtils } from './utils';

import { Program } from './program';

const chalk = chk.default;
const writeLn = CliUtils.writeLn;

export class VaultProgram extends Program {
    constructor(protected main: Main) {
        super(main);
    }

    register() {
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
                writeLn('    send');
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
            .action(async (format, filepath, options) => {
                await this.exitIfLocked();
                const command = new ImportCommand(this.main.importService);
                const response = await command.run(format, filepath, options);
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
            .action(async (password, options) => {
                await this.exitIfLocked();
                const command = new ExportCommand(this.main.cryptoService, this.main.exportService);
                const response = await command.run(password, options);
                this.processResponse(response);
            });

    }
}
