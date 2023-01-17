import { StateManager } from "./StateManager";
import { Tile } from "./Tile";
import { King, Knight, Mage, Priest, Princess, Rogue, Unit } from "./Unit";
import { Castle, DestroyTile, ISpell, PowerStomp, Ressurection, Sacrifice, Shadowstep} from "./Spell"
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { Validator } from "./Validator";
import { Color } from "./Enums";
import { clone, cloneDeep } from "lodash";

export interface AvailableCasts{
    Targets: GameObject[]
}


export class SpellManager{
    private readonly _units: Unit[];
    private readonly _tiles: Tile[][];
    private readonly _stateManager: StateManager;
    private readonly _validator: Validator;
    private _spells: Map<string, ISpell>;
    private _unitsAvailableCasts: Map<Unit, AvailableCasts>;
    public get UnitsAvailableCasts(): Map<Unit, AvailableCasts>{
        return this._unitsAvailableCasts;
    }

    constructor(units: Unit[], tiles: Tile[][], validator: Validator) {
        this._units = units;
        this._tiles = tiles;
        this._validator = validator;
        this.initializeSpellsDictionary();
        this.UpdateUnitsAvailableCasts();
    }

    private initializeSpellsDictionary(){
        this._spells = new Map<string, ISpell>();
        this._spells.set(Princess.name, new Castle());
        this._spells.set(King.name, new Sacrifice());
        this._spells.set(Rogue.name, new Shadowstep());
        this._spells.set(Priest.name, new Ressurection());
        this._spells.set(Mage.name, new DestroyTile());
        this._spells.set(Knight.name, new PowerStomp());
    }

    private getUnits2DArray(): Unit[][]{
        let units2DArray = Array(Game.BOARD_ROWS).fill(null);   

        for(let i = 0; i < Game.BOARD_ROWS; i++){
            units2DArray[i] = Array(Game.BOARD_COLUMNS).fill(null)
        } 

        this._units.forEach(u =>{
            if(!u.isCaptured){
                units2DArray[u.row][u.column] = u;
            }
        })

        return units2DArray;
    }

    public UpdateUnitsAvailableCasts(omitCheck: boolean = false): void {
        console.time('updateUnitsAvailableCasts')
        this._unitsAvailableCasts = new Map<Unit, AvailableCasts>();
        this._units.forEach(unit =>{
            if(unit.usedSpell || unit.isCaptured || !this._spells.has(unit.constructor.name)){
                //this._unitsAvailableCasts.set(unit, {Targets: []});
            } else{
                this._unitsAvailableCasts.set(unit, {Targets: this._spells.get(unit.constructor.name).GetValidTargets(unit, this)});
            }
        })
        if(!omitCheck){
            var castTargetsToRemove = this.getUnitCastsThatWouldResultInCheck();
           // console.log("cast targets to remove size: " + castTargetsToRemove.size)
            for(const [unit, casts] of castTargetsToRemove){
               // console.log("n. of units that cant be taken becaues of princess check: " + casts.length)
                this.UnitsAvailableCasts.get(unit).Targets = this.UnitsAvailableCasts.get(unit).Targets.filter(x => !casts.map(x=>x.id).includes(x.id));
            }
        }
        console.timeEnd('updateUnitsAvailableCasts')
    }

    // public CheckForSpellCheck(): boolean{
    //     let isSpellCheck = false;
    //     for (let [unit, availableCasts] of this.UnitsAvailableCasts) {
    //         if(availableCasts.Targets.length === 0) continue;
    //         const unitSpell = this._spells[unit.constructor.name]
    //         if(unitSpell instanceof Shadowstep && availableCasts.Targets.find(u => u instanceof Princess)){
    //             isSpellCheck = true;
    //         }
    //         if(unitSpell instanceof PowerStomp){
    //             for (let [unit, tile] of unitSpell.TilesBehindMap) {
    //                 if(unit instanceof Princess && tile.isDestroyed === true){
    //                     isSpellCheck = true;
    //                 }
    //             }
    //         }
    //         }
    //     return isSpellCheck;
    //   }

    getUnitCastsThatWouldResultInCheck(): Map<Unit, GameObject[]>{
        let unitsTargetsToRemoveMap = new Map<Unit, GameObject[]>();
        for (const [castingUnit, availableCasts] of this._unitsAvailableCasts) {
            if(availableCasts.Targets.length === 0 || (castingUnit instanceof Knight) || castingUnit instanceof Rogue) continue;
            let targetsToRemove = [] as GameObject[];
            availableCasts.Targets.forEach(targetObject => {
                let spellManagerCopy = cloneDeep(this)
                //spellManagerCopy.UpdateUnitsAvailableCasts(true);
                let targetObjectCopy: GameObject = spellManagerCopy._units.find(u => u.row === targetObject.row && u.column === targetObject.column);
                
                if(targetObjectCopy === undefined){
                    targetObjectCopy = spellManagerCopy._tiles[targetObject.row][targetObject.column];
                }

                let princessCopy = spellManagerCopy._units.find(u => u instanceof Princess && u.color === castingUnit.color);
                
                let castingUnitCopy =  spellManagerCopy._units.find(u => u.row === castingUnit.row && u.column === castingUnit.column);
                
                spellManagerCopy._spells.get(castingUnitCopy.constructor.name).GetValidTargets(castingUnitCopy, spellManagerCopy);
                spellManagerCopy._spells.get(castingUnitCopy.constructor.name).Cast(castingUnitCopy, targetObjectCopy, spellManagerCopy);
                
                if(spellManagerCopy._tiles[castingUnitCopy.row][castingUnitCopy.column].isDestroyed){
                    castingUnitCopy.isCaptured = true;
                }
                if(targetObjectCopy instanceof Unit && spellManagerCopy._tiles[targetObjectCopy.row][targetObjectCopy.column].isDestroyed){
                    targetObjectCopy.isCaptured = true;
                }
                let availableMovesAfterCast = this._validator.GetUnitsAvailableMoves(spellManagerCopy._units, spellManagerCopy._tiles, true);
                for(const [unit, moves] of availableMovesAfterCast){
                    if(unit.color === princessCopy.color) continue;
                    if(moves.Units.includes(princessCopy) || princessCopy.isCaptured){
                        targetsToRemove.push(targetObjectCopy);
                      break;
                    }
                  }
            })
            unitsTargetsToRemoveMap.set(castingUnit, targetsToRemove);
        }
        return unitsTargetsToRemoveMap;
    }

    public CastSpell(castingUnit: Unit, targetObject: GameObject){
        //console.log("cast spell test")
        this._spells.get(castingUnit.constructor.name).Cast(castingUnit, targetObject, this);
    }

    CastSwapCastables(castingUnit: Unit, targetingUnit: Unit){
        if(castingUnit.column === targetingUnit.column){

            let tilesDifferences = castingUnit.row - targetingUnit.row;

            if(Math.abs(tilesDifferences) === 1){
                this.SwapUnits(castingUnit, targetingUnit)
            }
            else {
                castingUnit.row =  targetingUnit.row
                targetingUnit.row = targetingUnit.row + 1 * Math.sign(tilesDifferences)
            } 
        }

        if(castingUnit.row === targetingUnit.row){

            let tilesDifferences = castingUnit.column - targetingUnit.column;

            if(Math.abs(tilesDifferences) === 1){
                this.SwapUnits(castingUnit, targetingUnit)
            }
            else {
                castingUnit.column = targetingUnit.column
                targetingUnit.column = targetingUnit.column + 1 * Math.sign(tilesDifferences)
            } 
        }
    }

    SwapUnits(unit: Unit, unit2: Unit): void{
        const unitRowTemp = unit.row;
        const unitColumnTemp = unit.column;
        unit.row = unit2.row;
        unit.column = unit2.column;
        unit2.row = unitRowTemp;
        unit2.column = unitColumnTemp;
    }

    GetPowerStompCastables(castingUnit: Unit): {Targets: Tile[], TileToUnitToTileBehindMap: Map<Tile,Map<Unit,Tile>>}{
        let targetTiles = [] as Tile[];
        let tileToUnitToTileBehindMap = new Map<Tile,Map<Unit, Tile>>();
        let movePatternTiles = this._validator.UnitsAvailableMoves.get(castingUnit).Tiles;
        movePatternTiles.forEach(movePatternTile => {

            let behindTilesMap = new Map<Unit, Tile>();

            let units2DArray = this.getUnits2DArray();
            units2DArray[castingUnit.row][castingUnit.column] = null;
            units2DArray[movePatternTile.row][movePatternTile.column] = castingUnit;

            let enemyUnitsAround = this.getEnemyUnitsAroundTile(castingUnit.color, movePatternTile);

            enemyUnitsAround.forEach(enemyUnit =>{
                let emptyTileBehindUnit = this.getUnitEmptyTileBehind(movePatternTile, enemyUnit, units2DArray);
                if(emptyTileBehindUnit !== null){
                    behindTilesMap.set(enemyUnit, emptyTileBehindUnit);
                    if(!targetTiles.includes(movePatternTile)){
                        targetTiles.push(movePatternTile);
                    }
                }
            })

            if(behindTilesMap.size > 0){
                tileToUnitToTileBehindMap.set(movePatternTile, behindTilesMap);
            }


        })
        return {Targets: targetTiles, TileToUnitToTileBehindMap: tileToUnitToTileBehindMap};

    }

    getEnemyUnitsAroundTile(color: Color, targetingTile: Tile): Unit[]{
        let uncapturedUnits = this._units.filter(u => !u.isCaptured);
        let enemyUnitsAround = uncapturedUnits.filter(unit => {
            return (
                Math.abs(targetingTile.row - unit.row) <= 1 &&
                Math.abs(targetingTile.column - unit.column) <= 1 &&
                color !== unit.color)
        });
        return enemyUnitsAround;
    }

    public CastPowerStomp(castingUnit: Unit, targetingTile: Tile, tilesBehindMap: Map<Unit, Tile>){
        this.MoveUnit(castingUnit, targetingTile);
        for (const [unit, emptyTileBehind] of tilesBehindMap) {
            this.MoveUnit(unit, emptyTileBehind);
          }
    }

    public MoveUnit(unit: Unit, tile: Tile){
        unit.column = tile.column;
        unit.row = tile.row;
        unit.isMoved = true;
        if(this._tiles[unit.row][unit.column].isDestroyed){
            unit.isCaptured = true;
        }
    }

    public isBetween = (num1: number,num2: number,value: number) => value >= num1 && value <= num2 

    getUnitEmptyTileBehind(targetingTile: Tile, targetingUnit: Unit, units2DArray: Unit[][]){
        var tileBehindUnit: Tile = null;
        if(targetingTile.column === targetingUnit.column){
            let isTargetUnitAbove = Math.sign(targetingUnit.row-targetingTile.row) * 1;
                if(this.isBetween(0, Game.BOARD_ROWS-1, targetingUnit.row + isTargetUnitAbove)  &&
                    units2DArray[targetingUnit.row + isTargetUnitAbove][targetingUnit.column] === null){
                    tileBehindUnit = this._tiles[targetingUnit.row + isTargetUnitAbove][targetingUnit.column];
                }
        }
        else if(targetingTile.row === targetingUnit.row){
            let isTargetUnitOnRight = Math.sign(targetingUnit.column-targetingTile.column) * 1;
            // console.log("between")
            // console.log(this.isBetween(0, Game.BOARD_COLUMNS-1, targetingUnit.column + targetUnitHigher))
            // console.log("units2darray")
            // console.log(units2DArray[targetingUnit.row][targetingUnit.column + targetUnitHigher])
                if(this.isBetween(0, Game.BOARD_COLUMNS-1, targetingUnit.column + isTargetUnitOnRight) &&
                    units2DArray[targetingUnit.row][targetingUnit.column + isTargetUnitOnRight] === null){
                    tileBehindUnit = this._tiles[targetingUnit.row][targetingUnit.column + isTargetUnitOnRight];
                }
        }

        return tileBehindUnit;
    }

    GetSwapCastables(castingUnit: Unit): Unit[]{
        let unitsNotCaptured = this._units.filter(u => !u.isCaptured);
        let unitsAlly = unitsNotCaptured.filter(u => u.color == castingUnit.color)
        let unitsToConsiderRow = unitsAlly.filter(u => u.row == castingUnit.row)
        let unitsToConsiderColumn = unitsAlly.filter(unit => unit.column == castingUnit.column)
        let firstUnitOnRight = unitsToConsiderRow.sort((unit1, unit2) => unit1.column - unit2.column).find(unit => unit.column > castingUnit.column)
        let firstUnitOnLeft = unitsToConsiderRow.sort((unit1, unit2) => unit2.column - unit1.column).find(unit => unit.column < castingUnit.column)
        let firstUnitUp = unitsToConsiderColumn.sort((unit1, unit2) => unit1.row - unit2.row).find(unit => unit.row > castingUnit.row)
        let firstUnitDown = unitsToConsiderColumn.sort((unit1, unit2) => unit2.row - unit1.row).find(unit => unit.row < castingUnit.row)
       
        return [firstUnitOnRight, firstUnitOnLeft, firstUnitUp, firstUnitDown].filter(x => x);
    }

    GetSacrificeCastables(castingUnit: Unit): Unit[]{
        return this._units.filter(unit => 
            !unit.isCaptured &&
            unit.color === castingUnit.color &&
            unit != castingUnit
        );
    }

    CastSacrifice(sacrificingUnit: Unit, allyUnit: Unit){
        this.SwapUnits(sacrificingUnit, allyUnit);
        sacrificingUnit.isCaptured = true;
    }

    public GetShadowstepCastables(castingUnit: Unit): {Targets: Unit[], AdjacentTiles: Map<Unit,Tile>}{
        let rogueAdjacentTilesMap = new Map<Unit, Tile>(); 
        let rogueAdjacentsTiles = [] as Unit[];
        let unitsNotCaptured = this._units.filter(u => !u.isCaptured);
        let unitsToConsiderRow = unitsNotCaptured.filter(unit => unit.row == castingUnit.row)
        let unitsToConsiderColumn = unitsNotCaptured.filter(unit => unit.column == castingUnit.column)

        let firstUnitOnRight = unitsToConsiderRow.sort((unit1, unit2) => unit1.column - unit2.column).find(unit => unit.column > castingUnit.column && unit.column < Game.BOARD_COLUMNS-1)
        let adjacentTileRight: Tile = null;
        if(firstUnitOnRight){
            adjacentTileRight = this._tiles[firstUnitOnRight.row][firstUnitOnRight.column + 1]
           //console.log(adjacentTileRight)
            if(!(unitsNotCaptured.find(u => u.row == adjacentTileRight.row && u.column == adjacentTileRight.column))){
                rogueAdjacentTilesMap.set(firstUnitOnRight, adjacentTileRight)
                rogueAdjacentsTiles.push(firstUnitOnRight);
            }
        }


        let firstUnitOnLeft = unitsToConsiderRow.sort((unit1, unit2) => unit2.column - unit1.column).find(unit => unit.column < castingUnit.column && unit.column > 0)
        let adjacentTileLeft: Tile = null;
        if(firstUnitOnLeft){
            adjacentTileLeft = this._tiles[firstUnitOnLeft.row][firstUnitOnLeft.column - 1];
            if(!(this._units.find(u => u.row == adjacentTileLeft.row && u.column == adjacentTileLeft.column))){
                rogueAdjacentTilesMap.set(firstUnitOnLeft, adjacentTileLeft)
                rogueAdjacentsTiles.push(firstUnitOnLeft);
            }
        }

        let firstUnitUp = unitsToConsiderColumn.sort((unit1, unit2) => unit1.row - unit2.row).find(unit => unit.row > castingUnit.row && unit.row < Game.BOARD_ROWS-1)
        let adjacentTileUp: Tile = null;
        if(firstUnitUp){
            adjacentTileUp =  this._tiles[firstUnitUp.row + 1][firstUnitUp.column];
            if(!(this._units.find(u => u.row == adjacentTileUp.row && u.column == adjacentTileUp.column))){
                rogueAdjacentTilesMap.set(firstUnitUp, adjacentTileUp)
                rogueAdjacentsTiles.push(firstUnitUp);
            }
        }

        let firstUnitDown = unitsToConsiderColumn.sort((unit1, unit2) => unit2.row - unit1.row).find(unit => unit.row < castingUnit.row && unit.row > 0) 
        let adjacentTileDown: Tile = null; 
        if(firstUnitDown){
            adjacentTileDown = this._tiles[firstUnitDown.row - 1][firstUnitDown.column]
            if(!(this._units.find(u => u.row == adjacentTileDown.row && u.column == adjacentTileDown.column))){
                rogueAdjacentTilesMap.set(firstUnitDown, adjacentTileDown)
                rogueAdjacentsTiles.push(firstUnitDown);
            }
        }

        return  {
            Targets: rogueAdjacentsTiles,
            AdjacentTiles: rogueAdjacentTilesMap
        }
    }

    public GetUnoccupiedTiles(): Tile[]{
        let occupiedTiles = this._units.filter(u => !u.isCaptured).map(u => this._tiles[u.row][u.column]);
        let undestroyedTiles = [].concat(...this._tiles).filter(t => !t.isDestroyed) as Tile[];
        return undestroyedTiles.filter(t => !occupiedTiles.includes(t));
    }

    public GetDestroyedTiles(): Tile[]{
        return [].concat(...this._tiles).filter(t => t.isDestroyed);
    }

    public CastDestroyTile(targetingTile: Tile){
        targetingTile.isDestroyed = true;
        targetingTile.lastCapturedUnit = null;
    }

    public CastSpawnTile(targetingTile: Tile){
        targetingTile.isDestroyed = false;
    }

    public CastShadowstep(castingUnit: Unit, targetingUnit: Unit, adjacentTiles: Map<Unit,Tile>){
        let adjacentTile = adjacentTiles.get(targetingUnit);
        castingUnit.column = adjacentTile.column;
        castingUnit.row = adjacentTile.row;

        if(targetingUnit.color != castingUnit.color){
            targetingUnit.isCaptured = true;
            adjacentTile.lastCapturedUnit = targetingUnit;
        }
    }

    public GetResurrectionCastables(castingUnit: Unit): Unit[]{
        let capturedUnits = this._units.filter(u => u.isCaptured);
        let ressurectableUnits = capturedUnits.filter(capturedUnit => {
            return (
                Math.abs(castingUnit.row - capturedUnit.row) <= 1 &&
                Math.abs(castingUnit.column - capturedUnit.column) <= 1) &&
                (this._units.find(u => u.column === capturedUnit.column && u.row === capturedUnit.row && !u.isCaptured) === undefined)
        });
        return ressurectableUnits
    };

    public CastRessurection(castingUnit: Unit, targetUnit: Unit){
        targetUnit.isCaptured = false;
        targetUnit.color = castingUnit.color;
    }
}