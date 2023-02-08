import { ArraySchema, MapSchema } from "@colyseus/schema";
import { Room, Client, Delayed, Clock } from "colyseus";
import { Color } from "../runechess/Enums";
import { Game } from "../runechess/Game";
import { IGame } from "../runechess/Interfaces";
import { PowerStomp } from "../runechess/Spell";
import { AvailableCasts } from "../runechess/SpellManager";
import { Tile } from "../runechess/Tile";
import { Knight, Princess, Rogue, Unit } from "../runechess/Unit";
import { AvailableMoves } from "../runechess/Validator";
import { Position } from "../runechess/Position";
import { AvailableCastsSchema, AvailableMovesSchema, GameRoomState, TileSchema, UnitSchema } from "./schema/GameRoomState";

export class GameRoom extends Room<GameRoomState> {
  private _game: IGame;
  private _bluePlayerId: string = null;
  private _redPlayerId: string = null;
  private _isPlayground: boolean = false;
  private _lastMoveTimeStamp: number;
  private _isFirstMove: boolean = true;
  /**
   *
   */
  constructor() {
    super();
    this.initializeState()
  }

  private async updateState(){
    console.time('updateState')
    let currentMoveTimeStamp = Date.now();

    if(this._isFirstMove){
      this._isFirstMove = false;
    } else{
      if(this.state.PlayerTurnColor === Color.Blue){
        this.state.BluePlayerRemainingTime = this.state.BluePlayerRemainingTime - (currentMoveTimeStamp - this._lastMoveTimeStamp);
      } 
  
      if(this.state.PlayerTurnColor === Color.Red){
        this.state.RedPlayerRemainingTime = this.state.RedPlayerRemainingTime - (currentMoveTimeStamp - this._lastMoveTimeStamp);
      }
    }

    this._lastMoveTimeStamp = currentMoveTimeStamp;

    this.state.Units = this._game.Units.map(x => new UnitSchema(x)) as ArraySchema<UnitSchema>;
    this.state.Tiles = this._game.Tiles.flat().map(x => new TileSchema(x)) as ArraySchema<TileSchema>;
    this.state.AvailableMoves = this.mapMovesToSchema(this._game.UnitsAvailableMoves);
    this.state.AvailableCasts = this.mapCastsToSchema(this._game.UnitsAvailableCasts);
    this.state.PlayerTurnColor = this._game.GetPlayerTurnColor();
    this.state.Moves = this._game.Moves.map(x => x.toNotationString()) as ArraySchema<string>;
    this.state.IsCheck = this._game.IsCheck();
    this.state.IsMate = this._game.IsMate();
    console.timeEnd('updateState')

    if(this.state.IsMate){
      this.broadcast("GameOver", {winnerColor: this.state.PlayerTurnColor === 0 ? 1 : 0});
    }
  }

  private initializeState(){
    this._game = new Game();
    let units = this._game.Units.map(x => new UnitSchema(x)) as ArraySchema<UnitSchema>;
    let tiles = this._game.Tiles.flat().map(x => new TileSchema(x)) as ArraySchema<TileSchema>;
    let availableMoves = this.mapMovesToSchema(this._game.UnitsAvailableMoves);
    let availableCasts = this.mapCastsToSchema(this._game.UnitsAvailableCasts);
    let moves = this._game.Moves.map(x => x.toNotationString()) as ArraySchema<string>;
    this.setState(new GameRoomState(units, tiles, availableMoves, availableCasts, moves))
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

     // start the clock ticking
     this.clock.start();
    
    this.onMessage("TryMoveUnit", (client, data) =>{
      //if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
      if(this._game.TryMoveUnit(data.selectedUnit, data.tile)){
        //console.log(this._game.GetPlayerTurnColor())
       this.updateState();
       this.broadcast("UnitMoved", {selectedUnit: data.selectedUnit, tile: data.tile});
      }
    })

    this.onMessage("TryCaptureUnit", (client, data) =>{
      //if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
      if(this._game.TryCaptureUnit(data.selectedUnit, data.capturingUnit)){
       this.updateState();
       this.broadcast("UnitCaptured", {selectedUnit: data.selectedUnit, capturedUnit: data.capturingUnit});
      };
    })

    this.onMessage("TryCastingSpell", (client, data) =>{
      //console.log("try casting spell game")
      //if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
      
      const castingUnit = this._game.GetGameObjectById(data.castingUnit) as Unit;

      if(castingUnit instanceof Knight){
        const unitSpell = this._game.Spells.get(castingUnit) as PowerStomp;
        const targetingTile = this._game.GetGameObjectById(data.targetingObject) as Tile;
        let unitTileMap = new Map<string, {row: number, column: number}>();
        unitSpell._tilesBehindMap.get(targetingTile).forEach((v,k) =>{
          unitTileMap.set(k.id, {row: v.row, column: v.column})
        })
        let unitTileMapStringifed = JSON.stringify(Array.from(unitTileMap.entries()));
        if(this._game.TryCastingSpell(data.castingUnit, data.targetingObject)){
          this.broadcast("SpellCasted", { castingUnit: data.castingUnit, targetingTile: data.targetingObject, unitTileMap: unitTileMapStringifed});
        }
      } else if(castingUnit instanceof Princess){
        if(this._game.TryCastingSpell(data.castingUnit, data.targetingObject)){
          const castingUnit = this._game.GetGameObjectById(data.castingUnit);
          const targetingUnit = this._game.GetGameObjectById(data.targetingObject);
          this.broadcast("SpellCasted", { 
            castingUnit: data.castingUnit,
            castingUnitNewPosition: new Position(castingUnit.column, castingUnit.row),
            targetingUnit: data.targetingObject,
            targetingUnitNewPosition: new Position(targetingUnit.column, targetingUnit.row),
          }
          );
        }
      }
      else if(castingUnit instanceof Rogue){
        if(this._game.TryCastingSpell(data.castingUnit, data.targetingObject)){
          const castingUnit = this._game.GetGameObjectById(data.castingUnit);
          const targetingUnit = this._game.GetGameObjectById(data.targetingObject);
          this.broadcast("SpellCasted", { 
            castingUnit: data.castingUnit,
            castingUnitNewPosition: new Position(castingUnit.column, castingUnit.row),
            targetingUnit: data.targetingObject,
            targetingUnitNewPosition: new Position(targetingUnit.column, targetingUnit.row),
          }
          );
        }
      }
      else{
        this.broadcast("SpellCasted", { castingUnit: data.castingUnit, targetingUnit: data.targetingObject});
      }
      this.updateState();
    })
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