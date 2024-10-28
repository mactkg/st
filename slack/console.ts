import { logger } from "../logger.ts";
import type { SlackServiceType } from "./real.ts";

export class ConsoleDummySlackService implements SlackServiceType {
  async postMessage(text: string, channel: string) {
    logger.debug(`Message "${text}" posted to ${channel}`);
  }
  async setSlackStatus(text: string, emoji: string, exp?: number) {
    logger.debug(`Status changed to ${text}(${emoji}), exp: ${exp ?? "none"}`);
  }
  async getSlackStatus(): Promise<{ text: string; emoji: string }> {
    logger.debug("Slack status is fetched");
    return Promise.resolve({
      text: "dummy status",
      emoji: "dummy",
    });
  }
  async clearSlackStatus() {
    logger.debug("Slack status is cleared");
  }
}
