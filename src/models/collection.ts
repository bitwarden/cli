import { CollectionView } from 'jslib/models/view/collectionView';

export class Collection {
    static toView(req: Collection, view = new CollectionView()) {
        view.name = req.name;
        if (view.organizationId == null) {
            view.organizationId = req.organizationId;
        }
        return view;
    }

    name: string;
    organizationId: string;

    constructor(o?: CollectionView) {
        if (o == null) {
            return;
        }

        this.name = o.name;
        this.organizationId = o.organizationId;
    }
}
