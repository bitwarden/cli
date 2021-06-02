import { BaseResponse } from 'jslib/cli/models/response/baseResponse';

import { OrganizationUserStatusType } from 'jslib/enums/organizationUserStatusType';
import { OrganizationUserType } from 'jslib/enums/organizationUserType';

export class OrganizationUserResponse implements BaseResponse {
    object: string;
    id: string;
    email: string;
    name: string;
    status: OrganizationUserStatusType;
    type: OrganizationUserType;
    twoFactorEnabled: boolean;
    userId: string;

    constructor() {
        this.object = 'org-member';
    }
}
