var aabb2 = require("aabb2"),
    vec2 = require("vec2"),
    mat32 = require("mat32"),
    EventEmitter = require("event_emitter"),
    shapeType = require("../consts/shapeType");


var ShapePrototype;


module.exports = Shape;


function Shape() {

    EventEmitter.call(this, -1);

    this.type = shapeType.NONE;

    this.body = null;

    this.density = 1;

    this.localPosition = vec2.create();
    this.localRotation = 0;

    this.position = vec2.create();
    this.rotation = 0;

    this.matrix = mat32.create();
    this.matrixWorld = mat32.create();

    this.friction = 0.5;
    this.elasticity = 0.25;

    this.isTrigger = false;

    this.filterMask = 1;
    this.filterGroup = 1;

    this.aabb = aabb2.create();
}
EventEmitter.extend(Shape);
ShapePrototype = Shape.prototype;

Shape.create = function create() {
    return new Shape().construct();
};

ShapePrototype.construct = function construct() {
    return this;
};

ShapePrototype.destructor = function destructor() {

    this.type = shapeType.NONE;

    this.body = null;

    this.density = 1;

    vec2.set(this.localPosition, 0.0, 0.0);
    this.localRotation = 0;

    vec2.set(this.position, 0.0, 0.0);
    this.rotation = 0;

    mat32.identity(this.matrix);
    mat32.identity(this.matrixWorld);

    this.friction = 0.5;
    this.elasticity = 0.25;

    this.isTrigger = false;

    this.filterMask = 1;
    this.filterGroup = 1;

    aabb2.clear(this.aabb);

    return this;
};

ShapePrototype.toJSON = function(json) {

    json = json || {};

    json.type = this.type;
    json.density = this.density;

    json.localPosition = vec2.copy(json.localPosition || [], this.localPosition);
    json.localRotation = this.localRotation;

    json.position = vec2.copy(json.position || [], this.position);
    json.rotation = this.rotation;

    json.matrix = mat32.copy(json.matrix || [], this.matrix);
    json.matrixWorld = mat32.copy(json.matrixWorld || [], this.matrixWorld);

    json.friction = this.friction;
    json.elasticity = this.elasticity;

    json.isTrigger = this.isTrigger;

    json.filterMask = this.filterMask;
    json.filterGroup = this.filterGroup;

    json.aabb = aabb2.toJSON(this.aabb, json.aabb);

    return json;
};

ShapePrototype.fromJSON = function(json) {

    this.type = json.type;
    this.density = json.density;

    vec2.copy(this.localPosition, json.localPosition);
    this.localRotation = json.localRotation;

    vec2.copy(this.position, json.position);
    this.rotation = json.rotation;

    mat32.copy(this.matrix, json.matrix);
    mat32.copy(this.matrixWorld, json.matrixWorld);

    this.friction = json.friction;
    this.elasticity = json.elasticity;

    this.isTrigger = json.isTrigger;

    this.filterMask = json.filterMask;
    this.filterGroup = json.filterGroup;

    aabb2.fromJSON(this.aabb, json.aabb);

    return this;
};
