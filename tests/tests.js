#!/usr/bin/env node
let consoleRed = '\x1b[31m%s\x1b[0m';
let consoleGreen = '\x1b[32m%s\x1b[0m';
const p = require("../app/params");
const app = require("../app/main");
const floodTests = require("./floodTests");
let testNumber = 0;
let testsFailed = 0;


const tests = () => {
  testNumber = 0;
  for (let test of floodTests.tests) {
    // given
    testNumber++;
    let request = { "body": test.json };
    let response = {};
    let result;
    console.log(`\n${testNumber} ${test.name}`);
    // when
    result = app.move(request, response);
    // then
    assert(result.move, "==", test.expected);
  }
};


const setup = (loggingEnabled) => {
  p.CONSOLE_LOG = !!loggingEnabled;
  main.p = p;
};


const assert = (a, operation, b) => {
  let result;
  switch(operation) {
    case "==":
      result = (a === b);
      break;
    case "!=":
      result = (a !== b);
      break
  }
  if (result) {
    console.log(consoleGreen, `Test ${testNumber} passed.`);
  }
  else {
    testsFailed++;
    console.error(consoleRed, `Test ${testNumber} FAILED!\n ${a} ${operation} ${b}`);
  }
};


function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms)
  })
}


const main = async () => {
  let loggingEnabled;
  if (process.argv.length >= 3) {
    loggingEnabled = !!process.argv[2]
  }
  console.log(`########## BEGINNING TESTS ##########`);
  console.log(`Logging is ${loggingEnabled ? "ENABLED" : "DISABLED"}.`);
  await sleep(700);

  if (process.argv.length >= 3) {
    setup(loggingEnabled);
  } else {
    setup();
  }
  tests();
  if (testsFailed) {
    console.log(consoleRed, `\n${testsFailed} TEST(S) FAILED!\n`)
  } else {
    console.log(consoleGreen, `\nAll ${testNumber} test(s) passed!`)
  }
};


if (require.main === module) {
  main();
}


// Example: '\x1b[31m%s\x1b[0m'

// %s separator

// Reset = "\x1b[0m"
// Bright = "\x1b[1m"
// Dim = "\x1b[2m"
// Underscore = "\x1b[4m"
// Blink = "\x1b[5m"
// Reverse = "\x1b[7m"
// Hidden = "\x1b[8m"
//
// FgBlack = "\x1b[30m"
// FgRed = "\x1b[31m"
// FgGreen = "\x1b[32m"
// FgYellow = "\x1b[33m"
// FgBlue = "\x1b[34m"
// FgMagenta = "\x1b[35m"
// FgCyan = "\x1b[36m"
// FgWhite = "\x1b[37m"
//
// BgBlack = "\x1b[40m"
// BgRed = "\x1b[41m"
// BgGreen = "\x1b[42m"
// BgYellow = "\x1b[43m"
// BgBlue = "\x1b[44m"
// BgMagenta = "\x1b[45m"
// BgCyan = "\x1b[46m"
// BgWhite = "\x1b[47m"