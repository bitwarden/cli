import { Login } from 'jslib/models/export/login';
import { LoginView } from 'jslib/models/view/loginView';

export class LoginResponse extends Login {
    passwordRevisionDate: Date;

    constructor(o: LoginView) {
        super(o);
        this.passwordRevisionDate = o.passwordRevisionDate != null ? o.passwordRevisionDate : null;
    }
}
