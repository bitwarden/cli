import { OrganizationUserStatusType } from "jslib-common/enums/organizationUserStatusType";
import { OrganizationUserType } from "jslib-common/enums/organizationUserType";
import { Organization } from "jslib-common/models/domain/organization";
import { BaseResponse } from "jslib-node/cli/models/response/baseResponse";

export class OrganizationResponse implements BaseResponse {
  object: string;
  id: string;
  name: string;
  status: OrganizationUserStatusType;
  type: OrganizationUserType;
  enabled: boolean;

  constructor(o: Organization) {
    this.object = "organization";
    this.id = o.id;
    this.name = o.name;
    this.status = o.status;
    this.type = o.type;
    this.enabled = o.enabled;
  }
}
