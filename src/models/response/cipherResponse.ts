import { CipherView } from 'jslib/models/view/cipherView';

import { Cipher } from '../cipher';
import { AttachmentResponse } from './attachmentResponse';
import { BaseResponse } from './baseResponse';

export class CipherResponse extends Cipher implements BaseResponse {
    object: string;
    id: string;
    attachments: AttachmentResponse[];

    constructor(o: CipherView) {
        super();
        this.object = 'item';
        this.id = o.id;
        this.build(o);
        if (o.attachments != null) {
            this.attachments = o.attachments.map((a) => new AttachmentResponse(a));
        }
    }
}
