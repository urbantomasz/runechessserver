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
} from "../../../runechessshared/DTOs";
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
  private _bluePlayerName: string = null;
  private _redPlayerName: string = null;
  private _bluePlayerId: string = null;
  private _redPlayerId: string = null;
  private _isPlayground: boolean = false;
  private _lastMoveTimeStamp: number;
  private _isFirstMove: boolean = true;
  private _redPlayerRemainingTime = 10 * 60 * 1000;
  private _bluePlayerRemainingTime = 10 * 60 * 1000;
  /**
   *
   */
  constructor() {
    super();
    this._game = new Game();
  }

  private async updateState() {
    let currentMoveTimeStamp = Date.now();
    let playerTurnColor = this._game.GetPlayerTurnColor();
    if (this._isFirstMove) {
      this._isFirstMove = false;
    } else {
      if (playerTurnColor === Color.Blue) {
        this._bluePlayerRemainingTime =
          this._bluePlayerRemainingTime -
          (currentMoveTimeStamp - this._lastMoveTimeStamp);
      }

      if (playerTurnColor === Color.Red) {
        this._redPlayerRemainingTime =
          this._redPlayerRemainingTime -
          (currentMoveTimeStamp - this._lastMoveTimeStamp);
      }
    }

    this._lastMoveTimeStamp = currentMoveTimeStamp;

    if (
      this._game.IsMate() ||
      this._game.Is50MoveRule() ||
      this._game.IsStaleMate()
    ) {
      this.broadcast("GameOver", {
        winnerColor: playerTurnColor === 0 ? 1 : 0,
      });

      dbConnection.insertMatch(
        new Date(Date.now()),
        this._bluePlayerId,
        this._redPlayerId,
        playerTurnColor === 0 ? 1 : 0
      );

      this.disconnect();
    } else {
      if (this._isPlayground && playerTurnColor !== Color.Blue) {
        setTimeout(() => this.makeBotMove(), 1000);
      }

      this.broadcast("StateChange", this.getGameStateData());
    }
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

  onJoin(client: Client, options?: any, auth?: any): void | Promise<any> {
    console.log(client.id + " joined to gameroom");
    console.log(options);
    if (this._bluePlayerId === null) {
      this._bluePlayerId = client.id;
      this._bluePlayerName = options.name;
    } else if (this._redPlayerId === null) {
      this._redPlayerId = client.id;
      this._redPlayerName = options.name;
    }

    client.send("StateChange", this.getGameStateData());

    if (
      this.clients.length == 2 &&
      this._bluePlayerId !== null &&
      this._redPlayerId !== null
    ) {
      this.broadcast("GameStart");
    } else if (this._isPlayground) {
      this._redPlayerId = "easyBot";
      this._redPlayerName = "Easy Bot";
      this.broadcast("GameStart");
    }
  }

  onCreate(options: any) {
    // this.autoDispose = false;

    this.maxClients = 2;

    if (options.hasOwnProperty("isPlayground")) {
      if (options.isPlayground) {
        this.maxClients = 1;
        this.setPrivate();
      }
      this._isPlayground = options.isPlayground;
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

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    console.log("OnLeave method triggered.");

    let leavingPlayerColor: Color;
    if (client.id === this._bluePlayerId) {
      leavingPlayerColor = Color.Blue;
    }
    if (client.id === this._redPlayerId) {
      leavingPlayerColor = Color.Red;
    }

    console.log("Leaving Player Color: ", leavingPlayerColor);

    const isGameOver =
      this._game.IsMate() ||
      this._game.Is50MoveRule() ||
      this._game.IsStaleMate();

    console.log("Is Game Over: ", isGameOver);

    // If a player has left and the game is not already over, declare the other player as the winner.
    if (!isGameOver) {
      let winnerColor =
        leavingPlayerColor === Color.Blue ? Color.Red : Color.Blue;

      console.log("Winner Color: ", winnerColor);

      // Broadcasting to all clients about the game over and the winner
      this.broadcast("GameOver", {
        winnerColor: winnerColor,
      });

      // Insert the match result into the database
      console.log("BluePlayerId: ", this._bluePlayerId);
      console.log("RedPlayerId: ", this._redPlayerId);
      dbConnection.insertMatch(
        new Date(Date.now()),
        this._bluePlayerId,
        this._redPlayerId,
        winnerColor
      );
      this.disconnect();
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
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
