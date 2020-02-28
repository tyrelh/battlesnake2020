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

  // things to track for this move
  let enemyHeads = 0;
  let killZones = 0;
  let tails = 0;
  let foods = 0;
  let warnings = 0;
  let walls = 0;
  let dangers = 0;
  let futures = 0;

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
        else {
          switch(inGrid(pos, grid)) {
            case k.ENEMY_HEAD:
            case k.SMALL_HEAD:
              enemyHeads++;
              break;
            default:
          }
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

  // iterate over all possible moves given current move
  while (openStack.length > 0) {
    const nextMove = removeFromOpen();
    addToClosed(nextMove);
    switch(inGrid(nextMove, grid)) {
      // case k.ENEMY_HEAD:
      // case k.SMALL_HEAD:
      //   enemyHeads++;
      //   break;
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
      case k.DANGER:
      case k.SMALL_DANGER:
        dangers++;
        break;
      case k.FUTURE_2:
        futures++;
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
  score += dangers * (p.BASE_DANGER * p.DANGER_FILL_MULTIPLIER);
  score += futures * p.BASE_FUTURE_2;

  // log.debug(`area: ${area} ${area * p.BASE_SPACE}\ntails: ${tails} ${tails * p.BASE_TAIL}\nfoods: ${foods} ${foods * p.BASE_FOOD}\nenemyHeads: ${enemyHeads} ${enemyHeads * p.BASE_ENEMY_HEAD}\nkillZones: ${killZones} ${killZones * p.BASE_KILL_ZONE}\nwarnings: ${warnings} ${warnings * p.BASE_WARNING}\nwalls: ${walls} ${walls * (p.BASE_WALL_NEAR * p.WALL_NEAR_FILL_MULTIPLIER)}\ndangers: ${dangers} ${dangers * (p.BASE_DANGER * p.DANGER_FILL_MULTIPLIER)}\nfutures: ${futures} ${futures * p.BASE_FUTURE_2}`);

  // const myLength = you.body.length;
  // if (area < myLength && tails < 1) {
  //   score = Math.floor(score / 2);
  // }

  log.debug(`Score in fill for move ${k.DIRECTION[direction]}: ${score.toFixed(1)}. Area: ${area}`);
  return score;
};


// get flood fill scores for each move
const completeFloodSearch = (grid, data) => {
  let scores = [0, 0, 0, 0];
  let myHead = s.location(data);
  try {
    log.status("Performing flood fill searches");
    for (let m = 0; m < 4; m++) {
      let move = u.applyMoveToPos(m, myHead);
      if (!g.outOfBounds(move, grid) && grid[move.y][move.x] < k.SNAKE_BODY) {
        scores[m] += fill(m, grid, data);
        let gridCopy = g.moveSnakes(1, grid, data);
        if (p.DEBUG_MAPS) {
          log.debug("Map for fill search 1 move in advance");
          g.printGrid(gridCopy);
        }
        scores[m] += fill(m, gridCopy, data, [k.KILL_ZONE, k.DANGER, k.WARNING, k.SMALL_DANGER]);
        // gridCopy = g.moveSnakes(2, grid, data);
        // if (p.DEBUG_MAPS) {
        //   log.debug("Map for fill search 2 moves in advance");
        //   g.printGrid(gridCopy);
        // }
        // scores[m] += fill(m, gridCopy, data, [k.KILL_ZONE, k.DANGER, k.WARNING, k.SMALL_DANGER, k.FUTURE_2]);
      }
    }
    scores = scores.map((x) => x * p.FLOOD_MULTIPLIER);
  }
  catch (e) { log.error(`ex in search.completeFloodSearch: ${e}`, data.turn); }
  return scores;
};


//  score moves based on distance from tail
const scoresCloserToTails = (grid, data) => {
  let tailScores = [0, 0, 0, 0];
  const myHead = s.location(data);
  try {
    const snakeList = data.board.snakes;
    for (let snake of snakeList) {
      let snakeTail = snake.body[snake.body.length - 1];
      for (let m = 0; m < 4; m++) {
        let movePos = u.applyMoveToPos(m, myHead);
        if (g.validPos(movePos, grid, data)) {
          let result = astar.search(movePos, snakeTail, grid, k.SNAKE_BODY, true);
          if (result) {
            let moveDirection = u.calcDirection(myHead, result.pos, data);
            // tailScores[moveDirection] += (Math.pow(result.distance, p.TAIL_DISTANCE_EXP) / 10);
            tailScores[moveDirection] += (Math.exp((-Math.abs(result.distance))/p.TAIL_DISTANCE_DECAY_RATE) * p.TAIL_DISTANCE_SCALAR)
          }
        }
      }
    }
  }
  catch (e) { log.error(`ex in search.scoresCloserToTails: ${e}`, data.turn); }
  return tailScores;
};


// score moves based on distance from closest danger snake
const scoresFartherFromDangerousSnake = (grid, data) => {
  const myHead = s.location(data);
  const myLength = s.length(data);
  let enemyDistanceScores = [0, 0, 0, 0];
  try {
    for (let direction = 0; direction < 4; direction++) {
      const move = u.applyMoveToPos(direction, myHead);
      if (!g.outOfBounds(move, grid) && grid[move.y][move.x] < k.SNAKE_BODY) {
        for (let snake of data.board.snakes) {
          if (myLength <= snake.body.length) {
            const enemyHead = snake.body[0];
            let distance = u.getDistance(move, enemyHead);
            if (distance) {
              enemyDistanceScores[direction] += Math.pow(distance, p.ENEMY_DISTANCE_EXP);
            }
          }
        }
      }
    }
  }
  catch (e) { log.error(`ex in search.fartherFromDangerousSnake: ${e}`, data.turn); }
  return u.normalizeScores(enemyDistanceScores);
};


// score moves based on distance to closest kill_zone
const scoresCloserToKillableSnakes = (grid, data) => {
  const myHead = s.location(data);
  const myLength = s.length(data);
  let enemyDistanceScores = [0, 0, 0, 0];
  try {
    for (let direction = 0; direction < 4; direction++) {
      const move = u.applyMoveToPos(direction, myHead);
      if (!g.outOfBounds(move, grid) && grid[move.y][move.x] < k.SNAKE_BODY) {
        for (let snake of data.board.snakes) {
          if (myLength > snake.body.length) {
            const enemyHead = snake.body[0];
            let distance = u.getDistance(move, enemyHead);
            if (distance) {
              enemyDistanceScores[direction] -= Math.pow(distance, p.KILL_DISTANCE_EXP);
            }
          }
        }
      }
    }
  }
  catch (e) { log.error(`ex in move.buildMove.closestEnemyHead: ${e}`, data.turn); }
  return u.normalizeScores(enemyDistanceScores);
};


// score moves based on distance from wall
const scoresFartherFromWall = (grid, data) => {
  let wallDistanceScores = [0, 0, 0, 0];
  let minDistance = 9999;
  try {
    for (let direction = 0; direction < 4; direction++) {
      const currentDistance = distanceFromWall(u.applyMoveToPos(direction, s.location(data)), grid);
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


const testForConstrainedMove = (grid, data) => {
  let scores = [0, 0, 0, 0];
  try {
    const myHead = s.location(data);
    for (let m = 0; m < 4; m++) {
      let move = u.applyMoveToPos(m, myHead);
      if (!g.outOfBounds(move, grid) && grid[move.y][move.x] <= k.DANGER) {
        for (let dir = 0; dir < 4; dir++) {
          let check = u.applyMoveToPos(dir, move);
          if (!g.outOfBounds(check, grid) && grid[check.y][check.x] <= k.WARNING) {
            scores[m] += p.CONSTRAINED_MOVE_MULTIPLIER
          }
        }
      }
    }
  }
  catch (e) { log.error(`ex in search.testForConstrainedMove: ${e}`, data.turn); }
  return scores;
};


// get a list of all enemy heads
const getEnemyLocations = (data) => {
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
        positions.push(u.applyMoveToPos(m, pos));
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
      return distanceFromWall(u.applyMoveToPos(direction, startPos), grid);
    }
  }
  catch (e) { log.error(`ex in search.distanceToCenter: ${e}`, data.turn); }
  return 0;
};


// get distance scores for foods directly from data
const foodScoresFromData = (urgency = 1, grid, data) => {
  // log.debug("FOODSCORESFROMDATA");
  let scores = [0, 0, 0, 0];
  try {
    let foodList = data.board.food;
    let myHead = s.location(data);
    // loop over every food on board
    for (let foodIndex = 0; foodIndex < foodList.length; foodIndex++) {
      let food = foodList[foodIndex];
      // loop over every move
      let distances = [0, 0, 0, 0];
      for (let m = 0; m < 4; m++) {
        let startPos = u.applyMoveToPos(m, myHead);
        // log.debug(`Start pos: ${u.pairToString(startPos)}`);
        // if move is valid search path to food
        if (!g.outOfBounds(startPos, grid) && grid[startPos.y][startPos.x] < k.SNAKE_BODY) {
          let movePos = null;
          let distance = 1;
          let move = null;
          let result = astar.search(startPos, food, grid, k.SNAKE_BODY, true);
          // if path was found
          if (result) {
            movePos = result.pos;
            distance = result.distance;
            if (movePos) {
              move = u.calcDirection(myHead, movePos, data);
            }
            if (move != null) {
              log.debug(`Distance: ${distance}`);
              distances[m] = distance;
              if (grid[startPos.y][startPos.x] >= k.SMALL_DANGER) {
                distances[m] = distances[m] * 2;
              }
            }
          }
        }
      }
      const maxDistance = Math.max.apply(Math, distances);
      log.debug(`Max Distance: ${maxDistance}`);
      for (let m = 0; m < 4; m++) {
        log.debug(`Move: ${k.DIRECTION[m]}`);
        let distance = maxDistance - distances[m];
        if (distance < 0 || distances[m] <= 0) {
          distance = 0;
        }
        log.debug(`Relative Distance: ${distance}`);
        scores[m] += (urgency * Math.pow(distance, p.FOOD_DISTANCE_EXP));
        log.debug(`Score: ${(urgency * Math.pow(distance, p.FOOD_DISTANCE_EXP))}`);
      }
    }
  }
  catch (e) { log.error(`ex in search.emergencyFoodScoresFromData`, data.turn); }
  return scores;
};


// get distance scores for foods from grid
const foodScoresFromGrid = (urgency = 1, grid, data) => {
  // log.debug("got here");
  let scores = [0, 0, 0, 0];
  try {
    const myHead = s.location(data);
    let gridCopy = g.copyGrid(grid);
    let food = null;
    while (true) {
      // get next closest food from grid
      food = t.closestFood(myHead, gridCopy, data);
      if (food == null) {
        break;
      }
      // let distances = [0, 0, 0, 0];

      for (let m = 0; m < 4; m++) {
        let startPos = u.applyMoveToPos(m, myHead);
        if (!g.outOfBounds(startPos, grid) && grid[startPos.y][startPos.x] < k.SMALL_DANGER) {
          let movePos = null;
          let distance = 1;
          let move = null;
          let result = astar.search(startPos, food, grid, k.SNAKE_BODY, true);
          if (result) {
            movePos = result.pos;
            distance = result.distance;
            if (movePos) {
              move = u.calcDirection(myHead, movePos, data);
            }
            if (move != null) {
              log.debug(`Distance: ${distance}`);
              distance = distance / 2;
              scores[move] += (urgency * (p.FOOD_DISTANCE / distance));
              // distances[m] = distance;
              // if (grid[startPos.y][startPos.x] >= k.SMALL_DANGER) {
              //   distances[m] = distances[m] * 2;
              // }
            }
          }
        }
      }
      gridCopy[food.y][food.x] = k.WARNING;
    }
  }
  catch (e) { log.error(`ex in search.foodScoresFromGrid`, data.turn); }
  if (!u.moveInScores(scores)) {
    scores = foodScoresFromData(urgency, grid, data);
  }
  return scores;
};


const closeAccessableFuture2FarFromWall = (grid, data) => {
  let scores = [0, 0, 0, 0];
  try {
    const myHead = s.location(data);
    let target = null;
    let gridCopy = g.copyGrid(grid);
    // loop through all possible targets
    while (true) {
      target = t.closestTarget(gridCopy, myHead, k.SMALL_HEAD);
      if (target === null) {
        target = t.closestTarget(gridCopy, myHead, k.ENEMY_HEAD);
      }
      if (target === null) {
        return scores;
      }
      let future2s = getFuture2InOrderOfDistanceFromWall(grid, target);
      if (future2s != null) {
        // loop through each future2 from a given target snake
        for (let future2 of future2s) {
          // loop through all of my possible moves
          for (let m = 0; m < 4; m++) {
            let startPos = u.applyMoveToPos(m, myHead);
            if (!g.outOfBounds(startPos, grid) && grid[startPos.y][startPos.x] < k.SMALL_DANGER) {
              let movePos = null;
              let distance = 1;
              let move = null;
              let result = astar.search(startPos, future2, grid, k.SNAKE_BODY, true);
              if (result) {
                movePos = result.pos;
                distance = result.distance;
                if (movePos) {
                  move = u.calcDirection(myHead, movePos, data);
                }
                if (move != null) {
                  log.debug(`Distance: ${distance}`);
                  scores[move] += Math.pow(distance, p.HUNT_LATE_DISTANCE_EXP);
                }
              }
            }
          }
        }
      }
      gridCopy[target.y][target.x] = k.SNAKE_BODY;
    }
  }
  catch (e) { log.error(`ex in search.closeAccessableFuture2FarFromWall: ${e}`, data.turn); }
  return scores;
};


const closeAccessableKillZoneFarFromWall = (grid, data) => {
  let scores = [0, 0, 0, 0];
  try {
    const myHead = s.location(data);
    let target = null;
    let gridCopy = g.copyGrid(grid);
    // loop through all possible targets
    while (true) {
      target = t.closestTarget(gridCopy, myHead, k.SMALL_HEAD);
      if (target === null) {
        return scores;
      }
      let killZones = getKillZonesInOrderOfDistanceFromWall(grid, target);
      if (killZones != null) {
        // loop through each killzone from a given target snake
        for (let killZone of killZones) {
          // loop through all of my possible moves
          for (let m = 0; m < 4; m++) {
            let startPos = u.applyMoveToPos(m, myHead);
            // if move is valid
            if (!g.outOfBounds(startPos, grid) && grid[startPos.y][startPos.x] < k.SNAKE_BODY) {
              let movePos = null;
              let distance = 1;
              let move = null;
              let result = astar.search(startPos, killZone, grid, k.SNAKE_BODY, true);
              // if path is found
              if (result) {
                movePos = result.pos;
                distance = result.distance;
                if (movePos) {
                  move = u.calcDirection(myHead, movePos, data);
                }
                if (move != null) {
                  log.debug(`Distance: ${distance}`);
                  let score = 0;
                  if (grid[startPos.y][startPos.x] >= k.SMALL_DANGER) {
                    score = (Math.pow(distance, p.HUNT_DISTANCE_EXP) / 10);
                    // log.debug(`New score: ${Math.pow(distance, p.HUNT_DISTANCE_EXP) / 10}`);
                  }
                  else {
                    score = Math.pow(distance, p.HUNT_DISTANCE_EXP);
                    // log.debug(`New score: ${Math.pow(distance, p.HUNT_DISTANCE_EXP)}`);
                  }
                  log.debug(`Score: ${score}`);
                  scores[move] += score;
                }
              }
            }
          }
        }
      }
      gridCopy[target.y][target.x] = k.ENEMY_HEAD;
    }
  }
  catch (e) { log.error(`ex in search.closeAccessableKillZoneFarFromWall: ${e}`, data.turn); }
  return scores;
};


const getFuture2InOrderOfDistanceFromWall = (grid, target) => {
  if (target == null) return null;
  log.debug(`getFuture2InOrderOfDistanceFromWall target: ${u.pairToString(target)}`);
  try {
    let spots = [];
    let spot = {};
    let distance = 0;
    const possibleFuture2Offsets = [
      { x: 0, y: -2 }, { x: 1, y: -1 },
      { x: 2, y: 0 }, { x: 1, y: 1 },
      { x: 0, y: 2 }, { x: -1, y: 1 },
      { x: -2, y: 0 }, { x: -1, y: -1 },
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
      const closestEnemyHead = t.closestTarget(grid, u.applyMoveToPos(direction, myHead), type);
      if (closestEnemyHead != null) log.debug(`Closest enemy for move ${k.DIRECTION[direction]} is ${u.pairToString(closestEnemyHead)}`);
      if (closestEnemyHead === null) return 0;
      return g.getDistance(closestEnemyHead, u.applyMoveToPos(direction, myHead));
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
    const newPos = u.applyMoveToPos(direction, pos);
    if (outOfBounds(newPos, grid)) return false;
    return grid[newPos.y][newPos.x] <= k.DANGER;
  }
  catch (e) {
    log.error(`ex in search.validMove: ${e}\n{direction: ${direction}, pos: ${pairToString(pos)}, grid: ${grid}}`);
    return false;
  }
};


module.exports = {
  outOfBounds,
  fill,
  completeFloodSearch,
  scoresFartherFromDangerousSnake,
  scoresCloserToKillableSnakes,
  scoresFartherFromWall,
  distanceToEnemy,
  closeAccessableKillZoneFarFromWall,
  distanceToCenter,
  closeAccessableFuture2FarFromWall,
  preprocessGrid,
  testForConstrainedMove,
  foodScoresFromData,
  foodScoresFromGrid,
  scoresCloserToTails
};
