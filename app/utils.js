const log = require("./logger");
const k = require("./keys");


// return pair as string
const pairToString = pair => {
  try {
    return `{x: ${pair.x}, y: ${pair.y}}`;
  }
  catch (e) {
    log.error(`ex in utils.pairToString: ${e}`);
    return "there was an error caught in utils.pairToString";
  }
};


// return scores array in a human readable string
const scoresToString = scores => {
  try {
    return `{up: ${scores[k.UP].toFixed(1)}, down: ${scores[k.DOWN].toFixed(1)}, left: ${scores[k.LEFT].toFixed(1)}, right: ${scores[k.RIGHT].toFixed(1)}}`
  }
  catch (e) { log.error(`ex in move.scoresToString: ${e}`); }
};


// test if cells are the same
const sameCell = (a, b) => {
  try {
    return (a.x === b.x && a.y === b.y);
  }
  catch (e) {
    log.error(`ex in utils.sameCell: ${e}`);
    return false;
  }
};


// check if array contains a given pair
const arrayIncludesPair = (arr, pair) => {
  for (let i = 0; i < arr.length; i++) {
    if (sameCell(arr[i], pair)) {
      return true;
    }
  }
  return false;
};


// calculate direction from a to b
// could be inaccurate if a and b are far apart
// TODO tyrelh rethink how this works if there are two directions that are the same distance
const calcDirection = (a, b) => {
  try {
    const xDelta = a.x - b.x;
    const yDelta = a.y - b.y;
    if (xDelta < 0) return k.RIGHT;
    else if (xDelta > 0) return k.LEFT;
    else if (yDelta < 0) return k.DOWN;
    else if (yDelta > 0) return k.UP;
    return null;
  }
  catch (e) {
    log.error(`ex in utils.calcDirection: ${e}`);
    return null;
  }
};


// manhattan distance
const getDistance = (a, b) => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};


// check if there is any move in a scores array
const moveInScores = (scores) => {
  try {
    for (let move of scores) {
      // log.status(`score: ${move}`);
      if (move > 0) { return true; }
    }
  }
  catch (e) { log.error(`ex in utils.moveInScores: ${e}`); }
  return false;
};


// add score for a given move to the scores array
const applyMoveToScores = (move, score, scores = [0, 0, 0, 0]) => {
  try {
    if (move === null || score === null) return scores;
    scores[move] += score;
  }
  catch (e) { log.error(`ex in utils.applyMoveToScore: ${e}`); }
  return scores
};


// combine two score arrays
const combineScores = (scoresA, scoresB) => {
  let scores = [0, 0, 0, 0];
  try {
    for (let i = 0; i < 4; i++) {
      scores[i] = scoresA[i] + scoresB[i];
      if (isNaN(scores[i])) scores[i] = 0;
    }
    return scores;
  }
  catch (e) { log.error(`ex in utils.combineScores: ${e}`); }
  if (scoresA === null) return scoresB;
  return scoresA;
};


// get highest score move
const highestScoreMove = (scores) => {
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


// apply a given direction to a position
const applyMoveToPos = (move, pos) => {
  switch (move) {
    case k.UP:
      return { x: pos.x, y: pos.y - 1 };
    case k.DOWN:
      return { x: pos.x, y: pos.y + 1 };
    case k.LEFT:
      return { x: pos.x - 1, y: pos.y };
    case k.RIGHT:
      return { x: pos.x + 1, y: pos.y };
  }
};


// subtract the value closest to 0 from all score values, so the lowest score becomes 0
const normalizeScores = (scores) => {
  try {
    let minAbsScore = 9999;
    let minScore = 0;
    for (let i = 0; i < 4; i++) {
      let absScore = Math.abs(scores[i]);
      if (absScore < minAbsScore) {
        minAbsScore = absScore;
        minScore = scores[i];
      }
    }
    if (minAbsScore < 9999 && minAbsScore > 0) {
      for (let i = 0; i < 4; i++) {
        scores[i] -= minScore;
      }
    }
  }
  catch (e) { log.error(`ex in utils.normalizeScores: ${e}`); }
  return scores;
};


module.exports = {
  pairToString: pairToString,
  scoresToString: scoresToString,
  sameCell: sameCell,
  calcDirection: calcDirection,
  arrayIncludesPair: arrayIncludesPair,
  getDistance: getDistance,
  moveInScores: moveInScores,
  applyMoveToScores: applyMoveToScores,
  combineScores: combineScores,
  highestScoreMove: highestScoreMove,
  applyMoveToPos,
  normalizeScores
};
