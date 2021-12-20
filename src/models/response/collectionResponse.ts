import { CollectionWithId } from "jslib-common/models/export/collectionWithId";
import { CollectionView } from "jslib-common/models/view/collectionView";

import { BaseResponse } from "jslib-node/cli/models/response/baseResponse";

export class CollectionResponse extends CollectionWithId implements BaseResponse {
  object: string;

  constructor(o: CollectionView) {
    super();
    this.object = "collection";
    this.build(o);
  }
}
