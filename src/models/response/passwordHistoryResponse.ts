import { PasswordHistoryView } from 'jslib/models/view/passwordHistoryView';

export class PasswordHistoryResponse {
    lastUsedDate: Date;
    password: string;

    constructor(o: PasswordHistoryView) {
        this.lastUsedDate = o.lastUsedDate;
        this.password = o.password;
    }
}
