import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TutorialStep, TUTORIAL_STEPS } from './tutorialData';
import { RotateCcw, X, Info, ArrowRight } from 'lucide-react';
import { playUIClick, playTapSound } from '../audio';

interface TutorialOverlayProps {
  currentStepIndex: number;
  onSetStepIndex: (index: number) => void;
  onRestartStep: () => void;
  onSkipTutorial: () => void;
  onFinishTutorial: () => void;
  inputType?: 'kbm' | 'gamepad';
  doubleDamageActive?: 'player' | 'dealer' | null;
}

export function TutorialOverlay({
  currentStepIndex,
  onSetStepIndex,
  onRestartStep,
  onSkipTutorial,
  onFinishTutorial,
  doubleDamageActive,
}: TutorialOverlayProps) {
  const step: TutorialStep = TUTORIAL_STEPS[currentStepIndex] || TUTORIAL_STEPS[0];
  const [isExpanded, setIsExpanded] = useState(step.id === 'ITEMS_OVERVIEW' || step.stepNumber === 5);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  // Dynamically position the UI to keep critical screen areas completely clear:
  // When aiming at or watching the Dealer, move down to the bottom edge so the Dealer's upper half is unobstructed.
  // When shooting self or manipulating items, stay docked at the top.
  const isTargetingDealer =
    step.highlightTarget === 'shoot-dealer' ||
    (step.id === 'ITEMS_PRACTICE_SCALPEL' && doubleDamageActive === 'player') ||
    step.id === 'CORE_TWIST_LIVE' ||
    step.id === 'DEALER_AI_RETALIATION';

  const dockPosition: 'top' | 'bottom' = isTargetingDealer ? 'bottom' : 'top';

  // Automatically expand info on step 5 ("Study the full item encyclopedia"), and retract for other steps
  useEffect(() => {
    if (step.id === 'ITEMS_OVERVIEW' || step.stepNumber === 5) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [currentStepIndex, step.id, step.stepNumber]);

  const handleNext = useCallback(() => {
    playUIClick('toggle');
    setIsExpanded(false);
    if (isLastStep) {
      onFinishTutorial();
    } else {
      onSetStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, isLastStep, onFinishTutorial, onSetStepIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        if (step.canAdvanceManually) {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (!isFirstStep) {
          e.preventDefault();
          playUIClick('back');
          onSetStepIndex(currentStepIndex - 1);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playTapSound();
        onRestartStep();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        playTapSound();
        setIsExpanded(prev => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSkipTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step.canAdvanceManually, isFirstStep, currentStepIndex, handleNext, onRestartStep, onSetStepIndex, onSkipTutorial]);

  return (
    <div
      className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-[120] w-[95%] max-w-4xl select-none transition-all duration-300 ${
        dockPosition === 'bottom'
          ? 'bottom-4 sm:bottom-6'
          : 'top-3 sm:top-4'
      }`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="pointer-events-auto border-2 border-red-950 bg-[#0a050d]/92 backdrop-blur-md shadow-[0_0_35px_rgba(0,0,0,0.92)] rounded-none overflow-hidden text-neutral-200"
      >
        {/* Top/Bottom Micro Progress Rail: 12 discrete clickable notches */}
        <div className="flex w-full gap-0.5 bg-neutral-950/95 px-3 py-1 border-b border-red-950/70">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                playTapSound();
                onSetStepIndex(idx);
              }}
              title={`Step ${idx + 1}: ${s.title}`}
              className={`h-1 flex-1 transition-all duration-150 cursor-pointer ${
                idx < currentStepIndex
                  ? 'bg-neutral-600 hover:bg-neutral-400'
                  : idx === currentStepIndex
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  : 'bg-neutral-900 hover:bg-neutral-800'
              }`}
            />
          ))}
        </div>

        {/* Streamlined Horizontal Widescreen Command Bar */}
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 font-mono">
          {/* Left: Phase & Title */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <span className="text-red-600 font-extrabold text-xs tracking-wider">//</span>
            <span className="text-red-500 font-extrabold text-[11px] uppercase tracking-wider hidden sm:inline">
              {step.phaseName}
            </span>
            <span className="text-neutral-700 text-xs hidden sm:inline">|</span>
            <span className="px-1.5 py-0.5 border border-neutral-800 bg-neutral-950 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
              {step.stepNumber < 10 ? `0${step.stepNumber}` : step.stepNumber}/{step.totalSteps}
            </span>
          </div>

          {/* Center: Active Directive (Primary focus for player) */}
          <div className="flex items-center gap-2 min-w-0 flex-1 px-2">
            <span className="px-1.5 py-0.5 border border-red-900/80 bg-red-950/40 text-red-400 text-[9px] font-extrabold uppercase tracking-widest shrink-0 hidden md:inline">
              DIRECTIVE
            </span>
            <p className="text-[11px] sm:text-xs font-mono font-bold text-neutral-100 tracking-wide truncate">
              {step.objective}
            </p>
          </div>

          {/* Right: Minimalist Action & Utility Cluster (No Redundancy) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Primary Action Button (Only shown when manual step advancement is valid) */}
            {step.canAdvanceManually && (
              <button
                id="tutorial-primary-btn"
                onClick={handleNext}
                title={isLastStep ? 'Graduate tutorial [N]' : 'Advance directive [N]'}
                className="px-2.5 py-1 rounded-none bg-red-950 text-red-100 border border-red-600 hover:bg-red-900 font-mono text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 active:translate-y-0.5 shadow-[inset_0_0_8px_rgba(220,38,38,0.3)]"
              >
                <span>{isFirstStep ? 'START [N]' : isLastStep ? 'ENTER CHAMBER' : 'NEXT [N]'}</span>
                <ArrowRight size={11} />
              </button>
            )}

            {/* Toggle Info Detail ("i" icon only) */}
            <button
              id="tutorial-toggle-intel-btn"
              onClick={() => {
                playTapSound();
                setIsExpanded(prev => !prev);
              }}
              title="Toggle detailed info [TAB]"
              className={`w-6 h-6 rounded-none border font-mono text-[10px] transition-all cursor-pointer flex items-center justify-center active:translate-y-0.5 ${
                isExpanded
                  ? 'bg-red-950/90 text-red-200 border-red-700'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <Info size={12} />
            </button>

            {/* Step Reset Utility */}
            <button
              id="tutorial-restart-btn"
              onClick={() => {
                playTapSound();
                onRestartStep();
              }}
              title="Reset current step setup [R]"
              className="w-6 h-6 rounded-none bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 flex items-center justify-center font-mono text-[10px] transition-all cursor-pointer active:translate-y-0.5"
            >
              <RotateCcw size={11} />
            </button>

            {/* Exit Tutorial Utility */}
            <button
              id="tutorial-exit-btn"
              onClick={() => {
                playTapSound();
                onSkipTutorial();
              }}
              title="Exit tutorial mode [ESC]"
              className="w-6 h-6 rounded-none bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:bg-red-900/80 hover:border-red-600 flex items-center justify-center font-mono text-[10px] transition-all cursor-pointer active:translate-y-0.5"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Collapsible Tactical Doctrine Drawer: Revealed only on demand without covering action zones */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="overflow-hidden border-t-2 border-red-950 bg-neutral-950/95 px-4 py-3 flex flex-col gap-2 font-mono text-[11px] text-neutral-300 max-h-[220px] overflow-y-auto"
            >
              <div className="space-y-1.5 text-neutral-300 leading-relaxed">
                {step.description.map((paragraph, idx) => (
                  <p key={idx} className="tracking-wide">
                    {paragraph}
                  </p>
                ))}
              </div>

              {step.tacticalTip && (
                <div className="border-l-2 border-red-700 bg-red-950/20 pl-3 py-1.5 text-neutral-400 mt-1">
                  <span className="text-[9px] uppercase tracking-wider text-red-500 font-bold block mb-0.5">
                    TACTICAL DOCTRINE //
                  </span>
                  <p className="text-[10px] italic text-neutral-300 leading-relaxed">
                    {step.tacticalTip}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
