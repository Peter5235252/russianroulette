import { Chamber, ItemType } from '../types';

export type TutorialStepId =
  | 'WELCOME'
  | 'CORE_TWIST_BLANK'
  | 'CORE_TWIST_LIVE'
  | 'BLOOD_CURRENCY'
  | 'ITEMS_OVERVIEW'
  | 'ITEMS_PRACTICE_MIRROR'
  | 'ITEMS_PRACTICE_SCALPEL'
  | 'ITEMS_PRACTICE_HEAL'
  | 'BLACK_MARKET'
  | 'SURRENDER_MECHANIC'
  | 'DEALER_AI_RETALIATION'
  | 'GRADUATION';

export interface TutorialStep {
  id: TutorialStepId;
  stepNumber: number;
  totalSteps: number;
  phaseName: string;
  title: string;
  objective: string;
  description: string[];
  tacticalTip?: string;
  highlightTarget?: 'shoot-self' | 'shoot-dealer' | 'cylinder-hud' | 'item-rack' | 'blood-currency' | 'market-btn' | 'surrender-btn' | 'health-tubes';
  requiredAction?: 'SHOOT_SELF' | 'SHOOT_DEALER' | 'USE_ITEM' | 'BUY_ITEM' | 'OPEN_MARKET' | 'SURRENDER' | 'NONE';
  canAdvanceManually: boolean;
  scriptedSetup?: {
    chambers?: Chamber[];
    currentChamberIndex?: number;
    playerHealth?: number;
    dealerHealth?: number;
    playerItems?: ItemType[];
    dealerItems?: ItemType[];
    bloodCurrency?: number;
    allowSurrender?: boolean;
    initialTurn?: 'player' | 'dealer';
  };
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'WELCOME',
    stepNumber: 1,
    totalSteps: 12,
    phaseName: 'PHASE 1: THE PREMISE',
    title: 'WELCOME TO THE UNDERGROUND TABLE',
    objective: 'Read the foundational briefing and click "BEGIN TUTORIAL".',
    description: [
      'You are seated across from the enigmatic Dealer in a high-stakes duel of Russian Roulette with dark tactical twists.',
      'Unlike standard roulette, you have full control over where to aim the 6-chamber revolver on your turn: at YOURSELF or at the DEALER.',
      'Through mathematical probability, item manipulation, blood currency, and strategic concessions, you can outsmart the house and survive.'
    ],
    tacticalTip: 'Every turn is an optimization problem. Understanding cylinder state and item synergies is the difference between victory and oblivion.',
    highlightTarget: undefined,
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: true },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 100,
      playerItems: [],
      dealerItems: [],
      bloodCurrency: 0
    }
  },
  {
    id: 'CORE_TWIST_BLANK',
    stepNumber: 2,
    totalSteps: 12,
    phaseName: 'PHASE 2: THE CORE TWIST (PART 1)',
    title: 'SHOOTING SELF WITH A BLANK',
    objective: 'Aim the revolver at YOURSELF and pull the trigger (click "SHOOT SELF" / press A or Space).',
    description: [
      'Look at the CYLINDER LOAD indicator at the bottom-left: 1 LIVE and 1 BLANK round remain.',
      'The active chamber is currently a BLANK (0 damage).',
      'THE CRITICAL TWIST: When you discharge a BLANK at YOURSELF, you take 0 damage AND you retain your turn (FREE EXTRA TURN)!',
      'WARNING: If you shoot yourself with a LIVE round, you suffer a catastrophic 70 HP penalty (2x damage for shooting self).'
    ],
    tacticalTip: 'When odds favor a blank, shooting yourself allows you to safely discard the empty chamber without passing the turn to the Dealer.',
    highlightTarget: 'shoot-self',
    requiredAction: 'SHOOT_SELF',
    canAdvanceManually: false,
    scriptedSetup: {
      chambers: [
        { isLive: false, isSpent: false }, // Chamber 0: BLANK
        { isLive: true, isSpent: false },  // Chamber 1: LIVE
        { isLive: false, isSpent: true },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 100,
      playerItems: [],
      dealerItems: [],
      bloodCurrency: 0
    }
  },
  {
    id: 'CORE_TWIST_LIVE',
    stepNumber: 3,
    totalSteps: 12,
    phaseName: 'PHASE 2: THE CORE TWIST (PART 2)',
    title: 'SHOOTING THE DEALER WITH A LIVE ROUND',
    objective: 'Aim the revolver at the DEALER and pull the trigger (click "SHOOT DEALER" / press D).',
    description: [
      'Notice that you kept your turn! Now only 1 LIVE round remains in the cylinder (100% live certainty).',
      'Aim the barrel directly at the Dealer across the table.',
      'Landing a LIVE round on the Dealer inflicts 35 HP base damage and harvests valuable BLOOD CURRENCY (+25 Blood).',
      'If you had fired a blank at the Dealer instead, your turn would immediately end, and the Dealer would enter RETALIATION mode.'
    ],
    tacticalTip: 'Never waste a guaranteed live round on yourself. Always unload confirmed live rounds into the Dealer.',
    highlightTarget: 'shoot-dealer',
    requiredAction: 'SHOOT_DEALER',
    canAdvanceManually: false,
    scriptedSetup: {
      chambers: [
        { isLive: false, isSpent: true },
        { isLive: true, isSpent: false }, // Chamber 1: LIVE
        { isLive: false, isSpent: true },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 1,
      playerHealth: 100,
      dealerHealth: 100,
      playerItems: [],
      dealerItems: [],
      bloodCurrency: 0
    }
  },
  {
    id: 'BLOOD_CURRENCY',
    stepNumber: 4,
    totalSteps: 12,
    phaseName: 'PHASE 3: BLOOD AS CURRENCY',
    title: 'HARVESTING LIQUID ASSETS',
    objective: 'Review the Blood Economy overview and click "NEXT STEP".',
    description: [
      'You struck the Dealer and extracted +25 BLOOD CURRENCY (displayed in the top-right and Black Market HUD).',
      'Blood is the universal currency of the underground table:',
      '• +25 Blood is earned every time you wound the Dealer with a live round.',
      '• Blood is spent at the Black Market to purchase survival tools, weapons, and medical supplies.',
      '• Blood carries over across rounds, enabling long-term resource management.'
    ],
    tacticalTip: 'Accumulating blood early allows you to purchase game-winning exotic items like Syringes, Defibrillators, and Scalpels.',
    highlightTarget: 'blood-currency',
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: true },
        { isLive: true, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 65,
      playerItems: ['MIRROR', 'SCALPEL', 'WHISKEY'],
      dealerItems: ['MIRROR'],
      bloodCurrency: 50
    }
  },
  {
    id: 'ITEMS_OVERVIEW',
    stepNumber: 5,
    totalSteps: 12,
    phaseName: 'PHASE 4: THE ITEM ARSENAL',
    title: 'THE 11 ITEMS & RARITY SYSTEM',
    objective: 'Study the full item encyclopedia below and click "NEXT STEP".',
    description: [
      'Items are stored in your active inventory rack (up to 8 slots max). Items are categorized into 4 Rarity tiers:',
      '• COMMON (Green): MIRROR (peer into chamber), PLIERS (eject round & bleed 5 HP), WHISKEY (heal 20 HP).',
      '• UNCOMMON (Blue): TOURNIQUET (+1 Max HP buffer & halve damage), CIGARETTE (-30 HP damage taken for 20s), SCALPEL (2x damage next shot).',
      '• RARE (Gold): DEFIBRILLATOR (heal 40 HP, burn 10 Max HP), PENTAGRAM (swap HP percentage with Dealer).',
      '• EXOTIC (Magenta): RUSTY RAZORBLADE (convert blank to live round / double live), SYRINGE (+50 HP surge), MEDKIT (100% full health restore).'
    ],
    tacticalTip: 'You can use multiple items in a single turn before pulling the trigger. Item combinations create lethal guarantees!',
    highlightTarget: 'item-rack',
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 65,
      playerItems: ['MIRROR', 'SCALPEL', 'WHISKEY', 'RAZORBLADE'],
      dealerItems: ['WHISKEY'],
      bloodCurrency: 50
    }
  },
  {
    id: 'ITEMS_PRACTICE_MIRROR',
    stepNumber: 6,
    totalSteps: 12,
    phaseName: 'PHASE 4: ITEM PRACTICE (MIRROR)',
    title: 'INSPECTING THE ACTIVE CHAMBER',
    objective: 'Select and use the MIRROR from your item rack (click MIRROR or press 1).',
    description: [
      'You are holding a MIRROR in slot 1.',
      'Using the Mirror inspects the active chamber inside the revolver cylinder without discharging or spinning it.',
      'The inspection result will appear in the central subtitle banner, revealing with 100% certainty whether the next pull is LIVE or BLANK.',
      'Go ahead and use the Mirror now.'
    ],
    tacticalTip: 'Always use a Mirror when uncertain about a 50/50 split. If it shows LIVE, use a Scalpel next for an instant 70 HP blowout!',
    highlightTarget: 'item-rack',
    requiredAction: 'USE_ITEM',
    canAdvanceManually: false,
    scriptedSetup: {
      chambers: [
        { isLive: true, isSpent: false }, // Chamber 0 is LIVE
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 65,
      playerItems: ['MIRROR', 'SCALPEL', 'WHISKEY', 'RAZORBLADE'],
      dealerItems: ['WHISKEY'],
      bloodCurrency: 50
    }
  },
  {
    id: 'ITEMS_PRACTICE_SCALPEL',
    stepNumber: 7,
    totalSteps: 12,
    phaseName: 'PHASE 4: ITEM PRACTICE (SCALPEL)',
    title: 'SAWING OFF THE BARREL (2X DAMAGE)',
    objective: 'Select and use the SCALPEL to saw off the revolver barrel (click SCALPEL or press 1).',
    description: [
      'The Mirror confirmed that the current round is LIVE!',
      'Now select the SCALPEL from your inventory.',
      'Using the Scalpel cuts down the revolver barrel, supercharging the next shot to inflict DOUBLE DAMAGE (70 HP).',
      'Combined with the Mirror\'s confirmed live round, you have created an inescapable lethal strike against the Dealer!'
    ],
    tacticalTip: 'The classic combo: MIRROR -> SCALPEL -> SHOOT DEALER. If Dealer has <= 70 HP, this ends the round instantly.',
    highlightTarget: 'item-rack',
    requiredAction: 'USE_ITEM',
    canAdvanceManually: false,
    scriptedSetup: {
      chambers: [
        { isLive: true, isSpent: false }, // Confirmed LIVE
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 65,
      playerItems: ['SCALPEL', 'WHISKEY', 'RAZORBLADE'],
      dealerItems: ['WHISKEY'],
      bloodCurrency: 50
    }
  },
  {
    id: 'ITEMS_PRACTICE_HEAL',
    stepNumber: 8,
    totalSteps: 12,
    phaseName: 'PHASE 4: ITEM PRACTICE (HEALING & BLADES)',
    title: 'VITALITY RECOVERY & VISCERAL BLADES',
    objective: 'Use the WHISKEY to restore health, or click "NEXT STEP" to proceed.',
    description: [
      'Healing items ensure long-term survivability against dealer aggression:',
      '• WHISKEY restores +20 HP vitality.',
      '• SYRINGE slams +50 HP adrenaline directly into your veins.',
      '• DEFIBRILLATOR shocks you for +40 HP (permanently burns 10 Max HP).',
      '• RUSTY RAZORBLADE deals 10 self-harm to convert a Blank into a LIVE shell, or doubles a live shell!'
    ],
    tacticalTip: 'If the cylinder only contains blanks and it is your turn, use a RAZORBLADE to convert the blank to live, then shoot the Dealer!',
    highlightTarget: 'item-rack',
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 75,
      dealerHealth: 65,
      playerItems: ['WHISKEY', 'RAZORBLADE', 'TOURNIQUET'],
      dealerItems: ['WHISKEY'],
      bloodCurrency: 50
    }
  },
  {
    id: 'BLACK_MARKET',
    stepNumber: 9,
    totalSteps: 12,
    phaseName: 'PHASE 5: THE BLACK MARKET',
    title: 'TRADING BLOOD FOR SURVIVAL',
    objective: 'Open the Black Market shop (press Q / Down Arrow / click MARKET button) and buy an item.',
    description: [
      'You currently hold 50 BLOOD CURRENCY in your reserves.',
      'Open the BLACK MARKET table by clicking the MARKET button or pressing Q / Down Arrow.',
      'Inside the shop, you can purchase any unlocked item provided you have enough blood and inventory capacity (max 8 items).',
      'Higher difficulty modes introduce INFLATION (+35% on Hard, +75% on Very Hard, +130% on Nightmare).'
    ],
    tacticalTip: 'Prioritize buying Mirrors and Scalpels early for guaranteed damage, and keep at least one healing item in reserve.',
    highlightTarget: 'market-btn',
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: false, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 80,
      dealerHealth: 65,
      playerItems: ['WHISKEY'],
      dealerItems: [],
      bloodCurrency: 85
    }
  },
  {
    id: 'SURRENDER_MECHANIC',
    stepNumber: 10,
    totalSteps: 12,
    phaseName: 'PHASE 6: THE SURRENDER MECHANIC',
    title: 'GRIM CONDITIONS & CONCEDING',
    objective: 'Review the Surrender / Concede rules and click "NEXT STEP".',
    description: [
      'When your situation becomes statistically hopeless, the CONCEDE ROUND / SURRENDER mechanic unlocks ([X] key or bottom-right HUD button).',
      'GRIM CONDITIONS trigger when:',
      '1. CRITICAL HEALTH: Player has <= 35 HP (1 shot from death).',
      '2. MASSIVE DISPARITY: Player has <= 40% HP while Dealer has >= 1.8x player health.',
      '3. GUARANTEED LETHAL: All remaining chambers are Live and you are in fatal range.',
      'Surrendering triggers an unforgettable 4.2-second cinematic exit where the Dealer racks a 12-gauge shotgun rather than prolonging agony.'
    ],
    tacticalTip: 'Surrender allows you to exit with dignity when the math guarantees your demise.',
    highlightTarget: 'surrender-btn',
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: true, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: true, isSpent: true },
        { isLive: true, isSpent: true },
        { isLive: true, isSpent: true },
        { isLive: true, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 25, // Critical health triggers Grim Condition
      dealerHealth: 100,
      playerItems: [],
      dealerItems: ['SCALPEL'],
      bloodCurrency: 25,
      allowSurrender: true
    }
  },
  {
    id: 'DEALER_AI_RETALIATION',
    stepNumber: 11,
    totalSteps: 12,
    phaseName: 'PHASE 7: DEALER AI DEMONSTRATION',
    title: 'THE DEALER AI MASTERCLASS',
    objective: 'Observe the Dealer AI (powered by reasoning LLM + local tactical fallback) demonstrate probability deduction, item synergy, and free turn retention.',
    description: [
      'The Dealer is driven by an advanced reasoning LLM for psychological deduction and strategic turn planning — with an automatic fallback to a local tactical engine.',
      'Watch closely as he executes the optimal decision chain:',
      '1. PROBABILITY ANALYSIS: Cylinder holds 1 Blank and 1 Live (50/50). Rather than guessing blindly, the Dealer deploys a Mirror.',
      '2. BLANK TURN RETENTION: Confirming a Blank, the Dealer discharges at HIMSELF for 0 damage, keeping the turn!',
      '3. ITEM SYNERGY: Knowing the final shell is 100% Live, the Dealer deploys a Scalpel for double damage (70 HP).',
      '4. EXECUTION: The Dealer strikes you with a guaranteed, inescapable lethal blast.'
    ],
    tacticalTip: 'The reasoning LLM calculates exact shell odds and ruthlessly punishes mistakes, backed by an automatic local fallback.',
    highlightTarget: undefined,
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: false, isSpent: false }, // Chamber 0: BLANK
        { isLive: true, isSpent: false },  // Chamber 1: LIVE
        { isLive: false, isSpent: true },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 100,
      playerItems: [],
      dealerItems: ['MIRROR', 'SCALPEL'],
      bloodCurrency: 50,
      initialTurn: 'dealer'
    }
  },
  {
    id: 'GRADUATION',
    stepNumber: 12,
    totalSteps: 12,
    phaseName: 'PHASE 8: GRADUATION',
    title: 'TUTORIAL COMPLETED — READY FOR THE CHAMBER',
    objective: 'Click "ENTER THE CHAMBER" to begin playing on NORMAL difficulty, or select your preferred mode.',
    description: [
      'Congratulations! You have mastered all core systems of the Russian Roulette table:',
      '✓ Discharging at Self (Blanks = Free Turn, Live = 2x Self-Damage)',
      '✓ Discharging at Dealer (Live = 35 HP Damage + 25 Blood Currency)',
      '✓ Complete 11-Item Arsenal & Rarity Synergies',
      '✓ Black Market Shop & Blood Economy',
      '✓ Grim Conditions & Surrender Mechanic',
      '✓ Dealer AI (Reasoning LLM with Local Tactical Fallback)',
      'You are now fully prepared to face the Dealer.'
    ],
    tacticalTip: 'Remember: In Russian Roulette, luck is for amateurs. Strategy, deduction, and cold calculation rule the table.',
    highlightTarget: undefined,
    requiredAction: 'NONE',
    canAdvanceManually: true,
    scriptedSetup: {
      chambers: [
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: false },
        { isLive: false, isSpent: false },
        { isLive: true, isSpent: true },
        { isLive: false, isSpent: true }
      ],
      currentChamberIndex: 0,
      playerHealth: 100,
      dealerHealth: 100,
      playerItems: ['MIRROR', 'SCALPEL', 'WHISKEY', 'SYRINGE'],
      dealerItems: ['MIRROR', 'WHISKEY'],
      bloodCurrency: 100
    }
  }
];
