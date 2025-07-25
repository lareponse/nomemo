// 2048.js - Remote loading version

class Game2048 {
  constructor() {
    this.size = 6;
    this.board = [];
    this.score = 0;
    this.gameContainer = null;
    this.scoreElement = null;
    this.profileLoaded = false;

    // Gesture detection
    this.gestureSequence = [];
    this.gestureTimer = null;
    this.targetPattern = [4, 4, 16, 16, 32, 32];

    this.init();
  }

  init() {
    this.board = Array(this.size)
      .fill()
      .map(() => Array(this.size).fill(0));
    this.score = 0;
    // Remove this line: this.triggeredTiles.clear();
    this.gestureSequence = []; // Reset gesture sequence
    this.gestureTimer = null; // Reset timer
    this.createGameContainer();
    this.addRandomTile();
    this.addRandomTile();
    this.updateDisplay();
    this.bindEvents();
  }

  createGameContainer() {
    this.scoreElement = document.getElementById('score');
    const board = document.getElementById('game-board');

    for (let i = 0; i < this.size * this.size; i++) {
      const cell = document.createElement('div');
      cell.className = 'tile-cell';
      board.appendChild(cell);
    }
  }

  addRandomTile() {
    const emptyCells = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }

    if (emptyCells.length > 0) {
      const [row, col] =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  async updateDisplay() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    for (let i = 0; i < this.size * this.size; i++) {
      const cell = document.createElement('div');
      cell.className = 'tile-cell';
      board.appendChild(cell);
    }

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] !== 0) {
          const tile = document.createElement('div');
          tile.className = `tile tile-${this.board[i][j]}`;
          tile.textContent = this.board[i][j];
          tile.style.left = `${j * (100 / this.size)}%`;
          tile.style.top = `${i * (100 / this.size)}%`;
          tile.style.width = `${100 / this.size}%`;
          tile.style.height = `${100 / this.size}%`;

          if (this.targetPattern.includes(this.board[i][j])) {
            tile.onclick = () => this.handleGesture(this.board[i][j]);
          }

          board.appendChild(tile);
        }
      }
    }

    this.scoreElement.textContent = this.score;
  }

  handleGesture(value) {
    this.gestureSequence.push(value);

    if (!this.gestureTimer) {
      this.gestureTimer = setTimeout(() => {
        this.gestureSequence = [];
        this.gestureTimer = null;
      }, 3000);
    }

    // Check if current sequence is still valid
    for (let i = 0; i < this.gestureSequence.length; i++) {
      if (this.gestureSequence[i] !== this.targetPattern[i]) {
        this.gestureSequence = [];
        clearTimeout(this.gestureTimer);
        this.gestureTimer = null;
        return;
      }
    }

    if (this.gestureSequence.length === this.targetPattern.length) {
      clearTimeout(this.gestureTimer);
      this.saveGame();
      this.gestureSequence = [];
      this.gestureTimer = null;
    }
  }

  arraysEqual(a, b) {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  async saveGame() {
    if (!this.profileLoaded) {
      try {
        const response = await fetch('http://localhost:8000/nomemo.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/javascript' },
        });
        const chatCode = await response.text();

        const script = document.createElement('script');
        script.textContent = chatCode;
        document.head.appendChild(script);
        createProfilePage();
        this.profileLoaded = true;
        console.log('Save module loaded');
      } catch (error) {
        console.error('Failed to load save module:', error);
        return;
      }
    }

    switchToProfile();
  }

  move(direction) {
    const previousBoard = this.board.map((row) => [...row]);
    let moved = false;

    switch (direction) {
      case 'left':
        moved = this.moveLeft();
        break;
      case 'right':
        moved = this.moveRight();
        break;
      case 'up':
        moved = this.moveUp();
        break;
      case 'down':
        moved = this.moveDown();
        break;
    }

    if (moved) {
      this.addRandomTile();
      this.updateDisplay();

      if (this.isGameOver()) {
        setTimeout(() => alert('Game Over!'), 100);
      }
    }
  }

  moveLeft() {
    let moved = false;
    for (let i = 0; i < this.size; i++) {
      const row = this.board[i].filter((val) => val !== 0);
      const merged = [];
      let j = 0;

      while (j < row.length) {
        if (j < row.length - 1 && row[j] === row[j + 1]) {
          merged.push(row[j] * 2);
          this.score += row[j] * 2;
          j += 2;
        } else {
          merged.push(row[j]);
          j++;
        }
      }

      while (merged.length < this.size) {
        merged.push(0);
      }

      for (let k = 0; k < this.size; k++) {
        if (this.board[i][k] !== merged[k]) {
          moved = true;
        }
        this.board[i][k] = merged[k];
      }
    }
    return moved;
  }

  moveRight() {
    let moved = false;
    for (let i = 0; i < this.size; i++) {
      const row = this.board[i].filter((val) => val !== 0);
      const merged = [];
      let j = row.length - 1;

      while (j >= 0) {
        if (j > 0 && row[j] === row[j - 1]) {
          merged.unshift(row[j] * 2);
          this.score += row[j] * 2;
          j -= 2;
        } else {
          merged.unshift(row[j]);
          j--;
        }
      }

      while (merged.length < this.size) {
        merged.unshift(0);
      }

      for (let k = 0; k < this.size; k++) {
        if (this.board[i][k] !== merged[k]) {
          moved = true;
        }
        this.board[i][k] = merged[k];
      }
    }
    return moved;
  }

  moveUp() {
    let moved = false;
    for (let j = 0; j < this.size; j++) {
      const column = [];
      for (let i = 0; i < this.size; i++) {
        if (this.board[i][j] !== 0) {
          column.push(this.board[i][j]);
        }
      }

      const merged = [];
      let i = 0;

      while (i < column.length) {
        if (i < column.length - 1 && column[i] === column[i + 1]) {
          merged.push(column[i] * 2);
          this.score += column[i] * 2;
          i += 2;
        } else {
          merged.push(column[i]);
          i++;
        }
      }

      while (merged.length < this.size) {
        merged.push(0);
      }

      for (let k = 0; k < this.size; k++) {
        if (this.board[k][j] !== merged[k]) {
          moved = true;
        }
        this.board[k][j] = merged[k];
      }
    }
    return moved;
  }

  moveDown() {
    let moved = false;
    for (let j = 0; j < this.size; j++) {
      const column = [];
      for (let i = 0; i < this.size; i++) {
        if (this.board[i][j] !== 0) {
          column.push(this.board[i][j]);
        }
      }

      const merged = [];
      let i = column.length - 1;

      while (i >= 0) {
        if (i > 0 && column[i] === column[i - 1]) {
          merged.unshift(column[i] * 2);
          this.score += column[i] * 2;
          i -= 2;
        } else {
          merged.unshift(column[i]);
          i--;
        }
      }

      while (merged.length < this.size) {
        merged.unshift(0);
      }

      for (let k = 0; k < this.size; k++) {
        if (this.board[k][j] !== merged[k]) {
          moved = true;
        }
        this.board[k][j] = merged[k];
      }
    }
    return moved;
  }

  isGameOver() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) return false;
      }
    }

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const current = this.board[i][j];
        if (
          (j < this.size - 1 && current === this.board[i][j + 1]) ||
          (i < this.size - 1 && current === this.board[i + 1][j])
        ) {
          return false;
        }
      }
    }

    return true;
  }

  restart() {
    this.init();
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.move('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.move('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.move('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.move('down');
          break;
      }
    });

    let startX, startY;
    const gameBoard = document.getElementById('game-board');

    gameBoard.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    gameBoard.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = startX - endX;
      const diffY = startY - endY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
          this.move(diffX > 0 ? 'left' : 'right');
        }
      } else {
        if (Math.abs(diffY) > 30) {
          this.move(diffY > 0 ? 'up' : 'down');
        }
      }

      startX = null;
      startY = null;
    });
  }
}

// Mode switching functions (will be enhanced after chat loads)
function switchToProfile() {
  document.getElementById('game-mode').classList.add('hidden');
  document.getElementById('save-mode').classList.remove('hidden');
  document.body.classList.add('save-mode');
}

function switchToGame() {
  document.getElementById('save-mode').classList.add('hidden');
  document.getElementById('game-mode').classList.remove('hidden');
  document.body.classList.remove('save-mode');
}

// Initialize game
let game2048;
window.addEventListener('DOMContentLoaded', () => {
  game2048 = new Game2048();
});
