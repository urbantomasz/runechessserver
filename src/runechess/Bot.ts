import { CaptureCommand, MoveCommand, SpellCommand } from "./Commands";
import { Color, CommandType } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { StateManager } from "./StateManager";
import { King, Knight, Mage, Peasant, Priest, Princess, Rogue, Unit } from "./Unit";

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



    public GetBestMove(){
      let movesValuedMap: Map<number, {unit: Unit, target: GameObject, command: CommandType}>

      this._game.UnitsAvailableMoves.forEach((moves, unit) => {

        moves.Tiles.forEach(tile =>{
          let moveCommand = new MoveCommand(unit, tile, this._game.Units);
          moveCommand.Execute();
          let moveValue = this.valueState(this._game.Units, unit.color);
          moveCommand.Undo();
          movesValuedMap.set(moveValue, {unit: unit, target: tile, command: CommandType.Move});
        })

        moves.Units.forEach(enemyUnit =>{
          let captureCommand = new CaptureCommand(unit, enemyUnit, this._game.Units, this._game.Tiles);
          captureCommand.Execute();
          let moveValue = this.valueState(this._game.Units, unit.color);
          captureCommand.Undo();
          movesValuedMap.set(moveValue, {unit: unit, target: enemyUnit, command: CommandType.Capture});
        })

        })

      this._game.UnitsAvailableCasts.forEach((casts, unit) =>{
        casts.Targets.forEach(target =>{
          let spellCommand = new SpellCommand(unit, target, this._game.Spells, this._game.Tiles, this._spellManager);
          spellCommand.Execute();
          let moveValue = this.valueState(this._game.Units, unit.color);
          spellCommand.Undo();
          movesValuedMap.set(moveValue, {unit: unit, target: target, command: CommandType.Cast});
        })
      })
      


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
        stateValue += unitValue * unit.color === color ? 1 : -1;
      });
      return stateValue;
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
}