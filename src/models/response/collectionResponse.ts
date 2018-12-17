import { CollectionWithId } from 'jslib/models/export/collectionWithId';
import { CollectionView } from 'jslib/models/view/collectionView';

import { BaseResponse } from './baseResponse';

export class CollectionResponse extends CollectionWithId implements BaseResponse {
    object: string;

    constructor(o: CollectionView) {
        super();
        this.object = 'collection';
        this.build(o);
    }
}
