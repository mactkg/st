import { ConsoleHandler, getLogger, setup } from "jsr:@std/log";

setup({
  handlers: {
    console: new ConsoleHandler("DEBUG", {
      formatter: (r) => `${r.msg}`,
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
  },
});

export const logger =
  Deno.env.get("DEBUG") == "1" ? getLogger("debug") : getLogger();
