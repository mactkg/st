import xdg from "https://deno.land/x/xdg_portable@v10.6.0/src/mod.deno.ts";
import { parse as parseToml, stringify } from "jsr:@std/toml";
import { logger } from "./logger.ts";
import { load } from "@std/dotenv";

export interface TomlConfig {
  states: Record<string, Status>;
}

export interface Status {
  text: string;
  emoji: string;
  messages: Message[];
}

interface Message {
  channel: string;
  message: string;
}

export async function loadConfig(fileName: string): Promise<TomlConfig | null> {
  for (const dir of xdg.configDirs()) {
    const path = `${dir}/st/${fileName}`;
    try {
      await Deno.lstat(path);
      const toml = await Deno.readTextFile(path);
      const config = parseToml(toml);
      logger.debug("toml config loaded: ");
      logger.debug(JSON.stringify(config, null, 2));

      return config as unknown as TomlConfig;
    } catch (e) {
      logger.debug(e);
    }
  }

  return null;
}

export async function generateState(
  fileName: string,
  name: string,
  text: string,
  emoji: string,
) {
  const newState = {
    states: {
      [name]: {
        text,
        emoji,
      },
    },
  };
  const tomlStr = stringify(newState);
  const dir = xdg.config();
  const path = `${dir}/st/${fileName}`;
  try {
    await Deno.writeTextFile(path, tomlStr, {
      append: true,
      create: true,
    });
    logger.info(`New state "${name}" was added to ${path}.`);
  } catch (e) {
    logger.error(e);
  }
}
