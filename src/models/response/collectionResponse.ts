import { CollectionView } from 'jslib/models/view/collectionView';

import { BaseResponse } from './baseResponse';

import { Collection } from '../collection';

export class CollectionResponse extends Collection implements BaseResponse {
    object: string;
    id: string;

    constructor(o: CollectionView) {
        super();
        this.object = 'collection';
        this.id = o.id;
        this.build(o);
    }
}
