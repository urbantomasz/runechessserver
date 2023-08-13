export abstract class GameObject {
  id: string;
  row: number;
  column: number;
  abstract toNotationString(): string;
}
