const log = require("./logger");
const s = require("./self");
const u = require("./utils");
const g = require("./grid");
const k = require("./keys");


const MAX_TIME = 250;
const DEAD_SCORE = -30;
const FINE_SCORE = 1;
const KILL_SCORE = 10;


const search = (grid, data) => {
  let startTime = Date.now();
  let scores = [0, 0, 0, 0];
  try {
    scores = traverseDepth(grid, data, 0, startTime);
  }
  catch (e) {
    console.error(`ex in graph.search: ${e}`);
    log.error(`ex in graph.search: ${e}`, data.turn);
    throw e;
  }
  return scores;
};


const traverseDepth = (grid, data, depth, startTime) => {
  console.log(`DEPTH: ${depth}`);
  let scores = [0, 0, 0, 0];
  if (!checkTimeIsGood(startTime)) {
    return scores;
  }

  try {
    let snakeList = data.board.snakes;
    let allPossibleMovesBySnake = [];
    for (let snake of snakeList) {
      let entry = { "snakeId": snake.id, "moves": getAllPossibleNextMoves(snake, grid, data) };
      allPossibleMovesBySnake.push(entry);
    }
    let possibleMoveCombinations = getAllPossibleMoveCombinations(allPossibleMovesBySnake);
    for (let moveCombo of possibleMoveCombinations) {
      let moveScores = traverseBreadth(grid, data, startTime, depth, moveCombo);
      scores = u.combineScores(scores, moveScores);
    }
  }
  catch (e) {
    console.error(`ex in graph.traverseDepth: ${e}`);
    log.error(`ex in graph.traverseDepth: ${e}`, data.turn);
    throw e;
  }
  return scores;
};


const traverseBreadth = (grid, data, startTime, depth, moveCombo) => {
  let scores = [0, 0, 0, 0];
  if (!checkTimeIsGood(startTime)) {
    return scores;
  }
  try {
    // console.log("traverseBreadth");
    // console.log(JSON.stringify(moveCombo, null, 2));
    // console.log(`depth: ${depth}`);
    // wait(300);


    if (checkTimeIsGood(startTime)) {
      let nextDepthScores = traverseDepth(grid, data, (depth + 1), startTime);
      scores = u.combineScores(scores, nextDepthScores);
    }
  }
  catch (e) {
    console.error(`ex in graph.traverseBreadth: ${e}`);
    log.error(`ex in graph.traverseBreadth: ${e}`, data.turn);
    throw e;
  }
  return scores;
};


// return milli from a given time
const calcCurrentTime = (startTime) => {
  return (Date.now() - startTime);
};


const checkTimeIsGood = (startTime) => {
  let currentTime = calcCurrentTime(startTime);
  console.log(`current time = ${currentTime}`);
  return (currentTime < MAX_TIME);
};


const getAllPossibleNextMoves = (snake, grid, data) => {
  let allMoves = [];
  try {
    let snakeHead = snake.body[0];
    for (let m = 0; m < 4; m++) {
      let move = u.applyMoveToPos(m, snakeHead);
      if (g.validPos(move, grid, data)) {
        allMoves.push(move);
      }
    }
  }
  catch (e) {
    console.error(`ex in graph.getAllPossibleNextMoves: ${e}`);
    log.error(`ex in graph.getAllPossibleNextMoves: ${e}`, data.turn);
    throw e;
  }
  return allMoves;
};


function getAllPossibleMoveCombinations(snakesData) {
  try {
    if (snakesData.length === 1) {
      return snakesData[0].moves.map((m) => { return [{ "snakeId": snakesData[0].snakeId, "move": m }] });
    }
    else {
      let possibleMoveCombinations = [];
      const moveCombinationsSoFar = getAllPossibleMoveCombinations(snakesData.slice(1));
      for (let i = 0; i < moveCombinationsSoFar.length; i++) {
        for (let j = 0; j < snakesData[0].moves.length; j++) {
          let moveCombo = [...moveCombinationsSoFar[i], { "snakeId": snakesData[0].snakeId, "move": snakesData[0].moves[j] }];
          possibleMoveCombinations = [...possibleMoveCombinations, moveCombo];
        }
      }
      return possibleMoveCombinations;
    }
  }
  catch (e) {
    console.error(`ex in graph.getAllPossibleMoveCombinations: ${e}`);
    log.error(`ex in graph.getAllPossibleMoveCombinations: ${e}`);
    throw e;
  }
}


const wait = (x) => {
  let y = 0;
  for (let i = 0; i < x; i++) {
    for (let j = 0; j < x; j++) {
      for (let k = 0; k < x; k++) {
        y++;
      }
    }
  }
};


// add a tail to a snake
// const growSnake = (snake) => {
//   try {
//     let currentTail = snake[snake.length - 1];
//     let newTail = { x: currentTail.x, y: currentTail.y };
//     snake.push(newTail);
//     return snake;
//   }
//   catch (e) {
//     log.error(`ex in graph.growSnake: ${e}`);
//     throw e;
//   }
// };


// const justAte = (snake) => {
//   try {
//     return u.sameCell(snake[snake.length - 1], snake[snake.length - 2]);
//   }
//   catch (e) {
//     log.error(`ex in graph.justAte: ${e}`);
//     throw e;
//   }
// };


module.exports = {
  search
};
