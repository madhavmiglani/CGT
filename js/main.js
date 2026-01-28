let gameState = null;
let selectedIndices = [];

const startBtn = document.getElementById("startGameBtn");
const setupPanel = document.getElementById("setup-panel");
const gamePanel = document.getElementById("game-panel");
const numPlayersInput = document.getElementById("numPlayers");
const playerDivisorsDiv = document.getElementById("player-divisors");

numPlayersInput.addEventListener("change", renderPlayerInputs);
startBtn.addEventListener("click", startGame);

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
    input.value = i === 0 ? 2 : 3;   // default values
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
    players: divisors.map((d, i) => ({
      id: i,
      divisor: d,
      alive: true
    })),
    currentPlayer: 0,
    history: []
  };

  selectedIndices = [];
  setupPanel.style.display = "none";
  gamePanel.style.display = "block";

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
    `Player ${p.id + 1} (mod ${p.divisor}) turn`;
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
 * Game Logic
 ***********************/
function attemptMove(i, j) {
  const a = gameState.state[i];
  const b = gameState.state[j];
  const player = gameState.players[gameState.currentPlayer];
  const d = player.divisor;

  if ((a + b) % d !== 0) {
    alert(`Illegal move: (${a} + ${b}) mod ${d} ≠ 0`);
    return;
  }

  // Save history
  gameState.history.push({
    state: [...gameState.state],
    currentPlayer: gameState.currentPlayer
  });

  // Remove larger index first
  const idx = [i, j].sort((x, y) => y - x);
  idx.forEach(k => gameState.state.splice(k, 1));

  advancePlayer();
}

/***********************
 * Turn Management
 ***********************/
function advancePlayer() {
  const n = gameState.players.length;

  let next = gameState.currentPlayer;
  do {
    next = (next + 1) % n;
  } while (!gameState.players[next].alive);

  gameState.currentPlayer = next;
  render();
}
