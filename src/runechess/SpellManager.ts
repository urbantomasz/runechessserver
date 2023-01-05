import { StateManager } from "./StateManager";
import { Tile } from "./Tile";
import { King, Knight, Mage, Priest, Princess, Rogue, Unit } from "./Unit";
import { Castle, DestroyTile, ISpell, PowerStomp, Ressurection, Sacrifice, Shadowstep} from "./Spell"
import { globalEvent } from "@billjs/event-emitter";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { Validator } from "./Validator";

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
        this.updateUnitsAvailableCasts();
        globalEvent.on("TurnFinished", evt => this.updateUnitsAvailableCasts())
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

    private getUnits2DArray(){
        let units2DArray = Array(Game.BOARD_ROWS).fill(null);   

        for(let i = 0; i < Game.BOARD_ROWS; i++){
            units2DArray[i] = Array(Game.BOARD_COLUMNS).fill(null)
        } 

        this._units.forEach(u =>{
            if(!u.isCaptured){
                units2DArray[u.row][u.column] = u;
            }
        })

        console.log(units2DArray.toString())
        console.log(units2DArray.length)
        console.log(units2DArray[0].length)
        return units2DArray;
    }

    public updateUnitsAvailableCasts(): void {
        this._unitsAvailableCasts = new Map<Unit, AvailableCasts>();
        this._units.forEach(unit =>{
            if(unit.usedSpell || unit.isCaptured || !this._spells.has(unit.constructor.name)){
                this._unitsAvailableCasts.set(unit, {Targets: []});
                //console.log(unit.constructor.name)
                //console.log(this._spells.keys())
            } else{
                //console.log(unit.constructor.name)
                //console.log(this._spells.get(unit.constructor.name).GetValidTargets(unit, this).length)
                this._unitsAvailableCasts.set(unit, {Targets: this._spells.get(unit.constructor.name).GetValidTargets(unit, this)});
            }
        })
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

    GetPowerStompTiles(castingUnit: Unit): Tile[]{
        return this._validator.UnitsAvailableMoves.get(castingUnit).Tiles;
    }

    CastPowerStomp(castingUnit: Unit, targetingTile: Tile){
        let uncapturedUnits = this._units.filter(u => !u.isCaptured);
        let enemyUnitsAround = uncapturedUnits.filter(unit => {
            return (
                Math.abs(targetingTile.row - unit.row) <= 1 &&
                Math.abs(targetingTile.column - unit.column) <= 1 &&
                castingUnit.color !== unit.color)
        });
        this.MoveUnit(castingUnit, targetingTile);
        enemyUnitsAround.forEach(enemyUnit => {
            this.sendUnitToFurthestEmptyTile(castingUnit, enemyUnit);
        })
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

    sendUnitToFurthestEmptyTile(castingUnit: Unit, targetingUnit: Unit){
        var tileBehindUnit: Tile = null;
        var units2DArray = this.getUnits2DArray();
        var targetUnitHigher;
        if(castingUnit.column === targetingUnit.column){
            targetUnitHigher = Math.sign(targetingUnit.row-castingUnit.row) * 1;
                if(this.isBetween(0, Game.BOARD_ROWS-1, targetingUnit.row + targetUnitHigher)  &&
                    units2DArray[targetingUnit.row + targetUnitHigher][targetingUnit.column] === null){
                    tileBehindUnit = this._tiles[targetingUnit.row + targetUnitHigher][targetingUnit.column];
                    console.log("columns")
                }
        }
        else if(castingUnit.row === targetingUnit.row){
            targetUnitHigher = Math.sign(targetingUnit.column-castingUnit.column) * 1;
            console.log("between")
            console.log(this.isBetween(0, Game.BOARD_COLUMNS-1, targetingUnit.column + targetUnitHigher))
            console.log("units2darray")
            console.log(units2DArray[targetingUnit.row][targetingUnit.column + targetUnitHigher])
                if(this.isBetween(0, Game.BOARD_COLUMNS-1, targetingUnit.column + targetUnitHigher) &&
                    units2DArray[targetingUnit.row][targetingUnit.column + targetUnitHigher] === null){
                    tileBehindUnit = this._tiles[targetingUnit.row][targetingUnit.column + targetUnitHigher];
                    console.log("rows")
                }
        }

        console.log("tileBehindUnit")
        console.log(tileBehindUnit)
        console.log("targetUnitHigher")
        console.log(targetUnitHigher)
        console.log("targetingUnit")
        console.log(targetingUnit)
        if(tileBehindUnit !== null){
            this.MoveUnit(targetingUnit, tileBehindUnit);
        }

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
        //console.log(targetingUnit)
//console.log(adjacentTiles)
       // console.log(adjacentTiles.size)
        //console.log(adjacentTiles.get(targetingUnit))
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





