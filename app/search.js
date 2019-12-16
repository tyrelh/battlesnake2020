const k = require("./keys");
const g = require("./grid");
const t = require("./target");
const s = require("./self");
const p = require("./params");
const u = require("./utils");
const log = require("./logger");
const astar = require("./astar");


// fill an area
const fill = (direction, grid, data, constraints = []) => {
  const you = data.you;
  let area = 0;
  let closedGrid;
  let openGrid;
  closedGrid = g.initGrid(grid[0].length, grid.length, false);
  openGrid = g.initGrid(grid[0].length, grid.length, false);
  let openStack = [];

  const inGrid = (pos, grd) => {
    try { return grd[pos.y][pos.x]; }
    catch (e) { log.error(`ex in search.fill.inGrid: ${e}`, data.turn); }
  };

  const addToOpen = pos => {
    try {
      if (!outOfBounds(pos, grid) && !inGrid(pos, closedGrid) && !inGrid(pos, openGrid)) {
        if (inGrid(pos, grid) <= k.DANGER) {
          for (let i = 0; i < constraints.length; i++) {
            // if very first cell you test is a killzone or future move, thats fine, dont return
            if (area === 0 && (inGrid(pos, grid) === k.KILL_ZONE || inGrid(pos, grid) === k.FUTURE_2)) break;
            if (inGrid(pos, grid) === constraints[i]) return;
          }
          openStack.push(pos);
          openGrid[pos.y][pos.x] = true;
        }
      }
    }
    catch (e) { log.error(`ex in search.fill.addToOpen: ${e}`, data.turn); }
    return false;
  };

  const removeFromOpen = () => {
    let pos;
    try {
      pos = openStack.pop();
      if (!pos) return false;
      openGrid[pos.y][pos.x] = false;
      return pos;
    }
    catch (e) { log.error(`ex in search.fill.removeFromOpen: ${e}`, data.turn); }
    return false;
  };

  const addToClosed = pos => {
    closedGrid[pos.y][pos.x] = true; 
  };

  let size = you.body.length;
  let current = you.body[0];
  let givenMovePos = {x: current.x, y: current.y};
  switch(direction) {
    case k.UP:
      givenMovePos.y -= 1;
      break;
    case k.DOWN:
      givenMovePos.y += 1;
      break;
    case k.LEFT:
      givenMovePos.x -= 1;
      break;
    case k.RIGHT:
      givenMovePos.x += 1;
  }
  addToOpen(givenMovePos);
  addToClosed(current);

  // things to track for this move
  let enemyHeads = 0;
  let killZones = 0;
  let tails = 0;
  let foods = 0;
  let warnings = 0;
  let walls = 0;

  // iterate over all possible moves given current move
  while (openStack.length > 0) {
    const nextMove = removeFromOpen();
    addToClosed(nextMove);
    switch(inGrid(nextMove, grid)) {
      case k.ENEMY_HEAD:
        enemyHeads++;
        break;
      case k.TAIL:
        tails++;
        break;
      case k.KILL_ZONE:
        killZones++;
        break;
      case k.FOOD:
        foods++;
        break;
      case k.WALL_NEAR:
        walls++;
        break;
      case k.WARNING:
        warnings++;
        break;
      default:
    }
    area++;

    // check up
    const nUp = {x: nextMove.x, y: nextMove.y - 1};
    addToOpen(nUp);
    // check down
    const nDown = {x: nextMove.x, y: nextMove.y + 1};
    addToOpen(nDown);
    // check left
    const nLeft = {x: nextMove.x - 1, y: nextMove.y};
    addToOpen(nLeft);
    // check right
    const nRight = {x: nextMove.x + 1, y: nextMove.y};
    addToOpen(nRight);
  }

  let score = 0;
  score += area * p.BASE_SPACE;
  score += tails * p.BASE_TAIL;
  score += foods * p.BASE_FOOD;
  score += enemyHeads * p.BASE_ENEMY_HEAD;
  score += killZones * p.BASE_KILL_ZONE;
  score += warnings * p.BASE_WARNING;
  score += walls * (p.BASE_WALL_NEAR * p.WALL_NEAR_FILL_MULTIPLIER);

  const myLength = you.body.length;
  if (area < myLength && tails < 1) {
    score = Math.floor(score / 2);
  }

  log.debug(`Score in fill for move ${k.DIRECTION[direction]}: ${score.toFixed(1)}. Area: ${area}`);
  return score;
};


// get flood fill scores for each move
const completeFloodSearch = (grid, data) => {
  let scores = [0, 0, 0, 0];
  try {
    log.status("Performing flood fill searches");
    for (let m = 0; m < 4; m++) {
      // let gridCopy = g.copyGrid(grid);
      scores[m] += fill(m, grid, data);
      let gridCopy = g.moveTails(1, grid, data);
      if (p.DEBUG_MAPS) {
        log.debug("Map for fill search 1 move in advance");
        g.printGrid(gridCopy);
      }
      scores[m] += fill(m, gridCopy, data, [k.KILL_ZONE, k.DANGER, k.WARNING]);
      gridCopy = g.moveTails(2, grid, data);
      if (p.DEBUG_MAPS) {
        log.debug("Map for fill search 2 moves in advance");
        g.printGrid(gridCopy);
      }
      scores[m] += fill(m, gridCopy, data, [k.KILL_ZONE, k.DANGER, k.WARNING, k.FUTURE_2]);
    }
    scores = scores.map((x) => x * p.FLOOD_MULTIPLIER);
  }
  catch (e) { log.error(`ex in search.completeFloodSearch: ${e}`, data.turn); }
  return scores;
};


// score moves based on distance from closest danger snake
const scoresFartherFromDangerousSnake = (grid, data) => {
  let enemyDistanceScores = [0, 0, 0, 0];
  try {
    for (let direction = 0; direction < 4; direction++) {
      const currentDistance = distanceToEnemy(direction, grid, data, k.ENEMY_HEAD);
      log.debug(`Distance to closest dangerous snake for move ${k.DIRECTION[direction]} is ${currentDistance}`);
      if (enemyDistanceScores[direction] < currentDistance) {
        enemyDistanceScores[direction] = (currentDistance * p.ENEMY_DISTANCE);
      }
    }
  }
  catch (e) { log.error(`ex in search.fartherFromDangerousSnake: ${e}`, data.turn); }
  return enemyDistanceScores;
};


// score moves based on distance to closest kill_zone
const scoresCloserToKillableSnakes = (grid, data) => {
  let enemyDistanceScores = [0, 0, 0, 0];
  try {
    for (let direction = 0; direction < 4; direction++) {
      const currentDistance = distanceToEnemy(direction, grid, data, k.KILL_ZONE);
      log.debug(`Distance to closest killable snake for move ${k.DIRECTION[direction]} is ${currentDistance}`);
      if (currentDistance === 0) continue;
      if (enemyDistanceScores[direction] < currentDistance) {
        enemyDistanceScores[direction] = -(currentDistance * p.KILL_DISTANCE);
      }
    }
  }
  catch (e) { log.error(`ex in move.buildMove.closestEnemyHead: ${e}`, data.turn); }
  return enemyDistanceScores;
};


// score moves based on distance from wall
const scoresFartherFromWall = (grid, data) => {
  let wallDistanceScores = [0, 0, 0, 0];
  let minDistance = 9999;
  try {
    for (let direction = 0; direction < 4; direction++) {
      const currentDistance = distanceFromWall(applyMoveToPos(direction, s.location(data)), grid);
      log.debug(`Distance from wall for move ${k.DIRECTION[direction]} is ${currentDistance}`);
      if (wallDistanceScores[direction] < currentDistance) {
        wallDistanceScores[direction] = (currentDistance * p.WALL_DISTANCE);
        if (wallDistanceScores[direction] < minDistance) {
          minDistance = wallDistanceScores[direction]
        }
      }
    }
    wallDistanceScores = wallDistanceScores.map((x) => x - minDistance);
  }
  catch (e) { log.error(`ex in search.scoresFartherFromWall: ${e}`, data.turn); }
  return wallDistanceScores;
};


// preprocess grid to find valuable cells
const preprocessGrid = (grid, data) => {
  try {
    if (p.STATUS) log.status("Preprocessing grid.");
    if (g.nearPerimeter(s.location(data), grid)) {
      if (p.DEBUG) log.debug(`I am near perimeter.`);
      const enemyLocations = getEnemyLocations(data);
      let gridCopy = g.copyGrid(grid);
      for (let enemy of enemyLocations) {
        if (g.onPerimeter(enemy, grid)) {
          if (p.DEBUG) log.debug(`Enemy at ${pairToString(enemy)} is on perimeter`);
          let result = edgeFillFromEnemyToYou(enemy, gridCopy, grid, data);
          gridCopy = result.grid;
        }
      }
      if (p.DEBUG_MAPS) g.printGrid(gridCopy);
      return gridCopy;
    }
  }
  catch (e) { log.error(`ex in search.preprocess: ${e}`, data.turn); }
  return grid;
};


const edgeFillFromEnemyToYou = (enemy, gridCopy, grid, data) => {
  try {
    const yourHead = s.location(data);
    const enemyMoves = getEnemyMoveLocations(enemy, grid);
    for (let enemyMove of enemyMoves) {
      log.debug (`Doing enemy edge fill for move @ ${pairToString(enemyMove)}`);

      // begin fill search

      let closedGrid;
      let openGrid;
      closedGrid = g.initGrid(grid[0].length, grid.length, false);
      openGrid = g.initGrid(grid[0].length, grid.length, false);
      let openStack = [];

      const inGrid = (pos, grd) => {
        try { return grd[pos.y][pos.x]; }
        catch (e) { log.error(`ex in search.edgeFillFromEnemyToYou.inGrid: ${e}`, data.turn); }
        return false;
      };

      const addToOpen = pos => {
        try {
          if (!outOfBounds(pos, grid) && !inGrid(pos, closedGrid) && !inGrid(pos, openGrid)) {
            if (inGrid(pos, grid) <= k.DANGER && g.onPerimeter(pos, grid)) {
              openStack.push(pos);
              openGrid[pos.y][pos.x] = true;
              return true;
            }
          }
        }
        catch (e) { log.error(`ex in search.fill.addToOpen: ${e}`, data.turn); }
        return false;
      };
    
      const removeFromOpen = () => {
        let pos;
        try {
          pos = openStack.pop();
          if (!pos) return false;
          openGrid[pos.y][pos.x] = false;
          return pos;
        }
        catch (e) { log.error(`ex in search.fill.removeFromOpen: ${e}`, data.turn); }
        return false;
      };
    
      const addToClosed = pos => {
        closedGrid[pos.y][pos.x] = true; 
      };

      addToOpen(enemyMove);
      let edgeSpaces = [];
      let foundMe = false;
      let fail = false;
      let nextMove = null;

      while (openStack.length > 0 && !foundMe && !fail) {
        nextMove = removeFromOpen();
        edgeSpaces.push(nextMove);
        addToClosed(nextMove);
        log.debug(`Next move in enemy fill search is ${pairToString(nextMove)}`);

        // check up
        const nextUp = {x: nextMove.x, y: nextMove.y - 1};
        if (!outOfBounds(nextUp, grid)) {
          if (sameCell(yourHead, nextUp)) {
            foundMe = true;
            break;
          }
          if (!g.onPerimeter(nextUp, grid)) {
            if (inGrid(nextUp, grid) < k.SNAKE_BODY) {
              fail = true;
              break;
            }
          }
          addToOpen(nextUp);
        }
        // check down
        const nextDown = {x: nextMove.x, y: nextMove.y + 1};
        if (!outOfBounds(nextDown, grid)) {
          if (sameCell(yourHead, nextDown)) {
            foundMe = true;
            break;
          }
          if ( !g.onPerimeter(nextDown, grid)) {
            if (inGrid(nextDown, grid) < k.SNAKE_BODY) {
              fail = true;
              break;
            }
          }
          addToOpen(nextDown);
        }
        // check left
        const nextLeft = {x: nextMove.x - 1, y: nextMove.y};
        if (!outOfBounds(nextLeft, grid)) {
          if (sameCell(yourHead, nextLeft)) {
            foundMe = true;
            break;
          }
          if ( !g.onPerimeter(nextLeft, grid)) {
            if (inGrid(nextLeft, grid) < k.SNAKE_BODY) {
              fail = true;
              break;
            }
          }
          addToOpen(nextLeft);
        }
        // check right
        const nextRight = {x: nextMove.x + 1, y: nextMove.y};
        if (!outOfBounds(nextRight, grid)) {
          if (sameCell(yourHead, nextRight)) {
            foundMe = true;
            break;
          }
          if (!g.onPerimeter(nextRight, grid)) {
            if (inGrid(nextRight, grid) < k.SNAKE_BODY) {
              fail = true;
              break;
            }
          }
          addToOpen(nextRight);
        }
      }

      if (fail) return { grid: gridCopy, move: null };

      if (foundMe) {
        if (p.STATUS) log.status(`Adding ${edgeSpaces.length} killzones for enemy near ${pairToString(enemy)}`);
        for (let space of edgeSpaces) {
          if (grid[space.y][space.x] < k.SMALL_DANGER) {
            gridCopy[space.y][space.x] = k.KILL_ZONE;
          }
        }
      }

      if (p.DEBUG && p.DEBUG_MAPS) {
        log.debug("Grid after edge fill search:");
        g.printGrid(gridCopy);
      }

      if (foundMe) {
        return { grid: gridCopy, move: nextMove };
      }

    }
  }
  catch (e) { log.error(`ex in search.edgeFillFromEnemyToYou: ${e}`, data.turn); }
  return { grid: gridCopy, move: null };
};


// get a list of all enemy heads
const getEnemyLocations = data => {
  try {
    const you = data.you;
    let locations = [];
    for (let snake of data.board.snakes) {
      if (snake.id === you.id) continue;
      locations.push(snake.body[0]);
    }
    return locations;
  }
  catch (e) { log.error(`ex in search.getEnemyLocations: ${e}`, data.turn); }
  return [];
};


const getEnemyMoveLocations = (pos, grid) => {
  try {
    let positions = [];
    for (let m = 0; m < 4; m++) {
      if (validMove(m, pos, grid)) {
        positions.push(applyMoveToPos(m, pos));
      }
    }
    return positions;
  }
  catch (e) { log.error(`ex in search.getEnemyMoveLocations: ${e}`); }
  return [];
};


// distance from pos to center of board
const distanceToCenter = (direction, startPos, grid, data) => {
  try {
    if (validMove(direction, startPos, grid)) {
      return distanceFromWall(applyMoveToPos(direction, startPos), grid);
    }
  }
  catch (e) { log.error(`ex in search.distanceToCenter: ${e}`, data.turn); }
  return 0;
};


const closeAccessableFuture2FarFromWall = (grid, data) => {
  try {
    // log.debug("calculating closeAccessableFuture2FarFromWall");
    const myHead = s.location(data);
    let target = null;
    let movePos = null;
    let move = null;
    let foundMove = false;
    let gridCopy = g.copyGrid(grid);
    while (!foundMove) {
      target = t.closestTarget(gridCopy, myHead, k.SMALL_HEAD);
      if (target === null) {
        target = t.closestTarget(gridCopy, myHead, k.ENEMY_HEAD);
      }
      // log.debug(`closeAccessableFuture2FarFromWall target: ${target}`);
      if (target === null) {
        return null;
      }
      let future2s = getFuture2InOrderOfDistanceFromWall(grid, target);
      log.debug(`future2s: ${future2s}`);
      if (future2s != null) {
        for (let future2 of future2s) {
            movePos = astar.search(myHead, future2, grid, k.SNAKE_BODY);
            if (movePos) move = u.calcDirection(myHead, movePos);
          // move = astar(grid, data, future2, keys.FUTURE_2);
          if (move != null) {
            return move;
          }
        }
      }
      gridCopy[target.y][target.x] = k.SNAKE_BODY;
    }
  }
  catch (e) { log.error(`ex in search.closeAccessableFuture2FarFromWall: ${e}`, data.turn); }
  return null;
};


const closeAccessableKillZoneFarFromWall = (grid, data) => {
  try {
    const myHead = s.location(data);
    let target = null;
    let movePos = null;
    let move = null;
    let foundMove = false;
    let gridCopy = g.copyGrid(grid);
    while (!foundMove) {
      target = t.closestTarget(gridCopy, myHead, k.SMALL_HEAD);
      if (target === null) {
        return null;
      }
      let killZones = getKillZonesInOrderOfDistanceFromWall(grid, target);
      if (killZones != null) {
        for (let killZone of killZones) {
          // move = astar(grid, data, killZone, keys.KILL_ZONE);
          movePos = astar.search(myHead, killZone, grid, k.SNAKE_BODY);
          if (movePos) move = u.calcDirection(myHead, movePos);
          if (move != null) {
            return move;
          }
        }
      }
      gridCopy[target.y][target.x] = k.ENEMY_HEAD;
    }
  }
  catch (e) { log.error(`ex in search.closeAccessableKillZoneFarFromWall: ${e}`, data.turn); }
  return null;
};


const getFuture2InOrderOfDistanceFromWall = (grid, target) => {
  if (target == null) return null;
  log.debug(`getFuture2InOrderOfDistanceFromWall target: ${u.pairToString(target)}`);
  try {
    let spots = [];
    let spot = {};
    let distance = 0;
    const possibleFuture2Offsets = [
      { x: 0, y: -2 },
      { x: 1, y: -1 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: -1, y: 1 },
      { x: -2, y: 0 },
      { x: -1, y: -1 },
    ];
    for (let offset of possibleFuture2Offsets) {
      spot = { x: target.x + offset.x, y: target.y + offset.y };
      // log.debug(`getFuture2InOrderOfDistanceFromWall spot: ${u.pairToString(spot)}`);
      if (!outOfBounds(spot, grid) && grid[spot.y][spot.x] === k.FUTURE_2) {
        distance = distanceFromWall(spot, grid);
        spots.push({ pos: spot, distance: distance });
      }
    }

    spots.sort(
      (a, b) => (a.distance < b.distance) ? 1 : ((b.distance < a.distance) ? -1 : 0)
    );

    let future2sSorted = [];
    for (spot of spots) {
      future2sSorted.push(spot.pos);
    }
    if (future2sSorted.length < 1) return null;
    return future2sSorted;
  }
  catch (e) { log.error(`ex in search.getFuture2InOrderOfDistanceFromWall: ${e}`); }
  return null;
};


const getKillZonesInOrderOfDistanceFromWall = (grid, target) => {
  try {
    let spots = [];
    let spot = {};
    let distance = 0;
    // check up
    spot = { x: target.x, y: target.y - 1 };
    if (!outOfBounds(spot, grid) && validMove(k.UP, target, grid)) {
      distance = distanceFromWall(spot, grid);
      spots.push({ pos: spot, distance: distance });
    }
    // check down
    spot = { x: target.x, y: target.y + 1 };
    if (!outOfBounds(spot, grid) && validMove(k.DOWN, target, grid)) {
      distance = distanceFromWall(spot, grid);
      spots.push({ pos: spot, distance: distance });
    }
    // check left
    spot = { x: target.x - 1, y: target.y };
    if (!outOfBounds(spot, grid) && validMove(k.LEFT, target, grid)) {
      distance = distanceFromWall(spot, grid);
      spots.push({ pos: spot, distance: distance });
    }
    // check right
    spot = { x: target.x + 1, y: target.y };
    if (!outOfBounds(spot, grid) && validMove(k.RIGHT, target, grid)) {
      distance = distanceFromWall(spot, grid);
      spots.push({ pos: spot, distance: distance });
    }

    spots.sort(
      (a, b) => (a.distance < b.distance) ? 1 : ((b.distance < a.distance) ? -1 : 0)
    );

    let killZones = []
    for (let spot of spots) {
      killZones.push(spot.pos);
    }
    if (killZones.length < 1) return null;
    return killZones;
  }
  catch (e) { log.error(`ex in search.getKillZonesInOrderOfDistanceFromWall: ${e}`); }
  return null;
};


// const getScoresForDistanceFromBigSnakes = (grid) => {
//   try {
//     let enemyDistances = [0, 0, 0, 0];
//     let largestDistance = 0;
//     let largestDistanceMove = 0;
//     let uniqueLargestDistanceMove = false;
//     for (let m = 0; m < 4; m++) {
//       const currentDistance = search.distanceToEnemy(m, grid, data, k.ENEMY_HEAD);
//       log.debug(`Distance to closest dangerous snake for move ${k.DIRECTION[m]} is ${currentDistance}`);
//       if (enemyDistances[m] < currentDistance) {
//         enemyDistances[m] = currentDistance;
//         if (largestDistance === currentDistance) uniqueLargestDistanceMove = false;
//         else if (largestDistance < currentDistance) {
//           largestDistance = currentDistance;
//           largestDistanceMove = m;
//           uniqueLargestDistanceMove = true;
//         }
//       }
//     }
//     if (uniqueLargestDistanceMove){
//       log.debug(`Add ENEMY_DISTANCE ${p.ENEMY_DISTANCE} to move ${k.DIRECTION[largestDistanceMove]} for farther ENEMY_HEAD`);
//       scores[largestDistanceMove] += p.ENEMY_DISTANCE;
//     }
//   }
//   catch (e) { log.error(`ex in move.buildMove.closestEnemyHead: ${e}`, data.turn); }
//   log.status(`Move scores: ${scoresToString(scores)}`);
// };


// calculate the distance a position is from walls
const distanceFromWall = (pos, grid) => {
  try {
    let yUp = pos.y;
    let yDown = (grid.length - 1) - pos.y;
    let xLeft = pos.x;
    let xRight = (grid[0].length - 1) - pos.x;
    let xDistance = Math.min(xLeft, xRight);
    let yDistance = Math.min(yUp, yDown);
    return (xDistance + yDistance);
  }
  catch (e) { log.error(`ex in search.distanceFromWall: ${e}`) };
  return 0;
};


const distanceToEnemy = (direction, grid, data, type = k.ENEMY_HEAD) => {
  try {
    const myHead = s.location(data);
    if (validMove(direction, myHead, grid)) {
      const closestEnemyHead = t.closestTarget(grid, applyMoveToPos(direction, myHead), type);
      if (closestEnemyHead != null) log.debug(`Closest enemy for move ${k.DIRECTION[direction]} is ${u.pairToString(closestEnemyHead)}`);
      if (closestEnemyHead === null) return 0;
      return g.getDistance(closestEnemyHead, applyMoveToPos(direction, myHead));
    }
  }
  catch (e) { log.error(`ex in search.distanceToEnemy: ${e}`, data.turn); }
  return 0;
};


// test if cells are the same
const sameCell = (a, b) => (a.x === b.x && a.y === b.y);


// return pair as string
const pairToString = pair => {
  try { return `{x: ${pair.x}, y: ${pair.y}}`; }
  catch (e) {
    log.error(`ex in search.pairToString: ${e}`);
    return "there was an error caught in search.pairToString";
  }
};


// check if space is out of bounds
const outOfBounds = ({ x, y }, grid) => {
  try {
    if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return true
      else return false
  } catch (e) {
    log.error(`ex in search.outOfBounds: ${e}`);
    return true
  }
};


// check if move is not fatal
const validMove = (direction, pos, grid) => {
  try {
    const newPos = applyMoveToPos(direction, pos);
    if (outOfBounds(newPos, grid)) return false;
    return grid[newPos.y][newPos.x] <= k.DANGER;
  }
  catch (e) {
    log.error(`ex in search.validMove: ${e}\n{direction: ${direction}, pos: ${pairToString(pos)}, grid: ${grid}}`);
    return false;
  }
};


const applyMoveToPos = (move, pos) => {
  switch (move) {
    case k.UP:
      return {x: pos.x, y: pos.y - 1};
    case k.DOWN:
      return {x: pos.x, y: pos.y + 1};
    case k.LEFT:
      return {x: pos.x - 1, y: pos.y};
    case k.RIGHT:
      return {x: pos.x + 1, y: pos.y};
  }
  return {x: 0, y: 0};
};


module.exports = {
  outOfBounds: outOfBounds,
  fill: fill,
  completeFloodSearch: completeFloodSearch,
  scoresFartherFromDangerousSnake: scoresFartherFromDangerousSnake,
  scoresCloserToKillableSnakes: scoresCloserToKillableSnakes,
  scoresFartherFromWall: scoresFartherFromWall,
  distanceToEnemy: distanceToEnemy,
  applyMoveToPos: applyMoveToPos,
  closeAccessableKillZoneFarFromWall: closeAccessableKillZoneFarFromWall,
  distanceToCenter: distanceToCenter,
  closeAccessableFuture2FarFromWall: closeAccessableFuture2FarFromWall,
  preprocessGrid: preprocessGrid
};
