const fs = require('fs');
const { BlockList } = require('net');

let objects = [];
let layouts = [];
let vars = {};
let layoutList = [];
let code = {
  sheets: [],
}
let statements = [];
let cmds = [];



module.exports = {
  extract: function(inFile, runtimeFile, outFile) {
    console.log("Starting Decomp")

    let runtime = fs.readFileSync(runtimeFile).toString("utf8")
    statements = runtime.match(new RegExp(`${/self\.C3_ExpressionFuncs = \[/.source}(.*${/\];/.source})`, 's'))[0];

    statements = statements.slice("self.C3_ExpressionFuncs = ".length, -1)

    statements = eval(statements)

    for (let statementIndex = 0; statementIndex < statements.length; statementIndex++) {
      statements[statementIndex] = statements[statementIndex].toString()
    }

    console.log(`Found ${statements.length} statments`)


    cmds = runtime.match(new RegExp(`${/self\.C3_GetObjectRefTable = function \(\) \{/.source}(.*${/\};/.source})`, 's'))[0];

    cmds = cmds.slice("self.C3_GetObjectRefTable = function () {\n	return [\n".length, -5).trim()
    cmds = cmds.split(",");
    for (let cmd = 0; cmd < cmds.length; cmd++) {
      cmds[cmd] = cmds[cmd].trim()

    }

    console.log(`Found ${cmds.length} commands`)

    let json = JSON.parse(fs.readFileSync(inFile).toString("utf8"))
    let game = { width: json["project"][10], height: json["project"][11] };

    // 3 = objects/sprites?
    for (let index = 0; index < json["project"][3].length; index++) {

      objects[index] = {}
      objects[index]["name"] = json["project"][3][index][0];
      if (json["project"][3][index][7]) {
        objects[index]["image"] = json["project"][3][index][7][0][7][0][0];
      }
      objects[index]["behaviors"] = [];
      for (let behavior = 0; behavior < json["project"][3][index][8].length; behavior++) {
        objects[index]["behaviors"][behavior] = json["project"][3][index][8][behavior][0]
      }
      objects[index]["variables"] = [];
      for (let variable = 0; variable < json["project"][3][index][3].length; variable++) {
        objects[index]["variables"][variable] = json["project"][3][index][3][variable][2]
      }

    }
    console.log(`Found ${objects.length} objects`)

    json["project"][3] = {}


    // 5 = layouts
    for (let index = 0; index < json["project"][5].length; index++) {
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
    console.log(`Found ${layouts.length} layouts`)

    json["project"][5] = {}



    // 6 = eventSheet
    for (let index = 0; index < json["project"][6].length; index++) {
      let sheetObject = json["project"][6][index];
      code["sheets"][index] =
      {
        name: sheetObject[0],
        events: []
      };



      for (let codeObject = 0; codeObject < sheetObject[1].length; codeObject++) {
        code["sheets"][index]["events"][codeObject] = handleBlock(sheetObject[1], codeObject)
      }

    }
    console.log(`Found ${code["sheets"].length} eventSheets`)

    json["project"][6] = {}


    let repackagedData = {
      game: game,
      objects: objects,
      layouts: layouts,
      layoutList: layoutList,
      code: code,
    }

    fs.writeFileSync(outFile, JSON.stringify(repackagedData, null, 2))
    fs.writeFileSync("./out/remains.json", JSON.stringify(json, null, 2))

  }
}

function conditionalConvert(numVal) {
  switch (numVal) {
    case 0:
      return "equal"
    case 1:
      return "not-equal"
    case 2:
      return "less-than"
    case 3:
      return "less-than-or-equal"
    case 4:
      return "greater-than"
    case 5:
      return "greater-than-or-equal"


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
function handleBlock(sheetObject, codeObject) {
  let type;
  let objectData = sheetObject[codeObject]

  let extraInfo = {};
  switch (objectData[0]) {
    case 0:
      type = "block"
    case 6:
      if (!type)
        type = "action"
    case 3:
      if (!type) {
        type = "group"
        extraInfo["name"] = objectData[1][1]
      }


    case 4:
      if (!type) {
        type = "function"
        extraInfo["name"] = objectData[1][0]

      }

      let actions = [];
      let condtions = [];

      for (let conditionObject = 0; conditionObject < objectData[6].length; conditionObject++) {

        let obj = {
          name:
            "System"
        };
        if (objectData[6][conditionObject][0] >= 0) {
          obj = objects[objectData[6][conditionObject][0]]
        }

        let action = cmds[objectData[6][conditionObject][1]]



        if (
          action == "C3.Plugins.Sprite.Cnds.CompareInstanceVar"
        ) {

          condtions[conditionObject] = {
            action: "compare-instance-variable",
            id: objectData[6][conditionObject][7],
            obj: obj["name"],
            var: obj["variables"][objectData[6][conditionObject][9][0][1]],
            comparison: conditionalConvert(objectData[6][conditionObject][9][1][1]),
            value: statements[objectData[6][conditionObject][9][2][1][0]],
          }
        }
        else if (
          action == "C3.Plugins.System.Cnds.CompareVar"
        ) {


          condtions[conditionObject] = {
            action: "compare-event-variable",
            id: objectData[6][conditionObject][7],
            var: vars[objectData[6][conditionObject][9][0][1]],
            comparison: conditionalConvert(objectData[6][conditionObject][9][1][1]),
            value: statements[objectData[6][conditionObject][9][2][1][0]],
          }
        }
        else if (
          action == "C3.Plugins.Keyboard.Cnds.OnKey"
        ) {

          condtions[conditionObject] = {
            action: "key-pressed",
            id: objectData[6][conditionObject][7],
            obj: obj["name"],
            key: objectData[6][conditionObject][9][0][1],
          }
        }

        if (condtions[conditionObject] == undefined) {
          condtions[conditionObject] = {
            action: action,
            "action-id": objectData[6][conditionObject][1],
            object: obj["name"]
          }

        }



      }

      for (let actionObject = 0; actionObject < objectData[7].length; actionObject++) {
        let found = true;

        let obj = {};
        if (objectData[7][actionObject][0] >= 0) {
          obj = objects[objectData[7][actionObject][0]]
        }

        let action = cmds[objectData[7][actionObject][1]]

        if (
          action == "C3.Plugins.Sprite.Acts.SetInstanceVar"
        ) {
          actions[actionObject] = {
            action: "set-instvar",
            // var: objectData[7][actionObject][6][0][1],
            id: objectData[7][actionObject][3],
            object: obj["name"],
            "instance-variable": obj["variables"][objectData[7][actionObject][6][0][1]],
            value: statements[objectData[7][actionObject][6][1][1][0]]
          }
        }
        else if (
          action == "C3.Plugins.Sprite.Acts.AddInstanceVar"
        ) {

          actions[actionObject] = {
            action: "add-to-instvar",
            // var: objectData[7][actionObject][6][0][1],
            id: objectData[7][actionObject][3],
            object: obj["name"],
            "instance-variable": obj["variables"][objectData[7][actionObject][6][0][1]],
            value: statements[objectData[7][actionObject][6][1][1][0]]
          }
        }
        else if (
          action == "C3.Plugins.Sprite.Acts.SubInstanceVar"
        ) {
          actions[actionObject] = {
            action: "sub-to-instvar",
            // var: objectData[7][actionObject][6][0][1],
            id: objectData[7][actionObject][3],
            object: obj["name"],
            "instance-variable": obj["variables"][objectData[7][actionObject][6][0][1]],
            value: statements[objectData[7][actionObject][6][1][1][0]]
          }

        }
        else if (
          objectData[7][actionObject][0] == -2
        ) {
          actions[actionObject] = {
            action: "call-function",
            function: objectData[7][actionObject][1]
          }
        }

        else if (actions[actionObject] == undefined) {

          actions[actionObject] = {
            action: action,
            "action-id": objectData[7][actionObject][1],
            object: obj["name"]
          }
          found = false;
        }
      }
      let children = [];
      if (objectData[8]) {
        for (let childDex = 0; childDex < objectData[8].length; childDex++) {
          children[childDex] = handleBlock(objectData[8], childDex)
        }
      }
      return {
        type: type,
        id: objectData[4],
        extraInfo: extraInfo,
        condtions: condtions,
        actions: actions,
        children: children,
      };


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

      vars[objectData[6]] = objectData[1]
      return {
        type: "variable",
        name: objectData[1],
        dataType: dataType,
        value: objectData[3],
        constant: objectData[5],
        id: objectData[6]
      };

    default:
      type = "unamedType" + objectData[0]
      return {
        type: type,
      };

      break;
  }
}
