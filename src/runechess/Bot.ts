import { Color } from "./Enums";
import { Game } from "./Game";
import { King, Knight, Mage, Peasant, Priest, Princess, Rogue, Unit } from "./Unit";

export class Bot {
  private _game: Game;
  /**
 *
 */
    constructor(game: Game) {
        this._game = game;
    }

    public GetBestMove(){

    }



    private ValueState(units: Unit[], color: Color){
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