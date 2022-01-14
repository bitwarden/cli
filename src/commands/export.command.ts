import * as program from "commander";
import * as inquirer from "inquirer";

import { ExportService } from "jslib-common/abstractions/export.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { PolicyService } from "jslib-common/abstractions/policy.service";
import { UserVerificationService } from "jslib-common/abstractions/userVerification.service";

import { Response } from "jslib-node/cli/models/response";

import { PolicyType } from "jslib-common/enums/policyType";
import { VerificationType } from "jslib-common/enums/verificationType";

import { Utils } from "jslib-common/misc/utils";

import { CliUtils } from "../utils";

export class ExportCommand {
  constructor(
    private exportService: ExportService,
    private policyService: PolicyService,
    private keyConnectorService: KeyConnectorService,
    private userVerificationService: UserVerificationService
  ) {}

  async run(password: string, options: program.OptionValues): Promise<Response> {
    if (
      options.organizationid == null &&
      (await this.policyService.policyAppliesToUser(PolicyType.DisablePersonalVaultExport))
    ) {
      return Response.badRequest(
        "One or more organization policies prevents you from exporting your personal vault."
      );
    }

    const canInteract = process.env.BW_NOINTERACTION !== "true";
    if (!canInteract) {
      return Response.badRequest(
        "User verification is required. Try running this command again in interactive mode."
      );
    }

    try {
      (await this.keyConnectorService.getUsesKeyConnector())
        ? await this.verifyOTP()
        : await this.verifyMasterPassword(password);
    } catch (e) {
      return Response.badRequest(e.message);
    }

    let format = options.format;
    if (format !== "encrypted_json" && format !== "json") {
      format = "csv";
    }

    if (options.organizationid != null && !Utils.isGuid(options.organizationid)) {
      return Response.error("`" + options.organizationid + "` is not a GUID.");
    }

    let exportPassword: string = null;
    if (options.passwordprotect) {
      const answer: inquirer.Answers = await inquirer.createPromptModule({
        output: process.stderr,
      })({
        type: "password",
        name: "password",
        message: "Export file password:",
      });
      exportPassword = answer.password;
    }

    let exportContent: string = null;
    try {
      exportContent =
        exportPassword != null
          ? await this.getPasswordProtected(exportPassword, format, options.organizationid)
          : await this.getUnprotectedExport(format, options.organizationid);
    } catch (e) {
      return Response.error(e);
    }
    return await this.saveFile(exportContent, options, format);
  }

  private async getPasswordProtected(
    password: string,
    format: "csv" | "json",
    organizationId?: string
  ) {
    if (format !== "csv" && format !== "json") {
      throw Error(
        `Invalid format type ${format}. Accepted Password Protected format types are 'csv' and 'json'`
      );
    }

    return await this.exportService.getPasswordProtectedExport(password, format, organizationId);
  }

  private async getUnprotectedExport(
    format: "csv" | "json" | "encrypted_json",
    organizationId?: string
  ) {
    return organizationId != null
      ? await this.exportService.getOrganizationExport(organizationId, format)
      : await this.exportService.getExport(format);
  }

  private async saveFile(
    exportContent: string,
    options: program.OptionValues,
    format: string
  ): Promise<Response> {
    try {
      const fileName = this.getFileName(format, options.organizationid != null ? "org" : null);
      return await CliUtils.saveResultToFile(exportContent, options.output, fileName);
    } catch (e) {
      return Response.error(e.toString());
    }
  }

  private getFileName(format: string, prefix?: string) {
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

  private async verifyMasterPassword(password: string) {
    if (password == null || password === "") {
      const answer: inquirer.Answers = await inquirer.createPromptModule({
        output: process.stderr,
      })({
        type: "password",
        name: "password",
        message: "Master password:",
      });
      password = answer.password;
    }

    await this.userVerificationService.verifyUser({
      type: VerificationType.MasterPassword,
      secret: password,
    });
  }

  private async verifyOTP() {
    await this.userVerificationService.requestOTP();
    const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
      type: "password",
      name: "otp",
      message: "A verification code has been emailed to you.\n Verification code:",
    });

    await this.userVerificationService.verifyUser({
      type: VerificationType.OTP,
      secret: answer.otp,
    });
  }
}
