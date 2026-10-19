import { playSound } from './audio';
import { broadcastDiceRollToTable } from './tableChannel';

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export const DIE_MAX: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export interface DiceRollEntry {
  id: string;
  label: string;
  dieType: DieType;
  count: number;
  modifier: number;
  mode: RollMode;
  rolls: number[];
  discardedRoll?: number;
  keptRoll: number;
  keptRolls: number[];
  total: number;
  isCrit: boolean;
  isFumble: boolean;
  isSecretRoll?: boolean;
  timestamp: string;
}

export interface DiceRollRequest {
  label?: string;
  dieType?: DieType;
  count?: number;
  modifier?: number;
  mode?: RollMode;
  formula?: string;
  characterName?: string;
  openModal?: boolean;
  isSecretRoll?: boolean;
}

export interface DiceTrayState {
  isOpen: boolean;
  rolling: boolean;
  selectedDie: DieType;
  count: number;
  modifier: number;
  mode: RollMode;
  activeLabel: string;
  isSecretRoll: boolean;
  currentResult: DiceRollEntry | null;
  history: DiceRollEntry[];
}

type DiceTrayListener = (state: DiceTrayState) => void;

let trayState: DiceTrayState = {
  isOpen: false,
  rolling: false,
  selectedDie: 'd20',
  count: 1,
  modifier: 0,
  mode: 'normal',
  activeLabel: 'Arcane Roll',
  isSecretRoll: false,
  currentResult: null,
  history: [],
};

const listeners = new Set<DiceTrayListener>();

function notifyListeners() {
  const snapshot: DiceTrayState = {
    ...trayState,
    history: [...trayState.history],
  };
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeToDiceTray(listener: DiceTrayListener): () => void {
  listeners.add(listener);
  listener({ ...trayState, history: [...trayState.history] });
  return () => {
    listeners.delete(listener);
  };
}

export function parseDiceFormula(formula: string): {
  count: number;
  dieType: DieType;
  modifier: number;
} {
  const match = formula.match(/(\d+)\s*d\s*(4|6|8|100|10|12|20)(?:\s*([+-]\s*\d+))?/i);
  if (!match) {
    const bonusOnly = formula.match(/([+-]\s*\d+)/);
    return {
      count: 1,
      dieType: 'd20',
      modifier: bonusOnly ? parseInt(bonusOnly[1].replace(/\s+/g, ''), 10) || 0 : 0,
    };
  }
  const count = Math.max(1, Math.min(10, parseInt(match[1], 10) || 1));
  const sides = parseInt(match[2], 10);
  const dieKey = `d${sides}` as DieType;
  const dieType: DieType = DIE_MAX[dieKey] ? dieKey : 'd20';
  const modifier = match[3] ? parseInt(match[3].replace(/\s+/g, ''), 10) || 0 : 0;
  return { count, dieType, modifier };
}

export function openDiceTray() {
  trayState = { ...trayState, isOpen: true };
  notifyListeners();
}

export function closeDiceTray() {
  trayState = { ...trayState, isOpen: false, rolling: false };
  notifyListeners();
}

export function toggleDiceTray() {
  trayState = { ...trayState, isOpen: !trayState.isOpen };
  notifyListeners();
}

export function updateDiceTrayConfig(
  partial: Partial<
    Pick<
      DiceTrayState,
      'selectedDie' | 'count' | 'modifier' | 'mode' | 'activeLabel' | 'isSecretRoll'
    >
  >
) {
  trayState = { ...trayState, ...partial };
  notifyListeners();
}

export function clearDiceHistory() {
  trayState = { ...trayState, history: [], currentResult: null };
  notifyListeners();
}

export function executeRoll(request?: DiceRollRequest): DiceRollEntry {
  let dieType = request?.dieType ?? trayState.selectedDie;
  let count = request?.count ?? trayState.count;
  let modifier = request?.modifier ?? trayState.modifier;
  const mode = request?.mode ?? trayState.mode;
  const label = request?.label ?? trayState.activeLabel ?? 'Arcane Roll';
  const isSecretRoll = request?.isSecretRoll ?? trayState.isSecretRoll;

  if (request?.formula) {
    const parsed = parseDiceFormula(request.formula);
    dieType = parsed.dieType;
    count = parsed.count;
    modifier = parsed.modifier;
  }

  const max = DIE_MAX[dieType] || 20;
  const rolls: number[] = [];
  let discardedRoll: number | undefined;
  let keptRoll = 0;

  if (dieType === 'd20' && count === 1 && mode !== 'normal') {
    const r1 = Math.floor(Math.random() * 20) + 1;
    const r2 = Math.floor(Math.random() * 20) + 1;
    rolls.push(r1, r2);
    if (mode === 'advantage') {
      keptRoll = Math.max(r1, r2);
      discardedRoll = Math.min(r1, r2);
    } else {
      keptRoll = Math.min(r1, r2);
      discardedRoll = Math.max(r1, r2);
    }
  } else {
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * max) + 1;
      rolls.push(r);
      keptRoll += r;
    }
  }

  const total = keptRoll + modifier;
  const isCrit = dieType === 'd20' && count === 1 && keptRoll === 20;
  const isFumble = dieType === 'd20' && count === 1 && keptRoll === 1;

  const entry: DiceRollEntry = {
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    dieType,
    count,
    modifier,
    mode,
    rolls,
    discardedRoll,
    keptRoll,
    keptRolls: [keptRoll],
    total,
    isCrit,
    isFumble,
    isSecretRoll,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  return entry;
}

export function triggerDiceRoll(request?: DiceRollRequest): DiceRollEntry {
  let dieType = request?.dieType ?? trayState.selectedDie;
  let count = request?.count ?? (request?.dieType ? 1 : trayState.count);
  let modifier = request?.modifier ?? (request?.dieType || request?.label ? 0 : trayState.modifier);
  const mode = request?.mode ?? trayState.mode;
  const label = request?.label ?? trayState.activeLabel ?? 'Arcane Roll';
  const isSecretRoll = request?.isSecretRoll ?? trayState.isSecretRoll;

  if (request?.formula) {
    const parsed = parseDiceFormula(request.formula);
    dieType = parsed.dieType;
    count = parsed.count;
    modifier = parsed.modifier;
  }

  playSound('dice_roll');

  const entry = executeRoll({
    dieType,
    count,
    modifier,
    mode,
    label,
    isSecretRoll,
  });

  // Broadcast roll to the Realtime Table Chat & Dice Log Stream
  broadcastDiceRollToTable(
    {
      dieType: entry.dieType,
      count: entry.count,
      modifier: entry.modifier,
      mode: entry.mode,
      rolls: entry.rolls,
      discardedRoll: entry.discardedRoll,
      keptRoll: entry.keptRoll,
      total: entry.total,
      isCrit: entry.isCrit,
      isFumble: entry.isFumble,
      label: entry.label,
    },
    {
      isSecret: isSecretRoll,
      senderName: request?.characterName,
    }
  );

  const shouldOpen = request?.openModal !== false;

  trayState = {
    ...trayState,
    isOpen: shouldOpen ? true : trayState.isOpen,
    rolling: true,
    selectedDie: dieType,
    count,
    modifier,
    mode,
    activeLabel: label,
    isSecretRoll,
  };
  notifyListeners();

  setTimeout(() => {
    if (entry.isCrit) {
      playSound('unlock');
    } else if (entry.isFumble) {
      playSound('alert');
    } else {
      playSound('stone_tap');
    }

    trayState = {
      ...trayState,
      rolling: false,
      currentResult: entry,
      history: [entry, ...trayState.history].slice(0, 20),
    };
    notifyListeners();
  }, 420);

  return entry;
}
