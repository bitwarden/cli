import { FolderView } from 'jslib/models/view/folderView';

export class Folder {
    static toView(req: Folder, view = new FolderView()) {
        view.name = req.name;
        return view;
    }

    name: string;

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: FolderView) {
        this.name = o.name;
    }
}
