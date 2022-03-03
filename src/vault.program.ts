import * as program from "commander";

import { Response } from "jslib-node/cli/models/response";

import { Main } from "./bw";
import { ConfirmCommand } from "./commands/confirm.command";
import { CreateCommand } from "./commands/create.command";
import { DeleteCommand } from "./commands/delete.command";
import { EditCommand } from "./commands/edit.command";
import { ExportCommand } from "./commands/export.command";
import { GetCommand } from "./commands/get.command";
import { ImportCommand } from "./commands/import.command";
import { ListCommand } from "./commands/list.command";
import { RestoreCommand } from "./commands/restore.command";
import { ShareCommand } from "./commands/share.command";
import { Program } from "./program";
import { CliUtils } from "./utils";

const writeLn = CliUtils.writeLn;

export class VaultProgram extends Program {
  constructor(protected main: Main) {
    super(main);
  }

  async register() {
    program
      .addCommand(this.listCommand())
      .addCommand(this.getCommand())
      .addCommand(this.createCommand())
      .addCommand(this.editCommand())
      .addCommand(this.deleteCommand())
      .addCommand(this.restoreCommand())
      .addCommand(this.shareCommand("move", false))
      .addCommand(this.confirmCommand())
      .addCommand(this.importCommand())
      .addCommand(this.exportCommand())
      .addCommand(this.shareCommand("share", true));
  }

  private validateObject(requestedObject: string, validObjects: string[]): boolean {
    let success = true;
    if (!validObjects.includes(requestedObject)) {
      success = false;
      this.processResponse(
        Response.badRequest(
          'Unknown object "' +
            requestedObject +
            '". Allowed objects are ' +
            validObjects.join(", ") +
            "."
        )
      );
    }
    return success;
  }

  private listCommand(): program.Command {
    const listObjects = [
      "items",
      "folders",
      "collections",
      "org-collections",
      "org-members",
      "organizations",
    ];

    return new program.Command("list")
      .arguments("<object>")
      .description("List an array of objects from the vault.", {
        object: "Valid objects are: " + listObjects.join(", "),
      })
      .option("--search <search>", "Perform a search on the listed objects.")
      .option("--url <url>", "Filter items of type login with a url-match search.")
      .option("--folderid <folderid>", "Filter items by folder id.")
      .option("--collectionid <collectionid>", "Filter items by collection id.")
      .option(
        "--organizationid <organizationid>",
        "Filter items or collections by organization id."
      )
      .option("--trash", "Filter items that are deleted and in the trash.")
      .on("--help", () => {
        writeLn("\n  Notes:");
        writeLn("");
        writeLn("    Combining search with a filter performs a logical AND operation.");
        writeLn("");
        writeLn("    Combining multiple filters performs a logical OR operation.");
        writeLn("");
        writeLn("  Examples:");
        writeLn("");
        writeLn("    bw list items");
        writeLn("    bw list items --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2");
        writeLn(
          "    bw list items --search google --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2"
        );
        writeLn("    bw list items --url https://google.com");
        writeLn("    bw list items --folderid null");
        writeLn("    bw list items --organizationid notnull");
        writeLn(
          "    bw list items --folderid 60556c31-e649-4b5d-8daf-fc1c391a1bf2 --organizationid notnull"
        );
        writeLn("    bw list items --trash");
        writeLn("    bw list folders --search email");
        writeLn("    bw list org-members --organizationid 60556c31-e649-4b5d-8daf-fc1c391a1bf2");
        writeLn("", true);
      })
      .action(async (object, cmd) => {
        if (!this.validateObject(object, listObjects)) {
          return;
        }

        await this.exitIfLocked();
        const command = new ListCommand(
          this.main.cipherService,
          this.main.folderService,
          this.main.collectionService,
          this.main.organizationService,
          this.main.searchService,
          this.main.apiService
        );
        const response = await command.run(object, cmd);

        this.processResponse(response);
      });
  }

  private getCommand(): program.Command {
    const getObjects = [
      "item",
      "username",
      "password",
      "uri",
      "totp",
      "notes",
      "exposed",
      "attachment",
      "folder",
      "collection",
      "org-collection",
      "organization",
      "template",
      "fingerprint",
      "send",
    ];
    return new program.Command("get")
      .arguments("<object> <id>")
      .description("Get an object from the vault.", {
        object: "Valid objects are: " + getObjects.join(", "),
        id: "Search term or object's globally unique `id`.",
      })
      .option("--itemid <itemid>", "Attachment's item id.")
      .option("--output <output>", "Output directory or filename for attachment.")
      .option("--organizationid <organizationid>", "Organization id for an organization object.")
      .on("--help", () => {
        writeLn("\n  If raw output is specified and no output filename or directory is given for");
        writeLn("  an attachment query, the attachment content is written to stdout.");
        writeLn("");
        writeLn("  Examples:");
        writeLn("");
        writeLn("    bw get item 99ee88d2-6046-4ea7-92c2-acac464b1412");
        writeLn("    bw get password https://google.com");
        writeLn("    bw get totp google.com");
        writeLn("    bw get notes google.com");
        writeLn("    bw get exposed yahoo.com");
        writeLn(
          "    bw get attachment b857igwl1dzrs2 --itemid 99ee88d2-6046-4ea7-92c2-acac464b1412 " +
            "--output ./photo.jpg"
        );
        writeLn(
          "    bw get attachment photo.jpg --itemid 99ee88d2-6046-4ea7-92c2-acac464b1412 --raw"
        );
        writeLn("    bw get folder email");
        writeLn("    bw get template folder");
        writeLn("", true);
      })
      .action(async (object, id, cmd) => {
        if (!this.validateObject(object, getObjects)) {
          return;
        }

        await this.exitIfLocked();
        const command = new GetCommand(
          this.main.cipherService,
          this.main.folderService,
          this.main.collectionService,
          this.main.totpService,
          this.main.auditService,
          this.main.cryptoService,
          this.main.stateService,
          this.main.searchService,
          this.main.apiService,
          this.main.organizationService
        );
        const response = await command.run(object, id, cmd);
        this.processResponse(response);
      });
  }

  private createCommand() {
    const createObjects = ["item", "attachment", "folder", "org-collection"];
    return new program.Command("create")
      .arguments("<object> [encodedJson]")
      .description("Create an object in the vault.", {
        object: "Valid objects are: " + createObjects.join(", "),
        encodedJson: "Encoded json of the object to create. Can also be piped into stdin.",
      })
      .option("--file <file>", "Path to file for attachment.")
      .option("--itemid <itemid>", "Attachment's item id.")
      .option("--organizationid <organizationid>", "Organization id for an organization object.")
      .on("--help", () => {
        writeLn("\n  Examples:");
        writeLn("");
        writeLn("    bw create folder eyJuYW1lIjoiTXkgRm9sZGVyIn0K");
        writeLn("    echo 'eyJuYW1lIjoiTXkgRm9sZGVyIn0K' | bw create folder");
        writeLn(
          "    bw create attachment --file ./myfile.csv " +
            "--itemid 16b15b89-65b3-4639-ad2a-95052a6d8f66"
        );
        writeLn("", true);
      })
      .action(async (object, encodedJson, cmd) => {
        if (!this.validateObject(object, createObjects)) {
          return;
        }

        await this.exitIfLocked();
        const command = new CreateCommand(
          this.main.cipherService,
          this.main.folderService,
          this.main.stateService,
          this.main.cryptoService,
          this.main.apiService
        );
        const response = await command.run(object, encodedJson, cmd);
        this.processResponse(response);
      });
  }

  private editCommand(): program.Command {
    const editObjects = ["item", "item-collections", "folder", "org-collection"];
    return new program.Command("edit")
      .arguments("<object> <id> [encodedJson]")
      .description("Edit an object from the vault.", {
        object: "Valid objects are: " + editObjects.join(", "),
        id: "Object's globally unique `id`.",
        encodedJson: "Encoded json of the object to create. Can also be piped into stdin.",
      })
      .option("--organizationid <organizationid>", "Organization id for an organization object.")
      .on("--help", () => {
        writeLn("\n  Examples:");
        writeLn("");
        writeLn(
          "    bw edit folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02 eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg=="
        );
        writeLn(
          "    echo 'eyJuYW1lIjoiTXkgRm9sZGVyMiJ9Cg==' | " +
            "bw edit folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02"
        );
        writeLn(
          "    bw edit item-collections 78307355-fd25-416b-88b8-b33fd0e88c82 " +
            "WyI5NzQwNTNkMC0zYjMzLTRiOTgtODg2ZS1mZWNmNWM4ZGJhOTYiXQ=="
        );
        writeLn("", true);
      })
      .action(async (object, id, encodedJson, cmd) => {
        if (!this.validateObject(object, editObjects)) {
          return;
        }

        await this.exitIfLocked();
        const command = new EditCommand(
          this.main.cipherService,
          this.main.folderService,
          this.main.cryptoService,
          this.main.apiService
        );
        const response = await command.run(object, id, encodedJson, cmd);
        this.processResponse(response);
      });
  }

  private deleteCommand(): program.Command {
    const deleteObjects = ["item", "attachment", "folder", "org-collection"];
    return new program.Command("delete")
      .arguments("<object> <id>")
      .description("Delete an object from the vault.", {
        object: "Valid objects are: " + deleteObjects.join(", "),
        id: "Object's globally unique `id`.",
      })
      .option("--itemid <itemid>", "Attachment's item id.")
      .option("--organizationid <organizationid>", "Organization id for an organization object.")
      .option(
        "-p, --permanent",
        "Permanently deletes the item instead of soft-deleting it (item only)."
      )
      .on("--help", () => {
        writeLn("\n  Examples:");
        writeLn("");
        writeLn("    bw delete item 7063feab-4b10-472e-b64c-785e2b870b92");
        writeLn("    bw delete item 89c21cd2-fab0-4f69-8c6e-ab8a0168f69a --permanent");
        writeLn("    bw delete folder 5cdfbd80-d99f-409b-915b-f4c5d0241b02");
        writeLn(
          "    bw delete attachment b857igwl1dzrs2 --itemid 310d5ffd-e9a2-4451-af87-ea054dce0f78"
        );
        writeLn("", true);
      })
      .action(async (object, id, cmd) => {
        if (!this.validateObject(object, deleteObjects)) {
          return;
        }

        await this.exitIfLocked();
        const command = new DeleteCommand(
          this.main.cipherService,
          this.main.folderService,
          this.main.stateService,
          this.main.apiService
        );
        const response = await command.run(object, id, cmd);
        this.processResponse(response);
      });
  }

  private restoreCommand(): program.Command {
    const restoreObjects = ["item"];
    return new program.Command("restore")
      .arguments("<object> <id>")
      .description("Restores an object from the trash.", {
        object: "Valid objects are: " + restoreObjects.join(", "),
        id: "Object's globally unique `id`.",
      })
      .on("--help", () => {
        writeLn("\n  Examples:");
        writeLn("");
        writeLn("    bw restore item 7063feab-4b10-472e-b64c-785e2b870b92");
        writeLn("", true);
      })
      .action(async (object, id, cmd) => {
        if (!this.validateObject(object, restoreObjects)) {
          return;
        }

        await this.exitIfLocked();
        const command = new RestoreCommand(this.main.cipherService);
        const response = await command.run(object, id);
        this.processResponse(response);
      });
  }

  private shareCommand(commandName: string, deprecated: boolean): program.Command {
    return new program.Command(commandName)
      .arguments("<id> <organizationId> [encodedJson]")
      .description((deprecated ? "--DEPRECATED-- " : "") + "Move an item to an organization.", {
        id: "Object's globally unique `id`.",
        organizationId: "Organization's globally unique `id`.",
        encodedJson: "Encoded json of an array of collection ids. Can also be piped into stdin.",
      })
      .on("--help", () => {
        writeLn("\n  Examples:");
        writeLn("");
        writeLn(
          "    bw " +
            commandName +
            " 4af958ce-96a7-45d9-beed-1e70fabaa27a " +
            "6d82949b-b44d-468a-adae-3f3bacb0ea32 WyI5NzQwNTNkMC0zYjMzLTRiOTgtODg2ZS1mZWNmNWM4ZGJhOTYiXQ=="
        );
        writeLn(
          "    echo '[\"974053d0-3b33-4b98-886e-fecf5c8dba96\"]' | bw encode | " +
            "bw " +
            commandName +
            " 4af958ce-96a7-45d9-beed-1e70fabaa27a 6d82949b-b44d-468a-adae-3f3bacb0ea32"
        );
        if (deprecated) {
          writeLn("");
          writeLn('--DEPRECATED See "bw move" for the current implementation--');
        }
        writeLn("", true);
      })
      .action(async (id, organizationId, encodedJson, cmd) => {
        await this.exitIfLocked();
        const command = new ShareCommand(this.main.cipherService);
        const response = await command.run(id, organizationId, encodedJson);
        this.processResponse(response);
      });
  }

  private confirmCommand(): program.Command {
    const confirmObjects = ["org-member"];
    return new program.Command("confirm")
      .arguments("<object> <id>")
      .description("Confirm an object to the organization.", {
        object: "Valid objects are: " + confirmObjects.join(", "),
        id: "Object's globally unique `id`.",
      })
      .option("--organizationid <organizationid>", "Organization id for an organization object.")
      .on("--help", () => {
        writeLn("\n  Examples:");
        writeLn("");
        writeLn(
          "    bw confirm org-member 7063feab-4b10-472e-b64c-785e2b870b92 " +
            "--organizationid 310d5ffd-e9a2-4451-af87-ea054dce0f78"
        );
        writeLn("", true);
      })
      .action(async (object, id, cmd) => {
        if (!this.validateObject(object, confirmObjects)) {
          return;
        }

        await this.exitIfLocked();
        const command = new ConfirmCommand(this.main.apiService, this.main.cryptoService);
        const response = await command.run(object, id, cmd);
        this.processResponse(response);
      });
  }

  private importCommand(): program.Command {
    return new program.Command("import")
      .arguments("[format] [input]")
      .description("Import vault data from a file.", {
        format: "The format of [input]",
        input: "Filepath to data to import",
      })
      .option("--formats", "List formats")
      .option("--organizationid <organizationid>", "ID of the organization to import to.")
      .on("--help", () => {
        writeLn("\n Examples:");
        writeLn("");
        writeLn("    bw import --formats");
        writeLn("    bw import bitwardencsv ./from/source.csv");
        writeLn("    bw import keepass2xml keepass_backup.xml");
        writeLn(
          "    bw import --organizationid cf14adc3-aca5-4573-890a-f6fa231436d9 keepass2xml keepass_backup.xml"
        );
      })
      .action(async (format, filepath, options) => {
        await this.exitIfLocked();
        const command = new ImportCommand(this.main.importService, this.main.organizationService);
        const response = await command.run(format, filepath, options);
        this.processResponse(response);
      });
  }

  private exportCommand(): program.Command {
    return new program.Command("export")
      .description("Export vault data to a CSV or JSON file.", {})
      .option("--output <output>", "Output directory or filename.")
      .option("--format <format>", "Export file format.")
      .option(
        "--password [password]",
        "Use password to encrypt instead of your Bitwarden account encryption key. Only applies to the encrypted_json format."
      )
      .option("--organizationid <organizationid>", "Organization id for an organization.")
      .on("--help", () => {
        writeLn("\n  Notes:");
        writeLn("");
        writeLn(
          "    Valid formats are `csv`, `json`, and `encrypted_json`. Default format is `csv`."
        );
        writeLn("");
        writeLn(
          "    If --raw option is specified and no output filename or directory is given, the"
        );
        writeLn("    result is written to stdout.");
        writeLn("");
        writeLn("  Examples:");
        writeLn("");
        writeLn("    bw export");
        writeLn("    bw --raw export");
        writeLn("    bw export myPassword321");
        writeLn("    bw export myPassword321 --format json");
        writeLn("    bw export --output ./exp/bw.csv");
        writeLn("    bw export myPassword321 --output bw.json --format json");
        writeLn(
          "    bw export myPassword321 --organizationid 7063feab-4b10-472e-b64c-785e2b870b92"
        );
        writeLn("", true);
      })
      .action(async (options) => {
        await this.exitIfLocked();
        const command = new ExportCommand(this.main.exportService, this.main.policyService);
        const response = await command.run(options);
        this.processResponse(response);
      });
  }
}
