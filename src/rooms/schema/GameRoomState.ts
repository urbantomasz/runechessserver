// import { AvailableCasts } from "../../runechess/SpellManager";
// import { Tile } from "../../runechess/Tile";
// import { Unit } from "../../runechess/Unit";
// import { AvailableMoves } from "../../runechess/Validator";
// import { Schema, type, ArraySchema, MapSchema} from "@colyseus/schema";
// import { UnitType } from "../../runechess/Enums";

// export class TileSchema extends Schema {
// /**
//  *
//  */
// constructor(tile: Tile) {
//   super();
//   this.id = tile.id;
//   this.column = tile.column;
//   this.row = tile.row;
//   this.lastCapturedUnit = tile.lastCapturedUnit?.id
//   this.isDestroyed = tile.isDestroyed;
// }
//   @type("string")
//   id: string;

//   @type("number")
//   row: number;

//   @type("number")
//   column: number;

//   @type("string")
//   lastCapturedUnit: string;

//   @type("boolean")
//   isDestroyed: boolean;
// }

// export class UnitSchema extends Schema {

//   /**
//    *
//    */
//   constructor(unit: Unit) {
//     super();
//     this.id = unit.id;
//     this.column = unit.column;
//     this.row = unit.row;
//     this.color =  unit.color;
//     this.isCaptured = unit.isCaptured;
//     this.isMoved = unit.isMoved;
//     this.usedSpell = unit.usedSpell;
//     this.type = UnitType[unit.constructor.name] as number;
//   }

//   @type("string")
//   id: string;

//   @type("number")
//   column: number;

//   @type("number")
//   row: number;

//   @type("boolean")
//   isMoved: boolean;

//   @type("boolean")
//   usedSpell: boolean;

//   @type("boolean")
//   isCaptured: boolean;

//   @type("number")
//   color: number;

//   @type("number")
//   type: number;
// }

// export class AvailableMovesSchema extends Schema{

//   /**
//    *
//    */
//   constructor(availableMoves: AvailableMoves) {
//     super();
//     this.Tiles = availableMoves.Tiles.map(x => x.id) as ArraySchema<string>;
//     this.Units = availableMoves.Units.map(x => x.id) as ArraySchema<string>;
//   }

//   @type(["string"])
//   Units: ArraySchema<string>;

//   @type(["string"])
//   Tiles: ArraySchema<string>
// }

// export class AvailableCastsSchema extends Schema{
//   /**
//    *
//    */
//   constructor(availableCasts: AvailableCasts) {
//     super();
//     this.Targets = availableCasts.Targets.map(x => x.id) as ArraySchema<string>;
//   }
//   @type(["string"])
//   Targets: ArraySchema<string>
// }

// export class GameRoomState extends Schema {
//   @type([TileSchema]) Tiles: ArraySchema<TileSchema>;
//   @type([UnitSchema]) Units: ArraySchema<UnitSchema>;
//   @type({ map: AvailableMovesSchema }) AvailableMoves: MapSchema<AvailableMovesSchema>;
//   @type({ map: AvailableCastsSchema }) AvailableCasts: MapSchema<AvailableCastsSchema>;
//   @type(["string"]) Moves: ArraySchema<string>;
//   @type("number") PlayerTurnColor: number;
//   @type("number") RedPlayerRemainingTime: number;
//   @type("number") BluePlayerRemainingTime: number;
//   @type("boolean") IsCheck: boolean;
//   @type("boolean") IsMate: boolean;


//   constructor(
//     units: ArraySchema<UnitSchema>,
//     tiles: ArraySchema<TileSchema>,
//     availableMoves: MapSchema<AvailableMovesSchema>,
//     availableCasts: MapSchema<AvailableCastsSchema>,
//     moves: ArraySchema<string>
//     ) {
//     super();
//     this.Tiles = tiles;
//     this.Units = units;
//     this.AvailableMoves = availableMoves;
//     this.AvailableCasts = availableCasts;
//     this.PlayerTurnColor = 0;
//     this.Moves = moves;
//     this.RedPlayerRemainingTime = 10 * 60 * 1000;
//     this.BluePlayerRemainingTime = 10 * 60 * 1000;
//     this.IsCheck = false;
//     this.IsMate = false;
//   }
// }