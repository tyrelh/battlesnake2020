const log = require("./logger");


// get your head location
const location = (data) => {
  return { x: data.you.body[0].x, y: data.you.body[0].y };
};


const health = (data) => {
  return data.you.health;
};


const length = (data) => {
  return data.you.body.length;
};


// get your tail location
const tailLocation = (data) => {
  try {
    const tail = data.you.body.length - 1;
    return { x: data.you.body[tail].x, y: data.you.body[tail].y }
  }
  catch (e) { log.error(`ex in self.tailLocation: ${e}`, data.turn); }
  return { x: 0, y: 0 };
};


// will return if you are the largest snake on the board
const biggestSnake = (data) => {
  try {
    const me = data.you.id;
    const myLength = data.you.body.length;
    for (let i = 0; i < data.board.snakes.length; i++) {
      let snake = data.board.snakes[i];
      if (snake.id == me) continue;
      if (snake.body.length >= myLength) return false;
    }
    return true;
  }
  catch (e) { log.error(`ex in self.biggestSnake: ${e}`, data.turn); }
  return false;
};


// check if there is a smaller (killable) snake
const existsSmallerSnake = (data) => {
  try {
    const myId = data.you.id;
    const myLength = data.you.body.length;
    for (let i = 0; i < data.board.snakes.length; i++) {
      let snake = data.board.snakes[i];
      if (snake.id == myId) continue;
      if (snake.body.length < myLength) return true;
    }
  }
  catch (e) { log.error(`ex in self.existsSmallerSnake: ${e}`, data.turn); }
  return false;
};


const id = (data) => {
  try { return data.you.id; }
  catch (e) { log.error(`ex in self.id: ${e}`, data.turn); }
  return "";
};


module.exports = {
  location,
  tailLocation,
  biggestSnake,
  existsSmallerSnake,
  health,
  length,
  id
};
