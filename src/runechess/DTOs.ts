import { UnitType } from "./Enums";
import { Tile } from "./Tile";
import { Peasant, Unit } from "./Unit";

export class TileDTO {
  constructor(tile: Tile) {
    this.id = tile.id;
    this.row = tile.row;
    this.column = tile.column;
    this.lastCapturedUnit = tile.lastCapturedUnit?.id;
    this.isDestroyed = tile.isDestroyed;
  }
  id: string;
  row: number;
  column: number;
  lastCapturedUnit: string;
  isDestroyed: boolean;
}

export class UnitDTO {
  id: string;
  column: number;
  row: number;
  isEnPassant: boolean;
  isMoved: boolean;
  usedSpell: boolean;
  isCaptured: boolean;
  color: number;
  type: number;

  constructor(unit: Unit) {
    this.id = unit.id;
    this.color = unit.color;
    this.row = unit.row;
    this.column = unit.column;
    this.isMoved = unit.isMoved;
    this.isCaptured = unit.isCaptured;
    this.isEnPassant = unit instanceof Peasant ? unit.isEnPassant : false;
    this.usedSpell = unit.usedSpell;
    this.type = UnitType[unit.constructor.name] as number;
  }
}

export class AvailableMovesDTO {
  Tiles: string[];
  Units: string[];
  EnPassant: string;
}

export class AvailableCastsDTO {
  Targets: string[];
}

export class UnitTargetDTO {
  Id: string;
  IsEnPassant: boolean;
}
