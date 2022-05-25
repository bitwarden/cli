import { CollectionExport } from "jslib-common/models/export/collectionExport";

import { SelectionReadOnly } from "../selectionReadOnly";

export class OrganizationCollectionRequest extends CollectionExport {
  static template(): OrganizationCollectionRequest {
    const req = new OrganizationCollectionRequest();
    req.organizationId = "00000000-0000-0000-0000-000000000000";
    req.name = "Collection name";
    req.externalId = null;
    req.groups = [SelectionReadOnly.template(), SelectionReadOnly.template()];
    return req;
  }

  groups: SelectionReadOnly[];
}
