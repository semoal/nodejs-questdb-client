import { Socket } from "node:net";
import { write, listen, shutdown, connect, close } from "./proxyfunctions";

// handles only a single client
// client -> server (Proxy) -> remote (QuestDB)
// client <- server (Proxy) <- remote (QuestDB)
class Proxy {
  client: unknown;
  remote: Socket;

  constructor() {
    this.remote = new Socket();

    this.remote.on("data", async (data: unknown) => {
      console.info(`received from remote, forwarding to client: ${data}`);
      await write(this.client, data);
    });

    this.remote.on("close", () => {
      console.info("remote connection closed");
    });

    this.remote.on("error", (err: unknown) => {
      console.error(`remote connection: ${err}`);
    });
  }

  async start(listenPort: unknown, remotePort: unknown, remoteHost: unknown, tlsOptions: Record<string, unknown>) {
    return new Promise<void>((resolve) => {
      this.remote.on("ready", async () => {
        console.info("remote connection ready");
        await listen(
          this,
          listenPort,
          async (data: unknown) => {
            console.info(`received from client, forwarding to remote: ${data}`);
            await write(this.remote, data);
          },
          tlsOptions,
        );
        resolve();
      });

      connect(this, remotePort, remoteHost);
    });
  }

  async stop() {
    await shutdown(this, async () => await close());
  }
}

export { Proxy };
