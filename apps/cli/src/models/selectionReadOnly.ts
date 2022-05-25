export class SelectionReadOnly {
  static template(): SelectionReadOnly {
    return new SelectionReadOnly("00000000-0000-0000-0000-000000000000", false, false);
  }

  id: string;
  readOnly: boolean;
  hidePasswords: boolean;

  constructor(id: string, readOnly: boolean, hidePasswords: boolean) {
    this.id = id;
    this.readOnly = readOnly;
    this.hidePasswords = hidePasswords || false;
  }
}
