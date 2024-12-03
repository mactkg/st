import type { Logger } from "@std/log";
import { format } from "jsr:@std/datetime/format";
import type { Status } from "./toml.ts";
import { audit as auditLogger } from "./logger.ts";

class AuditService {
  constructor(private logger: Logger) {
  }

  private log(obj: object) {
    this.logger.info(JSON.stringify({
      time: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      ...obj,
    }));
  }

  clear() {
    this.log({
      status: null,
      message: "status cleared",
    });
  }

  set(statusKey: string, status: Status) {
    this.log({
      status: statusKey,
      emoji: status.emoji,
      text: status.text,
      message:
        `status changed to ${status.emoji}(${status.text}) by ${statusKey}`,
    });
  }
}

export const audit = new AuditService(auditLogger);
