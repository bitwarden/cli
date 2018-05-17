import { AttachmentView } from 'jslib/models/view/attachmentView';

import { Attachment } from '../attachment';

export class AttachmentResponse extends Attachment {
    id: string;
    size: number;
    sizeName: string;
    url: string;

    constructor(o: AttachmentView) {
        super();
        this.id = o.id;
        this.build(o);
        this.size = o.size;
        this.sizeName = o.sizeName;
        this.url = o.url;
    }
}
