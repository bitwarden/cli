import { CollectionView } from 'jslib/models/view/collectionView';

export class Collection {
    static toView(req: Collection, view = new CollectionView()) {
        view.name = req.name;
        if (view.organizationId == null) {
            view.organizationId = req.organizationId;
        }
        return view;
    }

    organizationId: string;
    name: string;

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: CollectionView) {
        this.organizationId = o.organizationId;
        this.name = o.name;
    }
}
