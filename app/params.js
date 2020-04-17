const blue = "#3b9fef";
const pink = "#cc4ff1";
const green = "#2be384";
const green2 = "#02B07C";
const purple = "#9557EF";
const giftbitGreen = "#009b50";

const belugaHead = "beluga";
const boltTail = "bolt";

module.exports = {
  // logging
  DEBUG: true,
  STATUS: true,
  DEBUG_MAPS: false,
  CONSOLE_LOG: true,

  // my snake
  HEAD_DESIGN: belugaHead,
  TAIL_DESIGN: boltTail,
  COLOR: giftbitGreen,
  FRIENDS: [/crashoverride/, /zerocool/],

  // basic game params
  INITIAL_FEEDING: 0, // started @ 5 +++++++-
  SURVIVAL_MIN: 33, // started @ 50 --+++++-------+
  FEEDING_URGENCY_MULTIPLIER: 0.4, // started @ 0.4 -------+++
  LONG_GAME_ENDURANCE: 500, // started @ 80 ++++
  INITIAL_TIME_KILL: 0, // started @ 70 ---------------
  FINAL_SNAKES: 3, // started @ 2 +
  CONSTRAINED_MOVE_MULTIPLIER: 2.8, // started @ 1.1 +++
  SAFE_AMOUNT_OF_SNAKES: 4, // started @ 4
  STAY_SAFE_MULTIPLIER: 2.1, // started @ 4.0 -+
  FLOOD_MULTIPLIER: 0.3, // started @ 0.5 --
  ENEMY_DISTANCE_EXP: 0.9, // started @ 0.8 -+
  KILL_DISTANCE_EXP: 0.8, // started @ 0.8
  WALL_DISTANCE: 2.2, // started @ 2 +++-++----
  FOOD_DISTANCE: 1.0, // started @ 1
  FOOD_DISTANCE_EXP: 0.9, // started @ 1.1
  FOOD_DISTANCE_DECAY_RATE: 2.8, // started @ 2.0 ++

  // scores for moves
  FALLBACK: 5, // started @ 10 -++++
  HUNT_DISTANCE_EXP: 0.65, // started @ 0.7 -
  HUNT_LATE_DISTANCE_EXP: 0.4, // started @ 0.6 --
  BASE_KILL_ZONE: 4.5, // started @ 2.1 --++-
  KILL_ZONE_BASE_MOVE_MULTIPLIER: 1.3, // started @ 3 +---
  BASE_FOOD: 0.4, // started @ 0.8 -
  BASE_TAIL: 12.3, // started @ 0.4 ++++++
  TAIL_DISTANCE_SCALAR: 2.0, // started @ 0.55 +++
  TAIL_DISTANCE_DECAY_RATE: 2.0, // started @ 2.0
  BASE_SPACE: 0.9, // started @ 0.2 -+++--++++
  BASE_WALL_NEAR: -0.4, // started @ -0.1 ------+
  WALL_NEAR_BASE_MOVE_MULTIPLIER: 6.5, // started @ 1.6 ++++++++++++++---
  WALL_NEAR_FILL_MULTIPLIER: -0.5, // started @ 0.4 ----
  BASE_WARNING: -2.6, // started @ 0.2 -+-
  BASE_SMALL_DANGER: -11.0, // started @ -5 -+--
  BASE_DANGER: -12.0, // started @ 0.1 -----+++
  DANGER_FILL_MULTIPLIER: 0.06, // started @ 0.06
  BASE_ENEMY_HEAD: -5.9, // started @ -2 --+--
  BASE_FUTURE_2: -0.7, // started @ 0.4 -+
  FORGET_ABOUT_IT: -200, // started @ 100 -
  COIL: 5 // started @ 10 +
};
