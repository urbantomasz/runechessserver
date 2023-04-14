import { CaptureCommand, MoveCommand, SpellCommand, TurnFinishedCommand } from "./Commands";
import { Color, CommandType, Spell } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { StateManager } from "./StateManager";
import { King, Knight, Mage, Peasant, Priest, Princess, Rogue, Unit } from "./Unit";
import { Tile } from "./Tile";
import { Validator } from "./Validator";

export class Bot {
  private _game: Game;
  private _stateManager: StateManager;
  private _spellManager: SpellManager;
  private _validator: Validator;
  /**
 *
 */
    constructor(game: Game, stateManager: StateManager, spellManager: SpellManager, validator: Validator) {
        this._stateManager = stateManager;
        this._spellManager = spellManager;
        this._validator = validator;
        this._game = game;
    }

    public GetBestMove(depth: number): BotMove {
      return this.getValuedBotMoves(depth).pop();
    }

    private getValuedBotMoves(depth: number, maximizingPlayer: boolean = true, alpha: number = -Infinity, beta: number = Infinity): BotMove[] {
      
      let movesValuedArray: Array<BotMove> = this.evaluateCurrentState();
      if (depth === 0) {
        var highestValue = Math.max(...movesValuedArray.map(x => x.moveValue));
        var randomBestMove = movesValuedArray
        .filter(x => x.moveValue === highestValue)
        .sort(() => Math.random() - 0.5)
        .pop();
        return [randomBestMove]
      }
  
     
      let bestMove: BotMove = movesValuedArray[0];
  
      for (const move of movesValuedArray) {
        let actionCommand;
        let turnFinishedCommand = new TurnFinishedCommand(this._stateManager, this._spellManager, this._validator)
        if(move.command === CommandType.Move){
          actionCommand = new MoveCommand(move.unit, move.target as Tile, this._game.Units);
        }
        else if(move.command === CommandType.Capture){
            actionCommand = new CaptureCommand(move.unit, move.target as Unit, this._game.Units, this._game.Tiles);
        }
        else if(move.command === CommandType.Cast){
            actionCommand = new SpellCommand(move.unit, move.target, this._game.Spells, this._spellManager);
        }
        actionCommand.Execute();
        turnFinishedCommand.Execute();
        const moveValue = this.getValuedBotMoves(depth - 1, !maximizingPlayer, alpha, beta).pop().moveValue;
        actionCommand.Undo();
        turnFinishedCommand.Undo();

        const isBetterMove = maximizingPlayer ? moveValue > bestMove.moveValue : moveValue < bestMove.moveValue;
    
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

      this._game.UnitsAvailableMoves.forEach((moves, unit) => {
        moves.Tiles.forEach(tile =>{
          let moveCommand = new MoveCommand(unit, tile, this._game.Units);
          moveCommand.Execute();
          let moveValue = this.valueState(this._game, unit.color);
          moveCommand.Undo();
          movesValuedArray.push({unit: unit, target: tile, command: CommandType.Move, moveValue: moveValue});
        })

        moves.Units.forEach(enemyUnit =>{
          let captureCommand = new CaptureCommand(unit, enemyUnit, this._game.Units, this._game.Tiles);
          captureCommand.Execute();
          let moveValue = this.valueState(this._game, unit.color);
          captureCommand.Undo();
          movesValuedArray.push({unit: unit, target: enemyUnit, command: CommandType.Capture, moveValue: moveValue});
        })

        })

      this._game.UnitsAvailableCasts.forEach((casts, unit) =>{
        casts.Targets.forEach(target =>{
          let spellCommand = new SpellCommand(unit, target, this._game.Spells, this._spellManager);
          spellCommand.Execute();
          let moveValue = this.valueState(this._game, unit.color);
          spellCommand.Undo();
          movesValuedArray.push({unit: unit, target: target, command: CommandType.Cast, moveValue: moveValue});
        })
      })
      
      return movesValuedArray;
    }

    private valueState(game: Game, color: Color): number{
      let stateValue: number = 0;
      game.Units.forEach(unit => {
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
        if(game.IsMate()){
          stateValue += 1000;
        }
        stateValue += unitValue * (unit.color === color ? 1 : -1);
      });
      return stateValue;
    }
    

}

export interface BotMove{
  unit: Unit;
  target: GameObject;
  command: CommandType, 
  moveValue: number
}