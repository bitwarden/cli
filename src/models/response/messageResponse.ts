import { BaseResponse } from './baseResponse';

export class MessageResponse implements BaseResponse {
    object: string;
    title: string;
    message: string;
    raw: string;
    noColor = false;

    constructor(title: string, message: string) {
        this.object = 'message';
        this.title = title;
        this.message = message;
    }
}
