const fs = require('fs');

module.exports = {
  extract: function(inFile, runtimeFile, outFile) {
    console.log("Starting Decomp")

    let runtime = fs.readFileSync(runtimeFile).toString("utf8")
    let statements = runtime.match(new RegExp(`${/self\.C3_ExpressionFuncs = \[/.source}(.*${/\];/.source})`, 's'))[0];

    statements = statements.slice("self.C3_ExpressionFuncs = ".length, -1)

    statements = eval(statements)

    for (let statementIndex = 0; statementIndex < statements.length; statementIndex++) {
      statements[statementIndex] = statements[statementIndex].toString()
    }

    let json = JSON.parse(fs.readFileSync(inFile).toString("utf8"))
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
      objects[index]["behaviors"] = [];
      for (let behavior = 0; behavior < json["project"][3][index][8].length; behavior++) {
        objects[index]["behaviors"][behavior] = json["project"][3][index][8][behavior][0]
      }
    }

    // console.log("Looking For Layouts\nFound:")

    // 5 = layouts
    for (let index = 0; index < json["project"][5].length; index++) {
      // console.log(json["project"][5][index][0]);
      layoutList[index] = json["project"][5][index][0];

      let layoutData = json["project"][5][index];
      layouts[index] = { "name": layoutData[0], "layers": [] };

      for (let layer = 0; layer < layoutData[9].length; layer++) {

        layouts[index]["layers"][layer] = { "name": layoutData[9][layer][0], "objects": [] }
        let layerData = layoutData[9][layer];

        for (let layerObject = 0; layerObject < layerData[14].length; layerObject++) {
          let objectData = layerData[14][layerObject];
          let objectName = objects[objectData[1]]["name"]; // find name of object
          let behaviorValues = {}
          for (let behaviorObject = 0; behaviorObject < objectData[4].length; behaviorObject++) {
            behaviorValues[objects[objectData[1]]["behaviors"][behaviorObject]] =
              objectData[4][behaviorObject] ? objectData[4][behaviorObject] : "Physics"

          }
          layouts[index]["layers"][layer]["objects"][layerObject] =
          {
            "name": objectName,
            "x": objectData[0][0],
            "y": objectData[0][1],
            "z": objectData[0][2],

            "width": objectData[0][3],
            "height": objectData[0][4],

            "behaviors": behaviorValues,

            "id": objectData[1]

          };
        }
      }
    }

    let code = {
      sheets: [],
    }


    // 6 = eventSheet
    for (let index = 0; index < json["project"][6].length; index++) {
      let sheetObject = json["project"][6][index];
      code["sheets"][index] =
      {
        name: sheetObject[0],
        events: []
      };
      for (let codeObject = 0; codeObject < sheetObject[1].length; codeObject++) {
        let objectData = sheetObject[1][codeObject]

        switch (objectData[0]) {
          case 0:
            type = "block"
            let actions = [];
            let condtions = [];

            for (let conditionObject = 0; conditionObject < objectData[6].length; conditionObject++) {
              if (objectData[6][conditionObject][0] == 4) {
                actions[conditionObject] = {
                  action: "on-key-pressed",
                  id: objectData[6][conditionObject][7],
                  key: objectData[6][conditionObject][9][0][1],
                }
              }
              else if (objectData[6][conditionObject][0] == 9
                && objectData[6][conditionObject][1] == 14) {
                actions[conditionObject] = {
                  action: "compare-axis",
                  id: objectData[6][conditionObject][7],
                  axis: objectData[6][conditionObject][9][1][1],
                  comparison: conditionalConvert(objectData[6][conditionObject][9][2][1]),
                  value: statements[objectData[6][conditionObject][9][3][1][0]],
                }
              } else if (objectData[6][conditionObject][0] == 9
                && objectData[6][conditionObject][1] == 16) {
                actions[conditionObject] = {
                  action: "is-button-down",
                  id: objectData[6][conditionObject][7],
                  button: buttonConvert(objectData[6][conditionObject][9][1][1]),
                }
              } else if (objectData[6][conditionObject][0] == 9
              ) {
                actions[conditionObject] = {
                  action: "undefined-gamepad",
                  id: objectData[6][conditionObject][7],
                  source: objectData[6][conditionObject]
                }
              }


            }

            for (let actionObject = 0; actionObject < objectData[7].length; actionObject++) {
              if (objectData[7][actionObject][0] === -1) {
                actions[actionObject] = {
                  action: "set-var",
                  // var: objectData[7][actionObject][6][0][1],
                  id: objectData[7][actionObject][5],
                  // value: statements[objectData[7][actionObject][6][1][1][0]]
                }
              }

            }
            code["sheets"][index]["events"][codeObject] =
            {
              type: "block",
              condtions: condtions,
              actions: actions,
              id: objectData[4]
            };


            break;
          case 1:
            type = "variable"

            let dataType = ""
            switch (objectData[2]) {
              case 0:
                dataType = "float"
                break;
              case 1:
                dataType = "string";
                break;
              case 2:
                dataType = "bool";
                break;
              default:
                dataType = "unknown"
                break;
            }

            code["sheets"][index]["events"][codeObject] =
            {
              type: "variable",
              name: objectData[1],
              dataType: dataType,
              value: objectData[3],
              constant: objectData[5],
              id: objectData[6]
            };

            break;
          default:
            type = "unamedType" + objectData[0]
            break;
        }



      }
      sheetObject[1]
    }


    let repackagedData = {
      game: game,
      objects: objects,
      layouts: layouts,
      layoutList: layoutList,
      code: code,
    }

    fs.writeFileSync(outFile, JSON.stringify(repackagedData, null, 2))

  }
}

function conditionalConvert(numVal) {
  switch (numVal) {
    case 2:
      return "less-than"
    case 4:
      return "greater-than"

    default:
      return numVal

  }
}
function buttonConvert(numVal) {
  switch (numVal) {
    case 0:
      return "a"
    case 1:
      return "b"
    case 1:
      return "c"
    default:
      return numVal

  }
}
