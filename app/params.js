const blue = "#3b9fef";
const pink = "#cc4ff1";
const green = "#2be384";
const green2 = "#02B07C";
const purple = "#9557E0";

const belugaHead = "beluga";
const boltTail = "bolt";

module.exports = {
  // logging
  DEBUG: true,
  STATUS: true,
  DEBUG_MAPS: false,
  CONSOLE_LOG: false,

  HEAD_DESIGN: belugaHead,
  TAIL_DESIGN: boltTail,
  COLOR: purple,
  NAME: /zerocool/,

  // basic game params
  INITIAL_FEEDING: 0, // started @ 5 +++++++-
  DONT_EAT_HEALTH: 70, // started @ 75 -
  SURVIVAL_MIN: 32, // started @ 50 --+++++-------
  LONG_GAME_ENDURANCE: 80, // started @ 80
  INITIAL_TIME_KILL: 0, // started @ 70 ---------------
  FINAL_SNAKES: 3, // started @ 2 +
  CONSTRAINED_MOVE_MULTIPLIER: 1.1, // started @ 1.1
  WALL_NEAR_BASE_MOVE_MULTIPLIER: 11, // started @ 1.6 ++++++++++++++-
  WALL_NEAR_FILL_MULTIPLIER: 0.05, // started @ 0.4 ---
  KILL_ZONE_BASE_MOVE_MULTIPLIER: 3.5, // started @ 3 +
  FEEDING_URGENCY_MULTIPLIER: 0.15, // started @ 0.4 -------
  SAFE_AMOUNT_OF_SNAKES: 4, // started @ 4
  STAY_SAFE_MULTIPLIER: 2.1, // started @ 4.0 -+
  FLOOD_MULTIPLIER: 0.3, // started @ 0.5 --
  ENEMY_DISTANCE: 0.4, // started @ 0.99 +-+++-++++-+
  KILL_DISTANCE: 0.3, // started @ 1.5
  WALL_DISTANCE: 2.5, // started @ 2 +++-++--


  // scores for moves
  ASTAR_SUCCESS: 13, // started @ 10 -++++
  HUNT: 12.5, // started @ 12.5
  HUNT_LATE: 12, // started @ 14 -
  BASE_KILL_ZONE: 5, // started @ 2.1 --++
  BASE_FOOD: 0.4, // started @ 0.8 -
  BASE_TAIL: 9.2, // started @ 0.4 +++
  BASE_SPACE: 0.36, // started @ 0.2 -+++--+
  BASE_WALL_NEAR: -1.1, // started @ -0.1 ------
  BASE_WARNING: -2.6, // started @ 0.2 -+-
  BASE_SMALL_DANGER: -11.0, // started @ -5 -+--
  BASE_DANGER: -13.0, // started @ 0.1 -----++
  BASE_ENEMY_HEAD: -11, // started @ -2 -
  BASE_PREVIOUS: 0.09, // started @ 2 -
  FORGET_ABOUT_IT: -100,
  COIL: 5 // started @ 10 +
};
