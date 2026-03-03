import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";

const MAX_STAGE = 10;
const GRID_CARD_COUNT = 16;
const STAGE_TRIALS = 3;
const TARGET_LABEL = "ODUZZ";
const PREVIEW_SECONDS = 1;
const BASE_SEARCH_SECONDS = 5;
const SEARCH_DROP_PER_STAGE = 0.35;
const MIN_SEARCH_SECONDS = 2.2;
const MAX_TARGET_COUNT = 9;
const TIMER_TICK_MS = 100;
const WIN_ADVANCE_DELAY_MS = 900;
const MOBILE_VIEWPORT_QUERY = "(max-width: 900px)";
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

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

function detectMobilePlayable() {
  if (typeof window === "undefined") return false;

  const smallViewport = window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
  const touchScreen = window.matchMedia(TOUCH_QUERY).matches;
  const ua = window.navigator.userAgent.toLowerCase();
  const mobileUa = /android|iphone|ipod|mobile|iemobile|opera mini/.test(ua);
  const ipadUa = /ipad/.test(ua);

  return smallViewport && (touchScreen || mobileUa || ipadUa);
}

function getTargetCount(stage) {
  return Math.min(stage + 1, MAX_TARGET_COUNT);
}

function pickTargetSlots(targetCount) {
  return shuffleItems(Array.from({ length: GRID_CARD_COUNT }, (_item, index) => index)).slice(0, targetCount);
}

function getSearchSeconds(stage) {
  const seconds = BASE_SEARCH_SECONDS - (stage - 1) * SEARCH_DROP_PER_STAGE;
  return Number(Math.max(MIN_SEARCH_SECONDS, seconds).toFixed(1));
}

function buildStageRound(stage, totalScore, trialsLeft = STAGE_TRIALS, notice = "") {
  const targetCount = getTargetCount(stage);
  const targetSlots = pickTargetSlots(targetCount);

  const cards = Array.from({ length: GRID_CARD_COUNT }, (_item, slot) => {
    return {
      id: `slot-${slot + 1}`,
    };
  });

  return {
    stage,
    totalScore,
    trialsLeft,
    phase: "ready",
    cards,
    targetCount,
    targetCardIds: targetSlots.map((slot) => `slot-${slot + 1}`),
    selectedIds: [],
    previewLeft: PREVIEW_SECONDS,
    searchLeft: getSearchSeconds(stage),
    isBoardLocked: true,
    notice,
    lastStageScore: 0,
  };
}

function calculateStageScore(stage, trialsLeft, searchLeft) {
  const rawScore = stage * 70 + trialsLeft * 40 + Math.ceil(searchLeft * 10);
  return Math.max(50, rawScore);
}

function formatSeconds(value) {
  return Math.max(0, value).toFixed(1);
}

export default function MemoryGame() {
  const stageAdvanceTimeoutRef = React.useRef(null);
  const [isMobilePlayable, setIsMobilePlayable] = React.useState(() => detectMobilePlayable());
  const [game, setGame] = React.useState(() => buildStageRound(1, 0));

  const isPreviewing = game.phase === "preview";
  const isSearching = game.phase === "search";
  const isWon = game.phase === "won";
  const isFailed = game.phase === "failed";

  const selectedProgress = isWon ? game.targetCount : Math.min(game.selectedIds.length, game.targetCount);
  const progressPercent = game.targetCount > 0 ? (selectedProgress / game.targetCount) * 100 : 0;
  const stageSearchSeconds = getSearchSeconds(game.stage);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleViewportChange = () => {
      setIsMobilePlayable(detectMobilePlayable());
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (stageAdvanceTimeoutRef.current) {
        window.clearTimeout(stageAdvanceTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isPreviewing) return undefined;

    const timer = window.setInterval(() => {
      setGame((prev) => {
        if (prev.phase !== "preview") return prev;

        const nextPreviewLeft = Number((prev.previewLeft - TIMER_TICK_MS / 1000).toFixed(1));
        if (nextPreviewLeft <= 0) {
          return {
            ...prev,
            phase: "search",
            previewLeft: 0,
            searchLeft: getSearchSeconds(prev.stage),
            selectedIds: [],
            isBoardLocked: false,
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
              selectedIds: [],
              isBoardLocked: true,
              notice: "Time up. No trials left.",
            };
          }

          return buildStageRound(
            prev.stage,
            prev.totalScore,
            nextTrials,
            `Time up. ${nextTrials} trial${nextTrials === 1 ? "" : "s"} left.`
          );
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

  function startStagePreview() {
    setGame((prev) => {
      if (prev.phase !== "ready") return prev;

      return {
        ...prev,
        phase: "preview",
        previewLeft: PREVIEW_SECONDS,
        searchLeft: getSearchSeconds(prev.stage),
        selectedIds: [],
        isBoardLocked: true,
        notice: "",
      };
    });
  }

  function restartGame() {
    if (stageAdvanceTimeoutRef.current) {
      window.clearTimeout(stageAdvanceTimeoutRef.current);
      stageAdvanceTimeoutRef.current = null;
    }

    setGame(buildStageRound(1, 0));
  }

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
          notice: "Wrong locations. No trials left.",
        };
      }

      return buildStageRound(
        prev.stage,
        prev.totalScore,
        nextTrials,
        `Wrong locations. ${nextTrials} trial${nextTrials === 1 ? "" : "s"} left.`
      );
    });
  }

  if (!isMobilePlayable) {
    return (
      <section className="section memoryGamePage">
        <Container>
          <SectionHeader
            kicker="Test Your Memory"
            title="Game Not Available On Desktop"
            subtitle="Switch to mobile to access this game."
          />

          <Reveal delay={0.05}>
            <article className="card memoryDesktopOnlyCard">
              <p className="memoryDesktopOnlyText">
                Game not available on desktop. Switch to mobile to access game.
              </p>
              <div className="memoryDesktopOnlyActions">
                <Link to="/">
                  <Button variant="primary">Back home</Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline">Browse products</Button>
                </Link>
              </div>
            </article>
          </Reveal>
        </Container>
      </section>
    );
  }

  return (
    <section className="section memoryGamePage">
      <Container>
        <SectionHeader
          kicker="Test Your Memory"
          title="Locate the hidden numbers"
          subtitle="Press start, memorize for 1 second, then find both positions before time runs out."
        />

        <Reveal delay={0.04}>
          <div className="card memoryGamePanel">
            <div className="memoryStatsGrid">
              <div className="memoryStat">
                <span>Stage</span>
                <strong>{game.stage}/{MAX_STAGE}</strong>
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
                    : isSearching
                    ? `${formatSeconds(game.searchLeft)}s`
                    : "Ready"}
                </strong>
              </div>
              <div className="memoryStat">
                <span>Total score</span>
                <strong>{game.totalScore}</strong>
              </div>
            </div>

            <div className="memoryProgressRow" aria-label="Selection progress">
              <div className="memoryProgressTrack">
                <span className="memoryProgressFill" style={{ width: `${progressPercent}%` }} />
              </div>
              <small>{selectedProgress}/{game.targetCount} target positions selected</small>
            </div>

            {game.notice ? <p className="memoryNotice">{game.notice}</p> : null}

            {game.phase === "ready" ? (
              <div className="memoryStartCard">
                <p>
                  Stage {game.stage}: {TARGET_LABEL} will flash in <strong>{game.targetCount}</strong> cards for <strong>{PREVIEW_SECONDS.toFixed(1)}s</strong>, then hide.
                  You get <strong>{stageSearchSeconds.toFixed(1)}s</strong> to tap those exact card positions.
                </p>
                <div className="memoryResultActions">
                  <Button variant="primary" onClick={startStagePreview}>Start Stage</Button>
                </div>
              </div>
            ) : null}

            {isPreviewing ? (
              <p className="memoryPreviewBadge">
                Memorize where {TARGET_LABEL} appears ({formatSeconds(game.previewLeft)}s)
              </p>
            ) : null}

            {isSearching ? (
              <p className="memoryHint">
                Tap the {game.targetCount} card locations where {TARGET_LABEL} flashed before {formatSeconds(game.searchLeft)}s. Higher stages give less time.
              </p>
            ) : null}

            <div className="memoryGrid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
              {game.cards.map((card) => {
                const isTarget = game.targetCardIds.includes(card.id);
                const isSelected = game.selectedIds.includes(card.id);

                const revealDuringPreview = isPreviewing && isTarget;
                const revealOnWon = isWon && isTarget;
                const revealOnFailed = isFailed && (isTarget || isSelected);
                const showTargetLabel = revealDuringPreview || revealOnWon || (isFailed && isTarget);

                const isWrongPick = revealOnFailed && isSelected && !isTarget;
                const cardText = showTargetLabel
                  ? TARGET_LABEL
                  : isWrongPick
                  ? "X"
                  : isSearching && isSelected
                  ? "..."
                  : "?";

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`memoryCard${showTargetLabel ? " revealed target" : ""}${isSelected ? " selected" : ""}${isWrongPick ? " wrong" : ""}`}
                    onClick={() => handleCardPress(card.id)}
                    disabled={!isSearching || game.isBoardLocked || isSelected}
                    aria-label={showTargetLabel ? `${TARGET_LABEL} card` : "Hidden memory card"}
                  >
                    <span className="memoryCardText" aria-hidden="true">{cardText}</span>
                  </button>
                );
              })}
            </div>

            {isWon ? (
              <div className="memoryResult memoryResultWin">
                <p>
                  Correct. Stage score: <strong>{game.lastStageScore}</strong>. Moving to Stage {game.stage >= MAX_STAGE ? 1 : game.stage + 1}.
                </p>
              </div>
            ) : null}

            {isFailed ? (
              <div className="memoryResult memoryResultLose">
                <p>You used all 3 trials. Restart from Stage 1.</p>
                <div className="memoryResultActions">
                  <Button variant="primary" onClick={restartGame}>Restart game</Button>
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
