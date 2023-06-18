import { globalEvent } from "@billjs/event-emitter";
import { Color } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { Move } from "./Move";
import { SpellManager } from "./SpellManager";
import { Tile } from "./Tile";
import { DarkKnight, King, Knight, Peasant, Princess, Unit } from "./Unit";
import { Validator } from "./Validator";
import {
  CaptureCommand,
  ICommand,
  TargetCommand,
  MoveCommand,
  SpellCommand,
  TurnFinishedCommand,
} from "./Commands";

export class StateManager {
  private _validator: Validator;
  private _spellManager: SpellManager;
  private _tiles: Tile[][];
  private _units: Unit[];
  private _playerTurnColor: Color;
  private _commands: TargetCommand[] = [];

  constructor(
    units: Unit[],
    tiles: Tile[][],
    validator: Validator,
    spellManager: SpellManager
  ) {
    this._units = units;
    this._tiles = tiles;
    this._validator = validator;
    this._spellManager = spellManager;
    this._playerTurnColor = Color.Blue;
  }

  public get Tiles() {
    return this._tiles;
  }
  public get Units() {
    return this._units;
  }
  public get PlayerTurnColor() {
    return this._playerTurnColor;
  }

  public set PlayerTurnColor(color: Color) {
    this._playerTurnColor = color;
  }

  public get Commands() {
    return this._commands;
  }

  public get IsStaleMate(): boolean {
    return this.IsMate && !this.IsCheck;
  }

  public get IsCheck(): boolean {
    return this._validator.IsCheck || this._spellManager.IsSpellCheck;
  }

  public get IsMate(): boolean {
    return this._validator.IsMate && this._spellManager.IsSpellMate;
  }

  public get Is50MoveRule(): boolean {
    return this._commands.length >= 500;
  }

  public GetUnitById(id: string): Unit {
    return this._units.find((u) => u.id === id);
  }

  public GetTileById(id: string): Tile {
    for (let i = 0; i < this._tiles.length; i++) {
      for (let j = 0; j < this._tiles[i].length; j++) {
        if (this._tiles[i][j].id === id) {
          return this._tiles[i][j];
        }
      }
    }
    return null;
  }

  public TryCastingSpell(castingUnit: Unit, targetObject: GameObject): boolean {
    if (
      !this._spellManager.UnitsAvailableCasts.get(castingUnit).Targets.includes(
        targetObject
      )
    )
      return false;
    if (this._playerTurnColor !== castingUnit.color) return false;

    var spellCommand = new SpellCommand(
      castingUnit,
      targetObject,
      this._spellManager
    );

    spellCommand.Execute();

    this.FinishTurnCommand(spellCommand).Execute();
    return true;
  }

  public TryMoveUnit(unit: Unit, tile: Tile): MoveUnitResult {
    if (!this._validator.UnitsAvailableMoves.get(unit).Tiles.includes(tile))
      return;
    if (this._playerTurnColor !== unit.color) return;

    let moveCommand = new MoveCommand(unit, tile, this._units);

    moveCommand.Execute();

    this.FinishTurnCommand(moveCommand).Execute();

    return {
      selectedUnit: unit.id,
      tile: tile.id,
      isPeasantPromoted: moveCommand.IsPeasantPromoted,
    };
  }

  public TryTakeUnit(
    selectedUnit: Unit,
    capturingUnit: Unit
  ): CaptureUnitResult {
    console.log(selectedUnit.id);
    console.log(capturingUnit.id);
    console.log(
      this._tiles[capturingUnit.row][capturingUnit.column].lastCapturedUnit
    );
    if (
      !this._validator.UnitsAvailableMoves.get(selectedUnit).Units.includes(
        capturingUnit
      )
    )
      return;
    if (this._playerTurnColor !== selectedUnit.color) return;
    if (capturingUnit instanceof Princess) return;

    var captureCommand = new CaptureCommand(
      selectedUnit,
      capturingUnit,
      this._units,
      this._tiles
    );

    captureCommand.Execute();
    this.FinishTurnCommand(captureCommand).Execute();

    return {
      selectedUnit: selectedUnit.id,
      selectedUnitNewTile: captureCommand.CapturingUnitTile.id,
      capturedUnit: capturingUnit.id,
      isPeasantPromoted: captureCommand.moveCommand.IsPeasantPromoted,
    };
  }

  public FinishTurnCommand(command: TargetCommand | null = null) {
    if (command !== null) {
      this._commands.push(command);
    }
    return new TurnFinishedCommand(this, this._spellManager, this._validator);
  }

  public SwapPlayerTurnColor() {
    this._playerTurnColor =
      this._playerTurnColor === Color.Blue ? Color.Red : Color.Blue;
  }

  public GetAllPossibleMoves(): TargetCommand[] {
    let commandsArray: Array<TargetCommand> = new Array<TargetCommand>();

    this._validator
      .GetUnitsAvailableMovesByPlayerColor(this._playerTurnColor)
      .forEach((moves, unit) => {
        moves.Tiles.forEach((tile) => {
          let moveCommand = new MoveCommand(unit, tile, this.Units);
          commandsArray.push(moveCommand);
        });

        moves.Units.forEach((enemyUnit) => {
          let captureCommand = new CaptureCommand(
            unit,
            enemyUnit,
            this.Units,
            this.Tiles
          );
          commandsArray.push(captureCommand);
        });
      });

    this._spellManager
      .GetUnitsAvailableCastsByPlayerColor(this._playerTurnColor)
      .forEach((casts, unit) => {
        if (unit.color !== this._playerTurnColor) return;
        casts.Targets.forEach((target) => {
          let spellCommand = new SpellCommand(unit, target, this._spellManager);
          commandsArray.push(spellCommand);
        });
      });

    return commandsArray;
  }
}

export interface MoveUnitResult {
  selectedUnit: string;
  tile: string;
  isPeasantPromoted: boolean;
}

export interface CaptureUnitResult {
  selectedUnit: string;
  selectedUnitNewTile: string;
  capturedUnit: string;
  isPeasantPromoted: boolean;
}

// selectedUnit: data.selectedUnit,
// selectedUnitNewTile: Tile.CreateTileId(
//   selectedUnit.row,
//   selectedUnit.column
// ),
// capturedUnit: data.capturingUnit,
