import { Client, matchMaker, Room } from "colyseus";
import { LobbyRoomSchema, PlayerSchema } from "./schema/LobbyRoomSchema";

const dbConnection = require("./../dbConnection");

export class LobbyRoom extends Room<LobbyRoomSchema> {
  evaluateGroupsInterval = 2000;
  constructor() {
    super();
    this.setState(new LobbyRoomSchema());
  }
  onCreate(options: any) {
    this.onMessage("RequestPlayground", async (client, data) => {
      let playgroundRoom = await matchMaker.createRoom("GameRoom", {
        isPlayground: true,
      });
      let reservation = await matchMaker.reserveSeatFor(playgroundRoom, {});
      client.send("PlaygroundReservation", reservation);
    });

    this.onMessage("JoinQueue", async (client, data) => {
      if (!this.state.playersSearchingIds.includes(client.id)) {
        this.state.playersSearchingIds.push(client.id);
      }

      this.setSimulationInterval(
        () => this.redistributeGroups(),
        this.evaluateGroupsInterval
      );
    });
  }

  async redistributeGroups() {
    if (this.state.playersSearchingIds.length >= 2) {
      while (this.state.playersSearchingIds.length >= 2) {
        let clientBlueId = this.state.playersSearchingIds.pop();
        let clientRedId = this.state.playersSearchingIds.pop();
        let clientBlue = this.clients.find(
          (client) => client.id === clientBlueId
        );
        let clientRed = this.clients.find(
          (client) => client.id === clientRedId
        );
        // clientBlue.send("JoinGame", 0);
        // clientRed.send("JoinGame", 1);
        let gameRoom = await matchMaker.createRoom("GameRoom", {
          isPlayground: false,
        });
        let blueReservation = await matchMaker.reserveSeatFor(
          await gameRoom,
          this.state.players[clientBlueId]
        );
        let redReservation = await matchMaker.reserveSeatFor(
          await gameRoom,
          this.state.players[clientRedId]
        );
        clientBlue.send("SeatReservation", blueReservation);
        clientRed.send("SeatReservation", redReservation);
      }
    }
  }

  requestJoin(options: any) {
    return this.clients.filter((c) => c.id === options.clientId).length === 0;
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(
      client.id,
      new PlayerSchema(client.id, options.name, options.sub)
    );
    dbConnection.insertPlayerIfNotFound(
      options.sub,
      options.name,
      options.name
    );
    console.log("joined to lobby room");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.id + "leaved the room");
    this.IfExistsRemoveClientFromQueue(client);
    this.state.players.delete(client.id);
  }

  onDispose() {
    console.log("Disposing the room");
  }

  IfExistsRemoveClientFromQueue(client: Client) {
    let queueIndex = this.state.playersSearchingIds.indexOf(client.id);
    if (queueIndex > -1) {
      this.state.playersSearchingIds.splice(queueIndex, 1);
    }
  }
}
