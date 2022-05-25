import { CipherType } from "jslib-common/enums/cipherType";
import { CipherWithIdExport } from "jslib-common/models/export/cipherWithIdsExport";
import { CipherView } from "jslib-common/models/view/cipherView";
import { BaseResponse } from "jslib-node/cli/models/response/baseResponse";

import { AttachmentResponse } from "./attachmentResponse";
import { LoginResponse } from "./loginResponse";
import { PasswordHistoryResponse } from "./passwordHistoryResponse";

export class CipherResponse extends CipherWithIdExport implements BaseResponse {
  object: string;
  attachments: AttachmentResponse[];
  revisionDate: Date;
  deletedDate: Date;
  passwordHistory: PasswordHistoryResponse[];

  constructor(o: CipherView) {
    super();
    this.object = "item";
    this.build(o);
    if (o.attachments != null) {
      this.attachments = o.attachments.map((a) => new AttachmentResponse(a));
    }
    this.revisionDate = o.revisionDate;
    this.deletedDate = o.deletedDate;
    if (o.passwordHistory != null) {
      this.passwordHistory = o.passwordHistory.map((h) => new PasswordHistoryResponse(h));
    }
    if (o.type === CipherType.Login && o.login != null) {
      this.login = new LoginResponse(o.login);
    }
  }
}
