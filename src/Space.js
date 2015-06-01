var vec2 = require("vec2"),
    time = require("time"),
    motionType = require("./consts/motionType"),
    BroadPhase = require("./collision/BroadPhase"),
    NearPhase = require("./collision/NearPhase"),
    Solver = require("./Solver"),
    Friction = require("./constraints/Friction");


var SpacePrototype;


module.exports = Space;


function Space() {

    this.useGravity = true;
    this.gravity = vec2.create(0.0, -9.801);

    this.time = 0.0;

    this.broadphase = new Space.DefaultBroadPhase();
    this.nearphase = new Space.DefaultNearPhase();

    this.solver = new Space.DefaultSolver();

    this.bodies = [];
    this.__bodyHash = {};

    this.__pairsi = [];
    this.__pairsj = [];

    this.contacts = [];
    this.frictions = [];
    this.constraints = [];

    this.__collisionMatrix = [];
    this.__collisionMatrixPrevious = [];

    this.stats = {
        step: 0.0,
        solve: 0.0,
        integrate: 0.0,
        nearphase: 0.0,
        broadphase: 0.0
    };
}
SpacePrototype = Space.prototype;

Space.DefaultBroadPhase = BroadPhase;
Space.DefaultNearPhase = NearPhase;
Space.DefaultSolver = Solver;

SpacePrototype.collisionMatrixGet = function(i, j, current) {
    var tmp = j;

    if (j > i) {
        j = i;
        i = tmp;
    }
    i = (i * (i + 1) >> 1) + j - 1;

    return (current === undefined || current) ? this.__collisionMatrix[i] : this.__collisionMatrixPrevious[i];
};

SpacePrototype.collisionMatrixSet = function(i, j, value, current) {
    var tmp = j;

    if (j > i) {
        j = i;
        i = tmp;
    }

    i = (i * (i + 1) >> 1) + j - 1;

    if (current === undefined || current) {
        this.__collisionMatrix[i] = value;
    } else {
        this.__collisionMatrixPrevious[i] = value;
    }
};

SpacePrototype.collisionMatrixTick = function() {
    var collisionMatrix = this.__collisionMatrixPrevious,
        i;

    this.__collisionMatrixPrevious = this.__collisionMatrix;
    this.__collisionMatrix = collisionMatrix;

    i = collisionMatrix.length;
    while (i--) {
        collisionMatrix[i] = 0;
    }
};

SpacePrototype.clear = function() {
    var bodies = this.bodies,
        i = bodies.length;

    while (i--) {
        this.removeBody(bodies[i]);
    }

    return this;
};

SpacePrototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Space_add(this, arguments[i]);
    }
    return this;
};

function Space_add(_this, body) {
    var bodies = _this.bodies,
        index = bodies.indexOf(body);

    if (index === -1) {
        bodies.push(body);
        _this.__bodyHash[body._id] = body;

        body.space = _this;
        body.__index = bodies.length - 1;

        body.init();
    } else {
        throw new Error("Space.add(...bodies): Body already member of space");
    }
}

SpacePrototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Space_remove(this, arguments[i]);
    }
    return this;
};

function Space_remove(_this, body) {
    var bodies = _this.bodies,
        index = bodies.indexOf(body);

    if (index !== -1) {
        body.space = null;
        body.__index = -1;

        bodies.splice(index, 1);
        delete _this.__bodyHash[body.__id];
    } else {
        throw new Error("Space.remove(...bodies): Body is not a member of space");
    }

    return this;
};


SpacePrototype.addConstraint = function(constraint) {
    var constraints = this.constraints,
        index = constraints.indexOf(constraint);

    if (index === -1) {
        constraints.push(constraint);
    } else {
        throw new Error("Space.addConstraint(constraint): Constraint already member of space");
    }

    return this;
};


SpacePrototype.removeConstraint = function(constraint) {
    var constraints = this.constraints,
        index = constraints.indexOf(constraint);

    if (index !== -1) {
        constraints.splice(index, 1);
    } else {
        throw new Error("Space.removeConstraint(constraint): Constraint not a member of space");
    }

    return this;
};

SpacePrototype.findBodyByPoint = function(p) {
    var bodies = this.bodies,
        body, shapes, shape,
        i = bodies.length,
        j;

    while (i--) {
        body = bodies[i];

        if (body) {
            shapes = body.shapes;
            j = shapes.length;

            while (j--) {
                shape = shapes[j];

                if (shape && shape.pointQuery(p)) {
                    return body;
                }
            }
        }
    }

    return null;
};

SpacePrototype.findBodyById = function(id) {
    return this.__bodyHash[id];
};

SpacePrototype.step = function(dt) {
    var stepStart = time.now(),
        stats = this.stats,
        g = this.gravity,
        gx = g[0],
        gy = g[1],
        bodies = this.bodies,
        numBodies = bodies.length,
        solver = this.solver,
        constraints = this.constraints,
        pairsi = this.__pairsi,
        pairsj = this.__pairsj,
        contacts = this.contacts,
        frictions = this.frictions,
        constraint, currentTime, start, body, force, mass,
        bi, bj, c, cp, cn, u, slipForce, fc, fcp, fct,
        i;

    currentTime = this.time += dt;

    if (this.useGravity) {
        i = numBodies;
        while (i--) {
            body = bodies[i];

            if (body.motionState === motionType.DYNAMIC) {
                force = body.force;
                mass = body.mass;

                force[0] += gx * mass;
                force[1] += gy * mass;
            }
        }
    }

    this.collisionMatrixTick();

    start = time.now();
    this.broadphase.collisions(bodies, pairsi, pairsj);
    stats.broadphase = time.now() - start;

    start = time.now();
    this.nearphase.collisions(pairsi, pairsj, contacts);
    stats.nearphase = time.now() - start;

    start = time.now();
    solver.solve(dt, contacts);

    releaseArray(frictions);
    frictions.length = 0;

    i = contacts.length;
    while (i--) {
        c = contacts[i];

        if (c.u > 0.0) {
            bi = c.bi;
            bj = c.bj;
            fc = Friction.create();
            u = c.u;

            slipForce = u * c.lambda;
            fc.minForce = -slipForce;
            fc.maxForce = slipForce;

            fc.bi = bi;
            fc.bj = bj;

            cp = c.p;
            fcp = fc.p;

            fcp[0] = cp[0];
            fcp[1] = cp[1];

            cn = c.n;
            fct = fc.t;

            fct[0] = -cn[1];
            fct[1] = cn[0];

            frictions[frictions.length] = fc;
        }
    }

    solver.solve(dt, frictions);

    i = constraints.length;
    while (i--) {
        constraint = constraints[i];
        constraint.update();
        solver.solve(dt, constraint.equations);
    }
    stats.solve = time.now() - start;

    start = time.now();
    i = numBodies;
    while (i--) {
        body = bodies[i];
        if (body) {
            body.update(dt);
            body.sleepTick(currentTime);
        }
    }
    stats.integrate = time.now() - start;

    stats.step = time.now() - stepStart;
};

SpacePrototype.toJSON = function(json) {

    json.useGravity = this.useGravity;
    json.gravity = this.gravity.toJSON(json.gravity);
    json.broadphase = this.broadphase.toJSON(json.broadphase);

    return json;
};

SpacePrototype.fromJSON = function(json) {

    this.useGravity = json.useGravity;
    this.gravity.fromJSON(json.gravity);
    this.broadphase.fromJSON(json.broadphase);

    return this;
};

function releaseArray(array, constructor) {
    var i = -1,
        il = array.length - 1,
        value;

    while (i++ < il) {
        value = array[i];
        value.destructor();
        constructor.release(value);
    }
}
