const ROWS = 9;
const COLS = 9;
const MINES = 10;

const board = document.getElementById("game-board");
const mineCounter = document.getElementById("mine-counter");
const timer = document.getElementById("timer");
const resetButton = document.getElementById("game-reset");
const flagModeSwitch = document.getElementById("flag-mode");
const statusBar = document.getElementById("game-status");

board.addEventListener("contextmenu", (event) => event.preventDefault());
resetButton.addEventListener("click", newGame);

let started,
  over,
  cells,
  cellsIsMine,
  cellsIsOpen,
  cellsIsFlag,
  cellsNumber,
  minesC,
  flagsC,
  seconds,
  timerInterval,
  cellsRevealed,
  flagMode;

// This function makes n into 3 digit number so it can be displayed on the red screen
function make3digit(n) {
  if (n < 0) {
    return "000";
  } else if (n < 10) {
    return "00" + n;
  } else if (n < 100) {
    return "0" + n;
  } else if (n < 1000) {
    return n;
  } else {
    return "999";
  }
}

function updateDisplays() {
  mineCounter.textContent = make3digit(minesC - flagsC);
  timer.textContent = make3digit(seconds);
}

// This function decides what classes and text should the cell have acording to their state
function drawCell(cell) {
  if (cellsIsOpen[cell]) {
    let num = cellsNumber[cell];
    //classes
    if (num > 0 && !cellsIsMine[cell]) {
      cells[cell].className = "cell-open n" + num;
    } else {
      cells[cell].className = "cell-open";
    }
    //content
    if (cellsIsMine[cell]) {
      cells[cell].textContent = "*";
    } else if (num > 0) {
      cells[cell].textContent = num;
    } else {
      cells[cell].textContent = "";
    }
  } else if (cellsIsFlag[cell]) {
    cells[cell].className = "cell";
    cells[cell].textContent = "F";
  } else {
    cells[cell].className = "cell";
    cells[cell].textContent = "";
  }
}

// Reset values and make the board
function newGame() {
  clearInterval(timerInterval);
  started = false;
  over = false;
  minesC = MINES;
  flagsC = 0;
  seconds = 0;
  cellsRevealed = 0;
  cells = [];
  cellsIsMine = [];
  cellsIsOpen = [];
  cellsIsFlag = [];
  cellsNumber = [];
  flagMode = flagModeSwitch.value;
  board.innerHTML = "";
  let curr;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      let b = document.createElement("button");
      b.type = "button";
      b.className = "cell";
      curr = y * COLS + x;
      cells[curr] = b;
      cellsIsMine[curr] = false;
      cellsIsOpen[curr] = false;
      cellsIsFlag[curr] = false;
      cellsNumber[curr] = 0;
      b.addEventListener("click", function () {
        cellClick(true, x, y);
      });
      b.addEventListener("contextmenu", function () {
        cellClick(false, x, y);
      });
      board.appendChild(b);
    }
  }

  resetButton.textContent = ":)";
  statusBar.textContent = "";
  updateDisplays();
}

// This function decides which cells will have mines, safeX and safeY are the coordinates of first clicked cell so that the player cannot lose in the first click and ucovers some area
function placeMines(safeX, safeY) {
  let placed = 0;

  while (placed < MINES) {
    let selected = Math.floor(Math.random() * cells.length);
    let x = selected % COLS;
    let y = Math.floor(selected / COLS);
    if (
      !cellsIsMine[selected] &&
      (Math.abs(safeX - x) > 1 || Math.abs(safeY - y) > 1) // This makes sure that there are no mines around the first clicked cell
    ) {
      cellsIsMine[selected] = true;
      placed++;
    } else {
      continue;
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (x + dx < 0 || x + dx >= COLS) continue;
        if (y + dy < 0 || y + dy >= ROWS) continue;
        cellsNumber[(y + dy) * COLS + x + dx]++; // Here we update number of mines around the cell so that we do not have to calculate it while playing
      }
    }
  }
}

// This function recursively opens selected cell and adjacent cells if the cell has no mines around it, and handles winning and losing conditions
function reveal(cell) {
  if (cellsIsOpen[cell] || cellsIsFlag[cell]) return;

  let x = cell % COLS;
  let y = Math.floor(cell / COLS);

  if (!started) {
    started = true;
    placeMines(x, y);
    startTimer();
  }

  if (cellsIsMine[cell]) {
    lose(cell);
    return;
  }

  cellsIsOpen[cell] = true;
  drawCell(cell);
  cellsRevealed++;
  if (cellsRevealed === ROWS * COLS - minesC) {
    win();
    return;
  }

  if (cellsNumber[cell] === 0) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (x + dx < 0 || x + dx >= COLS) continue;
        if (y + dy < 0 || y + dy >= ROWS) continue;
        reveal((y + dy) * COLS + x + dx);
      }
    }
  }
}

function flag(cell) {
  if (cellsIsOpen[cell] || !started) return;
  if (cellsIsFlag[cell]) {
    cellsIsFlag[cell] = false;
    flagsC--;
  } else {
    cellsIsFlag[cell] = true;
    flagsC++;
  }
  drawCell(cell);
  updateDisplays();
}

function lose(cell) {
  over = true;
  stopTimer();
  for (let i = 0; i < ROWS * COLS; i++) {
    if (cellsIsMine[i]) {
      cellsIsOpen[i] = true;
      drawCell(i);
    } else if (cellsIsFlag[i]) {
      cellsIsFlag[i] = false;
      drawCell(i);
    }
  }
  cells[cell].className = "cell open boom";
  resetButton.textContent = ":'(";
  statusBar.textContent =
    "Mina wybuchła, naciśnij buźkę żeby zagrać jeszcze raz.";
}

function win() {
  over = true;
  stopTimer();
  for (let i = 0; i < ROWS * COLS; i++) {
    if (cellsIsMine[i]) {
      cellsIsFlag[i] = true;
      flagsC++;
      drawCell(i);
    }
  }
  updateDisplays();
  resetButton.textContent = ":D";
  statusBar.textContent = "Wygrana! Czas gry: " + seconds + "s";
}

// This function is called whe any cell is clicked and decides whether to reveal the cell or flag it
function cellClick(isLeftBtn, x, y) {
  if (over) return;
  flagMode = flagModeSwitch.checked;
  if ((isLeftBtn && !flagMode) || (!isLeftBtn && flagMode)) {
    reveal(y * COLS + x);
  } else {
    flag(y * COLS + x);
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    updateDisplays();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

board.addEventListener;

newGame();
