import { OrganizationUserStatusType } from "jslib-common/enums/organizationUserStatusType";
import { OrganizationUserType } from "jslib-common/enums/organizationUserType";
import { BaseResponse } from "jslib-node/cli/models/response/baseResponse";

export class OrganizationUserResponse implements BaseResponse {
  object: string;
  id: string;
  email: string;
  name: string;
  status: OrganizationUserStatusType;
  type: OrganizationUserType;
  twoFactorEnabled: boolean;

  constructor() {
    this.object = "org-member";
  }
}
