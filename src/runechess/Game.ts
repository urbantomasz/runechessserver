import { Player } from "./Player";
import { Tile } from "./Tile";
import { Peasant, Unit } from "./Unit";
import { Validator } from "./Validator";
import { StateManager } from "./StateManager";
import { SpellManager } from "./SpellManager";
import { Color } from "./Enums";
import { GameObject } from "./GameObject";
import { IGame } from "./IGame";
import { Bot, BotMove } from "./Bot";
import { GameSettings, defaultSettings } from "./GameSettings";
import { GameStateDTO } from "./DTOs";
import { Mapper } from "./Mapper";
import {
  CaptureUnitResult,
  CastNotValidResult,
  CastSpellResult,
  EnPassantResult,
  MoveUnitResult,
} from "./Models/Results";
//todo move some subclasses to game maybe as interfaces or abstract classes
export class Game implements IGame {
  public static BOARD_ROWS = 8;
  public static BOARD_COLUMNS = 9;
  public readonly State: GameStateDTO;
  protected readonly _players: Player[];
  protected readonly _validator: Validator;
  protected readonly _stateManager: StateManager;
  protected readonly _spellManager: SpellManager;
  protected readonly _bot: Bot;
  protected readonly _settings: GameSettings;

  constructor(settings?: Partial<GameSettings>) {
    this._settings = { ...defaultSettings, ...settings };
    this._players = [new Player(Color.Blue), new Player(Color.Red)];
    let tiles = this.initializeTiles();
    let units = this.initializeUnits();
    this._validator = new Validator(units, tiles);
    this._spellManager = new SpellManager(units, tiles, this._validator);
    this._stateManager = new StateManager(
      units,
      tiles,
      this._validator,
      this._spellManager,
      this._settings
    );
    if (this._settings.enableBot) {
      this._bot = new Bot(this._stateManager);
    }
  }

  public get GameState(): GameStateDTO {
    const gameState = new GameStateDTO();

    gameState.Units = Mapper.MapUnitsToDTO(this._stateManager.Units);
    gameState.Tiles = Mapper.MapTilesToDTO(this._stateManager.Tiles);
    gameState.UnitsAvailableMoves = Mapper.MapMovesToDTO(
      this._validator.GetUnitsAvailableMovesByPlayerColor(
        this._stateManager.PlayerTurnColor
      )
    );
    gameState.UnitsAvailableCasts = Mapper.MapCastsToDTO(
      this._spellManager.GetUnitsAvailableCastsByPlayerColor(
        this._stateManager.PlayerTurnColor
      )
    );
    gameState.Moves = [];
    gameState.PlayerTurnColor = this._stateManager.PlayerTurnColor;
    gameState.GameState = this._stateManager.State;
    return gameState;
  }

  // public IsCheck(): boolean {
  //   return this._stateManager.IsCheck;
  // }

  // public IsMate(): boolean {
  //   return this._stateManager.IsMate;
  // }

  // public IsStalemate(): boolean {
  //   return this._stateManager.IsStaleMate;
  // }

  // public Is50MoveRule(): boolean {
  //   return this._stateManager.Is50MoveRule;
  // }

  // public IsInsufficientMaterial(): boolean {
  //   return this._stateManager.Units.filter((u) => !u.isCaptured).every(
  //     (u) => u instanceof Princess
  //   );
  // }

  public GetBestMove(depth: number): BotMove {
    return this._bot.GetBestMove(depth);
  }

  public TryMoveUnit(selectedUnitId: string, tileId: string): MoveUnitResult {
    return this._stateManager.TryMoveUnit(
      this.getGameObjectById(selectedUnitId) as Unit,
      this.getGameObjectById(tileId) as Tile
    );
  }

  public TryCaptureUnit(
    selectedUnitId: string,
    capturingUnitId: string
  ): CaptureUnitResult {
    return this._stateManager.TryTakeUnit(
      this.getGameObjectById(selectedUnitId) as Unit,
      this.getGameObjectById(capturingUnitId) as Unit
    );
  }

  public TryEnPassantUnit(
    peasantId: string,
    capturingPeasantId: string
  ): EnPassantResult {
    return this._stateManager.TryEnPassant(
      this.getGameObjectById(peasantId) as Peasant,
      this.getGameObjectById(capturingPeasantId) as Peasant
    );
  }

  public TryCastingSpell(
    castingUnitId: string,
    targetUnitId: string
  ): CastSpellResult | CastNotValidResult {
    return this._stateManager.TryCastingSpell(
      this.getGameObjectById(castingUnitId) as Unit,
      this.getGameObjectById(targetUnitId) as Unit
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

  // public get Spells(): Map<Unit, ISpell> {
  //   return this._spellManager.Spells;
  // }

  // public get Tiles(): Tile[][] {
  //   return this._stateManager.Tiles;
  // }

  // public get Moves(): Move[] {
  //   return [] as Move[];
  // }

  // public get Units(): Unit[] {
  //   return this._stateManager.Units;
  // }

  // public get UnitsAvailableMoves(): Map<Unit, AvailableMoves> {
  //   return this._validator.GetUnitsAvailableMovesByPlayerColor(
  //     this._stateManager.PlayerTurnColor
  //   );
  // }

  // public get UnitsAvailableCasts(): Map<Unit, AvailableCasts> {
  //   return this._spellManager.GetUnitsAvailableCastsByPlayerColor(
  //     this._stateManager.PlayerTurnColor
  //   );
  // }

  private getGameObjectById(id: string): GameObject {
    if (id.includes("unit")) {
      return this._stateManager.GetUnitById(id);
    }

    if (id.includes("tile")) {
      return this._stateManager.GetTileById(id);
    }

    return null;
  }
}
