import { SendType } from "jslib-common/enums/sendType";
import { SendAccessView } from "jslib-common/models/view/sendAccessView";
import { BaseResponse } from "jslib-node/cli/models/response/baseResponse";

import { SendFileResponse } from "./sendFileResponse";
import { SendTextResponse } from "./sendTextResponse";

export class SendAccessResponse implements BaseResponse {
  static template(): SendAccessResponse {
    const req = new SendAccessResponse();
    req.name = "Send name";
    req.type = SendType.Text;
    req.text = null;
    req.file = null;
    return req;
  }

  object = "send-access";
  id: string;
  name: string;
  type: SendType;
  text: SendTextResponse;
  file: SendFileResponse;

  constructor(o?: SendAccessView) {
    if (o == null) {
      return;
    }
    this.id = o.id;
    this.name = o.name;
    this.type = o.type;

    if (o.type === SendType.Text && o.text != null) {
      this.text = new SendTextResponse(o.text);
    }
    if (o.type === SendType.File && o.file != null) {
      this.file = new SendFileResponse(o.file);
    }
  }
}
