import React from "react";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";

const GRID_COLUMNS = 4;
const MAX_STAGE = 10;
const GRID_CARD_COUNT = 16;
const STAGE_TRIALS = 3;
const TARGET_LABEL = "ODUZZ";
const BASE_PREVIEW_SECONDS = 1.2;
const PREVIEW_GAIN_PER_TARGET_SECONDS = 0.2;
const MAX_PREVIEW_SECONDS = 2.4;
const POST_PREVIEW_DELAY_SECONDS = 0.8;
const BASE_SEARCH_SECONDS = 6.4;
const SEARCH_DROP_PER_STAGE = 0.25;
const MIN_SEARCH_SECONDS = 3.4;
const MAX_TARGET_COUNT = 8;
const REVIEW_SECONDS = 1.8;
const TIMER_TICK_MS = 100;
const WIN_ADVANCE_DELAY_MS = 1700;
const MEMORY_PROGRESS_STORAGE_KEY = "oduzz-memory-progress";
const SUCCESS_VIBRATION_PATTERN = [40, 60, 40];
const REVIEW_VIBRATION_PATTERN = [25, 80, 25];
const FAILURE_VIBRATION_PATTERN = [60, 120, 60];

// Randomizes arrays so target positions change every round.
function shuffleItems(values) {
  const copy = [...values];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[randomIndex];
    copy[randomIndex] = temp;
  }

  return copy;
}

function getTargetCount(stage) {
  return Math.min(stage + 1, MAX_TARGET_COUNT);
}

// Give later stages slightly more preview time as the number of targets grows.
function getPreviewSeconds(stage) {
  const targetCount = getTargetCount(stage);
  const seconds = BASE_PREVIEW_SECONDS + Math.max(0, targetCount - 2) * PREVIEW_GAIN_PER_TARGET_SECONDS;
  return Number(Math.min(MAX_PREVIEW_SECONDS, seconds).toFixed(1));
}

function pickTargetSlots(targetCount) {
  return shuffleItems(Array.from({ length: GRID_CARD_COUNT }, (_item, index) => index)).slice(0, targetCount);
}

// Keep later rounds challenging without making the timer collapse too quickly.
function getSearchSeconds(stage) {
  const seconds = BASE_SEARCH_SECONDS - (stage - 1) * SEARCH_DROP_PER_STAGE;
  return Number(Math.max(MIN_SEARCH_SECONDS, seconds).toFixed(1));
}

function buildResetQueue(stage, totalScore, trialsLeft, notice) {
  return { stage, totalScore, trialsLeft, notice };
}

// Builds the full state object for a fresh stage or retry.
function buildStageRound(stage, totalScore, trialsLeft = STAGE_TRIALS, notice = "") {
  const targetCount = getTargetCount(stage);
  const targetSlots = pickTargetSlots(targetCount);

  return {
    stage,
    totalScore,
    trialsLeft,
    phase: "ready",
    cards: Array.from({ length: GRID_CARD_COUNT }, (_item, slot) => ({
      id: `slot-${slot + 1}`,
    })),
    targetCount,
    targetCardIds: targetSlots.map((slot) => `slot-${slot + 1}`),
    selectedIds: [],
    previewLeft: getPreviewSeconds(stage),
    postPreviewDelayLeft: POST_PREVIEW_DELAY_SECONDS,
    searchLeft: getSearchSeconds(stage),
    reviewLeft: REVIEW_SECONDS,
    isBoardLocked: true,
    notice,
    lastStageScore: 0,
    queuedReset: null,
  };
}

function calculateStageScore(stage, trialsLeft, searchLeft) {
  const rawScore = stage * 70 + trialsLeft * 40 + Math.ceil(searchLeft * 10);
  return Math.max(50, rawScore);
}

function formatSeconds(value) {
  return Math.max(0, value).toFixed(1);
}

function getCardCoordinates(cardIndex) {
  return {
    row: Math.floor(cardIndex / GRID_COLUMNS) + 1,
    column: (cardIndex % GRID_COLUMNS) + 1,
  };
}

function readSavedProgress() {
  if (typeof window === "undefined") {
    return { bestScore: 0, bestStage: 0 };
  }

  try {
    const raw = window.localStorage.getItem(MEMORY_PROGRESS_STORAGE_KEY);
    if (!raw) return { bestScore: 0, bestStage: 0 };

    const parsed = JSON.parse(raw);
    return {
      bestScore: Number.isFinite(parsed?.bestScore) ? Math.max(0, parsed.bestScore) : 0,
      bestStage: Number.isFinite(parsed?.bestStage) ? Math.max(0, parsed.bestStage) : 0,
    };
  } catch {
    return { bestScore: 0, bestStage: 0 };
  }
}

function persistSavedProgress(progress) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(MEMORY_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors so gameplay still works in private or restricted browsers.
  }
}

function triggerHaptic(pattern) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}

export default function MemoryGame() {
  const stageAdvanceTimeoutRef = React.useRef(null);
  const [game, setGame] = React.useState(() => buildStageRound(1, 0));
  const [bestProgress, setBestProgress] = React.useState(() => readSavedProgress());

  // Derived UI flags used throughout the render tree.
  const isReady = game.phase === "ready";
  const isPreviewing = game.phase === "preview";
  const isPostPreviewDelay = game.phase === "postPreviewDelay";
  const isSearching = game.phase === "search";
  const isReviewing = game.phase === "review";
  const isWon = game.phase === "won";
  const isFailed = game.phase === "failed";
  const isGridLocked = !isSearching || game.isBoardLocked;

  const selectedProgress = isWon ? game.targetCount : Math.min(game.selectedIds.length, game.targetCount);
  const progressPercent = game.targetCount > 0 ? (selectedProgress / game.targetCount) * 100 : 0;
  const stagePreviewSeconds = getPreviewSeconds(game.stage);
  const stageSearchSeconds = getSearchSeconds(game.stage);
  const bestStageLabel = bestProgress.bestStage > 0 ? `Stage ${bestProgress.bestStage}` : "None yet";

  // Drive the timer bar from the active phase so users can track each transition.
  const timerValue = isPreviewing
    ? game.previewLeft
    : isPostPreviewDelay
    ? game.postPreviewDelayLeft
    : isSearching
    ? game.searchLeft
    : isReviewing
    ? game.reviewLeft
    : 0;
  const timerMax = isPreviewing
    ? stagePreviewSeconds
    : isPostPreviewDelay
    ? POST_PREVIEW_DELAY_SECONDS
    : isSearching
    ? stageSearchSeconds
    : isReviewing
    ? REVIEW_SECONDS
    : 1;
  const timerPercent = timerMax > 0 ? (timerValue / timerMax) * 100 : 0;

  // Persist best score and highest cleared stage between visits.
  React.useEffect(() => {
    persistSavedProgress(bestProgress);
  }, [bestProgress]);

  React.useEffect(() => {
    setBestProgress((prev) => {
      const next = {
        bestScore: Math.max(prev.bestScore, game.totalScore),
        bestStage: isWon ? Math.max(prev.bestStage, game.stage) : prev.bestStage,
      };

      if (next.bestScore === prev.bestScore && next.bestStage === prev.bestStage) {
        return prev;
      }

      return next;
    });
  }, [game.totalScore, game.stage, isWon]);

  // Add light haptic feedback on devices that support vibration.
  React.useEffect(() => {
    if (isPreviewing) triggerHaptic(20);
    if (isReviewing) triggerHaptic(REVIEW_VIBRATION_PATTERN);
    if (isWon) triggerHaptic(SUCCESS_VIBRATION_PATTERN);
    if (isFailed) triggerHaptic(FAILURE_VIBRATION_PATTERN);
  }, [isPreviewing, isReviewing, isWon, isFailed]);

  // Clean up any pending stage-advance timeout when the component unmounts.
  React.useEffect(() => {
    return () => {
      if (stageAdvanceTimeoutRef.current) {
        window.clearTimeout(stageAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Countdown for the brief target preview phase.
  React.useEffect(() => {
    if (!isPreviewing) return undefined;

    const timer = window.setInterval(() => {
      setGame((prev) => {
        if (prev.phase !== "preview") return prev;

        const nextPreviewLeft = Number((prev.previewLeft - TIMER_TICK_MS / 1000).toFixed(1));
        if (nextPreviewLeft <= 0) {
          return {
            ...prev,
            phase: "postPreviewDelay",
            previewLeft: 0,
            postPreviewDelayLeft: POST_PREVIEW_DELAY_SECONDS,
            searchLeft: getSearchSeconds(prev.stage),
            selectedIds: [],
            isBoardLocked: true,
            notice: "",
          };
        }

        return {
          ...prev,
          previewLeft: nextPreviewLeft,
        };
      });
    }, TIMER_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPreviewing]);

  // Hold the board briefly after preview so the memory phase and tap phase stay distinct.
  React.useEffect(() => {
    if (!isPostPreviewDelay) return undefined;

    const timer = window.setInterval(() => {
      setGame((prev) => {
        if (prev.phase !== "postPreviewDelay") return prev;

        const nextDelayLeft = Number((prev.postPreviewDelayLeft - TIMER_TICK_MS / 1000).toFixed(1));
        if (nextDelayLeft <= 0) {
          return {
            ...prev,
            phase: "search",
            postPreviewDelayLeft: 0,
            searchLeft: getSearchSeconds(prev.stage),
            selectedIds: [],
            isBoardLocked: false,
            notice: "",
          };
        }

        return {
          ...prev,
          postPreviewDelayLeft: nextDelayLeft,
          isBoardLocked: true,
        };
      });
    }, TIMER_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPostPreviewDelay]);

  // Main search timer that handles retries and failure states.
  React.useEffect(() => {
    if (!isSearching) return undefined;

    const timer = window.setInterval(() => {
      setGame((prev) => {
        if (prev.phase !== "search") return prev;

        const nextSearchLeft = Number((prev.searchLeft - TIMER_TICK_MS / 1000).toFixed(1));
        if (nextSearchLeft <= 0) {
          const nextTrials = prev.trialsLeft - 1;

          if (nextTrials <= 0) {
            return {
              ...prev,
              phase: "failed",
              searchLeft: 0,
              trialsLeft: 0,
              isBoardLocked: true,
              notice: "Time up. No trials left. Review the highlighted answers, then restart.",
            };
          }

          return {
            ...prev,
            phase: "review",
            searchLeft: 0,
            reviewLeft: REVIEW_SECONDS,
            isBoardLocked: true,
            notice: `Time up. Review the answers. ${nextTrials} trial${nextTrials === 1 ? "" : "s"} left.`,
            queuedReset: buildResetQueue(
              prev.stage,
              prev.totalScore,
              nextTrials,
              `Time up. ${nextTrials} trial${nextTrials === 1 ? "" : "s"} left.`
            ),
          };
        }

        return {
          ...prev,
          searchLeft: nextSearchLeft,
        };
      });
    }, TIMER_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSearching]);

  // Briefly reveal the right answers after mistakes before resetting the same stage.
  React.useEffect(() => {
    if (!isReviewing) return undefined;

    const timer = window.setInterval(() => {
      setGame((prev) => {
        if (prev.phase !== "review") return prev;

        const nextReviewLeft = Number((prev.reviewLeft - TIMER_TICK_MS / 1000).toFixed(1));
        if (nextReviewLeft <= 0 && prev.queuedReset) {
          return buildStageRound(
            prev.queuedReset.stage,
            prev.queuedReset.totalScore,
            prev.queuedReset.trialsLeft,
            prev.queuedReset.notice
          );
        }

        return {
          ...prev,
          reviewLeft: nextReviewLeft,
        };
      });
    }, TIMER_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isReviewing]);

  // Auto-advance after a successful stage clear.
  React.useEffect(() => {
    if (!isWon) return undefined;

    stageAdvanceTimeoutRef.current = window.setTimeout(() => {
      setGame((prev) => {
        if (prev.phase !== "won") return prev;

        if (prev.stage >= MAX_STAGE) {
          return buildStageRound(1, 0, STAGE_TRIALS, "All stages cleared. Starting again from Stage 1.");
        }

        return buildStageRound(
          prev.stage + 1,
          prev.totalScore,
          STAGE_TRIALS,
          `Great! Stage ${prev.stage + 1} is ready.`
        );
      });
    }, WIN_ADVANCE_DELAY_MS);

    return () => {
      if (stageAdvanceTimeoutRef.current) {
        window.clearTimeout(stageAdvanceTimeoutRef.current);
        stageAdvanceTimeoutRef.current = null;
      }
    };
  }, [isWon]);

  // Starts the flash-preview sequence for the current stage.
  function startStagePreview() {
    setGame((prev) => {
      if (prev.phase !== "ready") return prev;

      return {
        ...prev,
        phase: "preview",
        previewLeft: getPreviewSeconds(prev.stage),
        postPreviewDelayLeft: POST_PREVIEW_DELAY_SECONDS,
        searchLeft: getSearchSeconds(prev.stage),
        reviewLeft: REVIEW_SECONDS,
        selectedIds: [],
        isBoardLocked: true,
        notice: "",
        queuedReset: null,
      };
    });
  }

  // Returns the entire game to stage one while keeping saved best progress intact.
  function restartGame() {
    if (stageAdvanceTimeoutRef.current) {
      window.clearTimeout(stageAdvanceTimeoutRef.current);
      stageAdvanceTimeoutRef.current = null;
    }

    setGame(buildStageRound(1, 0));
  }

  // Evaluates each card tap during the search phase.
  function handleCardPress(cardId) {
    setGame((prev) => {
      if (prev.phase !== "search") return prev;
      if (prev.isBoardLocked) return prev;
      if (prev.selectedIds.includes(cardId)) return prev;

      const nextSelectedIds = [...prev.selectedIds, cardId];
      if (nextSelectedIds.length < prev.targetCount) {
        return {
          ...prev,
          selectedIds: nextSelectedIds,
        };
      }

      const isCorrectSelection = prev.targetCardIds.every((targetId) => nextSelectedIds.includes(targetId));

      if (isCorrectSelection) {
        const stageScore = calculateStageScore(prev.stage, prev.trialsLeft, prev.searchLeft);
        return {
          ...prev,
          phase: "won",
          selectedIds: nextSelectedIds,
          isBoardLocked: true,
          lastStageScore: stageScore,
          totalScore: prev.totalScore + stageScore,
          notice: "Correct locations found.",
        };
      }

      const nextTrials = prev.trialsLeft - 1;

      if (nextTrials <= 0) {
        return {
          ...prev,
          phase: "failed",
          selectedIds: nextSelectedIds,
          trialsLeft: 0,
          isBoardLocked: true,
          notice: "Wrong locations. No trials left. Review the highlighted answers, then restart.",
        };
      }

      return {
        ...prev,
        phase: "review",
        selectedIds: nextSelectedIds,
        searchLeft: 0,
        reviewLeft: REVIEW_SECONDS,
        isBoardLocked: true,
        notice: `Wrong locations. Review the answer. ${nextTrials} trial${nextTrials === 1 ? "" : "s"} left.`,
        queuedReset: buildResetQueue(
          prev.stage,
          prev.totalScore,
          nextTrials,
          `Wrong locations. ${nextTrials} trial${nextTrials === 1 ? "" : "s"} left.`
        ),
      };
    });
  }

  return (
    <section className="section memoryGamePage">
      <Container>
        <SectionHeader
          kicker="Test Your Memory"
          title="Locate the hidden targets"
          subtitle="Playable on mobile and desktop. Each stage hides more ODUZZ cards, and later stages give you less time to recover them."
        />

        {/* Main game panel with score, timer, board, and result states. */}
        <Reveal delay={0.04}>
          <div className="card memoryGamePanel">
            {/* Desktop keeps controls beside the board so the playable area stays inside the viewport. */}
            <div className="memoryPlayArea">
              <div className="memorySidebar">
                {/* At-a-glance session stats and saved progress. */}
                <div className="memoryStatsGrid">
                  <div className="memoryStat">
                    <span>Stage</span>
                    <strong>{game.stage}/{MAX_STAGE}</strong>
                  </div>
                  <div className="memoryStat">
                    <span>Targets</span>
                    <strong>{game.targetCount}</strong>
                  </div>
                  <div className="memoryStat">
                    <span>Trials left</span>
                    <strong>{game.trialsLeft}</strong>
                  </div>
                  <div className="memoryStat">
                    <span>Timer</span>
                    <strong>
                      {isPreviewing
                        ? `${formatSeconds(game.previewLeft)}s`
                        : isPostPreviewDelay
                        ? `${formatSeconds(game.postPreviewDelayLeft)}s`
                        : isSearching
                        ? `${formatSeconds(game.searchLeft)}s`
                        : isReviewing
                        ? `${formatSeconds(game.reviewLeft)}s`
                        : "Ready"}
                    </strong>
                  </div>
                  <div className="memoryStat">
                    <span>Total score</span>
                    <strong>{game.totalScore}</strong>
                  </div>
                  <div className="memoryStat">
                    <span>Best score</span>
                    <strong>{bestProgress.bestScore}</strong>
                  </div>
                </div>

                {/* Persistent best-stage feedback gives players a longer-term goal. */}
                <p className="memorySessionMeta" role="status" aria-live="polite">
                  Best cleared stage: <strong>{bestStageLabel}</strong>
                </p>

                {/* Progress and timer bars expose selection and phase timing visually. */}
                <div className="memoryProgressRow" aria-label="Selection progress">
                  <div className="memoryProgressTrack">
                    <span className="memoryProgressFill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <small>{selectedProgress}/{game.targetCount} target positions selected</small>
                </div>

                <div className="memoryTimerRow" aria-label="Phase timer">
                  <div className="memoryTimerTrack">
                    <span className="memoryTimerFill" style={{ width: `${timerPercent}%` }} />
                  </div>
                </div>

                {game.notice ? (
                  <p className="memoryNotice" role="status" aria-live="polite">
                    {game.notice}
                  </p>
                ) : null}

                {isReady ? (
                  <div className="memoryStartCard">
                    <p>
                      Stage {game.stage}: {TARGET_LABEL} will flash in <strong>{game.targetCount}</strong> cards for <strong>{stagePreviewSeconds.toFixed(1)}s</strong>, then hide.
                      You get <strong>{stageSearchSeconds.toFixed(1)}s</strong> to tap those exact positions.
                    </p>
                    <p className="memoryHint">
                      Works with keyboard, mouse, and touch. Devices that support vibration also get haptic success and error feedback.
                    </p>
                    <div className="memoryResultActions">
                      <Button variant="primary" onClick={startStagePreview}>Start Stage</Button>
                    </div>
                  </div>
                ) : null}

                {isWon ? (
                  <div className="memoryResult memoryResultWin">
                    <p>
                      <strong>Congratulations!</strong> You cleared Stage {game.stage}.
                    </p>
                    <p>
                      Stage score: <strong>{game.lastStageScore}</strong>. Moving to Stage {game.stage >= MAX_STAGE ? 1 : game.stage + 1}.
                    </p>
                  </div>
                ) : null}

                {isFailed ? (
                  <div className="memoryResult memoryResultLose">
                    <p>You used all {STAGE_TRIALS} trials. The highlighted board shows the correct targets and any wrong picks.</p>
                    <div className="memoryResultActions">
                      <Button variant="primary" onClick={restartGame}>Restart game</Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="memoryBoardColumn">
                <div className="memoryBoardStatus">
                  {isPreviewing ? (
                    <p className="memoryPreviewBadge">
                      Memorize the {game.targetCount} {game.targetCount === 1 ? "target" : "targets"} ({formatSeconds(game.previewLeft)}s)
                    </p>
                  ) : null}

                  {isSearching ? (
                    <p className="memoryHint">
                      Tap the {game.targetCount} card locations where {TARGET_LABEL} flashed before {formatSeconds(game.searchLeft)}s. Higher stages hide more targets and shorten the timer.
                    </p>
                  ) : null}

                  {isPostPreviewDelay ? (
                    <p className="memoryHint">
                      {TARGET_LABEL} is hidden. Wait {formatSeconds(game.postPreviewDelayLeft)}s before the board unlocks.
                    </p>
                  ) : null}

                  {isReviewing ? (
                    <p className="memoryHint">
                      Reviewing answers for {formatSeconds(game.reviewLeft)}s. Green cards were correct targets and red cards were wrong picks.
                    </p>
                  ) : null}
                </div>

                {/* Grid buttons stay keyboard-accessible and expose row/column labels. */}
                <div className="memoryGridShell">
                  {isGridLocked ? <div className="memoryGridLock" aria-hidden="true" /> : null}
                  <div className="memoryGrid" style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}>
                    {game.cards.map((card, cardIndex) => {
                      const { row, column } = getCardCoordinates(cardIndex);
                      const isTarget = game.targetCardIds.includes(card.id);
                      const isSelected = game.selectedIds.includes(card.id);
                      const revealDuringPreview = isPreviewing && isTarget;
                      const revealOnWon = isWon && isTarget;
                      const revealOnReview = isReviewing && (isTarget || isSelected);
                      const revealOnFailed = isFailed && (isTarget || isSelected);
                      const showTargetLabel = revealDuringPreview || revealOnWon || ((isReviewing || isFailed) && isTarget);
                      const isWrongPick = (revealOnReview || revealOnFailed) && isSelected && !isTarget;
                      const isMissedTarget = (isReviewing || isFailed) && isTarget && !isSelected;
                      const cardText = showTargetLabel
                        ? TARGET_LABEL
                        : isWrongPick
                        ? "X"
                        : isSearching && isSelected
                        ? "..."
                        : "?";
                      const cardAriaLabel = [
                        `Row ${row}, column ${column}.`,
                        showTargetLabel
                          ? "Correct target."
                          : isWrongPick
                          ? "Wrong selection."
                          : isSelected
                          ? "Selected card."
                          : "Hidden card.",
                      ].join(" ");

                      return (
                        <button
                          key={card.id}
                          type="button"
                          className={`memoryCard${showTargetLabel ? " revealed target" : ""}${isSelected ? " selected" : ""}${isWrongPick ? " wrong" : ""}${isMissedTarget ? " missed" : ""}${isGridLocked ? " locked" : ""}`}
                          onClick={() => handleCardPress(card.id)}
                          disabled={isGridLocked || isSelected}
                          aria-label={cardAriaLabel}
                          aria-pressed={isSelected}
                        >
                          <span className="memoryCardCoord" aria-hidden="true">
                            R{row} C{column}
                          </span>
                          <span className="memoryCardText" aria-hidden="true">{cardText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
