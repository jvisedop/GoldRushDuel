import React, { useRef, useEffect, useState } from "react";

const GAME_WIDTH = 500;
const GAME_HEIGHT = 400;
const CLAW_WIDTH = 60;
const CLAW_HEIGHT = 20;
const CLAW_Y = 40;
const GOLD_RADIUS = 18;
const GOLD_SPEED = 2;
const CLAW_SPEED = 8;
const DROP_SPEED = 8;
const GAME_TIME = 30; // seconds

function randomGoldY() {
  return Math.random() * (GAME_HEIGHT - 100) + 100;
}

function GoldRushGame({ onGameEnd }) {
  const canvasRef = useRef(null);
  const [clawX, setClawX] = useState(GAME_WIDTH / 2 - CLAW_WIDTH / 2);
  const [clawDropping, setClawDropping] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameActive, setGameActive] = useState(false);

  // Refs for animation state
  const goldPiecesRef = useRef([]);
  const scoreRef = useRef(0);
  const clawDropYRef = useRef(CLAW_Y);

  // Keep refs in sync with state
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Start the game
  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameActive(false);
          setTimeout(() => onGameEnd && onGameEnd(scoreRef.current), 500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive, onGameEnd]);

  // Game loop
  useEffect(() => {
    if (!gameActive) return;
    let animationId;
    let lastGoldSpawn = Date.now();
    const goldSpawnInterval = 400; // ms, increase frequency

    function gameLoop() {
      // Move gold pieces
      goldPiecesRef.current = goldPiecesRef.current
        .map((g) => ({ ...g, x: g.x + GOLD_SPEED }))
        .filter((g) => g.x < GAME_WIDTH + GOLD_RADIUS && !g.grabbed);

      // Spawn new gold
      if (Date.now() - lastGoldSpawn > goldSpawnInterval) {
        goldPiecesRef.current.push({
          x: -GOLD_RADIUS,
          y: randomGoldY(),
          grabbed: false,
          id: Math.random().toString(36).substr(2, 9),
        });
        lastGoldSpawn = Date.now();
      }

      // Move claw if dropping
      if (clawDropping) {
        let newY = clawDropYRef.current + DROP_SPEED;
        // Check for collision with gold
        let grabbed = false;
        goldPiecesRef.current = goldPiecesRef.current.map((g) => {
          if (
            !g.grabbed &&
            Math.abs(g.x + GOLD_RADIUS - (clawX + CLAW_WIDTH / 2)) < GOLD_RADIUS &&
            Math.abs(g.y - newY) < GOLD_RADIUS
          ) {
            grabbed = true;
            return { ...g, grabbed: true };
          }
          return g;
        });
        if (grabbed) {
          setScore((s) => s + 1);
          setClawDropping(false);
          clawDropYRef.current = CLAW_Y;
        } else if (newY > GAME_HEIGHT - CLAW_HEIGHT) {
          setClawDropping(false);
          clawDropYRef.current = CLAW_Y;
        } else {
          clawDropYRef.current = newY;
        }
      } else {
        clawDropYRef.current = CLAW_Y;
      }

      draw();
      animationId = requestAnimationFrame(gameLoop);
    }

    function draw() {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw gold pieces
      goldPiecesRef.current.forEach((g) => {
        if (g.grabbed) return;
        ctx.beginPath();
        ctx.arc(g.x + GOLD_RADIUS, g.y, GOLD_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = "#FFD700";
        ctx.fill();
        ctx.strokeStyle = "#B8860B";
        ctx.stroke();
      });

      // Draw claw as a 'V' shape
      const clawCenterX = clawX + CLAW_WIDTH / 2;
      const clawY = clawDropYRef.current;
      const clawArmLength = 30;
      const clawSpread = 18;
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 6;
      ctx.beginPath();
      // Left arm
      ctx.moveTo(clawCenterX, clawY);
      ctx.lineTo(clawCenterX - clawSpread, clawY + clawArmLength);
      // Right arm
      ctx.moveTo(clawCenterX, clawY);
      ctx.lineTo(clawCenterX + clawSpread, clawY + clawArmLength);
      ctx.stroke();
      // Draw claw line (cable)
      ctx.beginPath();
      ctx.moveTo(clawCenterX, 0);
      ctx.lineTo(clawCenterX, clawY);
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw score and timer
      ctx.font = "20px Arial";
      ctx.fillStyle = "#222";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 30);
      ctx.fillText(`Time: ${timeLeft}s`, GAME_WIDTH - 110, 30);
    }

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
    // eslint-disable-next-line
  }, [gameActive, clawDropping, clawX, timeLeft]);

  // Keyboard controls
  useEffect(() => {
    if (!gameActive) return;
    function handleKey(e) {
      if (e.key === "ArrowLeft" || e.key === "a") {
        setClawX((x) => Math.max(0, x - CLAW_SPEED));
      } else if (e.key === "ArrowRight" || e.key === "d") {
        setClawX((x) => Math.min(GAME_WIDTH - CLAW_WIDTH, x + CLAW_SPEED));
      } else if ((e.key === " " || e.key === "ArrowDown" || e.key === "s") && !clawDropping) {
        setClawDropping(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameActive, clawDropping]);

  function startGame() {
    setScore(0);
    setTimeLeft(GAME_TIME);
    goldPiecesRef.current = [];
    setClawX(GAME_WIDTH / 2 - CLAW_WIDTH / 2);
    setClawDropping(false);
    clawDropYRef.current = CLAW_Y;
    setGameActive(true);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Gold Rush Duel</h2>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        style={{ border: "2px solid #333", background: "#f8f8e8" }}
      />
      {!gameActive && (
        <button onClick={startGame} style={{ marginTop: 20, fontSize: 18 }}>
          {timeLeft === 0 ? "Play Again" : "Start Game"}
        </button>
      )}
      <div style={{ marginTop: 10 }}>
        <p>
          <b>Controls:</b> Left/Right arrows (or A/D) to move, Space/Down/S to drop claw.
        </p>
      </div>
    </div>
  );
}

export default GoldRushGame; 