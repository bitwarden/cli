import { SendTextView } from 'jslib/models/view/sendTextView';

export class SendTextResponse {
    static template(): SendTextResponse {
        const req = new SendTextResponse();
        req.text = 'Text contained in the send.';
        req.hidden = false;
        return req;
    }
    text: string;
    hidden: boolean;

    constructor(o?: SendTextView) {
        if (o == null) {
            return;
        }
        this.text = o.text;
        this.hidden = o.hidden;
    }
}
