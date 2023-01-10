import { Tile } from "./Tile";
import { Princess, Unit } from "./Unit";
import { rotateMatrix90 } from "./Helpers";
import { globalEvent } from "@billjs/event-emitter";
import { Game } from "./Game";
import { Color, MoveType } from "./Enums";
import { AvailableCasts, SpellManager } from "./SpellManager";
import { Shadowstep } from "./Spell";

export interface AvailableMoves{
    Tiles: Tile[]
    Units: Unit[]
}

export class Validator{
    private readonly _tiles: Tile[][];
    private readonly _units: Unit[];
    //private readonly _unitsAvailableCasts: Map<Unit, AvailableCasts>;
    private _unitsAvailableMoves: Map<Unit, AvailableMoves>;
    constructor(units: Unit[], tiles: Tile[][]) {
        this._units = units;
        this._tiles = tiles;
        //this._unitsAvailableCasts = spellManager.UnitsAvailableCasts;
        this.updateUnitsAvailableMoves();
        globalEvent.on("TurnFinished", evt => this.updateUnitsAvailableMoves())
    }
   
    public get UnitsAvailableMoves(): Map<Unit, AvailableMoves>{
        return this._unitsAvailableMoves;
    }

    public get UnitsAvailableCasts(): Map<Unit, AvailableMoves>{
        return this._unitsAvailableMoves;
    }

    private updateUnitsAvailableMoves(): void{
        let unitsAvailableMoves = new Map<Unit, AvailableMoves>();
        this._units.forEach(unit =>{
            let movesAvailable = this.getUnitAvailableMoves(unit,  this._units.filter(u => !u.isCaptured), this._tiles);
            unitsAvailableMoves.set(unit, movesAvailable);
        })

        this._unitsAvailableMoves = unitsAvailableMoves;
        globalEvent.fire("AvailableMovesUpdated");
    }

    // private checkForCheck(): boolean{
    //   let isCheck = false;
    //   for (let availableMoves of this._unitsAvailableMoves.values()) {
    //     if(availableMoves.Units.find(unit => unit instanceof Princess)){
    //       isCheck = true;
    //       break;
    //     } 
    //   }
     

    //   return isCheck;
    // }

 
    // private filterMovesToFreeFromCheck(): void{
    //   // this.checkIfQueenHasMoves();
    //   // this.checkIfQueenCanCastle();
    //   // this.checkIfUnitsMoveCanSavePrincess();
    // }
    // private checkIfUnitsMoveCanSavePrincess(): boolean{
    //   for (let [unit, moves] of this._unitsAvailableMoves) {
    //   }
    // }
    // private checkForCheckmate(): boolean{
    // // It's actually quite easy to check for a checkmate:

    // // Can I move out of mate?
    // // Can I block mate?
    // // Can I take the attacker?
    // }

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
          unitsPlacement[u.row][u.column]= 1;
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
}