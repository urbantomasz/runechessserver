import { Player } from "./Player";
import { Tile } from "./Tile";
import { Unit } from "./Unit";
import { AvailableMoves, Validator } from "./Validator";
import {
  CaptureUnitResult,
  MoveUnitResult,
  StateManager,
} from "./StateManager";
import { AvailableCasts, SpellManager } from "./SpellManager";
import { Color } from "./Enums";
import { GameObject } from "./GameObject";
import { IGame } from "./IGame";
import { Move } from "./Move";
import { ISpell } from "./Spell";
import { Bot, BotMove } from "./Bot";
import { ICommand } from "./Commands";
//todo move some subclasses to game maybe as interfaces or abstract classes
export class Game implements IGame {
  public static BOARD_ROWS = 8;
  public static BOARD_COLUMNS = 9;
  private readonly _players: Player[];
  private readonly _validator: Validator;
  private readonly _stateManager: StateManager;
  private readonly _spellManager: SpellManager;
  private readonly _bot: Bot;

  constructor() {
    this._players = [new Player(Color.Blue), new Player(Color.Red)];
    let tiles = this.initializeTiles();
    let units = this.initializeUnits();
    this._validator = new Validator(units, tiles);
    this._spellManager = new SpellManager(units, tiles, this._validator);
    this._stateManager = new StateManager(
      units,
      tiles,
      this._validator,
      this._spellManager
    );
    this._bot = new Bot(this._stateManager);
  }

  public GetAllPossibleMoves(): ICommand[] {
    return this._stateManager.GetAllPossibleMoves();
  }

  public IsCheck(): boolean {
    return this._stateManager.IsCheck;
  }

  public IsMate(): boolean {
    return this._stateManager.IsMate;
  }

  public IsStaleMate(): boolean {
    return this._stateManager.IsStaleMate;
  }

  public Is50MoveRule(): boolean {
    return this._stateManager.Is50MoveRule;
  }

  public GetBestMove(depth: number): BotMove {
    return this._bot.GetBestMove(depth);
  }

  public GetPlayerTurnColor(): Color {
    return this._stateManager.PlayerTurnColor;
  }

  public TryMoveUnit(selectedUnitId: string, tileId: string): MoveUnitResult {
    return this._stateManager.TryMoveUnit(
      this.GetGameObjectById(selectedUnitId) as Unit,
      this.GetGameObjectById(tileId) as Tile
    );
  }

  public TryCaptureUnit(
    selectedUnitId: string,
    capturingUnitId: string
  ): CaptureUnitResult {
    return this._stateManager.TryTakeUnit(
      this.GetGameObjectById(selectedUnitId) as Unit,
      this.GetGameObjectById(capturingUnitId) as Unit
    );
  }

  public TryCastingSpell(castingUnitId: string, targetUnitId: string): boolean {
    return this._stateManager.TryCastingSpell(
      this.GetGameObjectById(castingUnitId) as Unit,
      this.GetGameObjectById(targetUnitId) as Unit
    );
  }

  private initializeUnits(): Unit[] {
    return this._players[0]
      .GetStartingUnits()
      .concat(this._players[1].GetStartingUnits());
  }

  private initializeTiles(): Tile[][] {
    let tiles: Tile[][] = [];
    for (let i = 0; i < Game.BOARD_ROWS; i++) {
      tiles[i] = [];
      for (let j = 0; j < Game.BOARD_COLUMNS; j++) {
        tiles[i][j] = new Tile(i, j);
      }
    }
    return tiles;
  }

  public get Spells(): Map<Unit, ISpell> {
    return this._spellManager.Spells;
  }

  public get Tiles(): Tile[][] {
    return this._stateManager.Tiles;
  }

  public get Moves(): Move[] {
    return [] as Move[];
  }

  public get Units(): Unit[] {
    return this._stateManager.Units;
  }

  public get UnitsAvailableMoves(): Map<Unit, AvailableMoves> {
    return this._validator.GetUnitsAvailableMovesByPlayerColor(
      this._stateManager.PlayerTurnColor
    );
  }

  public get UnitsAvailableCasts(): Map<Unit, AvailableCasts> {
    return this._spellManager.GetUnitsAvailableCastsByPlayerColor(
      this._stateManager.PlayerTurnColor
    );
  }

  public GetGameObjectById(id: string): GameObject {
    if (id.includes("unit")) {
      return this._stateManager.GetUnitById(id);
    }

    if (id.includes("tile")) {
      return this._stateManager.GetTileById(id);
    }

    return null;
  }
}
