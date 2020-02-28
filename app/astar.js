// const p = require("./params");
const u = require("./utils");
const log = require("./logger");

// finds the shortest path between start and destination
// returns { distance, pos }
const search = (start, destination, grid, avoidThreshold, returnStart = false) => {
  if (start === null || destination === null) {
    log.status("Start or destination is null in astar. Must call with start and destination coords.");
    return null;
  }

  if (grid === null) {
    log.status("Grid is null in astar. Must call with full game grid to perform searches on.");
    return null;
  }

  if (u.sameCell(start, destination) && returnStart) {
    return { distance: 0, pos: start };
  }

  log.status(`Calculating path (astar) from ${u.pairToString(start)} to ${u.pairToString(destination)}.`);

  // initialize search fields
  const searchScores = buildAstarScoreGrid(grid);
  let openSet = [];
  let closedSet = [];

  // add starting pos to open set
  openSet.push(start);

  while (openSet.length) {
    let lowestCell = { x: 9999, y: 9999 };
    let lowestF = 9999;

    // find cell with lowest f score
    openSet.forEach(({ x, y }) => {
      if (searchScores[y][x].f < lowestF) {
        // TODO: 2018 note: consider changing to <= and then also comparing g scores
        lowestF = searchScores[y][x].f;
        lowestCell = { x: x, y: y };
      }
    });

    // check if found destination
    if (u.sameCell(lowestCell, destination)) {
      log.status("Found a path (lowestCell)");
      // let tempCell = lowestCell;
      // log.debug(`Astar start pos: ${u.pairToString(start)}`);
      // if (!u.sameCell(tempCell, start)) {
      //   while (
      //     searchScores[tempCell.y][tempCell.x].previous.x != start.x ||
      //     searchScores[tempCell.y][tempCell.x].previous.y != start.y
      //     ) {
      //     tempCell = searchScores[tempCell.y][tempCell.x].previous;
      //   }
      // }
      //
      // log.debug(`Astar next move: ${u.pairToString(tempCell)}`);
      // return tempCell;

      return walkback(searchScores, start, lowestCell, returnStart);
    }

    // if not found destination, keep search
    let current = lowestCell;
    let currentCell = searchScores[current.y][current.x];

    // update sets
    openSet = openSet.filter(
      pair => !u.sameCell(pair, current)
    );
    closedSet.push(current);

    // check every viable neighbor to current cell
    const currentNeighbors = searchScores[current.y][current.x].neighbors;
    for (let n = 0; n< currentNeighbors.length; n++) {
      const neighbor = currentNeighbors[n];
      let neighborCell = searchScores[neighbor.y][neighbor.x];
      
      // check if path found
      if (u.sameCell(neighbor, destination)) {
        log.status("Found a path (neighbor)");
        neighborCell.previous = current;
        
        // trace path back to origin to find optimal next move
        // let nextPos = neighbor;
        // log.debug(`Astar start pos: ${u.pairToString(start)}`);
        // while (!u.sameCell(searchScores[nextPos.y][nextPos.x].previous, start)) {
        //   nextPos = searchScores[nextPos.y][nextPos.x].previous;
        // }
        // log.debug(`Astar next move (neighbor): ${u.pairToString(nextPos)}`);
        // return (nextPos);

        return walkback(searchScores, start, neighbor, returnStart);
      }

      // else keep searching
      // check if neighbor can be moved to
      if (neighborCell.state < avoidThreshold) {
        // check if neighbor has already been evaluated
        if (!u.arrayIncludesPair(closedSet, neighbor)) {
          const tempG = currentCell.g + 1;
          let shorter = true;
          // check if already evaluated with lower g score
          if (u.arrayIncludesPair(openSet, neighbor)) {
            if (tempG > neighborCell.g) {
              //TODO 2018 note: change to >=?
              shorter = false
            }
          }
          // if not in either set, add to open set
          else {
            openSet.push(neighbor);
          }
          // this is the current best path, record it
          if (shorter) {
            neighborCell.g = tempG;
            neighborCell.h = u.getDistance(neighbor, destination);
            neighborCell.f = neighborCell.g + neighborCell.h;
            neighborCell.previous = current;
          }
        }
      }
    }
  }
  // if reached this point and open set is empty, no path
  log.status("ASTAR: COULD NOT FIND PATH!");
  return null;
};


// trace path back to origin to find optimal next move
const walkback = (astarScoreGrid, start, destination, returnStart = false) => {
  let nextPos = destination;
  let distance = 0;
  log.debug(`Astar start pos: ${u.pairToString(start)}`);

  if (u.sameCell(start, destination)) {
    log.debug(`Astar start same as destination: ${u.pairToString(destination)}`);
    return { distance: distance, pos: start };
  }

  while (!u.sameCell(astarScoreGrid[nextPos.y][nextPos.x].previous, start)) {
    nextPos = astarScoreGrid[nextPos.y][nextPos.x].previous;
    distance += 1;
  }
  log.debug(`Astar next move: ${u.pairToString(nextPos)}`);
  let pos = returnStart ? astarScoreGrid[nextPos.y][nextPos.x].previous : nextPos;
  return { distance: distance, pos: pos };
};


// construct a parallel search grid to store a* scores
const buildAstarScoreGrid = (grid) => {
  let astarScoreGrid = new Array(grid.length);
  for (let i = 0; i < grid.length; i++) {
    astarScoreGrid[i] = new Array(grid[0].length);
    for (let j = 0; j < grid[0].length; j++) {
      astarScoreGrid[i][j] = new AstarScoreCell(j, i, grid[0].length, grid.length, grid[i][j]);
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
};


module.exports = {
  search
};