const test1 = {
  "json": {"game":{"id":"045f27be-6a26-4c29-9de4-b32b5047ff05"},"turn":23,"board":{"height":11,"width":11,"food":[{"x":8,"y":9}],"snakes":[{"id":"45dc0eb7-a779-42aa-a848-5216be6bdbf1","name":"chicken1","health":89,"body":[{"x":5,"y":8},{"x":5,"y":7},{"x":5,"y":6},{"x":4,"y":6}]},{"id":"c6d0b1e2-12af-447b-a151-85568e515942","name":"zerocool","health":77,"body":[{"x":6,"y":5},{"x":6,"y":4},{"x":5,"y":4}]},{"id":"f51f1d5f-bc83-4227-9f3d-9842c059fe0d","name":"chicken2","health":77,"body":[{"x":8,"y":3},{"x":9,"y":3},{"x":9,"y":2}]},{"id":"3ae7eb42-19ec-4031-a5ed-e09f37cd1db8","name":"wildcrazy1","health":98,"body":[{"x":3,"y":4},{"x":2,"y":4},{"x":1,"y":4},{"x":1,"y":3},{"x":2,"y":3}]},{"id":"ac122ddf-1c99-4f2f-8d9f-cc9f432a62a9","name":"karena2","health":77,"body":[{"x":10,"y":1},{"x":9,"y":1},{"x":9,"y":0}]},{"id":"668fd638-115e-4286-9311-2ce0b6a40885","name":"wildcrazy2","health":77,"body":[{"x":2,"y":9},{"x":1,"y":9},{"x":0,"y":9}]},{"id":"8a31d8d6-cc84-4899-b0b2-af4ff12fc4da","name":"wildcrazy3","health":94,"body":[{"x":4,"y":7},{"x":3,"y":7},{"x":3,"y":8},{"x":4,"y":8},{"x":4,"y":9},{"x":4,"y":10}]}]},"you":{"id":"c6d0b1e2-12af-447b-a151-85568e515942","name":"zerocool","health":77,"body":[{"x":6,"y":5},{"x":6,"y":4},{"x":5,"y":4}]}},
  "name": "Many snakes in middle, move out is best 1",
  "expected": "right"
};

const test2 = {
  "json": {"game":{"id":"7fc3387d-ceea-42fa-b573-0161234bc304"},"turn":188,"board":{"height":11,"width":11,"food":[{"x":1,"y":9}],"snakes":[{"id":"8b76a4d3-7923-4d8e-ac18-35a1ad41b3ef","name":"chicken1","health":77,"body":[{"x":3,"y":9},{"x":4,"y":9},{"x":5,"y":9},{"x":5,"y":8},{"x":4,"y":8},{"x":3,"y":8}]},{"id":"0bc454c0-abcb-4170-9066-680ed288f25f","name":"zerocool","health":47,"body":[{"x":5,"y":7},{"x":5,"y":6},{"x":4,"y":6},{"x":3,"y":6},{"x":2,"y":6}]},{"id":"354cec1c-f388-4943-88ac-3d453ee98fa6","name":"chicken2","health":81,"body":[{"x":2,"y":0},{"x":2,"y":1},{"x":2,"y":2},{"x":3,"y":2},{"x":3,"y":1}]}]},"you":{"id":"0bc454c0-abcb-4170-9066-680ed288f25f","name":"zerocool","health":47,"body":[{"x":5,"y":7},{"x":5,"y":6},{"x":4,"y":6},{"x":3,"y":6},{"x":2,"y":6}]}},
  "name": "Very tight space, was eaten by larger snake 1",
  "expected": "right"
};

const test3 = {
  "json": {"game":{"id":"12597c31-ed41-430e-9715-05c64c088e5e"},"turn":20,"board":{"height":11,"width":11,"food":[{"x":10,"y":0}],"snakes":[{"id":"1513502c-ef2c-4c16-8e50-34baf4b7e8a9","name":"zerocool","health":80,"body":[{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":3}]},{"id":"2f9e047d-f772-417a-9627-8890937d1389","name":"chicken1","health":81,"body":[{"x":8,"y":8},{"x":8,"y":7},{"x":9,"y":7},{"x":9,"y":8}]},{"id":"b54da614-5c36-4f8c-88d1-800b0a101512","name":"wildcrazy1","health":96,"body":[{"x":8,"y":10},{"x":7,"y":10},{"x":6,"y":10},{"x":5,"y":10}]},{"id":"a639412d-d7df-4577-8698-9c1bf380dd2d","name":"wildcrazy2","health":90,"body":[{"x":7,"y":5},{"x":7,"y":6},{"x":6,"y":6},{"x":5,"y":6}]},{"id":"95a9620c-8a0d-43bc-8db3-b785e0290365","name":"karena2","health":87,"body":[{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":1},{"x":4,"y":1}]},{"id":"48b8342e-eaaf-4c0f-a06d-35356a7687b8","name":"zerocool24","health":82,"body":[{"x":2,"y":6},{"x":1,"y":6},{"x":1,"y":5},{"x":2,"y":5}]}]},"you":{"id":"1513502c-ef2c-4c16-8e50-34baf4b7e8a9","name":"zerocool","health":80,"body":[{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":3}]}},
  "name": "Very tight space, was eaten by larger snake 2",
  "expected": "right"
};

module.exports = {
  tests: [
    test1,
    test2,
    test3
  ]
};