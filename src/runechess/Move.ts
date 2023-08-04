import { GameObject } from "./GameObject";
import { Unit } from "./Unit";

export class Move {
    unit: Unit;
    target: GameObject;
    castedSpell: boolean;

    private toStringMove(): string{
        return this.unit.toNotationString() + this.target.toNotationString();
    }

    private toStringCast(): string{
        return "*" + this.toStringMove();
    }

    public toNotationString(): string{
        return this.castedSpell ? this.toStringCast() : this.toStringMove();
    }

    constructor(unit: Unit, target: GameObject, castedSpell: boolean = false) {
        this.unit = unit;
        this.target = target;
        this.castedSpell = castedSpell;
    }
}
