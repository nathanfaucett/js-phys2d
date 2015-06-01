var mathf = require("mathf"),
    vec2 = require("vec2"),
    mat32 = require("mat32"),
    aabb2 = require("aabb2"),
    indexOf = require("index_of"),
    bodyType = require("../consts/bodyType"),
    sleepType = require("../consts/sleepType"),
    motionType = require("../consts/motionType"),
    Point = require("./Point"),
    shapeClassFromJSON = require("../shapes/shapeClassFromJSON");


var PointPrototype = Point.prototype,
    RigidBodyPrototype;


module.exports = RigidBody;


function RigidBody() {

    Point.call(this);

    this.type = bodyType.RIGID_BODY;

    this.rotation = 0;
    this.angularVelocity = 0;
    this.torque = 0;

    this.angularDamping = mathf.TAU * 0.01;

    this.matrix = mat32.create();
    this.aabb = aabb2.create();

    this.inertia = 0;
    this.invInertia = 0;

    this.sleepAngularVelocityLimit = mathf.TAU * 0.01;

    this.shapes = [];

    this.wlambda = 0;
}
Point.extend(RigidBody);
RigidBodyPrototype = RigidBody.prototype;

RigidBody.create = function create() {
    return new RigidBody().construct();
};

RigidBodyPrototype.construct = function construct() {

    PointPrototype.construct.call(this);

    return this;
};

function removeFromBody(shape) {
    shape.body = null;
}

RigidBodyPrototype.destructor = function destructor() {

    PointPrototype.destructor.call(this);

    this.rotation = 0;
    this.angularVelocity = 0;
    this.torque = 0;

    this.angularDamping = mathf.TAU * 0.01;

    mat32.identity(this.matrix);
    aabb2.clear(this.aabb);

    this.inertia = 0;
    this.invInertia = 0;

    this.sleepAngularVelocityLimit = mathf.TAU * 0.01;

    this.shapes.length = 0;
    this.forEachShape(removeFromBody);

    this.wlambda = 0;

    return this;
};

var init_scale = vec2.create(1, 1);
RigidBodyPrototype.init = function init() {
    var shapes = this.shapes,
        matrix = this.matrix,
        aabb = this.aabb,
        shape,
        i = -1,
        il = shapes.length - 1;

    mat32.compose(matrix, this.position, init_scale, this.rotation);
    aabb2.clear(aabb);

    while (i++ < il) {
        shape = shapes[i];
        shape.update(matrix);
        aabb2.union(aabb, aabb, shape.aabb);
    }

    this.resetMassData();
};

var update_scale = vec2.create(1, 1);
RigidBodyPrototype.update = function update(dt) {
    var matrix, aabb, shapes, shape, i;

    if (this.motionState !== motionType.STATIC) {

        PointPrototype.update.call(this, dt);

        this.angularVelocity += this.torque * this.invInertia * dt;
        this.torque = 0;
        this.angularVelocity *= mathf.pow(1 - this.angularDamping, dt);

        if (this.sleepState !== sleepType.SLEEPING) {
            this.rotation += this.angularVelocity * dt;

            matrix = this.matrix;
            mat32.compose(matrix, this.position, update_scale, this.rotation);

            aabb = this.aabb;
            aabb2.clear(aabb);

            shapes = this.shapes;
            i = shapes.length;
            while (i--) {
                shape = shapes[i];
                shape.update(matrix);
                aabb2.union(aabb, aabb, shape.aabb);
            }
        }
    }
};

RigidBodyPrototype.applyForce = function applyForce(force, worldPoint) {
    var pos, f, fx, fy, px, py;

    if (this.motionState !== motionType.STATIC) {
        if (this.sleepState === sleepType.SLEEPING) {
            this.wake();
        }
        pos = this.position;
        f = this.force;
        fx = force.x;
        fy = force.y;

        worldPoint = worldPoint || pos;

        px = worldPoint[0] - pos[0];
        py = worldPoint[1] - pos[1];

        f[0] += fx;
        f[1] += fy;

        this.torque += px * fy - py * fx;
    }
};

RigidBodyPrototype.applyAngularVelocity = function applyAngularVelocity(torque) {
    if (this.motionState !== motionType.STATIC) {
        if (this.sleepState === sleepType.SLEEPING) {
            this.wake();
        }

        this.torque += torque;
    }
};

RigidBodyPrototype.applyImpulse = function applyImpulse(impulse, worldPoint) {
    var pos, invMass, velocity, ix, iy, px, py;

    if (this.motionState !== motionType.STATIC) {
        if (this.sleepState === sleepType.SLEEPING) {
            this.wake();
        }
        pos = this.position;
        invMass = this.invMass;
        velocity = this.velocity;
        ix = impulse[0];
        iy = impulse[1];

        worldPoint = worldPoint || pos;

        px = worldPoint[0] - pos[0];
        py = worldPoint[1] - pos[1];

        velocity[0] += ix * invMass;
        velocity[1] += iy * invMass;

        this.angularVelocity += (px * iy - py * ix) * this.invInertia;
    }
};

RigidBodyPrototype.applyVelocity = function applyVelocity(velocity) {
    var vel;

    if (this.motionState !== motionType.STATIC) {
        if (this.sleepState === sleepType.SLEEPING) {
            this.wake();
        }
        vel = this.velocity;

        vel[0] += velocity[0];
        vel[1] += velocity[1];
    }
};

RigidBodyPrototype.applyAngularVelocity = function applyAngularVelocity(angularVelocity) {
    if (this.motionState !== motionType.STATIC) {
        if (this.sleepState === sleepType.SLEEPING) {
            this.wake();
        }

        this.angularVelocity += angularVelocity;
    }
};

var resetMassData_totalCentroid = vec2.create(),
    resetMassData_centroid = vec2.create();
RigidBodyPrototype.resetMassData = function resetMassData() {
    var shapes, shape, totalMass, totalInertia, mass, inertia, totalCentroid, centroid, i, il;

    if (this.motionState !== motionType.STATIC) {
        totalCentroid = resetMassData_totalCentroid;
        centroid = resetMassData_centroid;

        shapes = this.shapes;
        totalMass = 0.0;
        totalInertia = 0.0;
        totalCentroid[0] = totalCentroid[1] = 0.0;

        i = -1;
        il = shapes.length - 1;

        while (i++ < il) {
            shape = shapes[i];

            shape.centroid(centroid);
            mass = shape.area() * shape.density;
            inertia = shape.inertia(mass);

            vec2.add(totalCentroid, totalCentroid, vec2.smul(centroid, mass));
            totalMass += mass;
            totalInertia += inertia;
        }

        vec2.copy(centroid, vec2.sdiv(totalCentroid, totalMass));

        this.setMass(totalMass);
        this.setInertia(totalInertia - totalMass * vec2.lengthSq(centroid));
    }
};

RigidBodyPrototype.setInertia = function(inertia) {
    inertia = inertia || 0.0;
    this.inertia = inertia;
    this.invInertia = inertia > 0.0 ? 1.0 / inertia : 0.0;
    return this;
};

RigidBodyPrototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        RigidBody_add(this, arguments[i]);
    }

    return this;
};

function RigidBody_add(_this, shape) {
    var shapes = _this.shapes,
        index = indexOf(shapes, shape);

    if (index === -1) {
        shape.body = _this;
        shapes[shapes.length] = shape;

        if (_this.space !== null) {
            shape.update(_this.matrix);
            _this.resetMassData();
        }
    } else {
        throw new Error("RigidBody.add(...shapes): Shape already member of rigid body");
    }
}

RigidBodyPrototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        RigidBody_remove(this, arguments[i]);
    }

    return this;
};

function RigidBody_remove(_this, shape) {
    var shapes = _this.shapes,
        index = indexOf(shapes, shape);

    if (index !== -1) {
        shape.body = null;
        shapes.splice(index, 1);

        if (_this.space !== null) {
            shape.update(_this.matrix);
            _this.resetMassData();
        }
    } else {
        throw new Error("RigidBody.remove(...shapes): Shape not a member of rigid body");
    }
}

RigidBodyPrototype.removeAllShapes = function() {
    var shapes = this.shapes,
        i = -1,
        il = shapes.length - 1;

    while (i++ < il) {
        this.remove(shapes[i]);
    }

    return this;
};

RigidBodyPrototype.forEachShape = function(fn) {
    var shapes = this.shapes,
        i = -1,
        il = shapes.length - 1;

    while (i++ < il) {
        if (fn(shapes[i], i) === false) {
            break;
        }
    }

    return this;
};

RigidBodyPrototype.sleepTick = function sleepTick(ms) {
    var sleepState, velSq, sleepVelocityLimitSq, aVel, sleepAngularVelocityLimit;

    if (this.allowSleep) {
        sleepState = this.sleepState;
        velSq = vec2.lengthSq(this.velocity);
        sleepVelocityLimitSq = this.sleepVelocityLimit * this.sleepVelocityLimit;
        aVel = this.angularVelocity;
        sleepAngularVelocityLimit = this.sleepAngularVelocityLimit;

        if (sleepState === sleepType.AWAKE && (velSq < sleepVelocityLimitSq && aVel < sleepAngularVelocityLimit)) {
            this.sleepState = sleepType.SLEEPY;
            this.__sleepTime = ms;
        } else if (sleepState === sleepType.SLEEPY && (velSq > sleepVelocityLimitSq || aVel > sleepAngularVelocityLimit)) {
            this.wake();
        } else if (sleepState === sleepType.SLEEPY && (ms - this.__lastSleepyTime) > this.sleepTimeLimit) {
            this.sleep();
        }
    }
};

RigidBodyPrototype.toJSON = function toJSON(json) {

    json = PointPrototype.toJSON.call(this, json);

    json.rotation = this.rotation;
    json.angularVelocity = this.angularVelocity;
    json.torque = this.torque;

    json.angularDamping = this.angularDamping;

    json.matrix = mat32.copy(json.matrix || [], this.matrix);
    json.aabb = aabb2.toJSON(json.aabb, this.aabb);

    json.inertia = this.inertia;
    json.invInertia = this.invInertia;

    json.sleepAngularVelocityLimit = this.sleepAngularVelocityLimit;

    json.wlambda = this.wlambda;

    return json;
};

RigidBodyPrototype.fromJSON = function fromJSON(json) {

    PointPrototype.fromJSON.call(this, json);

    this.rotation = json.rotation;
    this.angularVelocity = json.angularVelocity;
    this.torque = json.torque;

    this.angularDamping = json.angularDamping;

    mat32.copy(this.matrix, json.matrix);
    aabb2.fromJSON(this.aabb, json.aabb);

    this.inertia = json.inertia;
    this.invInertia = json.invInertia;

    this.sleepAngularVelocityLimit = json.sleepAngularVelocityLimit;

    this.wlambda = json.wlambda;

    return this;
};
