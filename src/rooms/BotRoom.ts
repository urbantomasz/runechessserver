import { Client, matchMaker, Room } from "colyseus";

export class BotRoom extends Room {
  constructor() {
    super();
  }
  onCreate(options: any) {
    this.autoDispose = false;

    this.onMessage("RequestPlayground", async (client, data) => {
      console.log("playground request");
      let playgroundRoom = await matchMaker.createRoom("GameRoom", {
        isPlayground: true,
      });
      let reservation = await matchMaker.reserveSeatFor(playgroundRoom, {});
      client.send("PlaygroundReservation", reservation);
    });

    this.onMessage("RequestGameVersusBot", async (client, data) => {
      console.log("bot game request");
      let playgroundRoom = await matchMaker.createRoom("GameRoom", {
        isVersusBot: true,
      });
      let reservation = await matchMaker.reserveSeatFor(playgroundRoom, {});
      client.send("PlaygroundReservation", reservation);
    });
  }

  async onJoin(client: Client, options: any) {
    console.log("Client joined the Bot room");
  }

  async onLeave(client: Client, consented?: boolean) {
    console.log("Client leave the Bot room.");
  }

  onDispose() {
    console.log("Disposing the room");
  }
}
