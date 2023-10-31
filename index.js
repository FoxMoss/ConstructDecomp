const fs = require('fs');
const { extract } = require('./extract.js');
const { lace } = require('./lace.js');

let method = process.argv[2]

switch (method) {
  case "extract":
    extract("./out/data.json", "./out/c3runtime.js", "./out/out.json")
    break;
  case "lace":
    lace("./out/data.json", "./out/edit.json", "./out/laced.json")
    break;
  default:
    console.log("Method not defined, methods inclue: extract, and lace")
    break;
}
