import { AttachmentView } from "jslib-common/models/view/attachmentView";

export class AttachmentResponse {
  id: string;
  fileName: string;
  size: string;
  sizeName: string;
  url: string;

  constructor(o: AttachmentView) {
    this.id = o.id;
    this.fileName = o.fileName;
    this.size = o.size;
    this.sizeName = o.sizeName;
    this.url = o.url;
  }
}
