import * as program from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { SendService } from 'jslib/abstractions/send.service';
import { UserService } from 'jslib/abstractions/user.service';

import { SendType } from 'jslib/enums/sendType';

import { NodeUtils } from 'jslib/misc/nodeUtils';

import { Response } from 'jslib/cli/models/response';
import { StringResponse } from 'jslib/cli/models/response/stringResponse';

import { SendResponse } from '../../models/response/sendResponse';
import { SendTextResponse } from '../../models/response/sendTextResponse';

import { CliUtils } from '../../utils';

export class SendCreateCommand {
    constructor(private sendService: SendService, private userService: UserService,
        private environmentService: EnvironmentService) { }

    async run(requestJson: string, options: program.OptionValues) {
        let req: any = null;
        if (requestJson == null || requestJson === '') {
            requestJson = await CliUtils.readStdin();
        }

        if (requestJson == null || requestJson === '') {
            return Response.badRequest('`requestJson` was not provided.');
        }

        try {
            const reqJson = Buffer.from(requestJson, 'base64').toString();
            req = SendResponse.fromJson(reqJson);

            if (req == null) {
                throw new Error('Null request');
            }
        } catch (e) {
            return Response.badRequest('Error parsing the encoded request data.');
        }

        if (req.deletionDate == null || isNaN(new Date(req.deletionDate).getTime()) ||
            new Date(req.deletionDate) <= new Date()) {
            return Response.badRequest('Must specify a valid deletion date after the current time');
        }

        if (req.expirationDate != null && isNaN(new Date(req.expirationDate).getTime())) {
            return Response.badRequest('Unable to parse expirationDate: ' + req.expirationDate);
        }

        return this.createSend(req, options);
    }

    private async createSend(req: SendResponse, options: program.OptionValues) {
        const filePath = req.file?.fileName ?? options.file;
        const text = req.text?.text ?? options.text;
        const hidden = req.text?.hidden ?? options.hidden;
        const password = req.password ?? options.password;

        req.key = null;

        switch (req.type) {
            case SendType.File:
                if (!(await this.userService.canAccessPremium())) {
                    return Response.error('Premium status is required to use this feature.');
                }

                if (filePath == null) {
                    return Response.badRequest('Must specify a file to Send either with the --file option or in the encoded json');
                }

                req.file.fileName = path.basename(filePath)
                break;
            case SendType.Text:
                if (text == null) {
                    return Response.badRequest('Must specify text content to Send either with the --text option or in the encoded json');
                }
                req.text = new SendTextResponse();
                req.text.text = text;
                req.text.hidden = hidden;
                break;
            default:
                return Response.badRequest('Unknown Send type ' + SendType[req.type] + 'valid types are: file, text');
        }

        try {
            let fileBuffer: ArrayBuffer = null;
            if (req.type === SendType.File) {
                fileBuffer = NodeUtils.bufferToArrayBuffer(fs.readFileSync(filePath));
            }

            const sendView = SendResponse.toView(req);
            const [encSend, fileData] = await this.sendService.encrypt(sendView, fileBuffer, password);
            // Add dates from template
            encSend.deletionDate = sendView.deletionDate;
            encSend.expirationDate = sendView.expirationDate;

            await this.sendService.saveWithServer([encSend, fileData]);
            const newSend = await this.sendService.get(encSend.id);
            const decSend = await newSend.decrypt();
            const res = new SendResponse(decSend, this.environmentService.getWebVaultUrl());
            return Response.success(options.fullObject ? res :
                new StringResponse('Send created! It can be accessed at:\n' + res.accessUrl));
        } catch (e) {
            return Response.error(e);
        }
    }
}
