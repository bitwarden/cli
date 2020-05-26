import * as program from "commander";
import { Response } from "jslib/cli/models/response";
import { MessageResponse } from "jslib/cli/models/response/messageResponse";

type Option = {
    long: string;
    short: string;
    description: string;
};

type Command = {
    commands?: Command[];
    options?: Option[];
    _name: string;
    _description: string;
};

const zshCompletion = (rootName: string, rootCommand: Command) => {
    const renderCommandBlock = (name: string, command: Command): string => {
        const { commands = [], options = [] } = command;
        const hasOptions = options.length > 0;
        const hasCommands = commands.length > 0;

        const _arguments = options
            .map(({ long, short, description }) => {
                const aliases = [short, long].filter(Boolean);

                const OPTS = aliases.join(",");

                const DESCRIPTION = `[${description.replace("'", `'"'"'`)}]`;

                return aliases.length > 1
                    ? `'(${aliases.join(" ")})'{${OPTS}}'${DESCRIPTION}'`
                    : `'${OPTS}${DESCRIPTION}'`;
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
            commandBlockFunctionParts.push(
                `_arguments -C \\\n    ${_arguments.join(` \\\n    `)}`
            );
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
        .map(({ _name }) =>
            [`${_name})`, `_${name}_${_name}`, ";;"].join("\n      ")
        )
        .join("\n    ")}
  esac`
            );
        }

        const commandBlocParts = [
            `function _${name} {\n  ${commandBlockFunctionParts.join(
                "\n\n  "
            )}\n}`,
        ];

        if (hasCommands) {
            commandBlocParts.push(
                commands
                    .map((command) =>
                        renderCommandBlock(`${name}_${command._name}`, command)
                    )
                    .join("\n\n")
            );
        }

        return commandBlocParts.join("\n\n");
    };

    const render = () => {
        return [
            `#compdef _${rootName} ${rootName}`,
            "",
            renderCommandBlock(rootName, rootCommand),
        ].join("\n");
    };

    return {
        render,
    };
};

const validShells = ["zsh"];

export class CompletionCommand {
    constructor() {}

    async run(cmd: program.Command) {
        const shell: typeof validShells[number] = cmd.shell;

        if (!shell) {
            return Response.badRequest("`shell` was not provided!");
        }

        if (!validShells.includes(shell)) {
            return Response.badRequest(`Unsupported shell!`);
        }

        let content = "";

        if (shell === "zsh") {
            content = zshCompletion("bw", cmd.parent).render();
        }

        const res = new MessageResponse(content, null);
        return Response.success(res);
    }
}
