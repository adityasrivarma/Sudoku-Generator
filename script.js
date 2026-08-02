const boardElement = document.getElementById("sudoku-board");
const difficultyElement = document.getElementById("difficulty");
const newGameButton = document.getElementById("new-game");
const checkSolutionButton = document.getElementById("check-solution");
const resetButton = document.getElementById("reset-game");
const messageElement = document.getElementById("message");

const SIZE = 9;
const BOX = 3;
const EMPTY = 0;
const CLUES_BY_DIFFICULTY = {
  easy: 42,
  medium: 34,
  hard: 27
};

let solution = [];
let puzzle = [];

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

function shuffle(values) {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function isSafe(board, row, col, value) {
  for (let i = 0; i < SIZE; i++) {
    if (board[row][i] === value || board[i][col] === value) {
      return false;
    }
  }

  const startRow = Math.floor(row / BOX) * BOX;
  const startCol = Math.floor(col / BOX) * BOX;

  for (let r = startRow; r < startRow + BOX; r++) {
    for (let c = startCol; c < startCol + BOX; c++) {
      if (board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function solveBoard(board) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === EMPTY) {
        for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isSafe(board, row, col, value)) {
            board[row][col] = value;

            if (solveBoard(board)) {
              return true;
            }

            board[row][col] = EMPTY;
          }
        }

        return false;
      }
    }
  }

  return true;
}

function generateSolution() {
  const board = createEmptyBoard();
  solveBoard(board);
  return board;
}

function copyBoard(board) {
  return board.map((row) => [...row]);
}

function countSolutions(board, limit = 2) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === EMPTY) {
        let count = 0;

        for (let value = 1; value <= SIZE; value++) {
          if (isSafe(board, row, col, value)) {
            board[row][col] = value;
            count += countSolutions(board, limit);
            board[row][col] = EMPTY;

            if (count >= limit) {
              return count;
            }
          }
        }

        return count;
      }
    }
  }

  return 1;
}

function makePuzzle(solvedBoard, difficulty) {
  const nextPuzzle = copyBoard(solvedBoard);
  const targetClues = CLUES_BY_DIFFICULTY[difficulty] || CLUES_BY_DIFFICULTY.medium;
  let clues = SIZE * SIZE;

  for (const index of shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i))) {
    if (clues <= targetClues) {
      break;
    }

    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const originalValue = nextPuzzle[row][col];

    nextPuzzle[row][col] = EMPTY;

    if (countSolutions(copyBoard(nextPuzzle)) === 1) {
      clues--;
    } else {
      nextPuzzle[row][col] = originalValue;
    }
  }

  return nextPuzzle;
}

function setMessage(text, type = "") {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`.trim();
}

function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const input = document.createElement("input");
      const value = puzzle[row][col];

      input.className = "cell";
      input.type = "text";
      input.inputMode = "numeric";
      input.maxLength = 1;
      input.autocomplete = "off";
      input.dataset.row = row;
      input.dataset.col = col;
      input.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}`);

      if (value !== EMPTY) {
        input.value = value;
        input.readOnly = true;
        input.classList.add("given");
      }

      input.addEventListener("input", handleCellInput);
      boardElement.appendChild(input);
    }
  }
}

function handleCellInput(event) {
  const input = event.target;
  input.value = input.value.replace(/[^1-9]/g, "").slice(0, 1);
  input.classList.remove("invalid", "correct");
  setMessage("Keep going. Check your solution when the board is complete.");
}

function startNewGame() {
  solution = generateSolution();
  puzzle = makePuzzle(solution, difficultyElement.value);
  renderBoard();
  setMessage("New puzzle generated.");
}

function resetGame() {
  renderBoard();
  setMessage("Puzzle reset.");
}

function checkSolution() {
  const cells = boardElement.querySelectorAll(".cell");
  let hasEmpty = false;
  let hasMistake = false;

  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = Number(cell.value);

    cell.classList.remove("invalid", "correct");

    if (!value) {
      hasEmpty = true;
      return;
    }

    if (value !== solution[row][col]) {
      hasMistake = true;
      cell.classList.add("invalid");
    } else if (!cell.classList.contains("given")) {
      cell.classList.add("correct");
    }
  });

  if (hasMistake) {
    setMessage("Some entries are incorrect.", "error");
  } else if (hasEmpty) {
    setMessage("No mistakes found so far, but the board is not complete.");
  } else {
    setMessage("Solved correctly.", "success");
  }
}

newGameButton.addEventListener("click", startNewGame);
resetButton.addEventListener("click", resetGame);
checkSolutionButton.addEventListener("click", checkSolution);
difficultyElement.addEventListener("change", startNewGame);

startNewGame();
