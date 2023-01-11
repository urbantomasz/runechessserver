import { ArraySchema, MapSchema } from "@colyseus/schema";
import { Room, Client } from "colyseus";
import { Color } from "../runechess/Enums";
import { Game } from "../runechess/Game";
import { IGame } from "../runechess/Interfaces";
import { AvailableCasts } from "../runechess/SpellManager";
import { Unit } from "../runechess/Unit";
import { AvailableMoves } from "../runechess/Validator";
import { AvailableCastsSchema, AvailableMovesSchema, GameRoomState, TileSchema, UnitSchema } from "./schema/GameRoomState";

export class GameRoom extends Room<GameRoomState> {
  private _game: IGame;
  private _bluePlayerId: string = null;
  private _redPlayerId: string = null;
  private _isPlayground: boolean = false;
  /**
   *
   */
  constructor() {
    super();
    this.initializeState()
  }

    //this.setState(new GameRoomState(units, tiles, availableMoves))
  private updateState(){
    console.time('updateState')
    this.state.Units = this._game.Units.map(x => new UnitSchema(x)) as ArraySchema<UnitSchema>;
    this.state.Tiles = this._game.Tiles.flat().map(x => new TileSchema(x)) as ArraySchema<TileSchema>;
    this.state.AvailableMoves = this.mapMovesToSchema(this._game.UnitsAvailableMoves);
    this.state.AvailableCasts = this.mapCastsToSchema(this._game.UnitsAvailableCasts);
    this.state.PlayerTurnColor = this._game.GetPlayerTurnColor();
    console.timeEnd('updateState')
  }

  private initializeState(){
    this._game = new Game();
    let units = this._game.Units.map(x => new UnitSchema(x)) as ArraySchema<UnitSchema>;
    let tiles = this._game.Tiles.flat().map(x => new TileSchema(x)) as ArraySchema<TileSchema>;
    let availableMoves = this.mapMovesToSchema(this._game.UnitsAvailableMoves);
    let availableCasts = this.mapCastsToSchema(this._game.UnitsAvailableCasts);
    this.setState(new GameRoomState(units, tiles, availableMoves, availableCasts))
  }

  onJoin(client: Client, options?: any, auth?: any): void | Promise<any> {

    console.log(client.id + " join the room with option: " + options.playerColor)

    let playerColor = options.playerColor;

    if(this._bluePlayerId === null && playerColor === 0){
      this._bluePlayerId = client.id;
    }

    if(this._redPlayerId === null && playerColor === 1){
      this._redPlayerId = client.id; 
    }
     
    if(this.clients.length == 2 && this._bluePlayerId !== null && this._redPlayerId !== null){
      console.log("broadcasting message")
      this.broadcast("GameStart");
    } else if(options.isPlayground){
      this.broadcast("GameStart");
    }

  }

  onCreate (options: any) {
   // this.autoDispose = false;
    this.maxClients = 2;
    if(options.isPlayground){
      this.maxClients = 1;
    }


    if(options.hasOwnProperty("isPlayground")){
      console.log("isplayground value: " + options.isPlayground)
      this._isPlayground = options.isPlayground;
    }
    
    this.onMessage("TryMoveUnit", (client, data) =>{
      if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
      if(this._game.TryMoveUnit(data.selectedUnit, data.tile)){
        //console.log(this._game.GetPlayerTurnColor())
       this.updateState();
       this.broadcast("UnitMoved");
      }
    })

    this.onMessage("TryCaptureUnit", (client, data) =>{
      if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
      if(this._game.TryCaptureUnit(data.selectedUnit, data.capturingUnit)){
       this.updateState();
       this.broadcast("UnitCaptured");
      };
    })

    this.onMessage("TryCastingSpell", (client, data) =>{
      //console.log("try casting spell game")
      if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
      if(this._game.TryCastingSpell(data.castingUnit, data.targetingUnit)){
        this.updateState();
        this.broadcast("SpellCasted");
      };
    })

    this.onMessage("QueenCaptured", (client, data) =>{
      this.broadcast("GameOver");
    });
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    if(client.id === this._bluePlayerId)
      this._bluePlayerId = null;
    if(client.id === this._redPlayerId)
      this._redPlayerId = null; 
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  private mapMovesToSchema(availableMoves: Map<Unit,AvailableMoves>): MapSchema<AvailableMovesSchema> {
    const mapSchema = new MapSchema<AvailableMovesSchema>();
  
    for (const [key, value] of availableMoves) {
      mapSchema.set(key.id, new AvailableMovesSchema(value));
    }
  
    return mapSchema;
  }

  private mapCastsToSchema(availableCasts: Map<Unit,AvailableCasts>): MapSchema<AvailableCastsSchema> {
    const mapSchema = new MapSchema<AvailableCastsSchema>();
  
    for (const [key, value] of availableCasts) {
      mapSchema.set(key.id, new AvailableCastsSchema(value));
    }
  
    return mapSchema;
  }
}