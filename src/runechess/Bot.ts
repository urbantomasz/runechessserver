import { ICommand, TurnFinishedCommand } from "./Commands";
import { Color } from "./Enums";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { StateManager } from "./StateManager";
import { Tile } from "./Tile";
import { King, Knight, Mage, Peasant, Priest, Princess, Rogue, Unit } from "./Unit";
import { Validator } from "./Validator";

export class Bot {
  private _stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this._stateManager = stateManager;
    }

    public GetBestMove(depth: number): BotMove {
      return this.getValuedBotMoves(depth).pop();
    }

    private getValuedBotMoves(depth: number, maximizingPlayer: boolean = true, alpha: number = -Infinity, beta: number = Infinity): BotMove[] {
      
      let movesValuedArray: Array<BotMove> = this.evaluateCurrentState();

      if (depth === 0) {
        var highestValue = Math.max(...movesValuedArray.map(x => x.MoveValue));
        
        var randomBestMove = movesValuedArray
        .filter(x => x.MoveValue === highestValue)
        .sort(() => Math.random() - 0.5)
   
        return randomBestMove;
      }
  
      let bestMove: BotMove = movesValuedArray[0];
  
      for (const move of movesValuedArray) {
        
        let turnFinishedCommand = this._stateManager.FinishTurnCommand();
     
        move.Command.Execute();
        turnFinishedCommand.Execute();
        const moveValue = this.getValuedBotMoves(depth - 1, !maximizingPlayer, alpha, beta).pop().MoveValue;
        move.Command.Undo();
        turnFinishedCommand.Undo();

        const isBetterMove = maximizingPlayer ? moveValue > bestMove.MoveValue : moveValue < bestMove.MoveValue;
    
        if (isBetterMove) {
          bestMove = move;
        }

        if (maximizingPlayer) {
          if (moveValue > alpha) {
            alpha = moveValue;
            bestMove = move;
          }
        } else {
          if (moveValue < beta) {
            beta = moveValue;
            bestMove = move;
          }
        }
  
        if (alpha >= beta) {
          break;
        }
      }
  
      return [bestMove];
    }


    private evaluateCurrentState(): BotMove[]{
      let movesValuedArray: Array<BotMove> = new Array<BotMove>();
      let playerColor: Color = this._stateManager.PlayerTurnColor;
      this._stateManager.GetAllPossibleMoves().forEach(command =>{
        command.Execute();
        let moveValue = this.valueState(this._stateManager.Units, playerColor);
        command.Undo();
        movesValuedArray.push({UnitId: command.UnitId, TargetId: command.TargetId, Command: command, MoveValue: moveValue});
      })

      return movesValuedArray;
    }

    private valueState(units: Unit[], color: Color): number{
      let stateValue: number = 0;
      units.forEach(unit => {
        if(unit.isCaptured) return;
        let unitValue: number;
        if(unit instanceof Peasant){
          unitValue = 1;
        }
        else if(unit instanceof King){
          unitValue = 10;
        }
        else if(unit instanceof Princess){
          unitValue = 100;
        }
        else if(unit instanceof Knight){
          unitValue = 3;
        }
        else if(unit instanceof Priest){
          unitValue = 2;
        }
        else if(unit instanceof Mage){
          unitValue = 5;
        }
        else if(unit instanceof Rogue){
          unitValue = 3;
        }
        if(!unit.usedSpell){
          unitValue++;
        }
        // if(this._stateManager.IsCheck){
        //   stateValue += 100;
        // }
        // if(this._stateManager.IsMate){
        //   stateValue += 1000;
        // }
        stateValue += unitValue * (unit.color === color ? 1 : -1);
      });
      return stateValue;
    }

}

export interface BotMove{
  UnitId: string;
  TargetId: string;
  Command: ICommand, 
  MoveValue: number
}