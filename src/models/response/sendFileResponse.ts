import { SendFileView } from 'jslib/models/view/sendFileView';

export class SendFileResponse {
    static template(): SendFileResponse {
        const req = new SendFileResponse();
        req.fileName = 'file attachment location';
        return req;
    }

    id: string;
    url: string;
    size: string;
    sizeName: string;
    fileName: string;

    constructor(o?: SendFileView) {
        if (o == null) {
            return;
        }
        this.id = o.id;
        this.url = o.url;
        this.size = o.size;
        this.sizeName = o.sizeName;
        this.fileName = o.fileName;
    }
}
