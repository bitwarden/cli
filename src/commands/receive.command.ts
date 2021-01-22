import * as program from 'commander';
import * as inquirer from 'inquirer';

import { ApiService } from 'jslib/abstractions/api.service';
import { CryptoFunctionService } from 'jslib/abstractions/cryptoFunction.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';

import { SendAccessResponse } from '../models/response/SendAccessResponse';

import { ErrorResponse } from 'jslib/models/response/errorResponse';
import { SendAccessRequest } from 'jslib/models/request/sendAccessRequest';

import { SendAccess } from 'jslib/models/domain/sendAccess';
import { SymmetricCryptoKey } from 'jslib/models/domain/symmetricCryptoKey';

import { Response } from 'jslib/cli/models/response'
    ;
import { Utils } from 'jslib/misc/utils';
import { NodeUtils } from 'jslib/misc/nodeUtils';

import { DownloadCommand } from './download.command';
import { SendType } from 'jslib/enums/sendType';

export class ReceiveCommand extends DownloadCommand {
    private canInteract: boolean;
    private decKey: SymmetricCryptoKey;

    constructor(private apiService: ApiService, cryptoService: CryptoService,
        private cryptoFunctionService: CryptoFunctionService) {
        super(cryptoService);
    }

    async run(url: string, options: program.OptionValues): Promise<Response> {
        this.canInteract = process.env.BW_NOINTERACTION !== 'true';

        let urlObject: URL;
        try {
            urlObject = new URL(url);
        } catch (e) {
            return Response.badRequest('Failed to parse the provided Send url');
        }

        const apiUrl = this.getBaseUrl(urlObject);
        const [id, key] = this.getIdAndKey(urlObject);

        if (Utils.isNullOrWhitespace(id) || Utils.isNullOrWhitespace(key)) {
            return Response.badRequest('Failed to parse url, the url provided is not a valid Send url');
        }

        const keyArray = Utils.fromUrlB64ToArray(key);
        const request = new SendAccessRequest();

        let password = options.password;
        if (password == null || password === '') {
            if (options.passwordfile) {
                password = await NodeUtils.readFirstLine(options.passwordfile);
            } else if (options.passwordenv && process.env[options.passwordenv]) {
                password = process.env[options.passwordenv];
            }
        }

        if (password != null && password !== '') {
            request.password = await this.getUnlockedPassword(password, keyArray);
        }


        const response = await this.sendRequest(request, apiUrl, id, keyArray);

        if (response instanceof Response) {
            // Error scenario
            return response;
        }

        if (options.obj != null) {
            return Response.success(new SendAccessResponse(response));
        }

        switch (response.type) {
            case SendType.Text:
                // Write to stdout and response success so we get the text string only to stdout
                process.stdout.write(response?.text?.text);
                return Response.success();
            case SendType.File:
                return await this.saveAttachmentToFile(response?.file?.url, this.decKey, response?.file?.fileName, options.output);
            default:
                return Response.success(new SendAccessResponse(response));
        }
    }

    private getIdAndKey(url: URL): [string, string] {
        const result = url.hash.split('/').slice(2);
        return [result[0], result[1]];
    }

    private getBaseUrl(url: URL) {
        return url.origin + '/api';
    }

    private async getUnlockedPassword(password: string, keyArray: ArrayBuffer) {
        const passwordHash = await this.cryptoFunctionService.pbkdf2(password, keyArray, 'sha256', 100000);
        return Utils.fromBufferToB64(passwordHash);
    }

    private async sendRequest(request: SendAccessRequest, url: string, id: string, key: ArrayBuffer) {
        try {
            const sendResponse = await this.apiService.postSendAccess(id, request, url);

            const sendAccess = new SendAccess(sendResponse);
            this.decKey = await this.cryptoService.makeSendKey(key);
            return await sendAccess.decrypt(this.decKey);
        } catch (e) {
            if (e instanceof ErrorResponse) {
                if (e.statusCode === 401) {
                    if (this.canInteract) {
                        const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                            type: 'password',
                            name: 'password',
                            message: 'Master password:',
                        });

                        // reattempt with new password
                        request.password = await this.getUnlockedPassword(answer.password, key);
                    }

                    return Response.badRequest('Incorrect or missing password');
                } else if (e.statusCode === 405) {
                    return Response.badRequest('Bad Request');
                } else if (e.statusCode === 404) {
                    return Response.notFound();
                } else {
                    return Response.error(e);
                }
            }
        }
    }
}
