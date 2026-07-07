import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import dns from "node:dns";
import { setServers } from "node:dns/promises";
dns.setDefaultResultOrder("ipv4first");
setServers(["8.8.8.8", "8.8.4.4"]);

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
