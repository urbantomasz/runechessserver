import { Room, Client } from "colyseus";
import { Color, CommandType } from "../runechess/Enums";
import { Game } from "../runechess/Game";
import { IGame } from "../runechess/IGame";
import { PowerStomp } from "../runechess/Spell";
import { Tile } from "../runechess/Tile";
import { Knight, Princess, Rogue, Unit } from "../runechess/Unit";
import { Position } from "../runechess/Position";
import {
  UnitDTO,
  TileDTO,
  AvailableMovesDTO,
  AvailableCastsDTO,
} from "../runechess/DTOs";
import { AvailableMoves } from "../runechess/Validator";
import { AvailableCasts } from "../runechess/SpellManager";
import {
  CaptureCommand,
  MoveCommand,
  SpellCommand,
} from "../runechess/Commands";

const dbConnection = require("./../dbConnection");

export class GameRoom extends Room {
  private _game: IGame;
  private _isGameOver: boolean = false;
  private _bluePlayerName: string = null;
  private _redPlayerName: string = null;
  private _bluePlayerId: number = null;
  private _redPlayerId: number = null;
  private _isPlayground: boolean = false;
  private _redPlayerRemainingTime = 10 * 60 * 1000;
  private _bluePlayerRemainingTime = 10 * 60 * 1000;
  private _isVersusBot: any;
  private _idMapping: Map<string, number> = new Map<string, number>();
  /**
   *
   */
  constructor() {
    super();
    this._game = new Game();
  }

  private updateState() {
    let playerTurnColor = this._game.GetPlayerTurnColor();

    if (this._game.IsMate()) {
      this.endGame(playerTurnColor === 0 ? 1 : 0, "Mate");
    }

    if (this._game.IsStalemate()) {
      this.endGame(null, "Stalemate");
    }

    if (this._game.Is50MoveRule()) {
      this.endGame(null, "50 Move Rule");
    }

    if (this._game.IsInsufficientMaterial()) {
      this.endGame(null, "Insufficient Material");
    }

    if (this._isGameOver) return;

    if (this._isVersusBot && playerTurnColor !== Color.Blue) {
      setTimeout(() => this.makeBotMove(), 1000);
    }

    // if (this._isVersusBot && playerTurnColor !== Color.Red) {
    //   setTimeout(() => this.makeBotMove(), 100);
    // }

    this.broadcast("StateChange", this.getGameStateData());
  }

  private getGameStateData(): any {
    return {
      Units: this._game.Units.map((x) => new UnitDTO(x)),
      Tiles: this._game.Tiles.flat().map((x) => new TileDTO(x)),
      AvailableMoves: JSON.stringify(
        Array.from(mapMovesToDTO(this._game.UnitsAvailableMoves).entries())
      ),
      AvailableCasts: JSON.stringify(
        Array.from(mapCastsToDTO(this._game.UnitsAvailableCasts).entries())
      ),
      IsCheck: this._game.IsCheck(),
      IsMate: this._game.IsMate(),
      Moves: this._game.Moves.map((x) => x.toNotationString()),
      BluePlayerRemainingTime: this._bluePlayerRemainingTime,
      RedPlayerRemainingTime: this._redPlayerRemainingTime,
      BluePlayerName: this._bluePlayerName,
      RedPlayerName: this._redPlayerName,
      PlayerTurnColor: this._game.GetPlayerTurnColor(),
    };
  }

  private makeBotMove() {
    const bestMove = this._game.GetBestMove(0);

    if (bestMove !== undefined) {
      if (bestMove.Command instanceof MoveCommand) {
        this.tryMoveUnit({
          selectedUnit: bestMove.UnitId,
          tile: bestMove.TargetId,
        });
      }
      if (bestMove.Command instanceof CaptureCommand) {
        this.tryCaptureUnit({
          selectedUnit: bestMove.UnitId,
          capturingUnit: bestMove.TargetId,
        });
      }
      if (bestMove.Command instanceof SpellCommand) {
        this.tryCastingSpell({
          castingUnit: bestMove.UnitId,
          targetingObject: bestMove.TargetId,
        });
      }
    }
  }

  onJoin(client: Client, options?: any, auth?: any): void | Promise<any> {
    this._idMapping.set(client.id, options.playerId);

    if (this._bluePlayerId === null) {
      this._bluePlayerId = options.playerId;
      this._bluePlayerName = options.name;
    } else if (this._redPlayerId === null) {
      this._redPlayerId = options.playerId;
      this._redPlayerName = options.name;
    }

    client.send("StateChange", this.getGameStateData());

    if (
      this.clients.length == 2 &&
      this._bluePlayerId !== null &&
      this._redPlayerId !== null
    ) {
      this.broadcast("GameStart");
    } else if (this._isVersusBot) {
      this._redPlayerId = 3;
      this._redPlayerName = "Easy Bot";
      this.broadcast("GameStart");
    } else if (this._isPlayground) {
      this.broadcast("GameStart");
    }
  }

  onCreate(options: any) {
    if (options.hasOwnProperty("isPlayground")) {
      this.autoDispose = true;
    } else {
      this.autoDispose = false;
    }

    this.maxClients = 2;

    if (
      options.hasOwnProperty("isPlayground") ||
      options.hasOwnProperty("isVersusBot")
    ) {
      if (options.isPlayground || options.isVersusBot) {
        this.maxClients = 1;
        this.setPrivate();
      }
      this._isPlayground = options.isPlayground;
      this._isVersusBot = options.isVersusBot;
    }

    // start the clock ticking
    this.clock.start();

    this.onMessage("TryMoveUnit", (client, data: TryMoveUnitData) => {
      this.tryMoveUnit(data);
    });

    this.onMessage("TryCaptureUnit", (client, data: TryCaptureUnitData) => {
      this.tryCaptureUnit(data);
    });

    this.onMessage("TryCastingSpell", (client, data: TryCastingSpellData) => {
      this.tryCastingSpell(data);
    });
  }

  async onLeave(client: Client, consented: boolean) {
    if (!this._isGameOver && !this._isPlayground) {
      if (consented) {
        let leavingPlayerId = this._idMapping.get(client.id);
        let leavingPlayerColor =
          this._bluePlayerId === leavingPlayerId ? Color.Blue : Color.Red;
        let winningPlayerColor =
          leavingPlayerColor === Color.Blue ? Color.Red : Color.Blue;
        this.endGame(winningPlayerColor, "Player left...");
      } else {
      }
    }
  }

  private tryMoveUnit(data: TryMoveUnitData) {
    //if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
    var moveUnitResult = this._game.TryMoveUnit(data.selectedUnit, data.tile);
    if (moveUnitResult !== null) {
      this.updateState();
      this.broadcast("UnitMoved", moveUnitResult);
    }
  }

  private tryCaptureUnit(data: TryCaptureUnitData) {
    //if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;
    var captureUnitResult = this._game.TryCaptureUnit(
      data.selectedUnit,
      data.capturingUnit
    );
    if (captureUnitResult !== null) {
      this.updateState();
      this.broadcast("UnitCaptured", captureUnitResult);
    }
  }

  private tryCastingSpell(data: TryCastingSpellData) {
    //console.log("try casting spell game")
    //if(!this._isPlayground && !(client.id === (this._game.GetPlayerTurnColor() === Color.Blue ? this._bluePlayerId : this._redPlayerId))) return;

    const castingUnit = this._game.GetGameObjectById(data.castingUnit) as Unit;

    if (castingUnit instanceof Knight) {
      const unitSpell = this._game.Spells.get(castingUnit) as PowerStomp;
      const targetingTile = this._game.GetGameObjectById(
        data.targetingObject
      ) as Tile;
      let unitTileMap = new Map<string, string>();
      unitSpell._tilesBehindMap.get(targetingTile).forEach((v, k) => {
        unitTileMap.set(k.id, Tile.CreateTileId(v.row, v.column));
      });
      let unitTileMapStringifed = JSON.stringify(
        Array.from(unitTileMap.entries())
      );
      if (this._game.TryCastingSpell(data.castingUnit, data.targetingObject)) {
        this.broadcast("SpellCasted", {
          castingUnit: data.castingUnit,
          targetingTile: data.targetingObject,
          unitTileMap: unitTileMapStringifed,
        });
      }
    } else if (castingUnit instanceof Princess) {
      if (this._game.TryCastingSpell(data.castingUnit, data.targetingObject)) {
        const castingUnit = this._game.GetGameObjectById(data.castingUnit);
        const targetingUnit = this._game.GetGameObjectById(
          data.targetingObject
        );
        this.broadcast("SpellCasted", {
          castingUnit: data.castingUnit,
          castingUnitNewTile: Tile.CreateTileId(
            castingUnit.row,
            castingUnit.column
          ),
          targetingUnit: data.targetingObject,
          targetingUnitNewTile: Tile.CreateTileId(
            targetingUnit.row,
            targetingUnit.column
          ),
        });
      }
    } else if (castingUnit instanceof Rogue) {
      if (this._game.TryCastingSpell(data.castingUnit, data.targetingObject)) {
        const castingUnit = this._game.GetGameObjectById(data.castingUnit);
        const targetingUnit = this._game.GetGameObjectById(
          data.targetingObject
        );
        this.broadcast("SpellCasted", {
          castingUnit: data.castingUnit,
          castingUnitNewTile: Tile.CreateTileId(
            castingUnit.row,
            castingUnit.column
          ),
          targetingUnit: data.targetingObject,
          targetingUnitNewTile: Tile.CreateTileId(
            targetingUnit.row,
            targetingUnit.column
          ),
        });
      }
    } else {
      if (this._game.TryCastingSpell(data.castingUnit, data.targetingObject)) {
        this.broadcast("SpellCasted", {
          castingUnit: data.castingUnit,
          targetingUnit: data.targetingObject,
        });
      }
    }
    this.updateState();
  }

  endGame = (winnerColor: number, reason: string) => {
    this.broadcast("GameOver", {
      winnerColor,
      reason,
    });

    dbConnection.insertMatch(
      new Date(Date.now()),
      this._bluePlayerId,
      this._redPlayerId,
      winnerColor === Color.Blue ? true : false
    );

    this._isGameOver = true; // set game over flag to true

    this.disconnect();
  };
}

export interface TryMoveUnitData {
  selectedUnit: string;
  tile: string;
}

export interface TryCaptureUnitData {
  selectedUnit: string;
  capturingUnit: string;
}

export interface TryCastingSpellData {
  castingUnit: string;
  targetingObject: string;
}

function mapMovesToDTO(
  availableMovesMap: Map<Unit, AvailableMoves>
): Map<string, AvailableMovesDTO> {
  const availableMovesDTO = new Map<string, AvailableMovesDTO>();

  for (const [key, value] of availableMovesMap) {
    let availableMoves = new AvailableMovesDTO();
    availableMoves.Tiles = value.Tiles.map((x) => x.id);
    availableMoves.Units = value.Units.map((x) => x.id);
    availableMovesDTO.set(key.id, availableMoves);
  }

  return availableMovesDTO;
}

function mapCastsToDTO(
  availableCastsMap: Map<Unit, AvailableCasts>
): Map<string, AvailableCastsDTO> {
  const availableCastsDTO = new Map<string, AvailableCastsDTO>();

  for (const [key, value] of availableCastsMap) {
    let availableCasts = new AvailableCastsDTO();
    availableCasts.Targets = value.Targets.map((x) => x.id);
    availableCastsDTO.set(key.id, availableCasts);
  }

  return availableCastsDTO;
}
