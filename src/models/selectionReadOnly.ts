export class SelectionReadOnly {
    static template(): SelectionReadOnly {
        return new SelectionReadOnly('00000000-0000-0000-0000-000000000000', false);
    }

    id: string;
    readOnly: boolean;

    constructor(id: string, readOnly: boolean) {
        this.id = id;
        this.readOnly = readOnly;
    }
}
