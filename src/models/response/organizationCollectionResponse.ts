import { CollectionView } from 'jslib/models/view/collectionView';

import { SelectionReadOnly } from '../selectionReadOnly';

import { CollectionResponse } from './collectionResponse';

export class OrganizationCollectionResponse extends CollectionResponse {
    groups: SelectionReadOnly[];

    constructor(o: CollectionView, groups: SelectionReadOnly[]) {
        super(o);
        this.groups = groups;
    }
}
