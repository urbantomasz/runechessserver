import { boolean } from "@colyseus/schema/lib/encoding/decode";
import { CaptureCommand, MoveCommand, SpellCommand } from "./Commands";
import { Color, CommandType, Spell } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { StateManager } from "./StateManager";
import { King, Knight, Mage, Peasant, Priest, Princess, Rogue, Unit } from "./Unit";
import { Move } from "./Move";
import { Tile } from "./Tile";

export class Bot {
  private _game: Game;
  private _stateManager: StateManager;
  private _spellManager: SpellManager;
  /**
 *
 */
    constructor(game: Game, stateManager: StateManager, spellManager: SpellManager) {
        this._stateManager = stateManager;
        this._spellManager = spellManager;
        this._game = game;
    }

    // public GetBestMove(): BotMove{
    //   return this.getValuedBotMoves().pop();
    // }

    public GetBestMove(depth: number): BotMove {
      return this.getValuedBotMoves(depth).pop();
    }

    private getValuedBotMoves(depth: number, maximizingPlayer: boolean = true, alpha: number = -Infinity, beta: number = Infinity): BotMove[] {
      if (depth === 0) {
        return this.evaluateCurrentState();
      }
  
      let movesValuedArray: Array<BotMove> = this.evaluateCurrentState();
      let bestMove: BotMove = null;
  
      for (const move of movesValuedArray) {
        let command;
        if(move.command === CommandType.Move){
            command = new MoveCommand(move.unit, move.target as Tile, this._game.Units);
          }
          if(move.command === CommandType.Capture){
            command = new CaptureCommand(move.unit, move.target as Unit, this._game.Units, this._game.Tiles);
          }
          if(move.command === CommandType.Cast){
            command = new SpellCommand(move.unit, move.target, this._game.Spells, this._game.Tiles, this._spellManager);
          }
        command.Execute();
        const moveValue = this.getValuedBotMoves(depth - 1, !maximizingPlayer, alpha, beta).pop().moveValue;
        command.Undo();
  
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
          let moveValue = this.valueState(this._game.Units, unit.color);
          moveCommand.Undo();
          movesValuedArray.push({unit: unit, target: tile, command: CommandType.Move, moveValue: moveValue});
        })

        moves.Units.forEach(enemyUnit =>{
          let captureCommand = new CaptureCommand(unit, enemyUnit, this._game.Units, this._game.Tiles);
          captureCommand.Execute();
          let moveValue = this.valueState(this._game.Units, unit.color);
          captureCommand.Undo();
          movesValuedArray.push({unit: unit, target: enemyUnit, command: CommandType.Capture, moveValue: moveValue});
        })

        })

      this._game.UnitsAvailableCasts.forEach((casts, unit) =>{
        casts.Targets.forEach(target =>{
          let spellCommand = new SpellCommand(unit, target, this._game.Spells, this._game.Tiles, this._spellManager);
          spellCommand.Execute();
          let moveValue = this.valueState(this._game.Units, unit.color);
          spellCommand.Undo();
          movesValuedArray.push({unit: unit, target: target, command: CommandType.Cast, moveValue: moveValue});
        })
      })
      
      movesValuedArray.sort((a,b) => b.moveValue - a.moveValue);

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


    // public playMove(){
    //     unitMovesAvailable.Tiles.forEach(tile => {
    //         unit.row = tile.row
    //         unit.column = tile.column
    //         let availableMovesAfterMove = this.GetUnitsAvailableMoves(this._units, this._tiles, true);
    //         for(const [unit, moves] of availableMovesAfterMove){
    //           if(unit.color === princess.color) continue;
    //           if(moves.Units.includes(princess)){
    //             tilesToRemove.push(tile);
    //             break;
    //           }
    //         }
    //         unit.row = unitStartingRow;
    //         unit.column = unitStartingColumn;
    //       });
        
    //       unitMovesAvailable.Units.forEach(enemyUnit => {
    //         unit.row = enemyUnit.row
    //         unit.column = enemyUnit.column
    //         enemyUnit.isCaptured = true;
    //         const lastCapturedUnitCopy = this._tiles[enemyUnit.row][enemyUnit.column].lastCapturedUnit;
    //         this._tiles[enemyUnit.row][enemyUnit.column].lastCapturedUnit = enemyUnit;
    //         let availableMovesAfterTake = this.GetUnitsAvailableMoves(this._units, this._tiles, true);
    //         for(const [unit, moves] of availableMovesAfterTake){
    //           if(unit.color === princess.color) continue;
    //           if(moves.Units.includes(princess)){
    //             unitsToRemove.push(enemyUnit);
    //             break;
    //           }
    //         }
  
    //         this._tiles[enemyUnit.row][enemyUnit.column].lastCapturedUnit = lastCapturedUnitCopy;
    //         enemyUnit.isCaptured = false;
    //         unit.row = unitStartingRow;
    //         unit.column = unitStartingColumn;
    //       });
    // }


        // public GetBestMoveRecursive(depth: number): number{

    //   if(depth === 0){
    //     let value = this.valueState(this._game.Units, this._game.GetPlayerTurnColor());
    //     return value;
    //   }

    //   let valuedMoves = this.getValuedBotMoves();
    //   valuedMoves.forEach(move =>{
    //     let command;
    //     if(move.command === CommandType.Move){
    //       command = new MoveCommand(move.unit, move.target as Tile, this._game.Units);
    //     }
    //     if(move.command === CommandType.Capture){
    //       command = new CaptureCommand(move.unit, move.target as Unit, this._game.Units, this._game.Tiles);
    //     }
    //     if(move.command === CommandType.Cast){
    //       command = new SpellCommand(move.unit, move.target, this._game.Spells, this._game.Tiles, this._spellManager);
    //     }
    //     command.Execute();
    //     this.GetBestMoveRecursive(depth - 1);
    //     command.Undo();
    //   })
    // }