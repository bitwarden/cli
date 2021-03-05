import * as program from 'commander';

import { ExportService } from 'jslib/abstractions/export.service';

import { Response } from 'jslib/cli/models/response';

import { CliUtils } from '../utils';

import { Utils } from 'jslib/misc/utils';

export class ExportCommand {
    constructor(private exportService: ExportService) { }

    async run(options: program.OptionValues): Promise<Response> {
        let format = options.format;
        if (format !== 'encrypted_json' && format !== 'json') {
            format = 'csv';
        }
        if (options.organizationid != null && !Utils.isGuid(options.organizationid)) {
            return Response.error('`' + options.organizationid + '` is not a GUID.');
        }
        let exportContent: string = null;
        try {
            exportContent = options.organizationid != null ?
                await this.exportService.getOrganizationExport(options.organizationid, format) :
                await this.exportService.getExport(format);
        } catch (e) {
            return Response.error(e);
        }
        return await this.saveFile(exportContent, options, format);
    }

    async saveFile(exportContent: string, options: program.OptionValues, format: string): Promise<Response> {
        try {
            const fileName = this.exportService.getFileName(options.organizationid != null ? 'org' : null, format);
            return await CliUtils.saveResultToFile(exportContent, options.output, fileName);
        } catch (e) {
            return Response.error(e.toString());
        }
    }
}
