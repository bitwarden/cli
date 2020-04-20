import { BaseResponse } from 'jslib/cli/models/response/baseResponse';
import {
    GroupDetailsResponse as BaseGroupDetailsResponse,
    GroupResponse as BaseGroupResponse,
} from 'jslib/models/response/groupResponse';
import { SelectionReadOnly } from '../selectionReadOnly';

export class GroupResponse implements BaseResponse {
    object: string;
    id: string;
    organizationId: string;
    name: string;
    accessAll: boolean;
    externalId: string;

    constructor(response: BaseGroupResponse) {
        this.object = 'group';
        this.id = response.id;
        this.organizationId = response.organizationId;
        this.name = response.name;
        this.accessAll = response.accessAll;
        this.externalId = response.externalId;
    }
}

export class GroupDetailsResponse extends GroupResponse implements BaseResponse {
    collections: SelectionReadOnly[];
    constructor(response: BaseGroupDetailsResponse) {
        super(response);
        this.collections = response.collections.map((r) => new SelectionReadOnly(r.id, r.readOnly));
    }
}
