import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string")
  name: string;
  @type("number")
  playerId: number;
  @type("string")
  googleId: string;
  /**
   *
   */
  constructor(name: string, playerId: number, googleId: string) {
    super();
    this.name = name;
    this.playerId = playerId;
    this.googleId = googleId;
  }
}

export class MessageSchema extends Schema {
  @type("string")
  name: string;
  @type("string")
  message: string;
}

export class LobbyRoomSchema extends Schema {
  @type({ map: PlayerSchema }) players: MapSchema<PlayerSchema>;
  /**
   *
   */
  constructor() {
    super();
    this.players = new MapSchema<PlayerSchema>();
  }
}
