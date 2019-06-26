import { BaseResponse } from 'jslib/cli/models/response/baseResponse';

import { Organization } from 'jslib/models/domain/organization';

import { OrganizationUserStatusType } from 'jslib/enums/organizationUserStatusType';
import { OrganizationUserType } from 'jslib/enums/organizationUserType';

export class OrganizationResponse implements BaseResponse {
    object: string;
    id: string;
    name: string;
    status: OrganizationUserStatusType;
    type: OrganizationUserType;
    enabled: boolean;

    constructor(o: Organization) {
        this.object = 'organization';
        this.id = o.id;
        this.name = o.name;
        this.status = o.status;
        this.type = o.type;
        this.enabled = o.enabled;
    }
}
