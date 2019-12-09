const keys = require("./keys");
const g = require("./grid");
const log = require("./logger");
const s = require("./self");
const u = require("./utils");


const closestFood = (start, grid, data) => {
  // try {
  //   const foodList = data.board.food;
  //   let gridCopy = g.copyGrid(grid);
  //   let closestFoodPos = null;
  //   let closestFoodDistance = 9999;
  //   foodList.forEach((foodPos) => {
  //     let currentDistance = u.getDistance(start, foodPos);
  //     if (currentDistance < closestFoodDistance) {
  //       closestFoodPos = foodPos;
  //       closestFoodDistance = currentDistance;
  //     }
  //   });
  //   return closestFoodPos;
  // }
  // catch (e) { log.error(`ex in target.closestFood: ${e}`, data.turn); }
  // return null;
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
  closestTarget: closestTarget
};