import { CipherView } from 'jslib/models/view/cipherView';

import { BaseResponse } from './baseResponse';

import { CipherType } from 'jslib/enums';

export class CipherResponse extends BaseResponse {
    id: string;
    organizationId: string;
    type: CipherType;
    name: string;
    notes: string;

    constructor(o: CipherView) {
        super('item');
        this.id = o.id;
        this.organizationId = o.organizationId;
        this.type = o.type;
        this.name = o.name;
        this.notes = o.notes;
    }
}
