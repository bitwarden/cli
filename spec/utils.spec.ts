import { FlagName } from "../src/flags";
import { CliUtils } from "../src/utils";
describe("flagEnabled", () => {
  it("is true if flag is null", () => {
    process.env.FLAGS = JSON.stringify({ test: null });

    expect(CliUtils.flagEnabled("test" as FlagName)).toBe(true);
  });

  it("is true if flag is undefined", () => {
    process.env.FLAGS = JSON.stringify({});

    expect(CliUtils.flagEnabled("test" as FlagName)).toBe(true);
  });

  it("is true if flag is true", () => {
    process.env.FLAGS = JSON.stringify({ test: true });

    expect(CliUtils.flagEnabled("test" as FlagName)).toBe(true);
  });

  it("is false if flag is false", () => {
    process.env.FLAGS = JSON.stringify({ test: false });

    expect(CliUtils.flagEnabled("test" as FlagName)).toBe(false);
  });
});
