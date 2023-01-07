import { globalEvent } from "@billjs/event-emitter";
import { Color } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { Tile } from "./Tile";
import { DarkKnight, King, Knight, Peasant, Princess, Unit } from "./Unit";
import { Validator } from "./Validator";

export class StateManager {
     private _validator: Validator;
     private _spellManager: SpellManager;
     private _tiles: Tile[][];
     public get Tiles(){
        return this._tiles;
     }
     private _units: Unit[];
     public get Units(){
        return this._units;
     }
     private _playerTurnColor: Color;
     public get PlayerTurnColor(){
        return this._playerTurnColor;
     }
    constructor(units: Unit[], tiles: Tile[][], validator: Validator, spellManager: SpellManager) {
        this._units = units;
        this._tiles = tiles;
        this._validator = validator;
        this._spellManager = spellManager;
        this._playerTurnColor = Color.Blue;

        globalEvent.on("TryCaptureUnit", evt => this.TryTakeUnit(evt.data.selectedUnit, evt.data.capturingUnit));
        globalEvent.on("TryMoveUnit", evt => this.TryMoveUnit(evt.data.selectedUnit, evt.data.tile));
    }

    public GetUnitById(id: string): Unit{
        return this._units.find(u => u.id === id);
    }

    public GetTileById(id: string): Tile{
        for (let i = 0; i < this._tiles.length; i++) {
            for (let j = 0; j < this._tiles[i].length; j++) {
              if (this._tiles[i][j].id === id) {
                return this._tiles[i][j];
              }
            }
          }
          return null;
        }
    
    public TryCastingSpell(castingUnit: Unit, targetObject: GameObject): boolean {
       // console.log("Try casting spell")
        if(!this._spellManager.UnitsAvailableCasts.get(castingUnit).Targets.includes(targetObject)) return false;
        if(this._playerTurnColor !== castingUnit.color) return false;
        this._spellManager.CastSpell(castingUnit, targetObject);
        if(this._tiles[castingUnit.row][castingUnit.column].isDestroyed){
            castingUnit.isCaptured = true;
        }
        if(targetObject instanceof Unit && this._tiles[targetObject.row][targetObject.column].isDestroyed){
            targetObject.isCaptured = true;
        }
        this._playerTurnColor = (this._playerTurnColor === Color.Blue ? Color.Red : Color.Blue);
        castingUnit.usedSpell = true;
        globalEvent.fire("TurnFinished");
        return true;
    }

    public MoveUnit(unit: Unit, tile: Tile){
        if(unit instanceof Peasant && unit.color === Color.Blue && tile.row === Game.BOARD_ROWS-1 ||
            unit instanceof Peasant && unit.color === Color.Red && tile.row === 0){
                console.log("jestem w srodku")
            let unitIndex = this._units.findIndex(u => u === unit);
            let king = new King(unit.color, new Tile(tile.row, tile.column))
            king.id = unit.id;
            this._units[unitIndex] = king;
            return;
        }
        unit.column = tile.column;
        unit.row = tile.row;
        unit.isMoved = true;
    }

    public TryMoveUnit(unit: Unit, tile: Tile): boolean{
        if(!this._validator.UnitsAvailableMoves.get(unit).Tiles.includes(tile)) return false;
        if(this._playerTurnColor !== unit.color) return false;
        this.MoveUnit(unit, tile);
        this._playerTurnColor = (this._playerTurnColor === Color.Blue ? Color.Red : Color.Blue);
        globalEvent.fire("TurnFinished");
        return true;
    }

    public TryTakeUnit(selectedUnit: Unit, capturingUnit: Unit): boolean{
        if(!this._validator.UnitsAvailableMoves.get(selectedUnit).Units.includes(capturingUnit)) return false;
        if(this._playerTurnColor !== selectedUnit.color) return false;
        if(capturingUnit instanceof Princess){
            globalEvent.fire("PrincessTaken");
        }
        let capturingUnitTile = this._tiles[capturingUnit.row][capturingUnit.column];
        capturingUnit.isCaptured = true;
        capturingUnitTile.lastCapturedUnit = capturingUnit;
        this.MoveUnit(selectedUnit, capturingUnitTile);
        this._playerTurnColor = (this._playerTurnColor === Color.Blue ? Color.Red : Color.Blue);
        globalEvent.fire("TurnFinished");
        return true;
    }
}