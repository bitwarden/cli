import { FolderView } from 'jslib/models/view/folderView';

export class Folder {
    static toView(req: Folder, view = new FolderView()) {
        view.name = req.name;
        return view;
    }

    name: string;

    constructor(o?: FolderView) {
        if (o == null) {
            return;
        }

        this.name = o.name;
    }
}
