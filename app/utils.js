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
    return `{up: ${scores[0]}, down: ${scores[1]}, left: ${scores[2]}, right: ${scores[3]}}`
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


module.exports = {
  pairToString: pairToString,
  scoresToString: scoresToString,
  sameCell: sameCell,
  calcDirection: calcDirection,
  arrayIncludesPair: arrayIncludesPair,
  getDistance: getDistance
};
