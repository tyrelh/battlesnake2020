const keys = require("./keys");
const g = require("./grid");
const m = require("./move");
const p = require("./params");
const s = require("./self");
const log = require("./logger");
const search = require("./search");

// globals to track over course of game
// will break if multiple games are running simultaneosly
let slowest = 0;
let slowestMove = 0;
let moveTimes = [];


// called for every move
const move = (req, res) => {
  let date = new Date();
  let startTime = date.getMilliseconds();

  const data = req.body;
  const health = data.you.health;
  const turn = data.turn;
  const numSnakes = data.board.snakes.length;

  try { log.saveJSON(data); }
  catch (e) { log.error(`ex in main.log.saveJSON: ${e}`, turn); }

  log.status(`\n\n####################################### MOVE ${data.turn}`);

  let grid = [];
  try {
    grid = g.buildGrid(data);
    grid = search.preprocessGrid(grid, data);
  }
  catch (e) { log.error(`ex in main.buildGrid: ${e}`, turn); }
  
  let move = null;
  const iAmBiggestSnake = s.biggestSnake(data);
  const existsSmallerSnake = s.existsSmallerSnake(data);
  log.status(`Biggest snake ? ${iAmBiggestSnake}`);
  log.status(`Smaller snake ? ${existsSmallerSnake}`);
  const minHealth = p.SURVIVAL_MIN - Math.floor(data.turn / p.LONG_GAME_ENDURANCE);
  const staySafe = numSnakes > p.SAFE_AMOUNT_OF_SNAKES;
  if (staySafe) log.status(`Keep Safe! ${numSnakes} still alive`);

  // if you are hungry or small you gotta eat
  if (health < minHealth || turn < p.INITIAL_FEEDING) {
    try { move = m.eat(staySafe, grid, data); }
    catch (e) { log.error(`ex in main.survivalMin: ${e}`, turn); }
  }

  // start early game by killing some time, to let dumb snakes die
  else if (turn < p.INITIAL_TIME_KILL) {
    try { move = m.killTime(staySafe, grid, data); }
    catch (e) { log.error(`ex in main.initialKillTime: ${e}`, turn); }
  }

  // if there is only one other snake, don't try to be bigger than it, just hunt it
  else if (numSnakes <= p.FINAL_SNAKES) {
    try { move = m.lateHunt(staySafe, grid, data); }
    catch (e) { log.error(`ex in main.lateHunt: ${e}`, turn); }
  }

  // data.board.snakes.length > 4
  // if there are no smaller snakes than you, eat
  else if (!existsSmallerSnake) {
    try { move = m.eat(staySafe, grid, data); }
    catch (e) { log.error(`ex in main.notBiggest: ${e}`, turn); }
  }

  // if there are smaller snakes than you, hunt
  else if (iAmBiggestSnake || existsSmallerSnake) {
    try { move = m.hunt(staySafe, grid, data); }
    catch (e) { log.error(`ex in main.biggest: ${e}`, turn); }
  }

  // backup plan?
  if (move == null) {
    try { move = m.eat(staySafe, grid, data); }
    catch (e) { log.error(`ex in main.backupPlan: ${e}`, turn); }
  }

  let date2 = new Date();
  let endTime = date2.getMilliseconds();
  let timeTaken = endTime - startTime;
  if (timeTaken > slowest) {
    slowest = timeTaken;
    slowestMove = data.turn;
  }
  moveTimes.push(timeTaken);
  log.status(`${health} health remaining.`);
  log.status(`Move ${data.turn} took ${timeTaken}ms.`);
  return res.json({ move: move ? keys.DIRECTION[move] : keys.DIRECTION[keys.UP] });
};


// called once at beginning of game
const start = (req, res) => {
  try {
    // ensure previous game logs are cleared
    log.initLogs();
    log.status(`####################################### STARTING GAME ${req.body.game.id}`);
    log.status(`My snake id is ${req.body.you.id}`);
    slowest = 0;
    slowestMove = 0;
    moveTimes = [];

    log.status("Snakes playing this game are:");
    req.body.board.snakes.forEach(({ id, name, health, body }) => {
      log.status(name);
    });
  }
  catch (e) { log.error(`ex in main.start.snakenames: ${e}`); }

  return res.json({
    color: p.COLOR,
    headType: p.HEAD_DESIGN,
    tailType: p.TAIL_DESIGN
  });
};


// called when you die, or end of game if you win
const end = (req, res) => {
  log.status(`\nSlowest move ${slowestMove} took ${slowest}ms.`);
  const numberOfMoves = moveTimes.length;
  const totalTime = moveTimes.reduce((acc, c) => acc + c, 0);
  const averageTime = totalTime / numberOfMoves;
  log.status(`Total time computing was ${totalTime}ms for ${numberOfMoves} moves.`);
  log.status(`Average move time was ${averageTime.toFixed(1)}ms.`);
  // write logs for this game to file
  log.writeLogs(req.body);
  slowest = 0;
  slowestMove = 0;
  moveTimes = [];
  return res.json({});
};


module.exports = {
  move: move,
  start: start,
  end: end
};
