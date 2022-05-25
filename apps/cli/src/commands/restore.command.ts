import { CipherService } from "jslib-common/abstractions/cipher.service";
import { Response } from "jslib-node/cli/models/response";

export class RestoreCommand {
  constructor(private cipherService: CipherService) {}

  async run(object: string, id: string): Promise<Response> {
    if (id != null) {
      id = id.toLowerCase();
    }

    switch (object.toLowerCase()) {
      case "item":
        return await this.restoreCipher(id);
      default:
        return Response.badRequest("Unknown object.");
    }
  }

  private async restoreCipher(id: string) {
    const cipher = await this.cipherService.get(id);
    if (cipher == null) {
      return Response.notFound();
    }
    if (cipher.deletedDate == null) {
      return Response.badRequest("Cipher is not in trash.");
    }

    try {
      await this.cipherService.restoreWithServer(id);
      return Response.success();
    } catch (e) {
      return Response.error(e);
    }
  }
}
