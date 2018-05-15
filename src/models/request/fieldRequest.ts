import { FieldType } from 'jslib/enums/fieldType';
import { FieldView } from 'jslib/models/view';

export class FieldRequest {
    static template(): FieldRequest {
        const req = new FieldRequest();
        req.name = 'Field name';
        req.value = 'Some value';
        req.type = FieldType.Text;
        return req;
    }

    static toView(req: FieldRequest, view = new FieldView()) {
        view.type = req.type;
        view.value = req.value;
        view.name = req.name;
        return view;
    }

    name: string;
    value: string;
    type: FieldType;
}
