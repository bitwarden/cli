import * as koaMulter from "@koa/multer";
import * as koaRouter from "@koa/router";
import * as program from "commander";
import * as koa from "koa";
import * as koaBodyParser from "koa-bodyparser";
import * as koaJson from "koa-json";

import { KeySuffixOptions } from "jslib-common/enums/keySuffixOptions";
import { Response } from "jslib-node/cli/models/response";
import { FileResponse } from "jslib-node/cli/models/response/fileResponse";

import { Main } from "../bw";

import { ConfirmCommand } from "./confirm.command";
import { CreateCommand } from "./create.command";
import { DeleteCommand } from "./delete.command";
import { EditCommand } from "./edit.command";
import { GenerateCommand } from "./generate.command";
import { GetCommand } from "./get.command";
import { ListCommand } from "./list.command";
import { LockCommand } from "./lock.command";
import { RestoreCommand } from "./restore.command";
import { SendCreateCommand } from "./send/create.command";
import { SendDeleteCommand } from "./send/delete.command";
import { SendEditCommand } from "./send/edit.command";
import { SendGetCommand } from "./send/get.command";
import { SendListCommand } from "./send/list.command";
import { SendRemovePasswordCommand } from "./send/removePassword.command";
import { ShareCommand } from "./share.command";
import { StatusCommand } from "./status.command";
import { SyncCommand } from "./sync.command";
import { UnlockCommand } from "./unlock.command";

export class ServeCommand {
  private listCommand: ListCommand;
  private getCommand: GetCommand;
  private createCommand: CreateCommand;
  private editCommand: EditCommand;
  private generateCommand: GenerateCommand;
  private shareCommand: ShareCommand;
  private statusCommand: StatusCommand;
  private syncCommand: SyncCommand;
  private deleteCommand: DeleteCommand;
  private confirmCommand: ConfirmCommand;
  private restoreCommand: RestoreCommand;
  private lockCommand: LockCommand;
  private unlockCommand: UnlockCommand;

  private sendCreateCommand: SendCreateCommand;
  private sendDeleteCommand: SendDeleteCommand;
  private sendEditCommand: SendEditCommand;
  private sendGetCommand: SendGetCommand;
  private sendListCommand: SendListCommand;
  private sendRemovePasswordCommand: SendRemovePasswordCommand;

  constructor(protected main: Main) {
    this.getCommand = new GetCommand(
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
    this.listCommand = new ListCommand(
      this.main.cipherService,
      this.main.folderService,
      this.main.collectionService,
      this.main.organizationService,
      this.main.searchService,
      this.main.apiService
    );
    this.createCommand = new CreateCommand(
      this.main.cipherService,
      this.main.folderService,
      this.main.stateService,
      this.main.cryptoService,
      this.main.apiService
    );
    this.editCommand = new EditCommand(
      this.main.cipherService,
      this.main.folderService,
      this.main.cryptoService,
      this.main.apiService
    );
    this.generateCommand = new GenerateCommand(
      this.main.passwordGenerationService,
      this.main.stateService
    );
    this.syncCommand = new SyncCommand(this.main.syncService);
    this.statusCommand = new StatusCommand(
      this.main.environmentService,
      this.main.syncService,
      this.main.stateService,
      this.main.authService
    );
    this.deleteCommand = new DeleteCommand(
      this.main.cipherService,
      this.main.folderService,
      this.main.stateService,
      this.main.apiService
    );
    this.confirmCommand = new ConfirmCommand(this.main.apiService, this.main.cryptoService);
    this.restoreCommand = new RestoreCommand(this.main.cipherService);
    this.shareCommand = new ShareCommand(this.main.cipherService);
    this.lockCommand = new LockCommand(this.main.vaultTimeoutService);
    this.unlockCommand = new UnlockCommand(
      this.main.cryptoService,
      this.main.stateService,
      this.main.cryptoFunctionService,
      this.main.apiService,
      this.main.logService,
      this.main.keyConnectorService,
      this.main.environmentService,
      this.main.syncService,
      async () => await this.main.logout()
    );

    this.sendCreateCommand = new SendCreateCommand(
      this.main.sendService,
      this.main.stateService,
      this.main.environmentService
    );
    this.sendDeleteCommand = new SendDeleteCommand(this.main.sendService);
    this.sendGetCommand = new SendGetCommand(
      this.main.sendService,
      this.main.environmentService,
      this.main.searchService,
      this.main.cryptoService
    );
    this.sendEditCommand = new SendEditCommand(
      this.main.sendService,
      this.main.stateService,
      this.sendGetCommand
    );
    this.sendListCommand = new SendListCommand(
      this.main.sendService,
      this.main.environmentService,
      this.main.searchService
    );
    this.sendRemovePasswordCommand = new SendRemovePasswordCommand(this.main.sendService);
  }

  async run(options: program.OptionValues) {
    const port = options.port || 8087;
    const hostname = options.hostname || "localhost";
    const server = new koa();
    const router = new koaRouter();
    process.env.BW_SERVE = "true";
    process.env.BW_NOINTERACTION = "true";

    server.use(koaBodyParser()).use(koaJson({ pretty: false, param: "pretty" }));

    router.get("/generate", async (ctx, next) => {
      const response = await this.generateCommand.run(ctx.request.query);
      this.processResponse(ctx.response, response);
      await next();
    });

    router.get("/status", async (ctx, next) => {
      const response = await this.statusCommand.run();
      this.processResponse(ctx.response, response);
      await next();
    });

    router.get("/list/object/:object", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      let response: Response = null;
      if (ctx.params.object === "send") {
        response = await this.sendListCommand.run(ctx.request.query);
      } else {
        response = await this.listCommand.run(ctx.params.object, ctx.request.query);
      }
      this.processResponse(ctx.response, response);
      await next();
    });

    router.get("/send/list", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      const response = await this.sendListCommand.run(ctx.request.query);
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/sync", async (ctx, next) => {
      const response = await this.syncCommand.run(ctx.request.query);
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/lock", async (ctx, next) => {
      const response = await this.lockCommand.run();
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/unlock", async (ctx, next) => {
      const response = await this.unlockCommand.run(
        ctx.request.body.password == null ? null : (ctx.request.body.password as string),
        ctx.request.query
      );
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/confirm/:object/:id", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      const response = await this.confirmCommand.run(
        ctx.params.object,
        ctx.params.id,
        ctx.request.query
      );
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/restore/:object/:id", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      const response = await this.restoreCommand.run(ctx.params.object, ctx.params.id);
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/move/:id/:organizationId", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      const response = await this.shareCommand.run(
        ctx.params.id,
        ctx.params.organizationId,
        ctx.request.body // TODO: Check the format of this body for an array of collection ids
      );
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/attachment", koaMulter().single("file"), async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      const response = await this.createCommand.run(
        "attachment",
        ctx.request.body,
        ctx.request.query,
        {
          fileBuffer: ctx.request.file.buffer,
          fileName: ctx.request.file.originalname,
        }
      );
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/send/:id/remove-password", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      const response = await this.sendRemovePasswordCommand.run(ctx.params.id);
      this.processResponse(ctx.response, response);
      await next();
    });

    router.post("/object/:object", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      let response: Response = null;
      if (ctx.params.object === "send") {
        response = await this.sendCreateCommand.run(ctx.request.body, ctx.request.query);
      } else {
        response = await this.createCommand.run(
          ctx.params.object,
          ctx.request.body,
          ctx.request.query
        );
      }
      this.processResponse(ctx.response, response);
      await next();
    });

    router.put("/object/:object/:id", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      let response: Response = null;
      if (ctx.params.object === "send") {
        ctx.request.body.id = ctx.params.id;
        response = await this.sendEditCommand.run(ctx.request.body, ctx.request.query);
      } else {
        response = await this.editCommand.run(
          ctx.params.object,
          ctx.params.id,
          ctx.request.body,
          ctx.request.query
        );
      }
      this.processResponse(ctx.response, response);
      await next();
    });

    router.get("/object/:object/:id", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      let response: Response = null;
      if (ctx.params.object === "send") {
        response = await this.sendGetCommand.run(ctx.params.id, null);
      } else {
        response = await this.getCommand.run(ctx.params.object, ctx.params.id, ctx.request.query);
      }
      this.processResponse(ctx.response, response);
      await next();
    });

    router.delete("/object/:object/:id", async (ctx, next) => {
      if (await this.errorIfLocked(ctx.response)) {
        await next();
        return;
      }
      let response: Response = null;
      if (ctx.params.object === "send") {
        response = await this.sendDeleteCommand.run(ctx.params.id);
      } else {
        response = await this.deleteCommand.run(
          ctx.params.object,
          ctx.params.id,
          ctx.request.query
        );
      }
      this.processResponse(ctx.response, response);
      await next();
    });

    server
      .use(router.routes())
      .use(router.allowedMethods())
      .listen(port, hostname === "all" ? null : hostname, () => {
        this.main.logService.info("Listening on " + hostname + ":" + port);
      });
  }

  private processResponse(res: koa.Response, commandResponse: Response) {
    if (!commandResponse.success) {
      res.status = 400;
    }
    if (commandResponse.data instanceof FileResponse) {
      res.body = commandResponse.data.data;
      res.attachment(commandResponse.data.fileName);
      res.set("Content-Type", "application/octet-stream");
      res.set("Content-Length", commandResponse.data.data.length.toString());
    } else {
      res.body = commandResponse;
    }
  }

  private async errorIfLocked(res: koa.Response) {
    const authed = await this.main.stateService.getIsAuthenticated();
    if (!authed) {
      this.processResponse(res, Response.error("You are not logged in."));
      return true;
    }
    if (await this.main.cryptoService.hasKeyInMemory()) {
      return false;
    } else if (await this.main.cryptoService.hasKeyStored(KeySuffixOptions.Auto)) {
      // load key into memory
      await this.main.cryptoService.getKey();
      return false;
    }
    this.processResponse(res, Response.error("Vault is locked."));
    return true;
  }
}
