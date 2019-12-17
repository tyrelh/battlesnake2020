const keys = require("./keys");
const g = require("./grid");
const log = require("./logger");
const s = require("./self");
const u = require("./utils");


// get food directly from data, not from grid
const distanceToFoodInFoodList = (start, data) => {
  try {
    const foodList = data.board.food;
    let closestFoodPos = null;
    let closestFoodDistance = 9999;
    for (let food of foodList) {
      let currentDistance = u.getDistance(start, food);
      if (currentDistance < closestFoodDistance) {
        closestFoodPos = food;
        closestFoodDistance = currentDistance;
      }
    }
    return (closestFoodDistance === 9999 ? 0 : closestFoodDistance);
  }
  catch (e) { log.error(`ex in target.emergencyClosestFood`); }
  return 0;
};


// get closest food in grid
const closestFood = (start, grid, data) => {
  return closestTarget(grid, start, keys.FOOD);
};


const closestKillableEnemy = (grid, startPos) => {
  return closestTarget(grid, startPos, keys.KILL_ZONE);
};


const closestEnemyHead = (grid, startPos) => {
  return closestTarget(grid, startPos, keys.ENEMY_HEAD);
};


// simple search for closest target of a specified grid type
const closestTarget = (grid, startPos, targetType) => {
  try {
    let closestTarget = null;
    let closestDistance = 9999;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (grid[i][j] === targetType) {
          const target = { x: j, y: i };
          const distance = g.getDistance(startPos, target);
          if (distance < closestDistance) {
            closestTarget = target;
            closestDistance = distance;
          }
        }
      }
    }
    return closestTarget;
  }
  catch (e) { log.error(`ex in target.closestTarget ${e}`); }
  return null
};


module.exports = {
  closestFood: closestFood,
  closestKillableEnemy: closestKillableEnemy,
  closestEnemyHead: closestEnemyHead,
  closestTarget: closestTarget,
  distanceToFoodInFoodList
};