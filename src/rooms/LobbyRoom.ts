import { Client, matchMaker, Room } from "colyseus";
import { LobbyRoomSchema, PlayerSchema } from "./schema/LobbyRoomSchema";
import { Color } from "../runechess/Enums";

const dbConnection = require("./../dbConnection");

export class LobbyRoom extends Room<LobbyRoomSchema> {
  evaluateGroupsInterval = 2000;
  playersSearching = new Array<Client>();
  ongoingGames = new Map<number, string>();
  constructor() {
    super();
    this.setState(new LobbyRoomSchema());
  }
  onCreate(options: any) {
    this.autoDispose = false;

    this.onMessage("RequestPlayground", async (client, data) => {
      let playgroundRoom = await matchMaker.createRoom("GameRoom", {
        isPlayground: true,
      });
      let reservation = await matchMaker.reserveSeatFor(playgroundRoom, {});
      client.send("PlaygroundReservation", reservation);
    });

    this.onMessage("ChallengePlayer", async (client, data) => {
      var challengeClient = this.clients.find(
        (c) => c.sessionId === data.sessionId
      );
      challengeClient.send("ChallengePlayer", client.id);
    });

    this.onMessage("ChallengePlayerAccepted", async (client, clientId) => {
      var challengeClient = this.clients.find((c) => c.id === clientId);
      this.createGame(challengeClient, client);
    });

    this.onMessage("RequestGameVersusBot", async (client, data) => {
      this.removeClientFromQueue(client);
      let playgroundRoom = await matchMaker.createRoom("GameRoom", {
        isVersusBot: true,
      });
      let playerId = this.state.players.get(client.id).playerId;
      this.ongoingGames.set(playerId, playgroundRoom.roomId);
      let reservation = await matchMaker.reserveSeatFor(
        playgroundRoom,
        this.state.players.get(client.id)
      );

      client.send("PlaygroundReservation", reservation);
    });

    this.onMessage("JoinQueue", async (client, data) => {
      if (this.playersSearching.includes(client)) {
        this.removeClientFromQueue(client);
      } else {
        this.playersSearching.push(client);
        client.send("JoinedToQueue");
      }
    });

    this.setSimulationInterval(
      () => this.redistributeGroups(),
      this.evaluateGroupsInterval
    );
  }

  async redistributeGroups() {
    if (this.playersSearching.length >= 2) {
      while (this.playersSearching.length >= 2) {
        let clientBlue = this.playersSearching.pop();
        let clientRed = this.playersSearching.pop();

        clientBlue.send("RemovedFromQueue");
        clientRed.send("RemovedFromQueue");

        await this.createGame(clientBlue, clientRed);
      }
    }
  }

  async createGame(clientBlue: Client, clientRed: Client) {
    try {
      const gameRoom = await matchMaker.createRoom("GameRoom", {
        isPlayground: false,
      });

      const blueReservation = await matchMaker.reserveSeatFor(
        gameRoom,
        clientBlue
      );
      const redReservation = await matchMaker.reserveSeatFor(
        gameRoom,
        clientRed
      );

      clientBlue.send("SeatReservation", {
        reservation: blueReservation,
        color: Color.Blue,
      });

      clientRed.send("SeatReservation", {
        reservation: redReservation,
        color: Color.Red,
      });
    } catch (error) {
      console.log("Error occurred during game creation: ", error);
      throw error;
    }
  }

  async onJoin(client: Client, options: any) {
    console.log(client.id + " joined lobby room.");

    const playerId = await dbConnection.insertPlayerIfNotFound(
      options.sub,
      options.name,
      options.name
    );

    this.state.players.set(
      client.id,
      new PlayerSchema(options.name, playerId, options.sub, client.sessionId)
    );

    // Check if this user has an ongoing game
    if (this.ongoingGames.get(playerId)) {
      let ongoingGameId = this.ongoingGames.get(playerId);
      console.log("ongoingGameId: " + ongoingGameId);
      // Here, redirect the user to their ongoing game
      matchMaker
        .joinById(ongoingGameId, {})
        .then((reservation) => {
          client.send("SeatReservation", { reservation });
        })
        .catch((error) => {
          console.log(`Failed to rejoin game: ${error}`);
          // handle error, possibly remove the game from ongoingGames if it no longer exists
          this.ongoingGames.delete(playerId);
        });
    }
  }

  onLeave(client: Client, consented: boolean) {
    this.removeClientFromQueue(client);
    this.state.players.delete(client.id);
    console.log(client.id + " leaved lobby room");
  }

  onDispose() {
    console.log("Disposing the room");
  }

  removeClientFromQueue(client: Client) {
    let queueIndex = this.playersSearching.indexOf(client);
    if (queueIndex > -1) {
      this.playersSearching.splice(queueIndex, 1);
      client.send("RemovedFromQueue");
    }
  }
}
