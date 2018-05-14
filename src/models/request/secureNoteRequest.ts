import { SecureNoteType } from 'jslib/enums/secureNoteType';

export class SecureNoteRequest {
    static template(): SecureNoteRequest {
        var req = new SecureNoteRequest();
        req.type = SecureNoteType.Generic;
        return req;
    }

    type: SecureNoteType;
}
