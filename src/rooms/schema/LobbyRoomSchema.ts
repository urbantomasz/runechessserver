import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";

export class PlayerSchema extends Schema{
    @type("string")
    clientId: string;
    @type("string")
    name: string;
    /**
     *
     */
    constructor(clientId: string, name: string) {
        super();
        this.clientId = clientId;
        this.name = name;
    }
}

export class MessageSchema extends Schema{
    @type("string")
    name: string;
    @type("string")
    message: string;
}

export class LobbyRoomSchema extends Schema {
    @type(["string"]) playersSearchingIds: ArraySchema<string>
    @type({ map: PlayerSchema }) players: MapSchema<PlayerSchema>;
    @type([MessageSchema]) messages: ArraySchema<string>;
    /**
     *
     */
    constructor() {
        super();
        this.messages = new ArraySchema<string>();
        this.players = new MapSchema<PlayerSchema>();
        this.playersSearchingIds =  new ArraySchema<string>();
    }

    GetNumberOfPlayers(): number{
        return this.players.size;
    }
}

