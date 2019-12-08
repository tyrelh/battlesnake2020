const k = require("./keys");
const g = require("./grid");
const t = require("./target");
const s = require("./self");
const p = require("./params");
const search = require("./search");
const log = require("./logger");
const astar = require("./astar");
const u = require("./utils");


// target closest reachable food
const eat = (grid, data) => {
  const myHead = s.location(data);
  const health = data.you.health;
  let urgencyScore = (110 - health);
  let target = null;
  let move = null;
  let movePos = null;
  const gridCopy = g.copyGrid(grid);

  if (data.turn > p.INITIAL_FEEDING) {
    urgencyScore = Math.round(urgencyScore * p.FEEDING_URGENCY_MULTIPLIER);
  }
  log.status(`EATING w/ urgency ${urgencyScore}`);
  
  try {
    target = t.closestFood(grid, myHead);
    if (target === null) {
      if (p.STATUS) log.status("No food was found on board.");
      return buildMove(grid, data, null, 0);
    }
    movePos = astar.search(myHead, target, grid, k.SNAKE_BODY);

    while (movePos === null && target != null) {
      gridCopy[target.y][target.x] = k.DANGER;
      target = t.closestFood(gridCopy, myHead);
      if (target === null) break;
      movePos = astar.search(myHead, target, grid, k.SNAKE_BODY);
    }
  }
  catch (e) { log.error(`ex in move.eat: ${e}`, data.turn); }

  try {
    if (movePos != null) {
      if (target != null) log.debug(`target in eat: ${pairToString(target)}`);
      move = u.calcDirection(myHead, movePos);
      log.debug(`Score for a* move: {${k.DIRECTION[move]}: ${urgencyScore}}`);
      return buildMove(grid, data, move, urgencyScore);
    }
  }
  catch (e) { log.error(`ex in move.eat.buildmove: ${e}`, data.turn); }
  return buildMove(grid, data, null, 0);
};
 

// track closest KILL_ZONE
const hunt = (grid, data) => {
  let score = 0;
  let move = null;
  log.status("HUNTING");

  try {
    move = search.closeAccessableKillZoneFarFromWall(grid, data);
    if (move != null) {
      score = p.ASTAR_SUCCESS;
    }
  }
  catch (e) { log.error(`ex in move.hunt: ${e}`, data.turn); }

  if (move != null) log.debug(`In hunt calulated score ${score} for move ${k.DIRECTION[move]}`)
  else if (move === null) log.debug(`Move in hunt was NULL.`);
  return buildMove(grid, data, move, score);
};


const lateHunt = (grid, data) => {
  let score = 0;
  let move = null;
  log.status("HUNTING, LATE GAME");

  try {
    move = search.closeAccessableFuture2FarFromWall(grid, data);
    if (move != null) score = p.ASTAR_SUCCESS;
  }
  catch (e) { log.error(`ex in move.lateHunt: ${e}`, data.turn); }

  if (move != null) log.debug(`In lateHunt calulated score ${score} for move ${k.DIRECTION[move]}`)
  else if (move === null) log.debug(`Move in lateHunt was NULL.`);
  return buildMove(grid, data, move, score);
};


// track own tail
const killTime = (grid, data) => {
  log.status("KILLING TIME");

  // const fallbackMove = getFallbackMove(grid, data);
  // let move = fallbackMove.move;
  // let score = fallbackMove.score;

  // if (params.DEBUG && move != null) log.debug(`Score for a* move: ${keys.DIRECTION[move]}: ${params.ASTAR_SUCCESS}`);
  return buildMove(grid, data, null, 0);
};


const getFallbackMove = (grid, data) => {
  try {
    const myHead = s.location(data);
    log.status("Resorting to fallback move");
    // try finding a path to tail first
    let target = s.tailLocation(data);
    let movePos = astar.search(myHead, target, grid, k.SNAKE_BODY);
    let move = u.calcDirection(myHead, movePos);
    // let move = search.astar(grid, data, target, keys.TAIL);
    let score = 0;
    // if no path to own tail, try searching for food
    const gridCopy = g.copyGrid(grid);
    while (move === null) {
      target = t.closestFood(gridCopy, myHead);
      if (target != null) {
        gridCopy[target.y][target.x] = k.WARNING;
        movePos = astar.search(myHead, target, grid, k.SNAKE_BODY);
        move = u.calcDirection(myHead, movePos);
        // move = search.astar(grid, data, target, keys.FOOD);
      }
      // if no more food to search for just quit
      else break;
    }
    if (move != null) {
      score = p.ASTAR_SUCCESS / 5;
      log.debug(`getFallbackMove target: ${pairToString(target)}`);
      log.debug(`getFallbackMove move: ${k.DIRECTION[move]}`);
      log.debug(`getFallbackMove score: ${score}`);
      return { move: move, score: score };
    }
  }
  catch (e) { log.error(`ex in move.getFallbackMove: ${e}`, data.turn); }
  return { move: null, score: 0 };
};


const coil = (grid, data) => {
  log.status("Trying to coil to save space");
  try {
    let tailLocation = s.tailLocation(data);
    let tailDistances = [0, 0, 0, 0];
    let largestDistance = 0;

    for (let m = 0; m < 4; m++) {
      const nextMove = search.applyMoveToPos(m, s.location(data));
      if (search.outOfBounds(nextMove, grid)) continue;
      if (grid[nextMove.y][nextMove.x] >= k.SNAKE_BODY) continue;
      const currentDistance = g.getDistance(tailLocation, nextMove);
      log.debug(`Distance to tail for move ${k.DIRECTION[m]} is ${currentDistance}`);
      if (tailDistances[m] < currentDistance) {
        tailDistances[m] = currentDistance;
        if (largestDistance < currentDistance) {
          largestDistance = currentDistance;
        }
      }
    }

    let coilScores = [0, 0, 0, 0];
    for (let m = 0; m < 4; m++) {
      if (tailDistances[m] === largestDistance) {
        coilScores[m] += p.COIL;
      }
    }
    log.debug(`Coil scores are ${coilScores}`);
    return coilScores
  }
  catch (e) { log.error(`ex in move.coil: ${e}`, data.turn); }
  return [];
};


// build up move scores and return best move
const buildMove = (grid, data, move, moveScore = 0) => {
  const you = data.you;
  let scores = baseMoveScores(grid, you);
  try {

    // if move is null, try to find fallback move
    if (move === null) {
      const fallbackMove = getFallbackMove(grid, data);
      move = fallbackMove.move;
      // if no fallback move, try to coil on self to save space
      if (move != null) {
        scores[move] += fallbackMove.score;
      } else {
        const coilScores = coil(grid, data);
        for (let m = 0; m < coilScores.length; m++) {
          scores[m] += coilScores[m];
        }
      }
    } else {
      // get base next move scores
      log.status(`Adding moveScore ${moveScore} to move ${k.DIRECTION[move]}`);
      scores[move] += moveScore;
      log.status(`Move scores: ${scoresToString(scores)}`);
    }
   }
  catch (e) { log.error(`ex in move.buildMove.baseMoveScores: ${e}`, data.turn); }
  
  // get flood fill scores for each move
  try {
    log.status("Performing flood fill searches");
    for (let m = 0; m < 4; m++) {
      let gridCopy = g.copyGrid(grid)
      scores[m] += search.fill(m, grid, data);
      gridCopy = g.moveTails(1, grid, data);
      if (p.DEBUG_MAPS) {
        log.debug("Map for fill search 1 move in advance");
        g.printGrid(gridCopy);
      }
      scores[m] += search.fill(m, gridCopy, data, [k.KILL_ZONE, k.DANGER, k.WARNING]);
      gridCopy = g.moveTails(2, grid, data);
      if (p.DEBUG_MAPS) {
        log.debug("Map for fill search 2 moves in advance");
        g.printGrid(gridCopy);
      }
      scores[m] += search.fill(m, gridCopy, data, [k.KILL_ZONE, k.DANGER, k.WARNING, k.FUTURE_2]);
    }
  }
  catch (e) { log.error(`ex in move.buildMove.fill: ${e}`, data.turn); }
  log.status(`Move scores: ${scoresToString(scores)}`);

  // see if a particular move will bring you farther from dangerous snake
  try {
    let enemyDistances = [0, 0, 0, 0];
    let largestDistance = 0;
    let largestDistanceMove = 0;
    let uniqueLargestDistanceMove = false;
    for (let m = 0; m < 4; m++) {
      const currentDistance = search.distanceToEnemy(m, grid, data, k.ENEMY_HEAD);
      log.debug(`Distance to closest dangerous snake for move ${k.DIRECTION[m]} is ${currentDistance}`);
      if (enemyDistances[m] < currentDistance) {
        enemyDistances[m] = currentDistance;
        if (largestDistance === currentDistance) uniqueLargestDistanceMove = false;
        else if (largestDistance < currentDistance) {
          largestDistance = currentDistance;
          largestDistanceMove = m;
          uniqueLargestDistanceMove = true;
        }
      }
    }
    if (uniqueLargestDistanceMove){
      log.debug(`Add ENEMY_DISTANCE ${p.ENEMY_DISTANCE} to move ${k.DIRECTION[largestDistanceMove]} for farther ENEMY_HEAD`);
      scores[largestDistanceMove] += p.ENEMY_DISTANCE;
    }
  }
  catch (e) { log.error(`ex in move.buildMove.closestEnemyHead: ${e}`, data.turn); }
  log.status(`Move scores: ${scoresToString(scores)}`);

  // see if a particular move will bring you closer to a killable snake
  try {
    let enemyDistances = [9999, 9999, 9999, 9999];
    let smallestDistance = 9999;
    let smallestDistanceMove = 0;
    let uniqueSmallestDistanceMove = false;
    for (let m = 0; m < 4; m++) {
      const currentDistance = search.distanceToEnemy(m, grid, data, k.KILL_ZONE);
      log.debug(`Distance to closest killable snake for move ${k.DIRECTION[m]} is ${currentDistance}`);
      if (currentDistance === 0) continue;
      if (enemyDistances[m] > currentDistance) {
        enemyDistances[m] = currentDistance;
        if (smallestDistance === currentDistance) uniqueSmallestDistanceMove = false;
        else if (smallestDistance > currentDistance) {
          smallestDistance = currentDistance;
          smallestDistanceMove = m;
          uniqueSmallestDistanceMove = true;
        }
      }
    }
    if (uniqueSmallestDistanceMove){
      log.debug(`Add ENEMY_DISTANCE ${p.ENEMY_DISTANCE} to move ${k.DIRECTION[smallestDistanceMove]} for closer KILL_ZONE`);
      scores[smallestDistanceMove] += p.ENEMY_DISTANCE;
    }
  }
  catch (e) { log.error(`ex in move.buildMove.closestEnemyHead: ${e}`, data.turn); }
  log.status(`Move scores: ${scoresToString(scores)}`);

  // see if a particular move will bring you farther from wall
  try {
    let centerDistances = [0, 0, 0, 0];
    let largestDistance = 0;
    let largestDistanceMove = 0;
    let uniqueLargestDistanceMove = false;
    for (let m = 0; m < 4; m++) {
      const currentDistance = search.distanceToCenter(m, s.location(data), grid, data);
      log.debug(`Distance from wall for move ${k.DIRECTION[m]} is ${currentDistance}`);
      // if (currentDistance === 0) continue;
      if (centerDistances[m] < currentDistance) {
        centerDistances[m] = currentDistance;
        if (largestDistance === currentDistance) uniqueLargestDistanceMove = false;
        else if (largestDistance < currentDistance) {
          largestDistance = currentDistance;
          largestDistanceMove = m;
          uniqueLargestDistanceMove = true;
        }
      }
    }
    if (uniqueLargestDistanceMove){
      log.debug(`Add ${p.WALL_DISTANCE} to move ${k.DIRECTION[largestDistanceMove]} for farther from wall`);
      scores[largestDistanceMove] += p.WALL_DISTANCE;
    }
  }
  catch (e) { log.error(`ex in move.buildMove.fartherFromWall: ${e}`, data.turn); }
  log.status(`Move scores: ${scoresToString(scores)}`);

  const bestMove = highestScoreMove(scores);
  previousMove = bestMove;
  return bestMove
};


// get highest score move
const highestScoreMove = scores => {
  let bestMove = 0;
  let bestScore = -9999;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestMove = i;
    }
  }
  return bestMove;
};


// get base score for each possible move
const baseMoveScores = (grid, self) => {
  const head = self.body[0];
  let scores = [0, 0, 0, 0];
  // get score for each direction
  scores[k.UP] += baseScoreForBoardPosition(head.x, head.y - 1, grid);
  scores[k.DOWN] += baseScoreForBoardPosition(head.x, head.y + 1, grid);
  scores[k.LEFT] += baseScoreForBoardPosition(head.x - 1, head.y, grid);
  scores[k.RIGHT] += baseScoreForBoardPosition(head.x + 1, head.y, grid);
  log.debug(`Base move scores: {up: ${scores[k.UP]}, down: ${scores[k.DOWN]}, left: ${scores[k.LEFT]}, right: ${scores[k.RIGHT]}}`)
  return scores;
};


// return a base score depending on what is currently in that position on the board
const baseScoreForBoardPosition = (x, y, grid) => {
  try {
    // if out of bounds
    if (search.outOfBounds({ x: x, y: y }, grid)) return p.FORGET_ABOUT_IT;
    // types of spaces
    switch (grid[y][x]) {
      case k.SPACE:
      case k.TAIL:
      case k.FUTURE_2:
        return p.BASE_SPACE;
      case k.FOOD:
        return p.BASE_FOOD;
      case k.KILL_ZONE:
        return p.BASE_KILL_ZONE * p.KILL_ZONE_BASE_MOVE_MULTIPLIER;
      case k.WALL_NEAR:
        return p.BASE_WALL_NEAR * p.WALL_NEAR_BASE_MOVE_MULTIPLIER;
      case k.WARNING:
        return p.BASE_WARNING;
      case k.SMALL_DANGER:
        return p.BASE_SMALL_DANGER;
      case k.DANGER:
        return p.BASE_DANGER;
      // default includes SNAKE_BODY, ENEMY_HEAD and YOUR_BODY
      default:
        return p.FORGET_ABOUT_IT;
    }
  }
  catch (e) { log.error(`ex in move.baseScoreForBoardPosition: ${e}`); }
};


// check if move is not fatal
const validMove = (direction, pos, grid) => {
  try {
    if (search.outOfBounds(pos, grid)) return false;
    switch (direction) {
      case k.UP:
        return grid[pos.y - 1][pos.x] <= k.DANGER;
      case k.DOWN:
        return grid[pos.y + 1][pos.x] <= k.DANGER;
      case k.LEFT:
        return grid[pos.y][pos.x - 1] <= k.DANGER;
      case k.RIGHT:
        return grid[pos.y][pos.x + 1] <= k.DANGER;
    }
    return false;
  }
  catch (e) { log.error(`ex in move.validMove: ${e}`); }
};


// if move is no good, suggest a similar move that is valid
const suggestMove = (direction, pos, grid) => {
  try {
    switch (direction) {
      // if up, check right, left, down
      case k.UP:
        if (validMove(k.RIGHT, pos, grid)) return k.RIGHT;
        else if (validMove(k.LEFT, pos, grid)) return k.LEFT;
        else if (validMove(k.DOWN, pos, grid)) return k.DOWN;
        return direction;
      // if down, check left, right, up
      case k.DOWN:
        if (validMove(k.LEFT, pos, grid)) return k.LEFT;
        else if (validMove(k.RIGHT, pos, grid)) return k.RIGHT;
        else if (validMove(k.UP, pos, grid)) return k.UP;
        return direction;
      // if left, check up, down, right
      case k.LEFT:
        if (validMove(k.UP, pos, grid)) return k.UP;
        else if (validMove(k.DOWN, pos, grid)) return k.DOWN;
        else if (validMove(k.RIGHT, pos, grid)) return k.RIGHT;
        return direction;
      // if right, check down, up, left
      case k.RIGHT:
        if (validMove(k.DOWN, pos, grid)) return k.DOWN;
        else if (validMove(k.UP, pos, grid)) return k.UP;
        else if (validMove(k.LEFT, pos, grid)) return k.LEFT;
        return direction;
    }
  }
  catch(e) { log.error(`ex in move.suggestMove: ${e}`); }
  return direction;
};


// return pair as string
const pairToString = pair => {
  try { return `{x: ${pair.x}, y: ${pair.y}}`; }
  catch (e) { log.error(`ex in move.pairToString: ${e}`); }
};


// return scores array in a human readable string
const scoresToString = scores => {
  try {
    return `{up: ${scores[0]}, down: ${scores[1]}, left: ${scores[2]}, right: ${scores[3]}}`
  }
  catch (e) { log.error(`ex in move.scoresToString: ${e}`); }
};


module.exports = {
  eat: eat,
  killTime: killTime,
  hunt: hunt,
  lateHunt: lateHunt,
  validMove: validMove
};
