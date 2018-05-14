import { FieldType } from 'jslib/enums/fieldType';

export class FieldRequest {
    static template(): FieldRequest {
        var req = new FieldRequest();
        req.name = 'Field name';
        req.value = 'Some value';
        req.type = FieldType.Text;
        return req;
    }

    name: string;
    value: string;
    type: FieldType;
}
