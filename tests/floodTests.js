const test1 = {
  "json": {"game":{"id":"8f3f4281-1f2a-4571-a84a-182af464629c"},"turn":164,"board":{"height":11,"width":11,"food":[{"x":9,"y":0}],"snakes":[{"id":"4274a383-3213-4da5-9dd0-d8f48d8d6bd1","name":"zerocool","health":88,"body":[{"x":1,"y":5},{"x":2,"y":5},{"x":3,"y":5},{"x":3,"y":6},{"x":4,"y":6},{"x":5,"y":6},{"x":5,"y":7},{"x":4,"y":7},{"x":3,"y":7}]},{"id":"811265d8-f76d-4954-8162-ae293741f6c3","name":"chicken2","health":52,"body":[{"x":1,"y":7},{"x":1,"y":8},{"x":0,"y":8},{"x":0,"y":7},{"x":0,"y":6},{"x":0,"y":5},{"x":0,"y":4}]},{"id":"ac4daf9d-be1d-413e-a860-25115367990f","name":"wildcrazy1","health":69,"body":[{"x":4,"y":0},{"x":5,"y":0},{"x":5,"y":1},{"x":4,"y":1},{"x":4,"y":2},{"x":3,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":5,"y":3}]},{"id":"52ca6a5c-3e76-4499-aef5-a51e252ba784","name":"wildcrazy2","health":100,"body":[{"x":7,"y":9},{"x":7,"y":8},{"x":7,"y":7},{"x":7,"y":6},{"x":7,"y":5},{"x":7,"y":4},{"x":8,"y":4},{"x":8,"y":3},{"x":7,"y":3},{"x":7,"y":2},{"x":7,"y":1},{"x":7,"y":0},{"x":7,"y":0}]}]},"you":{"id":"4274a383-3213-4da5-9dd0-d8f48d8d6bd1","name":"zerocool","health":88,"body":[{"x":1,"y":5},{"x":2,"y":5},{"x":3,"y":5},{"x":3,"y":6},{"x":4,"y":6},{"x":5,"y":6},{"x":5,"y":7},{"x":4,"y":7},{"x":3,"y":7}]}},
  "name": "Flood Test 1",
  "expected": "up"
};

module.exports = {
  tests: [
    test1
  ]
};