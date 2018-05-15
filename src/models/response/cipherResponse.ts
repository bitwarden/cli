import { CipherView } from 'jslib/models/view/cipherView';

import { BaseResponse } from './baseResponse';

import { Cipher } from '../cipher';

export class CipherResponse extends Cipher implements BaseResponse {
    object: string;
    id: string;

    constructor(o: CipherView) {
        super();
        this.object = 'item';
        this.id = o.id;
        this.build(o);
    }
}
