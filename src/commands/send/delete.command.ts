import { SendService } from 'jslib/abstractions/send.service';

import { Response } from 'jslib/cli/models/response';

export class SendDeleteCommand {
    constructor(private sendService: SendService) { }

    async run(id: string) {
        const send = await this.sendService.get(id);

        if (send == null) {
            return Response.notFound();
        }

        try {
            this.sendService.delete(id);
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }
}
