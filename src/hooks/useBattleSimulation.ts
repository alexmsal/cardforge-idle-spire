import { useState, useRef, useCallback, useEffect } from 'react';
import { BattleEngine } from '../engine/BattleEngine';
import type { Card, EnemyDef, CombatState, BattleSummary, CombatLogEntry, AIRule } from '../models';

export type BattleSpeed = 1 | 2 | 4 | 100;
export type SimState = 'idle' | 'running' | 'paused' | 'stepping' | 'finished';

export interface BattleSnapshot {
  state: CombatState;
  newLogEntries: CombatLogEntry[];
}

function deepCloneState(state: CombatState): CombatState {
  return JSON.parse(JSON.stringify(state));
}

export function useBattleSimulation(
  deckCards: Card[],
  aiRules: AIRule[],
  enemyDefs: EnemyDef[],
) {
  const [simState, setSimState] = useState<SimState>('idle');
  const [snapshot, setSnapshot] = useState<BattleSnapshot | null>(null);
  const [summary, setSummary] = useState<BattleSummary | null>(null);
  const [speed, setSpeed] = useState<BattleSpeed>(1);

  const engineRef = useRef<BattleEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLogLenRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const captureSnapshot = useCallback((): BattleSnapshot | null => {
    const engine = engineRef.current;
    if (!engine) return null;
    const state = engine.getState();
    const allLog = state.log;
    const newEntries = allLog.slice(prevLogLenRef.current);
    prevLogLenRef.current = allLog.length;
    return { state: deepCloneState(state), newLogEntries: newEntries };
  }, []);

  const advanceTurn = useCallback((): boolean => {
    const engine = engineRef.current;
    if (!engine) return false;
    const ongoing = engine.runSingleTurn();
    const snap = captureSnapshot();
    if (snap) setSnapshot(snap);
    if (!ongoing) {
      setSummary(engine.getBattleSummary());
      setSimState('finished');
      clearTimer();
      return false;
    }
    return true;
  }, [captureSnapshot, clearTimer]);

  const scheduleNext = useCallback(
    (currentSpeed: BattleSpeed) => {
      clearTimer();
      if (currentSpeed === 100) {
        // Instant: run all remaining turns synchronously
        let ongoing = true;
        while (ongoing) {
          ongoing = advanceTurn();
        }
        return;
      }
      const delay = 1000 / currentSpeed;
      const tick = () => {
        const ongoing = advanceTurn();
        if (ongoing) {
          timerRef.current = setTimeout(tick, delay);
        }
      };
      timerRef.current = setTimeout(tick, delay);
    },
    [advanceTurn, clearTimer],
  );

  const startBattle = useCallback(() => {
    clearTimer();
    const engine = new BattleEngine(aiRules);
    engine.initCombat(deckCards, enemyDefs);
    engineRef.current = engine;
    prevLogLenRef.current = 0;

    // Capture initial state
    const snap = captureSnapshot();
    if (snap) setSnapshot(snap);
    setSummary(null);
    setSimState('running');
    scheduleNext(speed);
  }, [deckCards, aiRules, enemyDefs, speed, clearTimer, captureSnapshot, scheduleNext]);

  const pause = useCallback(() => {
    clearTimer();
    setSimState('paused');
  }, [clearTimer]);

  const resume = useCallback(() => {
    setSimState('running');
    scheduleNext(speed);
  }, [speed, scheduleNext]);

  const step = useCallback(() => {
    clearTimer();
    setSimState('stepping');
    advanceTurn();
    // Stay in stepping mode unless finished
    setSimState((prev) => (prev === 'finished' ? 'finished' : 'paused'));
  }, [advanceTurn, clearTimer]);

  const changeSpeed = useCallback(
    (newSpeed: BattleSpeed) => {
      setSpeed(newSpeed);
      if (simState === 'running') {
        clearTimer();
        scheduleNext(newSpeed);
      }
    },
    [simState, clearTimer, scheduleNext],
  );

  const reset = useCallback(() => {
    clearTimer();
    engineRef.current = null;
    setSimState('idle');
    setSnapshot(null);
    setSummary(null);
    prevLogLenRef.current = 0;
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    simState,
    snapshot,
    summary,
    speed,
    startBattle,
    pause,
    resume,
    step,
    changeSpeed,
    reset,
  };
}
