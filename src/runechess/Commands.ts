import { Color, CommandType, Spell } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { ISpell } from "./Spell";
import { AvailableCasts, SpellManager } from "./SpellManager";
import { StateManager } from "./StateManager";
import { Tile } from "./Tile";
import { King, Peasant, Unit } from "./Unit";
import { AvailableMoves, Validator } from "./Validator";

export interface ICommand {
  Execute(): void;
  Undo(): void;
}

export abstract class TargetCommand implements ICommand {
  readonly UnitId: string;
  readonly TargetId: string;
  constructor(unit: Unit, target: GameObject) {
    this.UnitId = unit.id;
    this.TargetId = target.id;
  }

  public abstract Execute(): void;
  public abstract Undo(): void;
}

export class TurnFinishedCommand implements ICommand {
  private _stateManager: StateManager;
  private _spellManager: SpellManager;
  private _validator: Validator;
  private _previousUnitsAvailableMoves: Map<Unit, AvailableMoves>;
  private _previousUnitsAvailableCasts: Map<Unit, AvailableCasts>;
  private _previousPlayercolor: Color;
  private _previousIsCheck: boolean;
  private _previousIsMate: boolean;
  private _previousIsSpellCheck: boolean;
  private _previousIsSpellMate: boolean;
  private _previousIs50MoveRule: boolean;
  private _previousIsInsufficientMaterial: boolean;

  constructor(
    stateManager: StateManager,
    spellManager: SpellManager,
    validator: Validator
  ) {
    this._stateManager = stateManager;
    this._spellManager = spellManager;
    this._validator = validator;
    this._previousUnitsAvailableCasts = this._spellManager.UnitsAvailableCasts;
    this._previousUnitsAvailableMoves = this._validator.UnitsAvailableMoves;
    this._previousPlayercolor = stateManager.PlayerTurnColor;
    this._previousIsCheck = validator.IsCheck;
    this._previousIsMate = validator.IsMate;
    this._previousIsSpellCheck = spellManager.IsSpellCheck;
    this._previousIsSpellMate = spellManager.IsSpellMate;
    this._previousIs50MoveRule = stateManager.Is50MoveRule;
    this._previousIsInsufficientMaterial = stateManager.IsInsufficientMaterial;
  }
  Execute(): void {
    this._stateManager.SwapPlayerTurnColor();
    this._stateManager.UpdateIs50MoveRule();
    this._stateManager.UpdateInsufficientMaterial();
    this._validator.UpdateUnitsAvailableMoves();
    this._spellManager.UpdateUnitsAvailableCasts();
  }
  Undo(): void {
    this._stateManager.PlayerTurnColor = this._previousPlayercolor;
    this._stateManager.Is50MoveRule = this._previousIs50MoveRule;
    this._stateManager.IsInsufficientMaterial = this._previousIsInsufficientMaterial;
    this._validator.UnitsAvailableMoves = this._previousUnitsAvailableMoves;
    this._validator.IsCheck = this._previousIsCheck;
    this._validator.IsMate = this._previousIsMate;
    this._spellManager.UnitsAvailableCasts = this._previousUnitsAvailableCasts;
    this._spellManager.IsSpellCheck = this._previousIsSpellCheck;
    this._spellManager.IsSpellMate = this._previousIsSpellMate;

  }
}

class PromotePeasantCommand implements ICommand {
  private _units: Unit[];
  private _unit: Unit;
  private _tile: Tile;
  private _unitIndex: number;

  constructor(unit: Unit, tile: Tile, units: Unit[]) {
    this._unit = unit;
    this._tile = tile;
    this._units = units;
  }

  Execute(): void {
    this._unitIndex = this._units.findIndex((u) => u === this._unit);
    let king = new King(
      this._unit.color,
      new Tile(this._tile.row, this._tile.column)
    );
    king.id = this._unit.id;
    this._units[this._unitIndex] = king;
  }

  Undo(): void {
    this._units[this._unitIndex] = this._unit;
  }
}

export class MoveCommand extends TargetCommand {
  public readonly UnitId: string;
  public readonly TargetId: string;
  private _unit: Unit;
  private _unitStartRow: number;
  private _unitStartColumn: number;
  private _unitIsMoved: boolean;
  private _tile: Tile;
  private _promotePeasantCommand: PromotePeasantCommand;
  private _isEnPassant: boolean;
  public get IsPeasantPromoted(): boolean {
    return this._promotePeasantCommand !== null;
  }
  public get IsEnPassant(): boolean {
    return this._isEnPassant;
  }

  public get EnPassant(): Peasant {
    return this._unit as Peasant;
  }

  constructor(unit: Unit, tile: Tile, units: Unit[]) {
    super(unit, tile);
    this._unit = unit;
    this._tile = tile;
    this._unitIsMoved = unit.isMoved;
    this._unitStartRow = unit.row;
    this._unitStartColumn = unit.column;
    if (
      (this._unit instanceof Peasant &&
        this._unit.color === Color.Blue &&
        this._tile.row === Game.BOARD_ROWS - 1) ||
      (this._unit instanceof Peasant &&
        this._unit.color === Color.Red &&
        this._tile.row === 0)
    ) {
      this._promotePeasantCommand = new PromotePeasantCommand(
        unit,
        tile,
        units
      );
    } else {
      this._promotePeasantCommand = null;
    }
  }

  Execute(): void {
    if (
      this._unit instanceof Peasant &&
      !this._unit.isMoved &&
      Math.abs(this._unit.row - this._tile.row) == 2
    ) {
      this._unit.isEnPassant = true;
      this._unit.enPassantColumn = this._unitStartColumn;
      this._unit.enPassantRow = (this._unitStartRow + this._tile.row) / 2;
      this._isEnPassant = true;
    }
    this._unit.column = this._tile.column;
    this._unit.row = this._tile.row;
    this._unit.isMoved = true;
    this._promotePeasantCommand?.Execute();
  }
  Undo(): void {
    if (this._unit instanceof Peasant && this._isEnPassant) {
      this._unit.isEnPassant = false;
      this._unit.enPassantColumn = null;
      this._unit.enPassantRow = null;
    }
    this._unit.column = this._unitStartColumn;
    this._unit.row = this._unitStartRow;
    this._unit.isMoved = this._unitIsMoved;
    this._promotePeasantCommand?.Undo();
  }
}

export class EnPassantCommand extends TargetCommand {
  public readonly UnitId: string;
  public readonly TargetId: string;
  public moveCommand: MoveCommand;
  public captureCommand: CaptureCommand;
  private capturingPeasant: Peasant;
  private peasant: Peasant;
  private units: Unit[];
  private tiles: Tile[][];
  private _enPassantTile: Tile;

  public get enPassantTile(): Tile {
    return this._enPassantTile;
  }

  constructor(
    peasant: Peasant,
    capturingPeasant: Peasant,
    units: Unit[],
    tiles: Tile[][]
  ) {
    super(peasant, capturingPeasant);
    this.capturingPeasant = capturingPeasant;
    this.peasant = peasant;
    this.units = units;
    this.tiles = tiles;
    this._enPassantTile =
      tiles[capturingPeasant.enPassantRow][capturingPeasant.enPassantColumn];
  }

  Execute(): void {
    this.moveCommand = new MoveCommand(
      this.capturingPeasant,
      this._enPassantTile,
      this.units
    );
    this.moveCommand.Execute();
    this.captureCommand = new CaptureCommand(
      this.peasant,
      this.capturingPeasant,
      this.units,
      this.tiles
    );
    this.captureCommand.Execute();
    this.capturingPeasant.isEnPassant = false;
    this.capturingPeasant.enPassantRow = null;
    this.capturingPeasant.enPassantColumn = null;
  }
  Undo(): void {
    this.captureCommand.Undo();
    this.moveCommand.Undo();
    this.capturingPeasant.isEnPassant = true;
    this.capturingPeasant.enPassantRow = this._enPassantTile.row;
    this.capturingPeasant.enPassantColumn = this._enPassantTile.column;
  }
}

export class CaptureCommand extends TargetCommand {
  public readonly UnitId: string;
  public readonly TargetId: string;
  public moveCommand: MoveCommand;
  private _capturingUnit: Unit;
  private _capturingUnitTile: Tile;
  private _capturingUnitTileLCU: Unit;

  public get CapturingUnitTile(): Tile {
    return this._capturingUnitTile;
  }

  constructor(unit: Unit, capturingUnit: Unit, units: Unit[], tiles: Tile[][]) {
    super(unit, capturingUnit);
    this._capturingUnit = capturingUnit;
    this._capturingUnitTile =
      tiles[this._capturingUnit.row][this._capturingUnit.column];
    this._capturingUnitTileLCU = this._capturingUnitTile.lastCapturedUnit;
    this.moveCommand = new MoveCommand(unit, this._capturingUnitTile, units);
  }
  Execute(): void {
    this._capturingUnit.isCaptured = true;
    this._capturingUnitTile.lastCapturedUnit = this._capturingUnit;
    this.moveCommand.Execute();
  }
  Undo(): void {
    this._capturingUnit.isCaptured = false;
    this._capturingUnitTile.lastCapturedUnit = this._capturingUnitTileLCU;
    this.moveCommand.Undo();
  }
}

export class SpellCommand extends TargetCommand {
  public readonly UnitId: string;
  public readonly TargetId: string;
  private _unitSpell: ISpell;
  private _targetObject: GameObject;
  private _castingUnit: Unit;
  private _spellManager: SpellManager;

  constructor(
    castingUnit: Unit,
    targetObject: GameObject,
    spellManager: SpellManager
  ) {
    super(castingUnit, targetObject);
    this._castingUnit = castingUnit;
    this._targetObject = targetObject;
    this._unitSpell = spellManager.Spells.get(castingUnit);
    this._spellManager = spellManager;
  }

  Execute(): void {
    this._unitSpell.Cast(
      this._castingUnit,
      this._targetObject,
      this._spellManager
    );
    this._castingUnit.usedSpell = true;
  }
  Undo(): void {
    this._unitSpell.Undo();
    this._castingUnit.usedSpell = false;
  }
}

// export class CaptureCommand extends TargetCommand {
//   public readonly UnitId: string;
//   public readonly TargetId: string;
//   public moveCommand: MoveCommand;
//   private _capturingUnit: Unit;
//   private _capturingUnitTile: Tile;
//   private _capturingUnitTileLCU: Unit;

//   private _moveCommandEnPassant: MoveCommand;
//   private _isEnPassant: boolean;
//   private _capturingUnitTileEnPassant: Tile;
//   private _capturingUnitTileLCUEnPassant: Unit;

//   public get CapturingUnitTile(): Tile {
//     return this._capturingUnitTile;
//   }

//   constructor(unit: Unit, capturingUnit: Unit, units: Unit[], tiles: Tile[][]) {
//     super(unit, capturingUnit);
//     this._capturingUnit = capturingUnit;
//     if (
//       unit instanceof Peasant &&
//       this._capturingUnit instanceof Peasant &&
//       this._capturingUnit.isEnPassant
//     ) {
//       this._isEnPassant = true;
//       this._capturingUnitTileEnPassant =
//         tiles[this._capturingUnit.enPassantRow][
//           this._capturingUnit.enPassantColumn
//         ];
//       this._capturingUnitTileLCUEnPassant =
//         this._capturingUnitTileEnPassant.lastCapturedUnit;
//       this._moveCommandEnPassant = new MoveCommand(
//         capturingUnit,
//         this._capturingUnitTileEnPassant,
//         units
//       );
//       this.moveCommand = new MoveCommand(
//         unit,
//         this._capturingUnitTileEnPassant,
//         units
//       );
//     } else {
//       this._capturingUnitTile =
//         tiles[this._capturingUnit.row][this._capturingUnit.column];
//       this._capturingUnitTileLCU = this._capturingUnitTile.lastCapturedUnit;
//       this.moveCommand = new MoveCommand(unit, this._capturingUnitTile, units);
//     }
//   }
//   Execute(): void {
//     if (this._isEnPassant) {
//       this._moveCommandEnPassant.Execute();
//       this._capturingUnitTileEnPassant.lastCapturedUnit = this._capturingUnit;
//     } else {
//       this._capturingUnitTile.lastCapturedUnit = this._capturingUnit;
//     }
//     this._capturingUnit.isCaptured = true;
//     this.moveCommand.Execute();
//   }
//   Undo(): void {
//     if (this._isEnPassant) {
//       this._moveCommandEnPassant.Undo();
//       this._capturingUnitTileEnPassant.lastCapturedUnit =
//         this._capturingUnitTileLCUEnPassant;
//     } else {
//       this._capturingUnitTile.lastCapturedUnit = this._capturingUnitTileLCU;
//     }
//     this._capturingUnit.isCaptured = false;
//     this.moveCommand.Undo();
//   }
// }
