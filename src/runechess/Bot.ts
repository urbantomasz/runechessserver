import { CaptureCommand, ICommand, TurnFinishedCommand } from "./Commands";
import { Color } from "./Enums";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { StateManager } from "./StateManager";
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

export class Bot {
  private _stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this._stateManager = stateManager;
  }

  public GetBestMove(depth: number): BotMove {
    let movesValuedArray: Array<BotMove> = this.evaluateCurrentState();

    if (movesValuedArray.length === 0) {
      return undefined;
    }

    var highestValue = Math.max(...movesValuedArray.map((x) => x.MoveValue));

    var randomBestMove = movesValuedArray
      .filter((x) => x.MoveValue === highestValue)
      .sort(() => Math.random() - 0.5)
      .pop();

    return randomBestMove;
  }

  private evaluateCurrentState(): BotMove[] {
    let movesValuedArray: Array<BotMove> = new Array<BotMove>();
    let playerColor: Color = this._stateManager.PlayerTurnColor;
    this._stateManager.GetAllPossibleMoves().forEach((command) => {
      command.Execute();
      let moveValue = this.valueState(this._stateManager.Units, playerColor);
      command.Undo();
      movesValuedArray.push({
        UnitId: command.UnitId,
        TargetId: command.TargetId,
        Command: command,
        MoveValue: moveValue,
      });
    });

    return movesValuedArray;
  }

  private valueState(units: Unit[], currentPlayerColor: Color): number {
    let stateValue: number = 0;
    units.forEach((unit) => {
      if (unit.isCaptured) return;
      let unitValue: number;
      if (unit instanceof Peasant) {
        unitValue = 1;
      } else if (unit instanceof King) {
        unitValue = 10;
      } else if (unit instanceof Princess) {
        unitValue = 100;
      } else if (unit instanceof Knight) {
        unitValue = 3;
      } else if (unit instanceof Priest) {
        unitValue = 2;
      } else if (unit instanceof Mage) {
        unitValue = 5;
      } else if (unit instanceof Rogue) {
        unitValue = 3;
      }
      if (!unit.usedSpell) {
        unitValue++;
      }
      if (
        this._stateManager
          .GetAllPossibleMoves()
          .some((t) => t instanceof CaptureCommand && t.TargetId == unit.id)
      ) {
        unitValue = 1;
      }
      stateValue += unitValue * (unit.color === currentPlayerColor ? 1 : -1);
    });
    if (this._stateManager.IsCheck) {
      stateValue += 100;
    }
    if (this._stateManager.IsMate) {
      stateValue += 1000;
    }
    return stateValue;
  }
}

export interface BotMove {
  UnitId: string;
  TargetId: string;
  Command: ICommand;
  MoveValue: number;
}
