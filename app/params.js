const blue = "#3b9fef";
const pink = "#cc4ff1";
const green = "#2be384";
const green2 = "#02B07C";
const purple = "#9557EF";

const belugaHead = "beluga";
const boltTail = "bolt";

module.exports = {
  // logging
  DEBUG: true,
  STATUS: true,
  DEBUG_MAPS: true,
  CONSOLE_LOG: true,

  HEAD_DESIGN: belugaHead,
  TAIL_DESIGN: boltTail,
  COLOR: purple,
  NAME: /nerper/,

  // basic game params
  INITIAL_FEEDING: 0, // started @ 5 +++++++-
  DONT_EAT_HEALTH: 70, // started @ 75 -
  SURVIVAL_MIN: 33, // started @ 50 --+++++-------+
  FEEDING_URGENCY_MULTIPLIER: 0.2, // started @ 0.4 -------++
  LONG_GAME_ENDURANCE: 100, // started @ 80 ++
  INITIAL_TIME_KILL: 0, // started @ 70 ---------------
  FINAL_SNAKES: 3, // started @ 2 +
  CONSTRAINED_MOVE_MULTIPLIER: 2.8, // started @ 1.1 +++
  SAFE_AMOUNT_OF_SNAKES: 4, // started @ 4
  STAY_SAFE_MULTIPLIER: 2.1, // started @ 4.0 -+
  FLOOD_MULTIPLIER: 0.3, // started @ 0.5 --
  ENEMY_DISTANCE_EXP: 0.8, // started @ 0.8
  KILL_DISTANCE_EXP: 0.8, // started @ 0.8
  WALL_DISTANCE: 2.3, // started @ 2 +++-++---
  FOOD_DISTANCE: 1.0, // started @ 1


  // scores for moves
  FALLBACK: 5, // started @ 10 -++++
  HUNT: 12.5, // started @ 12.5
  HUNT_LATE: 10, // started @ 14 ---
  BASE_KILL_ZONE: 5, // started @ 2.1 --++
  KILL_ZONE_BASE_MOVE_MULTIPLIER: 2.9, // started @ 3 +-
  BASE_FOOD: 0.4, // started @ 0.8 -
  BASE_TAIL: 9.2, // started @ 0.4 +++
  BASE_SPACE: 0.69, // started @ 0.2 -+++--++
  BASE_WALL_NEAR: -0.5, // started @ -0.1 ------+
  WALL_NEAR_BASE_MOVE_MULTIPLIER: 7.5, // started @ 1.6 ++++++++++++++--
  WALL_NEAR_FILL_MULTIPLIER: 0.05, // started @ 0.4 ---
  BASE_WARNING: -2.6, // started @ 0.2 -+-
  BASE_SMALL_DANGER: -11.0, // started @ -5 -+--
  BASE_DANGER: -13.0, // started @ 0.1 -----++
  BASE_ENEMY_HEAD: -0.5, // started @ -2 --
  BASE_PREVIOUS: 0.09, // started @ 2 -
  BASE_FUTURE_2: -1.4, // started @ -0.4
  FORGET_ABOUT_IT: -200, // started @ 100 -
  COIL: 5 // started @ 10 +
};
