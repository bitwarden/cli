import * as program from 'commander';
import { ImportService } from 'jslib/abstractions/import.service';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';

import { CliUtils } from '../utils';

export class ImportCommand {
    constructor(private importService: ImportService) { }

    async run(format: string, filepath: string, options: program.OptionValues): Promise<Response> {
        if (options.formats || false) {
            return this.list();
        } else {
            return this.import(format, filepath);
        }
    }

    private async import(format: string, filepath: string) {
        if (format == null || format === '') {
            return Response.badRequest('`format` was not provided.');
        }
        if (filepath == null || filepath === '') {
            return Response.badRequest('`filepath` was not provided.');
        }

        const importer = await this.importService.getImporter(format, null);
        if (importer === null) {
            return Response.badRequest('Proper importer type required.');
        }

        try {
            const contents = await CliUtils.readFile(filepath);
            if (contents === null || contents === '') {
                return Response.badRequest('Import file was empty.');
            }

            const err = await this.importService.import(importer, contents, null);
            if (err != null) {
                return Response.badRequest(err.message);
            }
            const res = new MessageResponse('Imported ' + filepath, null);
            return Response.success(res);
        } catch (err) {
            return Response.badRequest(err);
        }
    }

    private async list() {
        const options = this.importService.getImportOptions().sort((a, b) => {
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        }).map((option) => option.id).join('\n');
        const res = new MessageResponse('Supported input formats:', options);
        res.raw = options;
        return Response.success(res);
    }
}
