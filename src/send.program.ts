import * as program from 'commander';
import * as chk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';

import { Main } from './bw';

import { SendGetCommand } from './commands/send/get.command';
import { SendListCommand } from './commands/send/list.command';
import { SendReceiveCommand } from './commands/send/receive.command';

import { CliUtils } from './utils';
import { Program } from './program';
import { SendCreateCommand } from './commands/send/create.command';
import { GetCommand } from './commands/get.command';
import { SendResponse } from './models/response/sendResponse';
import { encode } from 'punycode';
import { Utils } from 'jslib/misc/utils';
import { SendFileResponse } from './models/response/sendFileResponse';
import { SendTextResponse } from './models/response/sendTextResponse';
import { Response } from 'jslib/cli/models/response';
import { SendType } from 'jslib/enums/sendType';


const chalk = chk.default;
const writeLn = CliUtils.writeLn;

export class SendProgram extends Program {

    constructor(main: Main) {
        super(main);
    }

    register() {
        program.addCommand(this.sendCommand());
        // receive is accessible both at `bw receive` and `bw send receive`
        program.addCommand(this.receiveCommand());
    }

    private sendCommand(): program.Command {
        return new program.Command('send')
            .arguments('<data>')
            .description('Work with Bitwarden sends. A Send can be quickly created using this command or subcommands can be used to fine-tune the Send', {
                data: 'The data to Send. Specify as a filepath with the --file option'
            })
            .option('-f, --file', 'Specifies that <data> is a filepath')
            .option('-d, --deleteInDays <days>', 'The number of days in the future to set deletion date, defaults to 7', this.parseValidDeleteIn, 7)
            .option('--hidden', 'Hide <data> in web by default. Valid only if --file is not set.')
            .option('-n, --name <name>', 'The name of the Send. Defaults to a guid for text Sends and the filename for files.')
            .option('--notes <notes>', 'Notes to add to the Send.')
            .addCommand(this.listCommand())
            .addCommand(this.templateCommand())
            .addCommand(this.getCommand())
            .addCommand(this.receiveCommand())
            .addCommand(this.createCommand())
            .action(async (data: string, options: program.OptionValues) => {
                const encodedJson = this.makeSendJson(data, options);

                let response: Response;
                if (encodedJson instanceof Response) {
                    response = encodedJson;
                } else {
                    response = await this.runCreate(encodedJson, options);
                }

                this.processResponse(response);
            });
    }

    private receiveCommand(): program.Command {
        return new program.Command('receive')
            .arguments('<url>')
            .description('Access a Bitwarden Send from a url')
            .option('--password <password>', 'Password needed to access the Send.')
            .option('--passwordenv <passwordenv>', 'Environment variable storing the Send\'s password')
            .option('--passwordfile <passwordfile>', 'Path to a file containing the Send\s password as its first line')
            .option('--obj', 'Return the Send\'s json object rather than the Send\'s content')
            .option('--output', 'Specify a file path to save a File-type Send to')
            .on('--help', () => {
                writeLn('');
                writeLn('Accesses a Send from the given url. If a password is required,');
                writeLn('the user is either prompted to the provided password is used.');
                writeLn('', true);
            })
            .action(async (url: string, options: program.OptionValues) => {
                const command = new SendReceiveCommand(this.main.apiService, this.main.cryptoService,
                    this.main.cryptoFunctionService, this.main.platformUtilsService, this.main.environmentService);
                const response = await command.run(url, options);
                this.processResponse(response);
            });
    }

    private listCommand(): program.Command {
        return new program.Command('list')

            .description('List all the Sends owned by you')
            .on('--help', () => { writeLn(chk.default('This is in the list command')); })
            .action(async (options: program.OptionValues) => {
                await this.exitIfLocked();
                const command = new SendListCommand(this.main.sendService, this.main.environmentService,
                    this.main.searchService);
                const response = await command.run(options);
                this.processResponse(response);
            });
    }

    private templateCommand(): program.Command {
        return new program.Command('template')
            .arguments('<object>')
            .description('Get json templates for send objects', {
                object: 'Valid objects are: send, send.text, send.file'
            })
            .action(async (object) => {
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService, this.main.auditService, this.main.cryptoService,
                    this.main.userService, this.main.searchService, this.main.apiService, this.main.sendService,
                    this.main.environmentService);
                const response = await command.run('template', object, null);
                this.processResponse(response);
            });
    }

    private getCommand(): program.Command {
        return new program.Command('get')
            .arguments('<id>')
            .description('Get Sends owned by you.')
            .option('--output <output>', 'Output directory or filename for attachment.')
            .option('--text', 'Specifies to return the text content of a Send')
            .option('--file', 'Specifies to return the file content of a Send. This can be paired with --output or --raw to output to stdout')
            .on('--help', () => {
                writeLn('');
                writeLn('  Id:');
                writeLn('');
                writeLn('    Search term or Send\'s globally unique `id`.');
                writeLn('');
                writeLn('    If raw output is specified and no output filename or directory is given for');
                writeLn('    an attachment query, the attachment content is written to stdout.');
                writeLn('');
                writeLn('  Examples:');
                writeLn('');
                writeLn('    bw get send searchText');
                writeLn('    bw get send id');
                writeLn('    bw get send searchText --text');
                writeLn('    bw get send searchText --file');
                writeLn('    bw get send searchText --file --output ../Photos/photo.jpg');
                writeLn('    bw get send searchText --file --raw');
                writeLn('', true);
            })
            .action(async (id: string, options: program.OptionValues) => {
                await this.exitIfLocked();
                const command = new SendGetCommand(this.main.sendService, this.main.environmentService,
                    this.main.searchService, this.main.cryptoService);
                const response = await command.run(id, options);
                this.processResponse(response);
            });
    }

    private createCommand(): program.Command {
        return new program.Command('create')
            .arguments('[encodedJson]')
            .description('create a Send', {
                encodedJson: 'JSON object to upload. Can also be piped in through stdin.',
            })
            .option('--file <path>', 'file to Send. Can also be specified in parent\'s JSON.')
            .option('--text <text>', 'text to Send. Can also be specified in parent\'s JSON.')
            .option('--hidden', 'text hidden flag. Valid only with the --text option.', true)
            .option('--password <password>', 'optional password to access this Send. Can also be specified in JSON')
            .on('--help', () => {
                writeLn('');
                writeLn('Note:');
                writeLn('  Options specified in JSON take precedence over command options');
                writeLn('', true);
            })
            .action(async (encodedJson: string, options: program.OptionValues) => {
                const response = await this.runCreate(encodedJson, options);
                this.processResponse(response);
            });
    }

    private parseValidDeleteIn(value: string) {
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue) || parsedValue <= 0) {
            throw new program.InvalidOptionArgumentError('Not a valid delete in value.');
        }
        return parsedValue;
    }

    private makeSendJson(data: string, options: program.OptionValues) {
        let sendFile = null;
        let sendText = null;
        let name = Utils.newGuid();
        let type = SendType.Text;
        if (options.file != null) {
            data = path.resolve(data);
            if (!fs.existsSync(data)) {
                return Response.badRequest('data path does not exist');
            }

            sendFile = SendFileResponse.template(data);
            name = path.basename(data);
            type = SendType.File;
        } else {
            sendText = SendTextResponse.template(data, options.hidden);
        }

        const template = Utils.assign(SendResponse.template(options.deleteInDays), {
            name: options.name ?? name,
            notes: options.notes,
            file: sendFile,
            text: sendText,
            type: type
        });

        return Buffer.from(JSON.stringify(template), 'utf8').toString('base64');
    }

    private async runCreate(encodedJson: string, options: program.OptionValues) {
        await this.exitIfLocked();
        const command = new SendCreateCommand(this.main.apiService, this.main.sendService, this.main.userService);
        return await command.run(encodedJson, options);
    }
}
