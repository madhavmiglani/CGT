let gameState = null;

const startBtn = document.getElementById("startGameBtn");
const setupPanel = document.getElementById("setup-panel");
const gamePanel = document.getElementById("game-panel");

startBtn.addEventListener("click", startGame);

function startGame() {
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
    currentPlayer: 0
  };

  setupPanel.style.display = "none";
  gamePanel.style.display = "block";

  render();
}

function render() {
  const container = document.getElementById("token-container");
  container.innerHTML = "";

  gameState.state.forEach((value, index) => {
    const token = document.createElement("div");
    token.className = "token";
    token.innerText = value;
    container.appendChild(token);
  });

  document.getElementById("current-player").innerText =
    `Player ${gameState.currentPlayer + 1}'s turn`;
}
