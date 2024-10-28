import xdg from "https://deno.land/x/xdg_portable@v10.6.0/src/mod.deno.ts";
import { parse as parseToml } from "jsr:@std/toml";

export interface TomlConfig {
  states: Record<string, Status>;
}

interface Status {
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
      return config as unknown as TomlConfig;
    } catch (_e) {
      continue;
    }
  }

  return null;
}
