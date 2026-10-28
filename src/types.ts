export type Participant = 'player' | 'dealer';

export type Difficulty = 'TUTORIAL' | 'NORMAL' | 'HARD' | 'VERY_HARD' | 'NIGHTMARE';

export type GameState =
  | 'MENU'
  | 'LOADING'
  | 'PLAYER_TURN'
  | 'DEALER_TURN'
  | 'SHOOTING'
  | 'ITEM_USE'
  | 'ROUND_OVER'
  | 'GAME_OVER'
  | 'SURRENDER';

export type ItemType = 'MIRROR' | 'PLIERS' | 'WHISKEY' | 'TOURNIQUET' | 'PENTAGRAM' | 'CIGARETTE' | 'SCALPEL' | 'DEFIBRILLATOR' | 'SYRINGE' | 'RAZORBLADE' | 'MEDKIT';

export interface Chamber {
  isLive: boolean;
  isSpent: boolean;
}

export interface PlayerState {
  health: number; // 0 to 100
  maxHealth: number;
  items: ItemType[];
}

export interface GameContextType {
  gameState: GameState;
  chambers: Chamber[];
  currentChamberIndex: number;
  player: PlayerState;
  dealer: PlayerState;
  liveRoundsInCylinder: number;
  blankRoundsInCylinder: number;
  message: string;
  subMessage: string;
  turnCount: number;
  bloodLevel: number; // Global screen blood effect
}

export const getLowHealthThreshold = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'NIGHTMARE':
      return 50;
    case 'VERY_HARD':
      return 45;
    case 'HARD':
      return 40;
    case 'NORMAL':
    default:
      return 35;
  }
};

export const isGrimCondition = (
  playerHealth: number,
  playerMaxHealth: number,
  dealerHealth: number,
  difficulty: Difficulty,
  chambers?: Chamber[]
): boolean => {
  if (playerHealth <= 0) return false;
  const threshold = getLowHealthThreshold(difficulty);
  // 1. Incredibly low health: 1 shot away from death (<= threshold)
  if (playerHealth <= threshold) return true;
  // 2. Grim health disparity: low health (<= 40%) against a towering dealer (dealer has >= 1.8x player health)
  if (playerHealth / playerMaxHealth <= 0.4 && dealerHealth >= playerHealth * 1.8) return true;
  // 3. Guaranteed lethal round: all unspent chambers in cylinder are live and player is in danger
  if (chambers && chambers.length > 0) {
    const unspent = chambers.filter((c) => !c.isSpent);
    if (unspent.length > 0 && unspent.every((c) => c.isLive) && playerHealth <= 70) return true;
  }
  return false;
};
