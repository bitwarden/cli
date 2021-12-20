import { CipherWithIds } from "jslib-common/models/export/cipherWithIds";
import { CipherView } from "jslib-common/models/view/cipherView";

import { BaseResponse } from "jslib-node/cli/models/response/baseResponse";

import { AttachmentResponse } from "./attachmentResponse";
import { LoginResponse } from "./loginResponse";
import { PasswordHistoryResponse } from "./passwordHistoryResponse";

import { CipherType } from "jslib-common/enums/cipherType";

export class CipherResponse extends CipherWithIds implements BaseResponse {
    object: string;
    attachments: AttachmentResponse[];
    revisionDate: Date;
    passwordHistory: PasswordHistoryResponse[];

    constructor(o: CipherView) {
        super();
        this.object = "item";
        this.build(o);
        if (o.attachments != null) {
            this.attachments = o.attachments.map((a) => new AttachmentResponse(a));
        }
        this.revisionDate = o.revisionDate;
        if (o.passwordHistory != null) {
            this.passwordHistory = o.passwordHistory.map((h) => new PasswordHistoryResponse(h));
        }
        if (o.type === CipherType.Login && o.login != null) {
            this.login = new LoginResponse(o.login);
        }
    }
}
