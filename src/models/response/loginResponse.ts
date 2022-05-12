import { LoginExport } from "jslib-common/models/export/loginExport";
import { LoginView } from "jslib-common/models/view/loginView";

export class LoginResponse extends LoginExport {
  passwordRevisionDate: Date;

  constructor(o: LoginView) {
    super(o);
    this.passwordRevisionDate = o.passwordRevisionDate != null ? o.passwordRevisionDate : null;
  }
}
