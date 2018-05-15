import { FieldType } from 'jslib/enums/fieldType';

import { FieldView } from 'jslib/models/view/fieldView';

export class Field {
    static template(): Field {
        const req = new Field();
        req.name = 'Field name';
        req.value = 'Some value';
        req.type = FieldType.Text;
        return req;
    }

    static toView(req: Field, view = new FieldView()) {
        view.type = req.type;
        view.value = req.value;
        view.name = req.name;
        return view;
    }

    name: string;
    value: string;
    type: FieldType;

    constructor(o?: FieldView) {
        if (o == null) {
            return;
        }

        this.name = o.name;
        this.value = o.value;
        this.type = o.type;
    }
}
