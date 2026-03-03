import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";

const MAX_STAGE = 10;
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

function getStageCardCount(stage) {
  const desired = 4 + (stage - 1) * 2;
  return Math.min(desired, 24);
}

function getStageTimeLimit(stage) {
  const pairCount = getStageCardCount(stage) / 2;
  return 16 + pairCount * 6 + stage * 2;
}

function calculateStageScore(stage, timeLeft, moves) {
  const score = stage * 40 + timeLeft * 8 - moves * 3;
  return Math.max(30, score);
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

function buildStageDeck(stage) {
  const cardCount = getStageCardCount(stage);
  const pairCount = cardCount / 2;
  const selectedSymbols = [];

  for (let i = 0; i < pairCount; i += 1) {
    selectedSymbols.push(SYMBOL_POOL[i % SYMBOL_POOL.length]);
  }

  const cards = selectedSymbols.flatMap((symbol, index) => {
    return [
      { id: `${stage}-${index}-a`, symbol },
      { id: `${stage}-${index}-b`, symbol },
    ];
  });

  return shuffleItems(cards);
}

function createStageState(stage, totalScore) {
  return {
    stage,
    totalScore,
    lastStageScore: 0,
    status: "playing",
    cards: buildStageDeck(stage),
    flippedIds: [],
    matchedIds: [],
    moves: 0,
    isBoardLocked: false,
    timeLeft: getStageTimeLimit(stage),
  };
}

export default function MemoryGame() {
  const mismatchTimeoutRef = React.useRef(null);
  const [isMobilePlayable, setIsMobilePlayable] = React.useState(() => detectMobilePlayable());
  const [game, setGame] = React.useState(() => createStageState(1, 0));

  const stageTimeLimit = React.useMemo(() => getStageTimeLimit(game.stage), [game.stage]);
  const matchedPairs = game.matchedIds.length / 2;
  const totalPairs = game.cards.length / 2;
  const progressPercent = totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;
  const timePercent = stageTimeLimit > 0 ? (game.timeLeft / stageTimeLimit) * 100 : 0;
  const cardColumns = game.cards.length <= 6 ? 2 : game.cards.length <= 12 ? 3 : 4;

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
    if (!isMobilePlayable) return undefined;
    if (game.status !== "playing") return undefined;

    const timer = window.setInterval(() => {
      setGame((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.timeLeft <= 1) {
          return {
            ...prev,
            timeLeft: 0,
            status: "lost",
            isBoardLocked: false,
            flippedIds: [],
          };
        }

        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [game.status, isMobilePlayable]);

  function startStage(nextStage, nextTotalScore) {
    if (mismatchTimeoutRef.current) {
      window.clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }

    setGame(createStageState(nextStage, nextTotalScore));
  }

  function handleCardPress(cardId) {
    setGame((prev) => {
      if (prev.status !== "playing") return prev;
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
        const hasWon = nextMatched.length === prev.cards.length;

        if (hasWon) {
          const stageScore = calculateStageScore(prev.stage, prev.timeLeft, nextMoves);
          return {
            ...prev,
            moves: nextMoves,
            flippedIds: [],
            matchedIds: nextMatched,
            status: "won",
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
          if (latest.status !== "playing") return latest;
          return {
            ...latest,
            flippedIds: [],
            isBoardLocked: false,
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

  function handleRetryStage() {
    startStage(game.stage, game.totalScore);
  }

  function handleNextStage() {
    if (game.stage >= MAX_STAGE) {
      startStage(1, 0);
      return;
    }

    startStage(game.stage + 1, game.totalScore);
  }

  function handleRestartGame() {
    startStage(1, 0);
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
          title="Match fast before time runs out"
          subtitle="Single-player stage mode. Card count increases each stage."
        />

        <Reveal delay={0.04}>
          <div className="card memoryGamePanel">
            <div className="memoryStatsGrid">
              <div className="memoryStat">
                <span>Stage</span>
                <strong>{game.stage}/{MAX_STAGE}</strong>
              </div>
              <div className="memoryStat">
                <span>Time left</span>
                <strong>{game.timeLeft}s</strong>
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
              <small>{matchedPairs}/{totalPairs} pairs</small>
            </div>

            <div className="memoryTimerRow" aria-label="Time remaining">
              <div className="memoryTimerTrack">
                <span className="memoryTimerFill" style={{ width: `${Math.max(0, timePercent)}%` }} />
              </div>
            </div>

            <div className="memoryGrid" style={{ gridTemplateColumns: `repeat(${cardColumns}, minmax(0, 1fr))` }}>
              {game.cards.map((card) => {
                const isFlipped = game.flippedIds.includes(card.id) || game.matchedIds.includes(card.id);
                const isMatched = game.matchedIds.includes(card.id);

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`memoryCard${isFlipped ? " flipped" : ""}${isMatched ? " matched" : ""}`}
                    onClick={() => handleCardPress(card.id)}
                    disabled={game.status !== "playing" || isMatched || game.isBoardLocked}
                    aria-label={isFlipped ? `Card ${card.symbol}` : "Hidden memory card"}
                  >
                    <span className="memoryCardInner" aria-hidden="true">
                      <span className="memoryCardFace memoryCardFront">?</span>
                      <span className="memoryCardFace memoryCardBack">{card.symbol}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {game.status === "playing" ? (
              <p className="memoryHint">Tap two cards to match each pair before the timer hits zero.</p>
            ) : null}

            {game.status === "won" ? (
              <div className="memoryResult memoryResultWin">
                <p>
                  Stage {game.stage} cleared. Stage score: <strong>{game.lastStageScore}</strong>
                </p>
                <div className="memoryResultActions">
                  <Button variant="primary" onClick={handleNextStage}>
                    {game.stage >= MAX_STAGE ? "Restart game" : "Next stage"}
                  </Button>
                  <Button variant="outline" onClick={handleRetryStage}>Replay stage</Button>
                </div>
              </div>
            ) : null}

            {game.status === "lost" ? (
              <div className="memoryResult memoryResultLose">
                <p>Time up on Stage {game.stage}. Try again before the timer ends.</p>
                <div className="memoryResultActions">
                  <Button variant="primary" onClick={handleRetryStage}>Retry stage</Button>
                  <Button variant="outline" onClick={handleRestartGame}>Restart game</Button>
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
