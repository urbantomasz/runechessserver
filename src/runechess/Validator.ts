import { Tile } from "./Tile";
import { Princess, Unit } from "./Unit";
import { rotateMatrix90 } from "./Helpers";
import { Game } from "./Game";
import { Color, MoveState, MoveType } from "./Enums";
import { AvailableMovesDTO } from "./DTOs";

export interface AvailableMoves{
    Tiles: Tile[]
    Units: Unit[]
}

export class Validator{
    private readonly _tiles: Tile[][];
    private readonly _units: Unit[];
    //private readonly _unitsAvailableCasts: Map<Unit, AvailableCasts>;
    private _unitsAvailableMoves: Map<Unit, AvailableMoves>;
    private _isCheck: boolean;
    private _isMate: boolean;

    constructor(units: Unit[], tiles: Tile[][]) {
        this._units = units;
        this._tiles = tiles;
        this._isCheck = false;
        this._isMate = false;
        this.UpdateUnitsAvailableMoves();
    }

    public get IsMate(): boolean{
      return this._isMate;
    }

    public get IsCheck(): boolean{
      return this._isCheck;
    }
   
    public get UnitsAvailableMoves(): Map<Unit, AvailableMoves>{
        return this._unitsAvailableMoves;
    }

    public get UnitsAvailableCasts(): Map<Unit, AvailableMoves>{
        return this._unitsAvailableMoves;
    }

    public UpdateUnitsAvailableMoves(): void{
      console.time('updateUnitsAvailableMoves')
      this._unitsAvailableMoves = this.GetUnitsAvailableMoves(this._units, this._tiles);
      this._isCheck = this.checkIfCheck();
      console.time("isMate")
      this._isMate = this.checkIfMate();
      console.timeEnd("isMate")
      console.timeEnd('updateUnitsAvailableMoves')
    }

    private checkIfMate(): boolean{
      if(!this._isCheck) return false;
      let bluePlayerMoves = 0;
      let redPlayersMoves = 0;
      for(const [unit, move] of this._unitsAvailableMoves){
        if(unit.color === Color.Blue && (move.Tiles.length > 0 || move.Units.length > 0)){
          bluePlayerMoves++;
        }
        if(unit.color === Color.Red && (move.Tiles.length > 0 || move.Units.length > 0)){
          redPlayersMoves++;
        }
      }
      return bluePlayerMoves === 0 || redPlayersMoves === 0
    }

    private checkIfCheck(): boolean{
      let isCheck = false;
      for(const [unit, move] of this._unitsAvailableMoves){
        if(move.Units.findIndex(u => u instanceof Princess) >= 0){
          isCheck = true;
          break;
        }
      }
      return isCheck;
    }


    public GetUnitsAvailableMoves(units: Unit[], tiles: Tile[][], omitCheck: boolean = false): Map<Unit, AvailableMoves>{
        let unitsAvailableMoves = new Map<Unit, AvailableMoves>();

        units.forEach(unit =>{
            if(unit.isCaptured){
              return;
            }
            let movesAvailable = this.getUnitAvailableMoves(unit,  units.filter(u => !u.isCaptured), tiles);
            if(!omitCheck){
              this.FilterUnitMovesThatWouldResultInCheck(unit, movesAvailable);
            }
            unitsAvailableMoves.set(unit, movesAvailable);
        })

        return unitsAvailableMoves;
    }

    private getUnitAvailableMoves(unit: Unit, unitsOnBoard: Unit[], tilesOnBoard: Tile[][]): AvailableMoves {
        let movePattern = unit.movePattern;
        let unitsPlacement = this.createUnitsPlacementArray(unitsOnBoard);
        movePattern = rotateMatrix90(movePattern)
        if(unit.color != Color.Blue){
            movePattern = this.rotateMovePattern(movePattern);
        }
        
        const movePatternLength = movePattern.length;
        const movePatternOffset = Math.floor(movePatternLength / 2);
        const x = unit.row - movePatternOffset;
        const y = unit.column - movePatternOffset;
        const xEnd = x + movePatternLength;
        const yEnd = y + movePatternLength;

        for (let i = Math.max(x, 0); i < Math.min(xEnd, Game.BOARD_ROWS); i++) {
          for (let j = Math.max(y, 0); j < Math.min(yEnd, Game.BOARD_COLUMNS); j++) {
            const mpI = i - x;
            const mpJ = j - y;
            this.updateUnitsPlacement(unit, unitsPlacement, movePattern[mpI][mpJ], i, j);
          }
        }

        unitsOnBoard.forEach(_unit => {
            if(unit.color == _unit.color){
                unitsPlacement[_unit.row][_unit.column] = -1;
            }

            if(unit.color != _unit.color &&  unitsPlacement[_unit.row][_unit.column] == 1){
                unitsPlacement[_unit.row][_unit.column] = -1;
            }
        })

        let tilesToMove = new Array<Tile>();
        let unitsToTake = new Array<Unit>();

        for(let i = 0; i < unitsPlacement.length; i++){
            for(let j = 0; j < unitsPlacement.length; j++){

                if(unitsPlacement[i][j] == 0){
                    tilesToMove.push(tilesOnBoard[i][j])
                }

                if(unitsPlacement[i][j] == 2){
                    let unitToTake = unitsOnBoard.find(_unit => _unit.row == i && _unit.column == j)
                    unitsToTake.push(unitToTake);    
                }
            }
        }
        return  {
            Tiles: tilesToMove,
            Units: unitsToTake
        };
    }

     rotateMovePattern(movePattern: number[][]): number[][] {
        for (let i = 0; i < 2; i++) {
          movePattern = rotateMatrix90(movePattern);
        }
        return movePattern;
      }

      createUnitsPlacementArray(units: Unit[]): number[][]{
        let unitsPlacement = Array(Game.BOARD_ROWS).fill(-1);   

        for(let i = 0; i < Game.BOARD_COLUMNS; i++){
            unitsPlacement[i] = Array(Game.BOARD_COLUMNS).fill(-1)
        } 

        units.forEach(u =>{
          if(u.row === undefined){
            console.log(u);
          }
          unitsPlacement[u.row][u.column] = 1;
        })

        return unitsPlacement
      }

    updateUnitsPlacement(unit: Unit, unitsPlacement: number[][], movePatternValue: number, i: number, j: number): void {
        switch(movePatternValue) {
          case MoveType.NoMovement:
            break;
          case MoveType.MoveOrTake:
            unitsPlacement[i][j]++;
            break;
          case MoveType.OnlyTake:
            if(unitsPlacement[i][j] == 1) unitsPlacement[i][j]++;
            break;
          case MoveType.OnlyMove:
            if(unitsPlacement[i][j] != 1) unitsPlacement[i][j] = 0;
            break;
          case Infinity: {
            let iDirection = Math.sign(i - unit.row);
            let jDirection = Math.sign(j - unit.column);
            
            let iIter = i;
            let jIter = j;
      
            while((iIter >= 0 && iIter < Game.BOARD_ROWS) && (jIter >= 0 && jIter < Game.BOARD_COLUMNS)){
              unitsPlacement[iIter][jIter] = unitsPlacement[iIter][jIter] + 1;
              if(unitsPlacement[iIter][jIter] == 2) break;
              iIter = iIter + iDirection;
              jIter = jIter + jDirection;
            }       
            break;
          } 
        }
      }
      
      FilterUnitMovesThatWouldResultInCheck(unit: Unit, unitMovesAvailable: AvailableMoves): void {
        let tilesToRemove = [] as Tile[];
        let unitsToRemove = [] as Unit[];
        let unitStartingRow = unit.row;
        let unitStartingColumn = unit.column;
        let princess = this._units.find(u => u instanceof Princess && u.color === unit.color);

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

        unitMovesAvailable.Tiles = unitMovesAvailable.Tiles.filter(t => !tilesToRemove.includes(t));
        unitMovesAvailable.Units = unitMovesAvailable.Units.filter(u => !unitsToRemove.includes(u));
      }
}
