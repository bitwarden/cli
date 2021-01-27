import { SendView } from 'jslib/models/view/sendView';

import { BaseResponse } from 'jslib/cli/models/response/baseResponse';

import { SendTextResponse } from './sendTextResponse';
import { SendFileResponse } from './sendFileResponse';

import { SendType } from 'jslib/enums/sendType';
import { Utils } from 'jslib/misc/utils';

export class SendResponse implements BaseResponse {

    static template(deleteInDays = 7): SendResponse {
        const req = new SendResponse();
        req.name = 'Send name';
        req.notes = 'Some notes about this send.';
        req.type = SendType.Text;
        req.text = null;
        req.file = null;
        req.maxAccessCount = null;
        req.deletionDate = this.getStandardDeletionDate(deleteInDays);
        req.expirationDate = null;
        req.password = null;
        req.disabled = false;
        return req;
    }

    static dateToString(d: Date) {
        return d.toISOString().split(':').slice(0, 2).join(':');
    }

    static toView(send: SendResponse, view = new SendView()): SendView {
        if (send == null) {
            return null;
        }

        view.id = send.id;
        view.accessId = send.accessId;
        view.name = send.name;
        view.notes = send.notes;
        view.key = send.key == null ? null : Utils.fromB64ToArray(send.key);
        view.type = send.type;
        view.file = SendFileResponse.toView(send.file);
        view.text = SendTextResponse.toView(send.text);
        view.maxAccessCount = send.maxAccessCount;
        view.accessCount = send.accessCount;
        view.revisionDate = send.revisionDate;
        view.deletionDate = send.deletionDate;
        view.expirationDate = send.expirationDate;
        view.password = send.password;
        view.disabled = send.disabled;
        return view;
    }

    private static getStandardDeletionDate(days: number) {
        const d = new Date();
        d.setHours(d.getHours() + (days * 24));
        return d;
    }

    object = 'send';
    id: string;
    accessId: string;
    accessUrl: string;
    name: string;
    notes: string;
    key: string;
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


    constructor(o?: SendView, webVaultUrl?: string) {
        if (o == null) {
            return;
        }
        this.id = o.id;
        this.accessId = o.accessId;
        this.accessUrl = (webVaultUrl ?? 'https://vault.bitwarden.com') + '/#/send/' + this.accessId + '/' + o.urlB64Key
        this.name = o.name;
        this.notes = o.notes;
        this.key = Utils.fromBufferToB64(o.key);
        this.type = o.type;
        this.maxAccessCount = o.maxAccessCount;
        this.accessCount = o.accessCount;
        this.revisionDate = o.revisionDate;
        this.deletionDate = o.deletionDate;
        this.expirationDate = o.expirationDate;
        this.disabled = o.disabled;

        if (o.type === SendType.Text && o.text != null) {
            this.text = new SendTextResponse(o.text);
        }
        if (o.type === SendType.File && o.file != null) {
            this.file = new SendFileResponse(o.file);
        }
    }
}
