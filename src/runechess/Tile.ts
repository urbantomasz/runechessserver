import { Row } from "./Enums";
import { GameObject } from "./GameObject";
import { Unit } from "./Unit";

export class Tile extends GameObject {
  isDestroyed: boolean;
  lastCapturedUnit: Unit | null;
  constructor(row: number, column: number) {
    super();
    this.row = row;
    this.column = column;
    this.id = this.getId();
    this.isDestroyed = false;
    this.lastCapturedUnit = null;
  }

  private getId(): string {
    return Tile.CreateTileId(this.row, this.column);
  }

  public static CreateTileId(row: number, column: number) {
    return "tile_".concat(row.toString(), column.toString());
  }

  public toNotationString(): string {
    return Row[this.row] + this.column.toString();
  }
}
