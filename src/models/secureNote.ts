import { SecureNoteType } from 'jslib/enums/secureNoteType';

import { SecureNoteView } from 'jslib/models/view/secureNoteView';

export class SecureNote {
    static template(): SecureNote {
        const req = new SecureNote();
        req.type = SecureNoteType.Generic;
        return req;
    }

    static toView(req: SecureNote, view = new SecureNoteView()) {
        view.type = req.type;
        return view;
    }

    type: SecureNoteType;

    constructor(o?: SecureNoteView) {
        if (o == null) {
            return;
        }

        this.type = o.type;
    }
}
