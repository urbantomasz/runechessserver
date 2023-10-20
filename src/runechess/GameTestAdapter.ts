import { ICommand } from "./Commands";
import { Game } from "./Game";
import { Move } from "./Move";
import { ISpell } from "./Spell";
import { Tile } from "./Tile";
import { Princess, Unit } from "./Unit";
import { AvailableMoves } from "./Validator";

export class GameTestAdapter extends Game{

    constructor() {
        super();
    }

    public GetAllPossibleMoves(): ICommand[] {
        return this._stateManager.GetAllPossibleMoves();
    }
  
    public IsCheck(): boolean {
      return this._stateManager.IsCheck;
    }
  
    public IsMate(): boolean {
      return this._stateManager.IsMate;
    }
  
    public IsStalemate(): boolean {
      return this._stateManager.IsStaleMate;
    }
  
    public Is50MoveRule(): boolean {
      return this._stateManager.Is50MoveRule;
    }
  
    public get Spells(): Map<Unit, ISpell> {
      return this._spellManager.Spells;
    }
  
    public get Tiles(): Tile[][] {
      return this._stateManager.Tiles;
    }
  
    public get Moves(): Move[] {
      return [] as Move[];
    }
  
    public get Units(): Unit[] {
      return this._stateManager.Units;
    }
  
    public get UnitsAvailableMoves(): Map<Unit, AvailableMoves> {
      return this._validator.GetUnitsAvailableMovesByPlayerColor(
        this._stateManager.PlayerTurnColor
      );
    }
}