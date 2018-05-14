import { BaseResponse } from './baseResponse';

export class ListResponse extends BaseResponse {
    data: BaseResponse[];

    constructor(data: BaseResponse[]) {
        super('list');
        this.data = data;
    }
}
