import { config } from "dotenv";
if (process.env.NODE_ENV !== "production") {
  config();
}

import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);

async function main() {
  const app = createApp();
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
