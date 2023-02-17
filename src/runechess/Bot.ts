export class Bot {
/**
 *
 */
    constructor() {
        
        
    }

    public GetBestMove(){

    }
    
    public playMove(){
        unitMovesAvailable.Tiles.forEach(tile => {
            unit.row = tile.row
            unit.column = tile.column
            let availableMovesAfterMove = this.GetUnitsAvailableMoves(this._units, this._tiles, true);
            for(const [unit, moves] of availableMovesAfterMove){
              if(unit.color === princess.color) continue;
              if(moves.Units.includes(princess)){
                tilesToRemove.push(tile);
                break;
              }
            }
            unit.row = unitStartingRow;
            unit.column = unitStartingColumn;
          });
        
          unitMovesAvailable.Units.forEach(enemyUnit => {
            unit.row = enemyUnit.row
            unit.column = enemyUnit.column
            enemyUnit.isCaptured = true;
            const lastCapturedUnitCopy = this._tiles[enemyUnit.row][enemyUnit.column].lastCapturedUnit;
            this._tiles[enemyUnit.row][enemyUnit.column].lastCapturedUnit = enemyUnit;
            let availableMovesAfterTake = this.GetUnitsAvailableMoves(this._units, this._tiles, true);
            for(const [unit, moves] of availableMovesAfterTake){
              if(unit.color === princess.color) continue;
              if(moves.Units.includes(princess)){
                unitsToRemove.push(enemyUnit);
                break;
              }
            }
  
            this._tiles[enemyUnit.row][enemyUnit.column].lastCapturedUnit = lastCapturedUnitCopy;
            enemyUnit.isCaptured = false;
            unit.row = unitStartingRow;
            unit.column = unitStartingColumn;
          });
    }
}