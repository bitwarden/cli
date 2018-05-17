import { AttachmentView } from 'jslib/models/view/attachmentView';

export class Attachment {
    static template(): Attachment {
        const req = new Attachment();
        req.fileName = 'photo.jpg';
        return req;
    }

    static toView(req: Attachment, view = new AttachmentView()) {
        view.fileName = req.fileName;
        return view;
    }

    fileName: string;

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: AttachmentView) {
        this.fileName = o.fileName;
    }
}
