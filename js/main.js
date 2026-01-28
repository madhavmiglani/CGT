let gameState = null;
let selectedIndices = [];

const startBtn = document.getElementById("startGameBtn");
const setupPanel = document.getElementById("setup-panel");
const gamePanel = document.getElementById("game-panel");
const numPlayersInput = document.getElementById("numPlayers");
const playerDivisorsDiv = document.getElementById("player-divisors");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const moveHistoryUI = document.getElementById("move-history");

const initRadios = document.querySelectorAll('input[name="initType"]');
const manualDiv = document.getElementById("manual-input");
const randomDiv = document.getElementById("random-input");

let undoStack = [];
let redoStack = [];

numPlayersInput.addEventListener("change", renderPlayerInputs);
startBtn.addEventListener("click", startGame);
undoBtn.addEventListener("click", undoMove);
redoBtn.addEventListener("click", redoMove);

initRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    manualDiv.style.display = radio.value === "manual" && radio.checked ? "block" : "none";
    randomDiv.style.display = radio.value === "random" && radio.checked ? "block" : "none";
  });
});

renderPlayerInputs();

/***********************
 * Setup UI
 ***********************/
function renderPlayerInputs() {
  const k = parseInt(numPlayersInput.value);
  playerDivisorsDiv.innerHTML = "";

  for (let i = 0; i < k; i++) {
    const label = document.createElement("label");
    label.innerText = `Player ${i + 1} divisor: `;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.value = i + 2;
    input.id = `divisor-${i}`;

    label.appendChild(input);
    playerDivisorsDiv.appendChild(label);
    playerDivisorsDiv.appendChild(document.createElement("br"));
  }
}

/***********************
 * Game Start
 ***********************/
function startGame() {
  const k = parseInt(numPlayersInput.value);
  const divisors = [];

  for (let i = 0; i < k; i++) {
    const d = parseInt(document.getElementById(`divisor-${i}`).value);
    if (!d || d <= 0) {
      alert("Divisors must be positive integers.");
      return;
    }
    divisors.push(d);
  }

  const manual = document.querySelector('input[name="initType"]:checked').value === "manual";
  let initialState = [];

  if (manual) {
    const text = document.getElementById("manualState").value;
    initialState = text.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  } else {
    const min = parseInt(document.getElementById("randMin").value);
    const max = parseInt(document.getElementById("randMax").value);
    const count = parseInt(document.getElementById("randCount").value);

    for (let i = 0; i < count; i++) {
      const v = Math.floor(Math.random() * (max - min + 1)) + min;
      initialState.push(v);
    }
  }

  if (initialState.length < 2) {
    alert("Please provide at least two numbers.");
    return;
  }

  gameState = {
    state: initialState,
    players: divisors.map((d, i) => ({ id: i, divisor: d, alive: true })),
    currentPlayer: 0
  };

  undoStack = [];
  redoStack = [];
  moveHistoryUI.innerHTML = "";
  selectedIndices = [];

  setupPanel.style.display = "none";
  gamePanel.style.display = "block";

  resolveEliminationSequential();
  render();
}

/***********************
 * Rendering
 ***********************/
function render() {
  const container = document.getElementById("token-container");
  container.innerHTML = "";

  gameState.state.forEach((value, index) => {
    const token = document.createElement("div");
    token.className = "token";
    token.innerText = value;

    if (selectedIndices.includes(index)) {
      token.classList.add("selected");
    }

    token.addEventListener("click", () => onTokenClick(index));
    container.appendChild(token);
  });

  const p = gameState.players[gameState.currentPlayer];
  document.getElementById("current-player").innerText =
    `Player ${p.id + 1}'s turn — divisor = ${p.divisor}`;

  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

/***********************
 * Token Interaction
 ***********************/
function onTokenClick(index) {
  if (selectedIndices.includes(index)) return;

  selectedIndices.push(index);

  if (selectedIndices.length === 2) {
    attemptMove(selectedIndices[0], selectedIndices[1]);
    selectedIndices = [];
  }

  render();
}

/***********************
 * Move Attempt
 ***********************/
function attemptMove(i, j) {
  const a = gameState.state[i];
  const b = gameState.state[j];
  const player = gameState.players[gameState.currentPlayer];
  const d = player.divisor;

  if ((a + b) % d !== 0) {
    alert(`Illegal move: ${a} + ${b} is not divisible by ${d}`);
    return;
  }

  undoStack.push(deepCopy(gameState));
  redoStack = [];

  const idx = [i, j].sort((x, y) => y - x);
  idx.forEach(k => gameState.state.splice(k, 1));

  logMove(player.id, a, b);
  advancePlayer();
}

/***********************
 * Turn Management
 ***********************/
function advancePlayer() {
  const n = gameState.players.length;

  do {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % n;
  } while (!gameState.players[gameState.currentPlayer].alive);

  resolveEliminationSequential();
  render();
}

/***********************
 * Sequential Elimination + Winner
 ***********************/
function resolveEliminationSequential() {
  const n = gameState.players.length;

  while (true) {
    const alivePlayers = gameState.players.filter(p => p.alive);

    if (alivePlayers.length === 1) {
      declareWinner(alivePlayers[0]);
      return;
    }

    const current = gameState.players[gameState.currentPlayer];

    if (hasLegalMove(current.divisor)) return;

    alert(`Player ${current.id + 1} has no legal move and is eliminated.`);
    current.alive = false;

    do {
      gameState.currentPlayer = (gameState.currentPlayer + 1) % n;
    } while (!gameState.players[gameState.currentPlayer].alive);
  }
}

function declareWinner(player) {
  setTimeout(() => {
    const again = confirm(`🏆 Player ${player.id + 1} wins!\n\nPlay again?`);
    if (again) location.reload();
  }, 100);
}

/***********************
 * Legal Move Check
 ***********************/
function hasLegalMove(divisor) {
  const S = gameState.state;
  for (let i = 0; i < S.length; i++) {
    for (let j = i + 1; j < S.length; j++) {
      if ((S[i] + S[j]) % divisor === 0) return true;
    }
  }
  return false;
}

/***********************
 * History + Undo / Redo
 ***********************/
function logMove(playerId, a, b) {
  const li = document.createElement("li");
  li.innerText = `Player ${playerId + 1} removed (${a}, ${b})`;
  moveHistoryUI.appendChild(li);
}

function undoMove() {
  if (undoStack.length === 0) return;
  redoStack.push(deepCopy(gameState));
  gameState = undoStack.pop();
  render();
}

function redoMove() {
  if (redoStack.length === 0) return;
  undoStack.push(deepCopy(gameState));
  gameState = redoStack.pop();
  render();
}

/***********************
 * Utilities
 ***********************/
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
