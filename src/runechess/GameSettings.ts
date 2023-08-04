export interface GameSettings {
  validateMoves: boolean;
  validatePlayerColor: boolean;
  enableUnlimitedSpells: boolean;
  enableBot: boolean;
}

// Define a default settings object to use when no custom settings are provided
export const defaultSettings: GameSettings = {
  validateMoves: true,
  validatePlayerColor: true,
  enableUnlimitedSpells: false,
  enableBot: true,
};
