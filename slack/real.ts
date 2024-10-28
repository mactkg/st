import "jsr:@std/dotenv/load";
import { logger } from "../logger.ts";

export type SlackServiceType = {
  [K in keyof SlackService]: SlackService[K];
};

export class SlackService implements SlackServiceType {
  private token: string;

  constructor() {
    const token = Deno.env.get("ST_SLACK_TOKEN");
    if (!token) {
      logger.error("ST_SLACK_TOKEN must be set in the environment variables");
      Deno.exit(1);
    }
    this.token = token;
  }

  async postMessage(text: string, channel: string) {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        channel,
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      logger.error(`Failed posting to ${channel}: ${result.error}`);
      Deno.exit(1);
    }

    console.log(`✅ The text posted to ${channel}`);
  }

  async setSlackStatus(text: string, emoji: string, exp: number = 0) {
    const response = await fetch("https://slack.com/api/users.profile.set", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile: {
          status_text: text,
          status_emoji: emoji,
          status_expiration: exp,
        },
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      logger.error("Failed to set status:", result.error);
      Deno.exit(1);
    }

    console.log(`✅ Slack status set to: ${text} ${emoji}`);
  }

  async getSlackStatus() {
    const response = await fetch("https://slack.com/api/users.profile.get", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (!result.ok) {
      logger.error("Failed to set status:", result.error);
      Deno.exit(1);
    }

    return {
      text: result.profile.status_text,
      emoji: result.profile.status_emoji,
    };
  }

  async clearSlackStatus() {
    await this.setSlackStatus("", "");
    console.log("✅ Slack status cleared");
  }
}
