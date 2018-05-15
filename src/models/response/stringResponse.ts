import { BaseResponse } from './baseResponse';

export class StringResponse implements BaseResponse {
    object: string;
    data: string;

    constructor(data: string) {
        this.object = 'string';
        this.data = data;
    }
}
