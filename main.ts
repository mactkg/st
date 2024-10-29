import { Command } from "jsr:@cliffy/command@1.0.0-rc.7";
import { Confirm, Input, Number, Secret } from "jsr:@cliffy/prompt@1.0.0-rc.7";
import { logger } from "./logger.ts";
import {
  generateState,
  loadConfig as loadTomlConfig,
  type TomlConfig,
} from "./toml.ts";
import {
  ConsoleDummySlackService,
  SlackService,
  SlackServiceType,
} from "./slack/index.ts";

function findStatusKey(config: TomlConfig, text: string) {
  for (const [key, value] of Object.entries(config.states)) {
    if (value.text == text) return key;
  }

  return null;
}

function listStates(config: TomlConfig) {
  console.log("Available states:");
  for (const [key, value] of Object.entries(config.states)) {
    console.log(`- ${key}: ${value.text} ${value.emoji}`);
  }
}

async function selectState(config: TomlConfig): Promise<string | undefined> {
  console.log("Select a state:");
  const stateKeys = Object.keys(config.states);

  for (let i = 0; i < stateKeys.length; i++) {
    console.log(
      `${i + 1}: ${stateKeys[i]} - ${config.states[stateKeys[i]].text} ${
        config.states[stateKeys[i]].emoji
      }`,
    );
  }

  const selectedIndex = await prompt(
    "Enter a number of states you want to set: ",
  );

  const index = parseInt(selectedIndex ?? "", 10);
  if (index > 0 && index <= stateKeys.length) {
    return stateKeys[index - 1];
  } else {
    logger.error("Invalid selection");
    return undefined;
  }
}

async function getSelectedStatusOrAsk(
  config: TomlConfig,
  status: string | number,
) {
  if (status && status !== "") {
    return config.states[status];
  } else {
    const key = await selectState(config);
    if (!key) {
      return null;
    }

    return config.states[key];
  }
}

const loadConfigOrExit = async () => {
  const config = await loadTomlConfig("config.toml");
  if (!config) {
    logger.error("Config file not found.");
    Deno.exit(1);
  }
  return config;
};

const slack: SlackServiceType = Deno.env.get("DEBUG") == "1"
  ? new ConsoleDummySlackService()
  : new SlackService();

const set = await new Command()
  .arguments("[status:string]")
  .option("-q, --quiet", "Set status without posting messages")
  .option("-m, --message <message:string>", "Message to post")
  .option("-c, --channel <channel:string>", "Channel to post", {
    depends: ["message"],
  })
  .action(async ({ quiet, message, channel }, status = "") => {
    const config = await loadConfigOrExit();
    const st = await getSelectedStatusOrAsk(config, status);

    if (st) {
      await slack.setSlackStatus(st.text, st.emoji);
      if (quiet) {
        console.log(`Skip posting messages because ${quiet} option enabled.`);
        Deno.exit(0);
      }

      if (channel && message) {
        console.log(
          `--channel is set to ${channel}, therefore post message to only the channel.`,
        );
        await slack.postMessage(message, channel);
      } else {
        if (message) {
          console.log(
            `--message is set to ${message}, therefore post message using the message.`,
          );
        }
        for (const stMessage of st.messages) {
          await slack.postMessage(
            message || stMessage.message,
            stMessage.channel,
          );
        }
      }
    } else {
      logger.error("State not found");
    }
  });
const clear = await new Command()
  .action(slack.clearSlackStatus);
const list = await new Command()
  .action(async () => {
    const config = await loadConfigOrExit();
    listStates(config);
  });
const show = await new Command()
  .action(async () => {
    const config = await loadConfigOrExit();
    const st = await slack.getSlackStatus();
    if (st.text == "" && st.emoji == "") {
      console.log("Status is empty");
    } else {
      const state = findStatusKey(config, st.text);
      const stateStr = state ? `(${state})` : "";
      console.log(`${st.emoji} ${st.text}${stateStr}`);
    }
  });
const generate = await new Command()
  .description("Append new state to your config file.")
  .alias("g")
  .arguments("[state:string]")
  .option("-e, --emoji <emoji:string>", "Emoji of status on Slack")
  .option("-t, --text <text:string>", "Text of status on Slack")
  .action(async ({ emoji, text }, state) => {
    const getValOrAsk = async (str: string | undefined, question: string) => {
      if (str) return str;
      return await Input.prompt({
        message: question,
      });
    };

    const stateName = await getValOrAsk(state, "Enter state name");
    const stateEmoji = await getValOrAsk(emoji, "Enter an emoji(e.g. :house:)");
    const stateText = await getValOrAsk(
      text,
      "Enter status text(e.g. Working from home)",
    );

    const config = await loadTomlConfig("config.toml");
    if (config && stateName in config.states) {
      logger.error(
        `State ${stateName} is already defined in config.toml! Aborted.`,
      );
      Deno.exit(1);
    }
    generateState("config.toml", stateName, stateText, stateEmoji);
  });

await new Command()
  .name("st")
  .description("A cli to manage your status on Slack")
  .version("v0.0.1")
  .command("set", set)
  .command("clear", clear)
  .command("ls", list)
  .command("show", show)
  .command("generate", generate)
  .parse(Deno.args);
