const test1 = {
  "json": {"game":{"id":"045f27be-6a26-4c29-9de4-b32b5047ff05"},"turn":23,"board":{"height":11,"width":11,"food":[{"x":8,"y":9}],"snakes":[{"id":"45dc0eb7-a779-42aa-a848-5216be6bdbf1","name":"chicken1","health":89,"body":[{"x":5,"y":8},{"x":5,"y":7},{"x":5,"y":6},{"x":4,"y":6}]},{"id":"c6d0b1e2-12af-447b-a151-85568e515942","name":"zerocool","health":77,"body":[{"x":6,"y":5},{"x":6,"y":4},{"x":5,"y":4}]},{"id":"f51f1d5f-bc83-4227-9f3d-9842c059fe0d","name":"chicken2","health":77,"body":[{"x":8,"y":3},{"x":9,"y":3},{"x":9,"y":2}]},{"id":"3ae7eb42-19ec-4031-a5ed-e09f37cd1db8","name":"wildcrazy1","health":98,"body":[{"x":3,"y":4},{"x":2,"y":4},{"x":1,"y":4},{"x":1,"y":3},{"x":2,"y":3}]},{"id":"ac122ddf-1c99-4f2f-8d9f-cc9f432a62a9","name":"karena2","health":77,"body":[{"x":10,"y":1},{"x":9,"y":1},{"x":9,"y":0}]},{"id":"668fd638-115e-4286-9311-2ce0b6a40885","name":"wildcrazy2","health":77,"body":[{"x":2,"y":9},{"x":1,"y":9},{"x":0,"y":9}]},{"id":"8a31d8d6-cc84-4899-b0b2-af4ff12fc4da","name":"wildcrazy3","health":94,"body":[{"x":4,"y":7},{"x":3,"y":7},{"x":3,"y":8},{"x":4,"y":8},{"x":4,"y":9},{"x":4,"y":10}]}]},"you":{"id":"c6d0b1e2-12af-447b-a151-85568e515942","name":"zerocool","health":77,"body":[{"x":6,"y":5},{"x":6,"y":4},{"x":5,"y":4}]}},
  "name": "Many snakes in middle, move out is best 1",
  "expected": "right"
};

module.exports = {
  tests: [
    test1
  ]
};