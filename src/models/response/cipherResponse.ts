import { CipherView } from 'jslib/models/view/cipherView';

import { Cipher } from '../cipher';
import { AttachmentResponse } from './attachmentResponse';
import { BaseResponse } from './baseResponse';
import { LoginResponse } from './loginResponse';
import { PasswordHistoryResponse } from './passwordHistoryResponse';

import { CipherType } from 'jslib/enums';

export class CipherResponse extends Cipher implements BaseResponse {
    object: string;
    id: string;
    attachments: AttachmentResponse[];
    revisionDate: Date;
    passwordHistory: PasswordHistoryResponse[];
    collectionIds: string[];

    constructor(o: CipherView) {
        super();
        this.object = 'item';
        this.id = o.id;
        this.build(o);
        if (o.attachments != null) {
            this.attachments = o.attachments.map((a) => new AttachmentResponse(a));
        }
        this.collectionIds = o.collectionIds;
        this.revisionDate = o.revisionDate;
        if (o.passwordHistory != null) {
            this.passwordHistory = o.passwordHistory.map((h) => new PasswordHistoryResponse(h));
        }
        if (o.type === CipherType.Login && o.login != null) {
            this.login = new LoginResponse(o.login);
        }
    }
}
