var mathf = require("mathf"),
    vec2 = require("vec2"),
    mat32 = require("mat32"),
    Shape = require("./Shape"),
    shapeType = require("../consts/shapeType");


var ShapePrototype = Shape.prototype,
    CirclePrototype;


module.exports = Circle;


function Circle() {

    Shape.call(this);

    this.type = shapeType.CIRCLE;
    this.radius = 0.5;
}

Shape.extend(Circle);
CirclePrototype = Circle.prototype;

Circle.create = function create(radius) {
    return new Circle().construct(radius);
};

CirclePrototype.construct = function construct(radius) {

    ShapePrototype.construct.call(this);

    this.radius = radius || 0.5;

    return this;
};

CirclePrototype.destructor = function destructor() {

    ShapePrototype.destructor.call(this);

    this.radius = 0.5;

    return this;
};

CirclePrototype.pointQuery = function(p) {
    var x = this.position,
        dx = x[0] - p[0],
        dy = x[1] - p[1],
        r = this.radius;

    return (dx * dx + dy * dy) < r * r;
};

CirclePrototype.centroid = function(v) {
    var localPosition = this.localPosition;

    v[0] = localPosition[0];
    v[1] = localPosition[1];

    return v;
};

CirclePrototype.area = function() {
    var r = this.radius;

    return mathf.PI * (r * r);
};

CirclePrototype.inertia = function(mass) {
    var r = this.radius,
        localPosition = this.localPosition,
        lx = localPosition[0],
        ly = localPosition[1];

    return mass * ((r * r * 0.5) + (lx * lx + ly * ly));
};

CirclePrototype.update = function(matrix) {
    var localMatrix = this.matrix,
        matrixWorld = this.matrixWorld,
        localPosition = this.localPosition,
        pos = this.position,
        r = this.radius,
        aabb = this.aabb,
        min = aabb.min,
        max = aabb.max,
        x, y;

    mat32.setRotation(localMatrix, this.localRotation);
    mat32.setPosition(localMatrix, localPosition);
    mat32.mul(matrixWorld, matrix, localMatrix);

    pos[0] = localPosition[0];
    pos[1] = localPosition[1];
    vec2.transformMat32(pos, pos, matrix);
    x = pos[0];
    y = pos[1];

    min[0] = x - r;
    min[1] = y - r;
    max[0] = x + r;
    max[1] = y + r;
};

CirclePrototype.toJSON = function(json) {

    json = ShapePrototype.toJSON.call(this, json);

    json.radius = this.radius;

    return json;
};

CirclePrototype.fromJSON = function(json) {

    ShapePrototype.fromJSON.call(this, json);

    this.radius = json.radius;

    return this;
};
