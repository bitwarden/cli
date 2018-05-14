import { CollectionView } from 'jslib/models/view/collectionView';

import { BaseResponse } from './baseResponse';

export class CollectionResponse extends BaseResponse {
    id: string;
    organizationId: string;
    name: string;

    constructor(o: CollectionView) {
        super('collection');
        this.id = o.id;
        this.organizationId = o.organizationId;
        this.name = o.name;
    }
}
