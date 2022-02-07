import * as program from "commander";

import { Response } from "jslib-node/cli/models/response";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

interface IOption {
  long?: string;
  short?: string;
  description: string;
}

interface ICommand {
  commands?: ICommand[];
  options?: IOption[];
  _name: string;
  _description: string;
}

const validShells = ["zsh"];

export class CompletionCommand {
  async run(options: program.OptionValues) {
    const shell: typeof validShells[number] = options.shell;

    if (!shell) {
      return Response.badRequest("`shell` option was not provided.");
    }

    if (!validShells.includes(shell)) {
      return Response.badRequest("Unsupported shell.");
    }

    let content = "";

    if (shell === "zsh") {
      content = this.zshCompletion("bw", program as any as ICommand).render();
    }

    const res = new MessageResponse(content, null);
    return Response.success(res);
  }

  private zshCompletion(rootName: string, rootCommand: ICommand) {
    return {
      render: () => {
        return [
          `#compdef _${rootName} ${rootName}`,
          "",
          this.renderCommandBlock(rootName, rootCommand),
        ].join("\n");
      },
    };
  }

  private renderCommandBlock(name: string, command: ICommand): string {
    const { commands = [], options = [] } = command;
    const hasOptions = options.length > 0;
    const hasCommands = commands.length > 0;

    const args = options
      .map(({ long, short, description }) => {
        const aliases = [short, long].filter(Boolean);
        const opts = aliases.join(",");
        const desc = `[${description.replace(`'`, `'"'"'`)}]`;
        return aliases.length > 1
          ? `'(${aliases.join(" ")})'{${opts}}'${desc}'`
          : `'${opts}${desc}'`;
      })
      .concat(
        `'(-h --help)'{-h,--help}'[output usage information]'`,
        hasCommands ? '"1: :->cmnds"' : null,
        '"*::arg:->args"'
      )
      .filter(Boolean);

    const commandBlockFunctionParts = [];

    if (hasCommands) {
      commandBlockFunctionParts.push("local -a commands");
    }

    if (hasOptions) {
      commandBlockFunctionParts.push(`_arguments -C \\\n    ${args.join(` \\\n    `)}`);
    }

    if (hasCommands) {
      commandBlockFunctionParts.push(
        `case $state in
    cmnds)
      commands=(
        ${commands
          .map(({ _name, _description }) => `"${_name}:${_description}"`)
          .join("\n        ")}
      )
      _describe "command" commands
      ;;
  esac

  case "$words[1]" in
    ${commands
      .map(({ _name }) => [`${_name})`, `_${name}_${_name}`, ";;"].join("\n      "))
      .join("\n    ")}
  esac`
      );
    }

    const commandBlocParts = [
      `function _${name} {\n  ${commandBlockFunctionParts.join("\n\n  ")}\n}`,
    ];

    if (hasCommands) {
      commandBlocParts.push(
        commands.map((c) => this.renderCommandBlock(`${name}_${c._name}`, c)).join("\n\n")
      );
    }

    return commandBlocParts.join("\n\n");
  }
}
