import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";

const MAX_STAGE = 10;
const GRID_CARD_COUNT = 16;
const STAGE_TRIALS = 3;
const PREVIEW_TICK_MS = 100;
const PREVIEW_START_SECONDS = 2;
const PREVIEW_MIN_SECONDS = 0.8;
const PREVIEW_DROP_PER_STAGE = 0.12;
const FLIP_BACK_DELAY_MS = 650;
const MOBILE_VIEWPORT_QUERY = "(max-width: 900px)";
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

const SYMBOL_POOL = [
  "Wire",
  "Socket",
  "Light",
  "Panel",
  "Battery",
  "Inverter",
  "Protector",
  "Switch",
  "Conduit",
  "Meter",
  "Fuse",
  "Cable",
  "RCCB",
  "MCB",
  "Clamp",
  "Tester",
  "Solar",
  "Lamp",
  "Trunk",
  "Outlet",
];

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

function getPreviewSeconds(stage) {
  const seconds = PREVIEW_START_SECONDS - (stage - 1) * PREVIEW_DROP_PER_STAGE;
  return Number(Math.max(PREVIEW_MIN_SECONDS, seconds).toFixed(1));
}

function buildStageDeck(stage) {
  const pairCount = GRID_CARD_COUNT / 2;
  const startIndex = (stage - 1) % SYMBOL_POOL.length;
  const selectedSymbols = [];

  for (let i = 0; i < pairCount; i += 1) {
    const symbolIndex = (startIndex + i) % SYMBOL_POOL.length;
    selectedSymbols.push(SYMBOL_POOL[symbolIndex]);
  }

  const cards = selectedSymbols.flatMap((symbol, index) => {
    return [
      { id: `${stage}-${index}-a`, symbol },
      { id: `${stage}-${index}-b`, symbol },
    ];
  });

  return shuffleItems(cards);
}

function calculateStageScore(stage, trialsLeft, moves) {
  const raw = stage * 60 + trialsLeft * 45 - moves * 2;
  return Math.max(40, raw);
}

function createStageState(stage, totalScore) {
  return {
    stage,
    totalScore,
    phase: "ready",
    cards: buildStageDeck(stage),
    flippedIds: [],
    matchedIds: [],
    moves: 0,
    trialsLeft: STAGE_TRIALS,
    previewLeft: getPreviewSeconds(stage),
    isBoardLocked: true,
    lastStageScore: 0,
  };
}

export default function MemoryGame() {
  const mismatchTimeoutRef = React.useRef(null);
  const [isMobilePlayable, setIsMobilePlayable] = React.useState(() => detectMobilePlayable());
  const [game, setGame] = React.useState(() => createStageState(1, 0));

  const matchedPairs = game.matchedIds.length / 2;
  const totalPairs = game.cards.length / 2;
  const progressPercent = totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;
  const isPreviewing = game.phase === "preview";
  const isPlaying = game.phase === "playing";

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
      if (mismatchTimeoutRef.current) {
        window.clearTimeout(mismatchTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (game.phase !== "preview") return undefined;

    const timer = window.setInterval(() => {
      setGame((prev) => {
        if (prev.phase !== "preview") return prev;

        const nextLeft = Number((prev.previewLeft - PREVIEW_TICK_MS / 1000).toFixed(1));
        if (nextLeft <= 0) {
          return {
            ...prev,
            phase: "playing",
            previewLeft: 0,
            flippedIds: [],
            isBoardLocked: false,
          };
        }

        return {
          ...prev,
          previewLeft: nextLeft,
        };
      });
    }, PREVIEW_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [game.phase]);

  function startStagePreview() {
    if (mismatchTimeoutRef.current) {
      window.clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }

    setGame((prev) => {
      if (prev.phase !== "ready") return prev;

      return {
        ...prev,
        phase: "preview",
        previewLeft: getPreviewSeconds(prev.stage),
        flippedIds: prev.cards.map((card) => card.id),
        matchedIds: [],
        moves: 0,
        trialsLeft: STAGE_TRIALS,
        isBoardLocked: true,
      };
    });
  }

  function resetToStage(stage, totalScore) {
    if (mismatchTimeoutRef.current) {
      window.clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }

    setGame(createStageState(stage, totalScore));
  }

  function handleCardPress(cardId) {
    setGame((prev) => {
      if (prev.phase !== "playing") return prev;
      if (prev.isBoardLocked) return prev;
      if (prev.flippedIds.includes(cardId) || prev.matchedIds.includes(cardId)) return prev;

      const nextFlipped = [...prev.flippedIds, cardId];
      if (nextFlipped.length < 2) {
        return {
          ...prev,
          flippedIds: nextFlipped,
        };
      }

      const [firstId, secondId] = nextFlipped;
      const firstCard = prev.cards.find((card) => card.id === firstId);
      const secondCard = prev.cards.find((card) => card.id === secondId);
      const nextMoves = prev.moves + 1;

      if (!firstCard || !secondCard) {
        return {
          ...prev,
          flippedIds: [],
          moves: nextMoves,
        };
      }

      if (firstCard.symbol === secondCard.symbol) {
        const nextMatched = [...prev.matchedIds, firstId, secondId];
        const hasClearedStage = nextMatched.length === prev.cards.length;

        if (hasClearedStage) {
          const stageScore = calculateStageScore(prev.stage, prev.trialsLeft, nextMoves);
          return {
            ...prev,
            phase: "won",
            moves: nextMoves,
            flippedIds: [],
            matchedIds: nextMatched,
            isBoardLocked: true,
            lastStageScore: stageScore,
            totalScore: prev.totalScore + stageScore,
          };
        }

        return {
          ...prev,
          moves: nextMoves,
          flippedIds: [],
          matchedIds: nextMatched,
        };
      }

      if (mismatchTimeoutRef.current) {
        window.clearTimeout(mismatchTimeoutRef.current);
      }

      mismatchTimeoutRef.current = window.setTimeout(() => {
        setGame((latest) => {
          if (latest.phase !== "playing") return latest;

          const nextTrials = latest.trialsLeft - 1;
          if (nextTrials <= 0) {
            return {
              ...latest,
              phase: "failed",
              flippedIds: [],
              isBoardLocked: true,
              trialsLeft: 0,
            };
          }

          return {
            ...latest,
            flippedIds: [],
            isBoardLocked: false,
            trialsLeft: nextTrials,
          };
        });
      }, FLIP_BACK_DELAY_MS);

      return {
        ...prev,
        moves: nextMoves,
        flippedIds: nextFlipped,
        isBoardLocked: true,
      };
    });
  }

  function handleNextStage() {
    if (game.stage >= MAX_STAGE) {
      resetToStage(1, 0);
      return;
    }

    resetToStage(game.stage + 1, game.totalScore);
  }

  function handleRestartFromStageOne() {
    resetToStage(1, 0);
  }

  function handleReplayStage() {
    resetToStage(game.stage, game.totalScore);
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
          title="Stage challenge: memorize then match"
          subtitle="16 blocks per stage. Press start when ready."
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
                <span>Moves</span>
                <strong>{game.moves}</strong>
              </div>
              <div className="memoryStat">
                <span>Total score</span>
                <strong>{game.totalScore}</strong>
              </div>
            </div>

            <div className="memoryProgressRow" aria-label="Stage progress">
              <div className="memoryProgressTrack">
                <span className="memoryProgressFill" style={{ width: `${progressPercent}%` }} />
              </div>
              <small>{matchedPairs}/{totalPairs} pairs matched</small>
            </div>

            {game.phase === "ready" ? (
              <div className="memoryStartCard">
                <p>Stage {game.stage} is ready. You will see cards for <strong>{getPreviewSeconds(game.stage)}s</strong>.</p>
                <div className="memoryResultActions">
                  <Button variant="primary" onClick={startStagePreview}>Start Stage</Button>
                </div>
              </div>
            ) : null}

            {isPreviewing ? (
              <p className="memoryPreviewBadge">Memorize now: {game.previewLeft.toFixed(1)}s</p>
            ) : null}

            <div className="memoryGrid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
              {game.cards.map((card) => {
                const isRevealed =
                  game.phase === "preview" ||
                  game.flippedIds.includes(card.id) ||
                  game.matchedIds.includes(card.id);
                const isMatched = game.matchedIds.includes(card.id);

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`memoryCard${isRevealed ? " flipped" : ""}${isMatched ? " matched" : ""}`}
                    onClick={() => handleCardPress(card.id)}
                    disabled={!isPlaying || isMatched || game.isBoardLocked}
                    aria-label={isRevealed ? `Card ${card.symbol}` : "Hidden memory card"}
                  >
                    <span className="memoryCardInner" aria-hidden="true">
                      <span className="memoryCardFace memoryCardFront">?</span>
                      <span className="memoryCardFace memoryCardBack">{card.symbol}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {isPlaying ? (
              <p className="memoryHint">Match all pairs exactly. Each wrong pair costs 1 trial.</p>
            ) : null}

            {game.phase === "won" ? (
              <div className="memoryResult memoryResultWin">
                <p>
                  Stage {game.stage} complete. Stage score: <strong>{game.lastStageScore}</strong>
                </p>
                <div className="memoryResultActions">
                  <Button variant="primary" onClick={handleNextStage}>
                    {game.stage >= MAX_STAGE ? "Restart game" : "Next stage"}
                  </Button>
                  <Button variant="outline" onClick={handleReplayStage}>Replay stage</Button>
                </div>
              </div>
            ) : null}

            {game.phase === "failed" ? (
              <div className="memoryResult memoryResultLose">
                <p>You used all 3 trials. Game restarts from Stage 1.</p>
                <div className="memoryResultActions">
                  <Button variant="primary" onClick={handleRestartFromStageOne}>Restart game</Button>
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
