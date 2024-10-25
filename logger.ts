import { ConsoleHandler, getLogger, setup } from "jsr:@std/log";

setup({
  handlers: {
    default: new ConsoleHandler("DEBUG", {
      formatter: (r) => `${r.msg}`,
    }),
  },
});

export const logger = getLogger();
