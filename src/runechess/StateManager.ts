import { Color } from "./Enums";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { Tile } from "./Tile";
import {
  King,
  Knight,
  Mage,
  Peasant,
  Priest,
  Princess,
  Rogue,
  Unit,
} from "./Unit";
import { Validator } from "./Validator";
import {
  CaptureCommand,
  TargetCommand,
  MoveCommand,
  SpellCommand,
  TurnFinishedCommand,
  EnPassantCommand,
} from "./Commands";
import { GameSettings } from "./GameSettings";
import { PowerStomp } from "./Spell";
import {
  CastSpellResult,
  CastNotValidResult,
  MoveUnitResult,
  CaptureUnitResult,
  EnPassantResult,
} from "./Models/Results";

export class StateManager {
  private _validator: Validator;
  private _spellManager: SpellManager;
  private _tiles: Tile[][];
  private _units: Unit[];
  private _playerTurnColor: Color;
  private _commands: TargetCommand[] = [];
  private _enPassant: Peasant | null;
  private readonly _settings: GameSettings;
  constructor(
    units: Unit[],
    tiles: Tile[][],
    validator: Validator,
    spellManager: SpellManager,
    settings: GameSettings
  ) {
    this._units = units;
    this._tiles = tiles;
    this._validator = validator;
    this._spellManager = spellManager;
    this._playerTurnColor = Color.Blue;
    this._settings = settings;
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
    if (this._commands.length < 50) return false;

    // Check the last 50 moves for a capture
    for (let i = this._commands.length - 50; i < this._commands.length; i++) {
      if (this._commands[i] instanceof CaptureCommand) return false; // or check some other condition
    }

    return true;
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

  public TryCastingSpell(
    castingUnit: Unit,
    targetObject: GameObject
  ): CastSpellResult | CastNotValidResult {
    if (
      !this._spellManager.UnitsAvailableCasts.get(castingUnit).Targets.includes(
        targetObject
      )
    ) {
      return null;
    }

    if (this._settings.validatePlayerColor) {
      if (this._playerTurnColor !== castingUnit.color) {
        return null;
      }
    }

    var spellCommand = new SpellCommand(
      castingUnit,
      targetObject,
      this._spellManager
    );

    spellCommand.Execute();

    this.FinishTurnCommand(spellCommand).Execute();

    return this._spellManager.GenerateCastSpellResult({
      castingUnit: castingUnit,
      targetObject: targetObject,
    });
  }

  public TryMoveUnit(unit: Unit, tile: Tile): MoveUnitResult {
    if (this._settings.validateMoves) {
      if (!this._validator.UnitsAvailableMoves.get(unit).Tiles.includes(tile)) {
        return;
      }
    }

    if (this._settings.validatePlayerColor) {
      if (this._playerTurnColor !== unit.color) {
        return;
      }
    }

    if (this._enPassant) {
      this._enPassant.isEnPassant = false;
      this._enPassant.enPassantColumn = null;
      this._enPassant.enPassantRow = null;
      this._enPassant = null;
    }

    let moveCommand = new MoveCommand(unit, tile, this._units);

    moveCommand.Execute();

    if (moveCommand.IsEnPassant) {
      this._enPassant = moveCommand.EnPassant;
      this.FinishTurnCommand(moveCommand, true).Execute();
    } else {
      this.FinishTurnCommand(moveCommand).Execute();
    }

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
    if (this._settings.validateMoves) {
      if (
        !this._validator.UnitsAvailableMoves.get(selectedUnit).Units.includes(
          capturingUnit
        )
      ) {
        return;
      }
    }

    if (this._settings.validatePlayerColor) {
      if (this._playerTurnColor !== selectedUnit.color) {
        return;
      }
    }

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

  public TryEnPassant(
    peasant: Peasant,
    capturingPeasant: Peasant
  ): EnPassantResult {
    if (this._settings.validateMoves) {
      if (
        !(
          this._validator.UnitsAvailableMoves.get(peasant).EnPassant ===
          capturingPeasant
        )
      ) {
        return;
      }
    }

    if (this._settings.validatePlayerColor) {
      if (this._playerTurnColor !== peasant.color) {
        return;
      }
    }

    var enPassantCommand = new EnPassantCommand(
      peasant,
      capturingPeasant,
      this._units,
      this._tiles
    );

    enPassantCommand.Execute();

    this.FinishTurnCommand(enPassantCommand).Execute();

    return {
      peasant: peasant.id,
      capturedPeasant: capturingPeasant.id,
      enPassantTile: enPassantCommand.enPassantTile.id,
    };
  }

  public FinishTurnCommand(
    command: TargetCommand | null = null,
    isEnPassant: boolean = false
  ): TurnFinishedCommand {
    console.log(command);
    if (command !== null) {
      this._commands.push(command);
    }
    if (!isEnPassant && this._enPassant) {
      this._enPassant.isEnPassant = false;
      this._enPassant.enPassantColumn = null;
      this._enPassant.enPassantRow = null;
      this._enPassant = null;
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
