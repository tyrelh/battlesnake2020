const params = require("./params");
const utils = require("./utils");
const log = require("./logger");


const astar = (start, destination, grid, badSpaceTypes = [], goodSpaceTypes = []) => {
  if (start === null || destination === null) {
    if (params.STATUS) {
      log.status("Start or destination is null in astar. Must call with start and destination coords.");
    }
  }
  if (grid === null) {
    if (params.STATUS) {
      log.status("Grid is null in astar. Must call with full game grid to perform searches on.");
    }
  }
  if (params.STATUS) {
    log.status(`Calculating path (astar) from ${utils.pairToString(start)} to ${utils.pairToString(destination)}.`);
  }

  // initialize search fields
  const astarScoreGrid = buildAstarScoreGrid(grid);
  const openSearchSet = [];
  const closedSearchSet = [];


}


// construct a parallel search grid to store a* scores
const buildAstarScoreGrid = grid => {
  let astarScoreGrid = new Array(grid.length);
  for (let i = 0; i < grid.length; i++) {
    astarScoreGrid[i] = new Array(grid[0].length);
    for (let j = 0; j < grid[0].length; j++) {
      astarGrid[i][j] = new AstarScoreCell(j, i, grid[0].length, grid.length, grid[i][j]);
    }
  }
  return astarScoreGrid;
};


// cell of search grid to store a* scores
class AstarScoreCell {
  constructor(x, y, width, height, state) {
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.x = x;
    this.y = y;
    this.state = state;
    this.neighbors = [];
    this.previous = { x: 9998, y: 9998 };
    if (this.x < width - 1) {
      this.neighbors.push({ x: this.x + 1, y: this.y });
    }
    if (this.x > 0) {
      this.neighbors.push({ x: this.x - 1, y: this.y });
    }
    if (this.y < height - 1) {
      this.neighbors.push({ x: this.x, y: this.y + 1 });
    }
    if (this.y > 0) {
      this.neighbors.push({ x: this.x, y: this.y - 1 });
    }
  }
}


module.exports = {
  astar: astar
}