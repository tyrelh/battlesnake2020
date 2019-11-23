

// return pair as string
const pairToString = pair => {
  try { return `{x: ${pair.x}, y: ${pair.y}}`; }
  catch (e) {
    log.error(`ex in utils.pairToString: ${e}`);
    return "there was an error caught in utils.pairToString";
  }
};

module.export = {
  pairToString: pairToString
}