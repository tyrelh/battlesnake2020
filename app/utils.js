const log = require("./logger");

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

// test if cells are the same
const sameCell = (a, b) => {
  try {
    return (a.x === b.x && a.y === b.y);
  }
  catch (e) {
    log.error(`ex in utils.sameCell: ${e}`);
    return false;
  }
}

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
const calcDirection = (a, b) => {
  try {
    const x = a.x - b.x;
    const y = a.y - b.y;
    let direction = keys.UP;
    if (x < 0) direction = keys.RIGHT;
    else if (x > 0) direction = keys.LEFT;
    else if (y < 0) direction = keys.DOWN;
    return direction;
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
  sameCell: sameCell,
  calcDirection: calcDirection,
  arrayIncludesPair: arrayIncludesPair,
  getDistance: getDistance
}