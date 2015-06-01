var shapeType = require("../consts/shapeType"),
    Circle = require("./Circle");


module.exports = shapeClassFromJSON;


function shapeClassFromJSON(json) {
    switch (json.type) {
        case shapeType.CIRCLE:
            return Circle;
        default:
            throw new Error("shapeClassFromJSON(json): no Class with type " + json.type);
    }
}
