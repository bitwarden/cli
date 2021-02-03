import { SendFileView } from 'jslib/models/view/sendFileView';

export class SendFileResponse {
    static template(fileName = 'file attachment location'): SendFileResponse {
        const req = new SendFileResponse();
        req.fileName = fileName;
        return req;
    }

    static toView(file: SendFileResponse, view = new SendFileView()) {
        if (file == null) {
            return null;
        }

        view.id = file.id;
        view.url = file.url;
        view.size = file.size;
        view.sizeName = file.sizeName;
        view.fileName = file.fileName;
        return view;
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
