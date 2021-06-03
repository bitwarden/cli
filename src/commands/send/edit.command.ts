import * as program from 'commander';

import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { SendService } from 'jslib-common/abstractions/send.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { Response } from 'jslib-node/cli/models/response';
import { SendType } from 'jslib-common/enums/sendType';

import { SendResponse } from '../../models/response/sendResponse';

import { CliUtils } from '../../utils';
import { SendGetCommand } from './get.command';

export class SendEditCommand {
    constructor(private sendService: SendService, private userService: UserService,
        private getCommand: SendGetCommand) { }

    async run(encodedJson: string, options: program.OptionValues): Promise<Response> {
        if (encodedJson == null || encodedJson === '') {
            encodedJson = await CliUtils.readStdin();
        }

        if (encodedJson == null || encodedJson === '') {
            return Response.badRequest('`encodedJson` was not provided.');
        }

        let req: SendResponse = null;
        try {
            const reqJson = Buffer.from(encodedJson, 'base64').toString();
            req = SendResponse.fromJson(reqJson);
        } catch (e) {
            return Response.badRequest('Error parsing the encoded request data.');
        }

        req.id = options.itemid || req.id;

        if (req.id != null) {
            req.id = req.id.toLowerCase();
        }

        const send = await this.sendService.get(req.id);

        if (send == null) {
            return Response.notFound();
        }

        if (send.type !== req.type) {
            return Response.badRequest('Cannot change a Send\'s type');
        }

        if (send.type === SendType.File && !(await this.userService.canAccessPremium())) {
            return Response.error('Premium status is required to use this feature.');
        }

        let sendView = await send.decrypt();
        sendView = SendResponse.toView(req, sendView);

        if (typeof (req.password) !== 'string' || req.password === '') {
            req.password = null;
        }

        try {
            const [encSend, encFileData] = await this.sendService.encrypt(sendView, null, req.password);
            // Add dates from template
            encSend.deletionDate = sendView.deletionDate;
            encSend.expirationDate = sendView.expirationDate;

            await this.sendService.saveWithServer([encSend, encFileData]);
        } catch (e) {
            return Response.error(e);
        }

        return await this.getCommand.run(send.id, {});
    }
}
