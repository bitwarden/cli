import { CipherView } from 'jslib/models/view/cipherView';

import { BaseResponse } from './baseResponse';

import { CipherType } from 'jslib/enums';

export class StringResponse extends BaseResponse {
    data: string;

    constructor(data: string) {
        super('string');
        this.data = data;
    }
}
