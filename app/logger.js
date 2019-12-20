const fs = require("fs");
const p = require("./params");


// globals for logging across whole game
// will cause errors when multiple games running simultaneously
let log = "";
let exLog = "############################# EXCEPTIONS\n";
let errorHappened = false;
let JSONData = "";


const initLogs = () => {
  log = "";
  exLog = "############################# EXCEPTIONS\n";
  errorHappened = false;
  JSONData = "";
};


// save log data to disk
const writeLogs = (data) => {
  if (errorHappened && p.CONSOLE_LOG) console.log(exLog);
  const gameId = data.game.id;
  const path = `${__dirname}/../logs/`;
  const gameLogsFilename = `${gameId}.txt`;
  const gameJSONFilename = `${gameId}-JSON.txt`;
  // append game exeptions to end of log for easy viewing
  if (errorHappened) log += "\n" + exLog;

  writeGameLogs(`${path}${gameLogsFilename}`, gameId);
  writeJSONLogs(`${path}${gameJSONFilename}`, gameId);
};

// write board JSON to file for reference
const writeJSONLogs = (path, gameId) => {
  try {
    // write JSON log
    fs.writeFile(path, JSONData, (err) => {
      if (err) { return console.log(`There was an error saving the JSON logs: ${err}`); }
      console.log(`The JSON log for game ${gameId} was saved.`);
    });
  }
  catch (e) { error(`ex in log.writeLogs: ${e}`); }
  return false;
};


// write logs for game to file and update the index of logs
const writeGameLogs = (path, gameId) => {
  try {
    // write log
    fs.writeFile(path, log, (err) => {
      if (err) return console.log(`There was an error saving the logs: ${err}`);
      console.log(`The log for game ${gameId} was saved.`);
      // update index of logs
      // read current index
      fs.readFile(
        `${__dirname}/../logs/index.html`,
        "utf8",
        (err, contents) => {
          // append new entry
          const newEntry = `<a href="/logs/${gameId}.txt">GAME: ${gameId}</a><br />`;
          const newIndex = contents + "\n" + newEntry;
          // write updated index
          fs.writeFile(
            `${__dirname}/../logs/index.html`,
            newIndex,
            err => {
              if (err) return console.log(`There was an error saving the new index.html: ${err}`);
              console.log("The logs index.html was updated");
            }
          )
        }
      );
    });
  }
  catch (e) { error(`ex in log.writeLogs: ${e}`); }
  return false;
};


// request data toString
const saveJSON = (data) => {
  try {
    JSONData += `\n#############################  TURN  ${data.turn}\n`;
    JSONData += `${JSON.stringify(data)}\n`;
  }
  catch (e) { log.error(`ex in logger.saveJSON: ${e}`, data.turn); }
};


// debug levels
const error = (message, turn = null) => {
  errorHappened = true;
  let msg = `!! ERROR: ${message}`;
  log += `${msg}\n`;
  if (p.CONSOLE_LOG) console.log(msg);
  exLog += `EX ON TURN ${turn != null ? turn : "none"}: ${message}\n`;
  return message;
};

const status = message => {
  if (p.STATUS) {
    log += `${message}\n`;
    if (p.CONSOLE_LOG) console.log(`${message}`);
  }
  return message;
};

const debug = message => {
  if (p.DEBUG) {
    log += `DEBUG: ${message}\n`;
    if (p.CONSOLE_LOG) console.log(`DEBUG: ${message}`);
  }
  return message;
};


module.exports = {
  initLogs: initLogs,
  writeLogs: writeLogs,
  error: error,
  status: status,
  debug: debug,
  saveJSON
};
