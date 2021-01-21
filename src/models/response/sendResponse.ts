import { SendView } from 'jslib/models/view/sendView';

import { BaseResponse } from 'jslib/cli/models/response/baseResponse';

import { SendTextResponse } from './sendTextResponse';
import { SendFileResponse } from './sendFileResponse';

import { SendType } from 'jslib/enums/sendType';

export class SendResponse implements BaseResponse {
    static template(): SendResponse {
        const req = new SendResponse();
        req.name = 'Send name';
        req.notes = 'Some notes about this send.';
        req.type = SendType.Text;
        req.text = null;
        req.file = null;
        req.maxAccessCount = null;
        req.password = 'The strong password required to access this send';
        req.disabled = false;
        return req;
    }

    object = 'send';
    id: string;
    accessId: string;
    name: string;
    notes: string;
    type: SendType;
    text: SendTextResponse;
    file: SendFileResponse;
    maxAccessCount?: number;
    accessCount: number;
    revisionDate: Date;
    deletionDate: Date;
    expirationDate: Date;
    password: string;
    disabled: boolean;


    constructor(o?: SendView) {
        if (o == null) {
            return;
        }
        this.id = o.id;
        this.accessId = o.accessId;
        this.name = o.name;
        this.notes = o.notes;
        this.type = o.type;
        this.maxAccessCount = o.maxAccessCount;
        this.accessCount = o.accessCount;
        this.revisionDate = o.revisionDate;
        this.deletionDate = o.deletionDate;
        this.expirationDate = o.expirationDate;
        this.password = o.password;
        this.disabled = o.disabled;

        if (o.type === SendType.Text && o.text != null) {
            this.text = new SendTextResponse(o.text);
        }
        if (o.type === SendType.File && o.file != null) {
            this.file = new SendFileResponse(o.file);
        }
    }
}
