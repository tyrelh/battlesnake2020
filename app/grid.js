const k = require("./keys");
const log = require("./logger");
const p = require("./params");
const u = require("./utils");


const buildGrid = data => {
  const board = data.board;
  const self = data.you;
  const myLength = self.body.length;
  const numberOfSnakes = board.snakes.length;

  // initailize grid to SPACEs
  let grid = initGrid(board.width, board.height, k.SPACE);

  try {
    // mark edges WALL_NEAR
    for (let y = 0; y < board.height; y++) {
      grid[y][0] = k.WALL_NEAR;
      grid[y][board.width - 1] = k.WALL_NEAR;
    }
    for (let x = 0; x < board.width; x++) {
      grid[0][x] = k.WALL_NEAR;
      grid[board.height - 1][x] = k.WALL_NEAR;
    }
  }
  catch (e) { log.error(`ex in edges marking grid.buildGrid: ${e}`, data.turn); }

  // fill FOOD locations
  try {
    board.food.forEach(({ x, y }) => {
      // if (self.health > p.DONT_EAT_HEALTH) {
      //   grid[y][x] = k.WARNING;
      // }
      // else {
      grid[y][x] = k.FOOD;
      // }
    });
  }
  catch (e) { log.error(`ex in food marking grid.buildGrid: ${e}`, data.turn); }

  try {
    // fill snake locations
    board.snakes.forEach(({ id, name, health, body }) => {
      // fill SNAKE_BODY locations
      body.forEach(({ x, y }) => {
        if (id === self.id) grid[y][x] = k.YOUR_BODY;
        else grid[y][x] = k.SNAKE_BODY;
      });

      // fill ENEMY_HEAD locations
      const head = body[0];
      const snakeSharesMyName = !!(name.toLowerCase().match(p.NAME)) && numberOfSnakes >= 2;
      const dangerSnake = body.length >= myLength;

      
      if (id != self.id) {
        if (dangerSnake || snakeSharesMyName) {
          grid[head.y][head.x] = k.ENEMY_HEAD;
        }
        else {
          grid[head.y][head.x] = k.SMALL_HEAD;
        }
      }

      // check if tail can be marked TAIL or remain SNAKE_BODY
      if (data.turn > 1 && health != 100) {
        const tail = body[body.length - 1];
        grid[tail.y][tail.x] = k.TAIL;
      }

      // // check if tail can be T AIL or SNAKE_BODY
      // let tailSpace = true;
      // // TO do: these checks can be simplified?
      // // check down
      // if (head.y + 1 < board.height && grid[head.y + 1][head.x] < keys.DANGER) {
      //   if (grid[head.y + 1][head.x] === keys.FOOD) tailSpace = false;
      // }
      // // check up
      // if (head.y - 1 >= 0 && grid[head.y - 1][head.x] < keys.DANGER) {
      //   if (grid[head.y - 1][head.x] === keys.FOOD) tailSpace = false;
      // }
      // // check left
      // if (head.x + 1 < board.width && grid[head.y][head.x + 1] < keys.DANGER) {
      //   if (grid[head.y][head.x + 1] === keys.FOOD) tailSpace = false;
      // }
      // // check right
      // if (head.x - 1 >= 0 && grid[head.y][head.x - 1] < keys.DANGER) {
      //   if (grid[head.y][head.x - 1] === keys.FOOD) tailSpace = false;
      // }
      // // check for tail
      // if (tailSpace && data.turn > 3) {
      //   let tail = body[body.length - 1]
      //   grid[tail.y][tail.x] = keys.TAIL;
      // }
    });

    // fill DANGER or KILL_ZONE locations around each snake head
    board.snakes.forEach(({ id, name, health, body }) => {
      if (id == self.id) return;
      let pos = { x: 0, y: 0 };
      const head = body[0];
      const snakeSharesMyName = !!(name.toLowerCase().match(p.NAME)) && numberOfSnakes >= 2;
      let headZone = k.DANGER;
      if (myLength > body.length && !snakeSharesMyName) {
        headZone = k.KILL_ZONE;
      }
      else if (myLength === body.length && !snakeSharesMyName) {
        headZone = k.SMALL_DANGER;
      }

      // check up, down, left, right
      let offsets = [
        {x: 0, y: -1}, // up
        {x: 0, y: 1},  // down
        {x: -1, y: 0}, // left
        {x: 1, y: 0},  // right
      ];
      for (let offset of offsets) {
        pos.x = head.x + offset.x;
        pos.y = head.y + offset.y;
        if (!outOfBounds(pos, grid) && grid[pos.y][pos.x] < k.DANGER) {
          grid[pos.y][pos.x] = headZone;
        }
      }

      // check positions snake could be in 2 moves
      let future2Offsets = [
        {x: -1, y: -1},
        {x: -2, y: 0},
        {x: -1, y: 1},
        {x: 0, y: 2},
        {x: 1, y: 1},
        {x: 2, y: 0},
        {x: 1, y: -1},
        {x: 0, y: -2}
      ];
      for (let offset of future2Offsets) {
        pos.x = head.x + offset.x;
        pos.y = head.y + offset.y;
        if (!outOfBounds(pos, grid) && grid[pos.y][pos.x] <= k.WALL_NEAR && grid[pos.y][pos.x] != k.FOOD) {
          grid[pos.y][pos.x] = k.FUTURE_2;
        }
      }
    });
  }
  catch (e) { log.error(`ex in snakes marking grid.buildGrid: ${e}`, data.turn); }

  if (p.DEBUG_MAPS) printGrid(grid);
  return grid;
};


// manhattan distance
const getDistance = (a, b) => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};


// print grid to logs
const printGrid = grid => {
  let xAxis = "  ";
  for (let x = 0; x < grid[0].length; x++) {
    xAxis += ` ${x % 10}`
  }
  log.status(`${xAxis}\n`);
  for (let i = 0; i < grid.length; i++) {
    let row = `${i % 10} `;
    for (let j = 0; j < grid[0].length; j++) {
      row += ` ${k.MAP[grid[i][j]]}`;
    }
    log.status(row);
  }
};


// create a grid filled with a given value
const initGrid = (width, height, fillValue) => {
  let grid;
  try {
    grid = new Array(height);
    for (let i = 0; i < height; i++) {
      grid[i] = new Array(width);
      for (let j = 0; j < width; j++) {
        grid[i][j] = fillValue;
      }
    }
  }
  catch (e) { log.error(`ex in grid.initGrid: ${e}`, data.turn); }
  return grid;
};


// return a deep copy of game grid
const copyGrid = (grid) => {
  let gridCopy;
  gridCopy = new Array(grid.length);
  for (let i = 0; i < grid.length; i++) {
    gridCopy[i] = new Array(grid[0].length);
    for (let j = 0 ;j< grid[0].length; j++) {
      gridCopy[i][j] = grid[i][j]
    }
  }
  return gridCopy;
};


// test if cells are the same
// const sameCell = (a, b) => a.x === b.x && a.y === b.y;


// check if space is out of bounds
const outOfBounds = ({ x, y }, grid) => {
  try {
    return (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length);
  } catch (e) {
    log.error(`ex in search.outOfBounds: ${e}`);
    return true
  }
};


// pos is on the outer bounds of the board
const onPerimeter = (pos, grid) => {
  try {
    const perimeterLeft = 0;
    const perimeterRight = grid[0].length - 1;
    const perimeterUp = 0;
    const perimeterDown = grid.length - 1;
    if (
      pos.x === perimeterLeft ||
      pos.x === perimeterRight ||
      pos.y === perimeterUp ||
      pos.y === perimeterDown
    ) {
      return true;
    }
  }
  catch (e) { log.error(`ex in self.onPerimiter: ${e}`); }
  return false;
};


// pos is near the outer bounds of the board
const nearPerimeter = (pos, grid) => {
  try {
    const perimeterLeft = 1;
    const perimeterRight = grid[0].length - 2;
    const perimeterUp = 1;
    const perimeterDown = grid.length - 2;
    if (
      pos.x === perimeterLeft ||
      pos.x === perimeterRight ||
      pos.y === perimeterUp ||
      pos.y === perimeterDown
    ) {
      return true;
    }
  }
  catch (e) { log.error(`ex in self.onPerimiter: ${e}`); }
  return false;
};


// make tail segments spaces as if the snake moved ahead given number of turns
const moveSnakes = (moves, grid, data) => {
  try {
    let you = data.you;
    let gridCopy = copyGrid(grid);
    data.board.snakes.forEach(({ id, name, health, body }) => {
      // log.debug(`head: ${u.pairToString(body[0])}, tail: ${u.pairToString(body[body.length - 1])}`);
      for (let tailOffset = 1; tailOffset <= moves; tailOffset++) {
        let tail = body[body.length - tailOffset];
        let tailNext = body[body.length - tailOffset - 1];
        if (grid[tail.y][tail.x] >= k.TAIL) {
          gridCopy[tail.y][tail.x] = k.SPACE;
        }
        else {
          gridCopy[tail.y][tail.x] = grid[tail.y][tail.x];
        }

        if (moves >= 1) gridCopy[tailNext.y][tailNext.x] = k.TAIL;
      }

      if (id === you.id) return;

      // check next move positions for killzone or danger
      const imBigger = you.body.length > body.length;
      let pos = { x: 0, y: 0 };
      const head = body[0];
      const headZone = imBigger ? k.SMALL_HEAD : k.ENEMY_HEAD;
      let offsets = [
        {x: 0, y: -1}, // up
        {x: 0, y: 1},  // down
        {x: -1, y: 0}, // left
        {x: 1, y: 0},  // right
      ];
      for (let offset of offsets) {
        pos.x = head.x + offset.x;
        pos.y = head.y + offset.y;
        if (!outOfBounds(pos, grid) && grid[pos.y][pos.x] <= k.DANGER) {
          gridCopy[pos.y][pos.x] = headZone;
        }
      }

      // check positions snake could be in 2 moves
      let future2Offsets = [
        {x: -1, y: -1},
        {x: -2, y: 0},
        {x: -1, y: 1},
        {x: 0, y: 2},
        {x: 1, y: 1},
        {x: 2, y: 0},
        {x: 1, y: -1},
        {x: 0, y: -2}
      ];
      for (let offset of future2Offsets) {
        pos.x = head.x + offset.x;
        pos.y = head.y + offset.y;
        if (!outOfBounds(pos, grid) && grid[pos.y][pos.x] <= k.WALL_NEAR && grid[pos.y][pos.x] !== k.FOOD) {
          gridCopy[pos.y][pos.x] = k.SMALL_HEAD;
        }
      }
    });
    return gridCopy;
  }
  catch (e) { log.error(`ex in grid.moveTails: ${e}`, data.turn); }
  return grid;
};


module.exports = {
  getDistance,
  buildGrid,
  printGrid,
  initGrid,
  copyGrid,
  onPerimeter,
  nearPerimeter,
  moveSnakes,
  outOfBounds
};
