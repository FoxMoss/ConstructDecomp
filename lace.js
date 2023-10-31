const fs = require('fs');

module.exports = {
  lace: function(dataFile, editFile, outFile) {
    console.log("Starting Lace")

    let edits = JSON.parse(fs.readFileSync(editFile).toString("utf8"))
    let og = JSON.parse(fs.readFileSync(dataFile).toString("utf8"))

    og["project"][10] = edits["game"]["width"]
    og["project"][11] = edits["game"]["height"]

    // 5 = layouts
    for (let index = 0; index < og["project"][5].length; index++) {
      // let layoutData = og["project"][5][index];
      for (let layer = 0; layer < og["project"][5][index][9].length; layer++) {

        let layerData = og["project"][5][index][9][layer];

        for (let layerObject = 0; layerObject < layerData[14].length; layerObject++) {
          og["project"][5][index][9][layer][14][layerObject][0][0] = edits["layouts"][index]["layers"][layer]["objects"][layerObject]["x"];
          og["project"][5][index][9][layer][14][layerObject][0][1] = edits["layouts"][index]["layers"][layer]["objects"][layerObject]["y"];

          /*
          {
            "name": objectName,
            "x": objectData[0][0],
            "y": objectData[0][1],
            "z": objectData[0][2],
  
            "width": objectData[0][3],
            "height": objectData[0][4],
  
            "id": objectData[1]
          };*/
        }
      }
    }

    fs.writeFileSync(outFile, JSON.stringify(og, null, 2))

  }
}
