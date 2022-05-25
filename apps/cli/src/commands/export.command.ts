import * as program from "commander";
import * as inquirer from "inquirer";

import { ExportFormat, ExportService } from "jslib-common/abstractions/export.service";
import { PolicyService } from "jslib-common/abstractions/policy.service";
import { PolicyType } from "jslib-common/enums/policyType";
import { Utils } from "jslib-common/misc/utils";
import { Response } from "jslib-node/cli/models/response";

import { CliUtils } from "../utils";

export class ExportCommand {
  constructor(private exportService: ExportService, private policyService: PolicyService) {}

  async run(options: program.OptionValues): Promise<Response> {
    if (
      options.organizationid == null &&
      (await this.policyService.policyAppliesToUser(PolicyType.DisablePersonalVaultExport))
    ) {
      return Response.badRequest(
        "One or more organization policies prevents you from exporting your personal vault."
      );
    }

    const format = options.format ?? "csv";

    if (options.organizationid != null && !Utils.isGuid(options.organizationid)) {
      return Response.error("`" + options.organizationid + "` is not a GUID.");
    }

    let exportContent: string = null;
    try {
      exportContent =
        format === "encrypted_json"
          ? await this.getProtectedExport(options.password, options.organizationid)
          : await this.getUnprotectedExport(format, options.organizationid);
    } catch (e) {
      return Response.error(e);
    }
    return await this.saveFile(exportContent, options, format);
  }

  private async getProtectedExport(passwordOption: string | boolean, organizationId?: string) {
    const password = await this.promptPassword(passwordOption);
    return password == null
      ? await this.exportService.getExport("encrypted_json", organizationId)
      : await this.exportService.getPasswordProtectedExport(password, organizationId);
  }

  private async getUnprotectedExport(format: ExportFormat, organizationId?: string) {
    return this.exportService.getExport(format, organizationId);
  }

  private async saveFile(
    exportContent: string,
    options: program.OptionValues,
    format: ExportFormat
  ): Promise<Response> {
    try {
      const fileName = this.getFileName(format, options.organizationid != null ? "org" : null);
      return await CliUtils.saveResultToFile(exportContent, options.output, fileName);
    } catch (e) {
      return Response.error(e.toString());
    }
  }

  private getFileName(format: ExportFormat, prefix?: string) {
    if (format === "encrypted_json") {
      if (prefix == null) {
        prefix = "encrypted";
      } else {
        prefix = "encrypted_" + prefix;
      }
      format = "json";
    }
    return this.exportService.getFileName(prefix, format);
  }

  private async promptPassword(password: string | boolean) {
    // boolean => flag set with no value, we need to prompt for password
    // string => flag set with value, use this value for password
    // undefined/null/false => account protect, not password, no password needed
    if (typeof password === "string") {
      return password;
    } else if (password) {
      const answer: inquirer.Answers = await inquirer.createPromptModule({
        output: process.stderr,
      })({
        type: "password",
        name: "password",
        message: "Export file password:",
      });
      return answer.password as string;
    }
    return null;
  }
}
