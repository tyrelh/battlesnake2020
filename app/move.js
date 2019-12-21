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
const eat = (staySafe, grid, data) => {
  const myHead = s.location(data);
  const health = data.you.health;
  let urgencyScore = (101 - health);
  let target = null;
  let move = null;
  let movePos = null;
  const gridCopy = g.copyGrid(grid);

  if (data.turn > p.INITIAL_FEEDING) {
    urgencyScore = Math.round(urgencyScore * p.FEEDING_URGENCY_MULTIPLIER);
  }
  log.status(`EATING w/ urgency ${urgencyScore}`);

  const distanceToClosestFood = t.distanceToFoodInFoodList(myHead, data);
  let emergency = (distanceToClosestFood >= health || health < (p.SURVIVAL_MIN - 5));

  // if emergency, replace food locations on grid
  if (emergency) {
    try {
      let foodList = data.board.food;
      for (let food of foodList) {
        gridCopy[food.y][food.x] = k.FOOD;
      }
    }
    catch (e) { log.error(`ex in move.eat.emergency: ${e}`, data.turn); }
  }

  try {
    target = t.closestFood(myHead, gridCopy, data);
    if (target === null) {
      log.status("No food was found on board.");
      return buildMove([0, 0, 0, 0], staySafe, grid, data);
    }
    let result = astar.search(myHead, target, grid, k.SNAKE_BODY);
    movePos = result.pos;

    while (movePos === null && target != null) {
      gridCopy[target.y][target.x] = k.DANGER;
      target = t.closestFood(myHead, gridCopy, data);
      if (target === null) break;
      let result = astar.search(myHead, target, grid, k.SNAKE_BODY);
      movePos = result.pos;
    }
  }
  catch (e) { log.error(`ex in move.eat: ${e}`, data.turn); }

  try {
    if (movePos != null) {
      if (target != null) log.debug(`Target in eat: ${u.pairToString(target)}`);
      move = u.calcDirection(myHead, movePos, data);
      log.status(`Move in eat: {move: ${k.DIRECTION[move]}, score: ${urgencyScore.toFixed(2)}}`);
      let scores = u.applyMoveToScores(move, urgencyScore);
      return buildMove(scores, staySafe, grid, data);
    }
  }
  catch (e) { log.error(`ex in move.eat.buildmove: ${e}`, data.turn); }
  return buildMove([0, 0, 0, 0], staySafe, grid, data);
};
 

// track closest KILL_ZONE
const hunt = (staySafe, grid, data) => {
  let score = 0;
  let move = null;
  log.status("HUNTING");

  try {
    move = search.closeAccessableKillZoneFarFromWall(grid, data);
    if (move != null) {
      score = p.HUNT;
    }

    if (move != null) log.status(`Move in hunt {move: ${k.DIRECTION[move]}, score: ${score.toFixed(2)}}`);
    else if (move === null) log.debug(`Move in hunt was NULL.`);
  }
  catch (e) { log.error(`ex in move.hunt: ${e}`, data.turn); }

  let scores = u.applyMoveToScores(move, score);
  return buildMove(scores, staySafe, grid, data);
};


const lateHunt = (staySafe, grid, data) => {
  let scores = [0, 0, 0, 0];
  log.status("HUNTING, LATE GAME");
  try {
    scores = search.closeAccessableFuture2FarFromWall(grid, data);
  }
  catch (e) { log.error(`ex in move.lateHunt: ${e}`, data.turn); }
  // let scores = u.applyMoveToScores(move, score);
  return buildMove(scores, staySafe, grid, data);
};


// track own tail
const killTime = (staySafe, grid, data) => {
  log.status("KILLING TIME");
  // rely on default move in buildMove
  return buildMove([0, 0, 0, 0], staySafe, grid, data);
};


// build up move scores and return best move
const buildMove = (scores = [0, 0, 0, 0], staySafe, grid, data) => {
  log.status(`Behaviour scores:\n ${u.scoresToString(scores, data)}`);
  const myHead = s.location(data);
  let baseScores = baseMoveScores(grid, myHead);
  log.status(`Base scores:\n ${u.scoresToString(baseScores, data)}`);
  try {
    // if move is null, try to find fallback move
    if (!u.moveInScores(scores)) {
      const fallbackScores = getFallbackMove(grid, data);
      // if no fallback move, try to coil on self to save space
      if (u.moveInScores(fallbackScores)) {
        log.status(`Fallback scores:\n ${u.scoresToString(fallbackScores, data)}`);
        scores = u.combineScores(fallbackScores, scores);
      } else {
        scores = coil(grid, data);
        log.status(`Coil scores:\n ${u.scoresToString(scores, data)}`);
      }
    }
  }
  catch (e) { log.error(`ex in move.buildMove.fallback: ${e}`, data.turn); }
  scores = u.combineScores(baseScores, scores);

  // TIGHT MOVE
  let tightMoveScores = search.testForConstrainedMove(grid, data);
  if (staySafe) {
    tightMoveScores = tightMoveScores.map((x) => x * p.STAY_SAFE_MULTIPLIER);
  }
  log.status(`Tight move scores:\n ${u.scoresToString(tightMoveScores, data)}`);
  scores = u.combineScores(scores, tightMoveScores);

  // FLOOD FILLS
  let floodScores = search.completeFloodSearch(grid, data);
  log.status(`Flood scores:\n ${u.scoresToString(floodScores, data)}`);
  scores = u.combineScores(scores, floodScores);

  // FARTHER FROM DANGER SNAKES
  let fartherFromDangerousSnakesScores = search.scoresFartherFromDangerousSnake(grid, data);
  if (staySafe) {
    fartherFromDangerousSnakesScores = fartherFromDangerousSnakesScores.map((x) => x * p.STAY_SAFE_MULTIPLIER);
  }
  log.status(`Farther from danger snakes scores:\n ${u.scoresToString(fartherFromDangerousSnakesScores, data)}`);
  scores = u.combineScores(scores, fartherFromDangerousSnakesScores);

  // CLOSER TO KILLABLE SNAKES
  let closerToKillableSnakesScores = search.scoresCloserToKillableSnakes(grid, data);
  log.status(`Closer to killable snakes scores:\n ${u.scoresToString(closerToKillableSnakesScores, data)}`);
  scores = u.combineScores(scores, closerToKillableSnakesScores);

  // FARTHER FROM WALL
  let fartherFromWallsScores = search.scoresFartherFromWall(grid, data);
  if (staySafe) {
    fartherFromWallsScores = fartherFromWallsScores.map((x) => x * p.STAY_SAFE_MULTIPLIER);
  }
  log.status(`Farther from walls scores:\n ${u.scoresToString(fartherFromWallsScores, data)}`);
  scores = u.combineScores(scores, fartherFromWallsScores);

  log.status(`Final scores:\n ${u.scoresToString(scores, data)}`);
  return u.highestScoreMove(scores)
};


const getFallbackMove = (grid, data) => {
  try {
    const myHead = s.location(data);
    log.status("Resorting to fallback move");
    // try finding a path to tail first
    let target = s.tailLocation(data);
    let result = astar.search(myHead, target, grid, k.SNAKE_BODY);
    let movePos = null, move = null, score = 0;
    if (result) {
      movePos = result.pos;
      move = u.calcDirection(myHead, movePos, data);
    }
    // if no path to own tail, try searching for food
    const gridCopy = g.copyGrid(grid);
    while (move === null) {
      target = t.closestFood(myHead, gridCopy, data);
      if (target != null) {
        gridCopy[target.y][target.x] = k.WARNING;
        let result = astar.search(myHead, target, grid, k.SNAKE_BODY);
        if (result) {
          movePos = result.pos;
          move = u.calcDirection(myHead, movePos, data);
        }
      }
      // if no more food to search for just quit
      else break;
    }
    if (move != null) {
      score = p.ASTAR_SUCCESS / 5;
      log.debug(`getFallbackMove target: ${u.pairToString(target)}`);
      log.debug(`getFallbackMove move: ${k.DIRECTION[move]}`);
      log.debug(`getFallbackMove score: ${score}`);
      return u.applyMoveToScores(move, score);
    }
  }
  catch (e) { log.error(`ex in move.getFallbackMove: ${e}`, data.turn); }
  return [0, 0, 0, 0];
};


const coil = (grid, data) => {
  log.status("Trying to coil to save space");
  let coilScores = [0, 0, 0, 0];
  try {
    let tailLocation = s.tailLocation(data);
    let tailDistances = [0, 0, 0, 0];
    let largestDistance = 0;

    for (let m = 0; m < 4; m++) {
      const nextMove = u.applyMoveToPos(m, s.location(data));
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

    for (let m = 0; m < 4; m++) {
      if (tailDistances[m] === largestDistance) {
        coilScores[m] += p.COIL;
      }
    }
  }
  catch (e) { log.error(`ex in move.coil: ${e}`, data.turn); }
  return coilScores
};


// get base score for each possible move
const baseMoveScores = (grid, myHead) => {
  let scores = [0, 0, 0, 0];
  // get score for each direction
  scores[k.UP] += baseScoreForBoardPosition(myHead.x, myHead.y - 1, grid);
  scores[k.DOWN] += baseScoreForBoardPosition(myHead.x, myHead.y + 1, grid);
  scores[k.LEFT] += baseScoreForBoardPosition(myHead.x - 1, myHead.y, grid);
  scores[k.RIGHT] += baseScoreForBoardPosition(myHead.x + 1, myHead.y, grid);
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
        return (p.BASE_KILL_ZONE * p.KILL_ZONE_BASE_MOVE_MULTIPLIER);
      case k.WALL_NEAR:
        return (p.BASE_WALL_NEAR * p.WALL_NEAR_BASE_MOVE_MULTIPLIER);
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
  return 0;
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
  return false;
};


module.exports = {
  eat: eat,
  killTime: killTime,
  hunt: hunt,
  lateHunt: lateHunt,
  validMove: validMove
};
