const fs = require('fs');

console.log("Starting Decomp")

let json = JSON.parse(fs.readFileSync("./data.json").toString("utf8"))
let objects = [];
let layouts = [];
let layoutList = [];
let game = { width: json["project"][10], height: json["project"][11] };

// console.log("Looking For Objects\nFound:")

// 3 = objects/sprites?
for (let index = 0; index < json["project"][3].length; index++) {
  // console.log(json["project"][3][index][0]);

  objects[index] = {}
  objects[index]["name"] = json["project"][3][index][0];
  if (json["project"][3][index][7]) {
    objects[index]["image"] = json["project"][3][index][7][0][7][0][0];
  }
}

// console.log("Looking For Layouts\nFound:")

// 5 = layouts
for (let index = 0; index < json["project"][5].length; index++) {
  // console.log(json["project"][5][index][0]);
  layouts[index] = {};
  layoutList[index] = json["project"][5][index][0];

  let layoutData = json["project"][5][index];

  for (let layer = 0; layer < layoutData[9].length; layer++) {

    layouts[index][layoutData[9][layer][0]] = {}
    let layerData = layoutData[9][layer];

    for (let layerObject = 0; layerObject < layerData[14].length; layerObject++) {
      let objectData = layerData[14][layerObject];
      let objectName = objects[objectData[1]]["name"]; // find name of object
      layouts[index][layerData[0]][layerObject] =
      {
        "name": objectName,
        "x": objectData[0][0],
        "y": objectData[0][1],
        "z": objectData[0][2],

        "width": objectData[0][3],
        "height": objectData[0][4],

        "id": objectData[1]
      };
    }
  }
}


let repackagedData = {
  objects: objects,
  layouts: layouts,
  layoutList: layoutList,
  game: game,
}

fs.writeFileSync("./out.json", JSON.stringify(repackagedData, null, 2))

