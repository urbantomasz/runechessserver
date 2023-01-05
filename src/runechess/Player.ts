import { Color, Column } from "./Enums";
import { Tile } from "./Tile";
import { Unit, Mage, Rogue, Druid, Knight, Princess, King, Priest, Peasant } from "./Unit";


const BLUE_STARTING_FIRST_ROW = 0;
const RED_STARTING_FIRST_ROW = 7;
const BLUE_STARTING_SECOND_ROW = 1;
const RED_STARTING_SECOND_ROW = 6;

export class Player{
    private color: Color;

    constructor(color: Color){
        this.color = color;
    }

    private isBlue(): boolean{
        return this.color == Color.Blue;
    }

    public GetStartingUnits(): Unit[]{

        let startingRow = this.isBlue() ? BLUE_STARTING_FIRST_ROW : RED_STARTING_FIRST_ROW;
        let secondRow = this.isBlue() ? BLUE_STARTING_SECOND_ROW : RED_STARTING_SECOND_ROW
    
        let units = new Array<Unit>(
            new Mage(this.color, new Tile(startingRow, Column.A)),
            new Rogue(this.color, new Tile(startingRow, Column.B)),
           // new Druid(this.color, new Tile(startingRow, Column.C)),
            new Knight(this.color, new Tile(startingRow, Column.C)),
            new King(this.color, new Tile(startingRow, Column.D)),
            new Princess(this.color, new Tile(startingRow, Column.E)),
            new Knight(this.color, new Tile(startingRow, Column.F)),
            new Priest(this.color, new Tile(startingRow, Column.G)),
            new Rogue(this.color, new Tile(startingRow, Column.H)),
            new Mage(this.color, new Tile(startingRow, Column.I)),
        )

        if(!this.isBlue()){
            units.forEach(u => u.column = Math.abs(u.column-8))
        }
        
    
        let peasants = new Array<Unit>();
    
        for (let i = 0; i < 9; i++) {
            peasants.push(new Peasant(this.color, new Tile(secondRow, i)));
        }
    
        units = units.concat(peasants);
    
        return units;
    }  
}