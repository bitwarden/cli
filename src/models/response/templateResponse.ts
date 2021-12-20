import { BaseResponse } from "jslib-node/cli/models/response/baseResponse";

export class TemplateResponse implements BaseResponse {
  object: string;
  template: any;

  constructor(template: any) {
    this.object = "template";
    this.template = template;
  }
}
