import { SecureNoteType } from 'jslib/enums/secureNoteType';
import { SecureNoteView } from 'jslib/models/view/secureNoteView';

export class SecureNoteRequest {
    static template(): SecureNoteRequest {
        const req = new SecureNoteRequest();
        req.type = SecureNoteType.Generic;
        return req;
    }

    static toView(req: SecureNoteRequest, view = new SecureNoteView()) {
        view.type = req.type;
        return view;
    }

    type: SecureNoteType;
}
