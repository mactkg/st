import { ConsoleHandler, FileHandler, getLogger, setup } from "jsr:@std/log";
import { format } from "jsr:@std/datetime/format";
import xdg from "https://deno.land/x/xdg_portable@v10.6.0/src/mod.deno.ts";

const DEBUG = Deno.env.get("DEBUG") == "1";

setup({
  handlers: {
    console: new ConsoleHandler("DEBUG", {
      formatter: (r) => `${r.msg}`,
    }),
    auditFile: new FileHandler("INFO", {
      filename: `${xdg.data()}/st/logs_${format(new Date(), "yyyyMM")}.${
        DEBUG ? "debug." : ""
      }log`,
      formatter: ({ msg }) => msg,
    }),
    auditConsole: new ConsoleHandler("INFO", {
      formatter: ({ msg }) => msg,
    }),
  },
  loggers: {
    debug: {
      level: "DEBUG",
      handlers: ["console"],
    },
    default: {
      level: "INFO",
      handlers: ["console"],
    },
    audit: {
      level: "INFO",
      handlers: DEBUG ? ["auditFile", "auditConsole"] : ["auditFile"],
    },
  },
});

export const logger = DEBUG ? getLogger("debug") : getLogger();
export const audit = getLogger("audit");
