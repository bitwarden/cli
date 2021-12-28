import * as program from "commander";

import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { SyncService } from "jslib-common/abstractions/sync.service";
import { VaultTimeoutService } from "jslib-common/abstractions/vaultTimeout.service";

import { Response } from "jslib-node/cli/models/response";

import { TemplateResponse } from "../models/response/templateResponse";

export class StatusCommand {
  constructor(
    private envService: EnvironmentService,
    private syncService: SyncService,
    private stateService: StateService,
    private vaultTimeoutService: VaultTimeoutService
  ) {}

  async run(): Promise<Response> {
    try {
      const baseUrl = this.baseUrl();
      const status = await this.status();
      const lastSync = await this.syncService.getLastSync();
      const userId = await this.stateService.getUserId();
      const email = await this.stateService.getEmail();

      return Response.success(
        new TemplateResponse({
          serverUrl: baseUrl,
          lastSync: lastSync,
          userEmail: email,
          userId: userId,
          status: status,
        })
      );
    } catch (e) {
      return Response.error(e);
    }
  }

  private baseUrl(): string {
    return this.envService.getUrls().base;
  }

  private async status(): Promise<string> {
    const authed = await this.stateService.getIsAuthenticated();
    if (!authed) {
      return "unauthenticated";
    }

    const isLocked = await this.vaultTimeoutService.isLocked();
    return isLocked ? "locked" : "unlocked";
  }
}
