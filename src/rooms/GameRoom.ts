import { Room, Client } from "colyseus";
import { Color, GameState } from "../runechess/Enums";
import { Game } from "../runechess/Game";
import { IGame } from "../runechess/IGame";
import {
  CaptureCommand,
  MoveCommand,
  SpellCommand,
} from "../runechess/Commands";
import { GameStateDTO, TileDTO, UnitDTO } from "../runechess/DTOs";
import { StringNullableChain } from "lodash";

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
    try {
      let playerTurnColor = this._game.State.PlayerTurnColor;

      if (this._game.State.GameState == GameState.CheckMate) {
        this.endGame(playerTurnColor === 0 ? 1 : 0, "Mate");
      }

      if (this._game.State.GameState == GameState.Stalemate) {
        this.endGame(null, "Stalemate");
      }

      if (this._game.State.GameState == GameState.MaxMoveRule) {
        this.endGame(null, "50 Move Rule");
      }

      if (this._game.State.GameState == GameState.InsufficientMaterial) {
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
    } catch (error) {
      console.log(error);
      this.endGame(null, "Match has been cancelled. (Server Internal Error)");
    }
  }

  private getGameStateData(): GameRoomGameState {

    const { UnitsAvailableCasts, UnitsAvailableMoves, ...restOfState } = this._game.State;

    const gameStateObject: GameRoomGameState = {
      ...restOfState,  // This spread operation copies all properties from restOfState to gameStateObject
      UnitsAvailableCasts: JSON.stringify(UnitsAvailableCasts),
      UnitsAvailableMoves: JSON.stringify(UnitsAvailableMoves),
      BluePlayerRemainingTime: this._bluePlayerRemainingTime,
      RedPlayerRemainingTime: this._redPlayerRemainingTime,
      BluePlayerName: this._bluePlayerName,
      RedPlayerName: this._redPlayerName,
      IsPlayground: this._isPlayground,
    };

    return gameStateObject;
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

    this.onMessage("TryEnPassant", (client, data: TryCaptureUnitData) => {
      console.log(data);
      this.tryEnPassant(data);
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
    var moveUnitResult = this._game.TryMoveUnit(data.selectedUnit, data.tile);
    if (moveUnitResult !== null) {
      this.updateState();
      this.broadcast("UnitMoved", moveUnitResult);
    }
  }

  private tryCaptureUnit(data: TryCaptureUnitData) {
    var captureUnitResult = this._game.TryCaptureUnit(
      data.selectedUnit,
      data.capturingUnit
    );
    if (captureUnitResult !== null) {
      this.updateState();
      this.broadcast("UnitCaptured", captureUnitResult);
    }
  }

  private tryEnPassant(data: TryCaptureUnitData) {
    var enPassantResult = this._game.TryEnPassantUnit(
      data.selectedUnit,
      data.capturingUnit
    );
    console.log(enPassantResult);
    if (enPassantResult !== null) {
      this.updateState();
      this.broadcast("EnPassant", enPassantResult);
    }
  }

  private tryCastingSpell(data: TryCastingSpellData) {
    const result = this._game.TryCastingSpell(
      data.castingUnit,
      data.targetingObject
    );

    if (result) {
      this.broadcast("SpellCasted", result);
    }

    this.updateState();
  }
  endGame = (winnerColor: number, reason: string) => {
    var winnerName = "";
    var winnerFlag = winnerColor === Color.Blue ? true : false;
    if (winnerColor === 0) {
      winnerName = this._bluePlayerName;
    } else if (winnerColor === 1) {
      winnerName = this._redPlayerName;
    } else {
      winnerFlag = null;
    }

    this.broadcast("GameOver", {
      winnerColor: winnerColor,
      reason: reason,
      winnerName: winnerName,
      bluePlayerName: this._bluePlayerName,
      redPlayerName: this._redPlayerName,
    });

    // dbConnection.insertMatch(
    //   new Date(Date.now()),
    //   this._bluePlayerId,
    //   this._redPlayerId,
    //   winnerFlag
    // );

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

export interface GameRoomGameState{
  Units: UnitDTO[];
  Tiles: TileDTO[];
  Moves: string[];
  PlayerTurnColor: Color;
  GameState: GameState;
  UnitsAvailableCasts: string;
  UnitsAvailableMoves: string;
  BluePlayerRemainingTime: number;
  RedPlayerRemainingTime: number;
  BluePlayerName: string;
  RedPlayerName: string;
  IsPlayground: boolean;
}
