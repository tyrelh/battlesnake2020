#!/usr/bin/env node
let consoleRed = '\x1b[31m%s\x1b[0m';
let consoleGreen = '\x1b[32m%s\x1b[0m';
const p = require("../app/params");
const app = require("../app/main");

const floodTests = require("./floodTests");
const dangerTests = require("./dangerTests");
const trappedTests = require("./trappedTests");
const killTests = require("./killTests");
const eatingTests = require("./eatingTests");

let testNumber, testsFailed, testList, failedTests = [];


const tests = async () => {
  for (let test of testList) {
    await sleep(90);
    // given
    testNumber++;
    let request = { "body": test.json };
    let response = {};
    let result;
    console.log(`\n${testNumber} ${test.name}`);
    // when
    result = app.move(request, response);
    // then
    if (!assert(result.move, "==", test.expected)) {
      failedTests.push(test);
    }
  }

  for (let test of failedTests) {
    // given
    // testNumber++;
    let request = { "body": test.json };
    let response = {};
    let result;
    console.log(`\nFAILED TEST: ${test.name}`);
    // when
    result = app.move(request, response);
    // then
    assert(result.move, "==", test.expected)
  }
};


const setup = (loggingEnabled) => {
  // set logging
  p.CONSOLE_LOG = !!loggingEnabled;
  p.DEBUG_MAPS = !!loggingEnabled;
  p.DEBUG = !!loggingEnabled;
  p.STATUS = !!loggingEnabled;
  main.p = p;
  // set suite fields
  testNumber = 0;
  testsFailed = 0;
  // merge all tests into one list
  testList = floodTests.tests.concat(dangerTests.tests).concat(trappedTests.tests).concat(killTests.tests).concat(eatingTests.tests);
};


const assert = (a, operation, b) => {
  let result;
  let failure;
  switch(operation) {
    case "==":
      if (b.hasOwnProperty("length")) {
        if (b.includes(a)) {
          result = true;
          break;
        } else {
          result = false;
          failure = "!=";
          break;
        }
      } else {
        result = (a === b);
        failure = "!=";
        break;
      }
    case "!=":
      if (b.hasOwnProperty("length")) {
        if (!b.includes(a)) {
          result = true;
          break;
        } else {
          result = false;
          failure = "==";
          break;
        }
      } else {
        result = (a !== b);
        failure = "==";
        break;
      }
  }
  if (result) {
    console.log(consoleGreen, `Test ${testNumber} passed.`);
  }
  else {
    testsFailed++;
    console.error(consoleRed, `Test ${testNumber} FAILED!\n   ${a} ${failure} ${b}`);
  }
  return result;
};


const main = async () => {
  let loggingEnabled;
  if (process.argv.length >= 3) {
    loggingEnabled = !!process.argv[2]
  }
  console.log(`########## BEGINNING TESTS ##########`);
  console.log(`Logging is ${loggingEnabled ? "ENABLED" : "DISABLED"}.`);
  await sleep(540);

  if (process.argv.length >= 3) {
    setup(loggingEnabled);
  } else {
    setup();
  }
  console.log(`Running ${testList.length} tests.`);
  await sleep(600);
  await tests();
  if (testsFailed) {
    console.log(consoleRed, `\n${testsFailed / 2} TEST(S) FAILED!\n`)
  } else {
    console.log(consoleGreen, `\nAll ${testNumber} test(s) passed!`)
  }
};


if (require.main === module) {
  main();
}


function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms)
  })
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