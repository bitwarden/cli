import * as program from 'commander';
import * as inquirer from 'inquirer';

import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { ExportService } from 'jslib-common/abstractions/export.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';

import { Response } from 'jslib-node/cli/models/response';

import { PolicyType } from 'jslib-common/enums/policyType';

import { Utils } from 'jslib-common/misc/utils';

import { CliUtils } from '../utils';

export class ExportCommand {
    constructor(private cryptoService: CryptoService, private exportService: ExportService,
        private policyService: PolicyService) { }

    async run(password: string, options: program.OptionValues): Promise<Response> {
        if (options.organizationid == null &&
            await this.policyService.policyAppliesToUser(PolicyType.DisablePersonalVaultExport)) {
            return Response.badRequest(
                'One or more organization policies prevents you from exporting your personal vault.'
            );
        }
        const canInteract = process.env.BW_NOINTERACTION !== 'true';
        if ((password == null || password === '') && canInteract) {
            const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                type: 'password',
                name: 'password',
                message: 'Master password:',
            });
            password = answer.password;
        }
        if (password == null || password === '') {
            return Response.badRequest('Master password is required.');
        }

        if (await this.cryptoService.compareAndUpdateKeyHash(password, null)) {
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
        } else {
            return Response.error('Invalid master password.');
        }
    }

    async saveFile(exportContent: string, options: program.OptionValues, format: string): Promise<Response> {
        try {
            const fileName = this.getFileName(format, options.organizationid != null ? 'org' : null);
            return await CliUtils.saveResultToFile(exportContent, options.output, fileName);
        } catch (e) {
            return Response.error(e.toString());
        }
    }

    private getFileName(format: string, prefix?: string) {
        if (format === 'encrypted_json') {
            if (prefix == null) {
                prefix = 'encrypted';
            } else {
                prefix = 'encrypted_' + prefix;
            }
            format = 'json';
        }
        return this.exportService.getFileName(prefix, format);
    }
}
