import { globalEvent } from "@billjs/event-emitter";
import { Color } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { Move } from "./Move";
import { SpellManager } from "./SpellManager";
import { Tile } from "./Tile";
import { DarkKnight, King, Knight, Peasant, Princess, Unit } from "./Unit";
import { Validator } from "./Validator";
import { CaptureCommand, MoveCommand, SpellCommand, TurnFinishedCommand } from "./Commands";

export class StateManager {
     private _validator: Validator;
     private _spellManager: SpellManager;
     private _tiles: Tile[][];
     private _moves: Move[] = [] as Move[];
     private _units: Unit[];
     private _playerTurnColor: Color;
 
    constructor(units: Unit[], tiles: Tile[][], validator: Validator, spellManager: SpellManager) {
        this._units = units;
        this._tiles = tiles;
        this._validator = validator;
        this._spellManager = spellManager;
        this._playerTurnColor = Color.Blue;
    }

    public get Tiles(){
        return this._tiles;
    }
    public get Units(){
        return this._units;
    }
    public get PlayerTurnColor(){
        return this._playerTurnColor;
    }

    public set PlayerTurnColor(color: Color){
        this._playerTurnColor = color;
    }

    public get Moves(){
        return this._moves;
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
        if(!this._spellManager.UnitsAvailableCasts.get(castingUnit).Targets.includes(targetObject)) return false;
        if(this._playerTurnColor !== castingUnit.color) return false;
        new SpellCommand(castingUnit, targetObject, this._spellManager.Spells, this._spellManager).Execute();
        this._moves.push(new Move(castingUnit, targetObject, true))
        return this.OnTurnFinished()
    }


    public TryMoveUnit(unit: Unit, tile: Tile): boolean{
        if(!this._validator.UnitsAvailableMoves.get(unit).Tiles.includes(tile)) return false;
        if(this._playerTurnColor !== unit.color) return false;
        new MoveCommand(unit, tile, this._units).Execute();
        this._moves.push(new Move(unit, tile))
        return this.OnTurnFinished()
    }

    public TryTakeUnit(selectedUnit: Unit, capturingUnit: Unit): boolean{
        if(!this._validator.UnitsAvailableMoves.get(selectedUnit).Units.includes(capturingUnit)) return false;
        if(this._playerTurnColor !== selectedUnit.color) return false;
        if(capturingUnit instanceof Princess){
            return false;
        }
        new CaptureCommand(selectedUnit, capturingUnit, this._units, this._tiles).Execute();
        this._moves.push(new Move(selectedUnit, capturingUnit, true))
        return this.OnTurnFinished();
    }

    public UpdatePlayerTurnColor(){
        this._playerTurnColor = (this._playerTurnColor === Color.Blue ? Color.Red : Color.Blue);
    }

    public OnTurnFinished(): boolean{
        new TurnFinishedCommand(this, this._spellManager, this._validator).Execute();
        return true
    }
}