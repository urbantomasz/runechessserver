export enum UnitType {
  Knight = 1,
  Druid,
  Priest,
  Mage,
  Dragon,
  Princess,
  Rogue,
  Wolf,
  King,
  Peasant,
  DarkKnight,
}
export enum Color {
  Blue = 0,
  Red = 1,
}
export enum Column {
  A = 0,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
}
export enum Row {
  A = 0,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
}
export enum MoveState {
  Casting,
  SelectedUnit,
  UnselectedUnit,
}
export enum Spell {
  Castle,
  Sacriface,
  TileBreak,
  Shadowstep,
  CatForm,
  Fireball,
  Teleport,
  DoubleMove,
  Ressurection,
  FireBreath,
  SummonImp,
  SummonWolf,
  CreateWall,
}

export enum CommandType {
  Move,
  Capture,
  Cast,
}
export enum MoveType {
  NoMovement,
  MoveOrTake,
  OnlyTake,
  OnlyMove,
}
export enum TargetColor {
  Red,
  Teal,
}

export enum GameState {
  IsPlayerTurn,
  IsMate,
  IsCheck,
  IsStalemate,
  Is50MoveRule,
  IsInsufficientMaterial,
}
