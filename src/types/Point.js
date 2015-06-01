var mathf = require("mathf"),
    vec2 = require("vec2"),
    EventEmitter = require("event_emitter"),
    bodyType = require("../consts/bodyType"),
    sleepType = require("../consts/sleepType"),
    motionType = require("../consts/motionType");


var TAU = mathf.TAU,
    PointPrototype;


module.exports = Point;


function Point() {

    EventEmitter.call(this, -1);

    this.space = null;

    this.type = bodyType.POINT;

    this.position = vec2.create();
    this.velocity = vec2.create();
    this.force = vec2.create();

    this.linearDamping = 0.01;

    this.mass = 0;
    this.invMass = 0;

    this.motionState = motionType.STATIC;

    this.allowSleep = true;
    this.sleepState = sleepType.AWAKE;

    this.sleepVelocityLimit = 0.01;
    this.sleepTimeLimit = 1.0;

    this.data = null;

    this.__sleepTime = 0.0;
    this.__lastSleepyTime = 0.0;

    this.vlambda = vec2.create();
}
EventEmitter.extend(Point);
PointPrototype = Point.prototype;

Point.create = function create() {
    return new Point().construct();
};

PointPrototype.construct = function construct() {
    return this;
};

PointPrototype.destructor = function destructor() {

    this.space = null;

    vec2.set(this.position, 0.0, 0.0);
    vec2.set(this.velocity, 0.0, 0.0);
    vec2.set(this.force, 0.0, 0.0);

    this.linearDamping = 0.01;

    this.mass = 0;
    this.invMass = 0;

    this.motionState = motionType.STATIC;

    this.allowSleep = true;
    this.sleepState = sleepType.AWAKE;

    this.sleepVelocityLimit = 0.01;
    this.sleepTimeLimit = 1.0;

    this.data = null;

    this.__sleepTime = 0.0;
    this.__lastSleepyTime = 0.0;

    vec2.set(this.vlambda, 0.0, 0.0);

    return this;
};

PointPrototype.init = function init() {};

PointPrototype.update = function update(dt) {
    var velocity, force, invMass, linearDamping, position;

    if (this.motionState !== motionType.STATIC) {
        velocity = this.velocity;
        force = this.force;
        invMass = this.invMass;
        linearDamping = mathf.pow(1 - this.linearDamping, dt);
        position = this.position;

        velocity[0] += force[0] * invMass * dt;
        velocity[1] += force[1] * invMass * dt;
        force[0] = force[1] = 0;

        velocity[0] *= linearDamping;
        velocity[1] *= linearDamping;

        if (this.sleepState !== sleepType.SLEEPING) {
            position[0] += velocity[0] * dt;
            position[1] += velocity[1] * dt;
        }
    }
};

PointPrototype.setMotionState = function setMotionState(motionState) {
    if (this.motionState !== motionState) {
        this.motionState = motionState;
        this.wake();
    }

    return this;
};

PointPrototype.setMass = function setMass(mass) {
    mass = mass || 0.0;
    this.mass = mass;
    this.invMass = mass > 0.0 ? 1.0 / mass : 0.0;
    return this;
};

PointPrototype.isAwake = function isAwake() {
    return this.sleepState === sleepType.AWAKE;
};

PointPrototype.isSleepy = function isSleepy() {
    return this.sleepState === sleepType.SLEEPY;
};

PointPrototype.isSleeping = function isSleeping() {
    return this.sleepState === sleepType.SLEEPING;
};

PointPrototype.isStatic = function isStatic() {
    return this.motionState === motionType.STATIC;
};

PointPrototype.isDynamic = function isDynamic() {
    return this.motionState === motionType.DYNAMIC;
};

PointPrototype.isKinematic = function isKinematic() {
    return this.motionState === motionType.KINEMATIC;
};

PointPrototype.wake = function wake() {
    if (this.sleepState === sleepType.SLEEPING) {
        this.emit("wake");
    }
    this.sleepState = sleepType.AWAKE;
    return this;
};

PointPrototype.sleep = function sleep() {
    if (this.sleepState !== sleepType.SLEEPING) {
        this.emit("sleep");
    }
    this.sleepState = sleepType.SLEEPING;
    return this;
};

PointPrototype.sleepTick = function sleepTick(ms) {
    var sleepState, velSq, sleepVelocityLimitSq;

    if (this.allowSleep) {
        sleepState = this.sleepState;
        velSq = vec2.lengthSq(this.velocity);
        sleepVelocityLimitSq = this.sleepVelocityLimit * this.sleepVelocityLimit;

        if (sleepState === sleepType.AWAKE && velSq < sleepVelocityLimitSq) {
            this.sleepState = sleepType.SLEEPY;
            this.__sleepTime = ms;
        } else if (sleepState === sleepType.SLEEPY && velSq > sleepVelocityLimitSq) {
            this.wake();
        } else if (sleepState === sleepType.SLEEPY && (ms - this.__lastSleepyTime) > this.sleepTimeLimit) {
            this.sleep();
        }
    }
};

PointPrototype.toJSON = function toJSON(json) {

    json = json || {};

    json.type = this.type;

    json.position = vec2.copy(json.position || [], this.position);
    json.velocity = vec2.copy(json.velocity || [], this.velocity);
    json.force = vec2.copy(json.force || [], this.force);

    json.linearDamping = this.linearDamping;

    json.mass = this.mass;
    json.invMass = this.invMass;

    json.motionState = this.motionState;

    json.allowSleep = this.allowSleep;
    json.sleepState = this.sleepState;

    json.sleepVelocityLimit = this.sleepVelocityLimit;
    json.sleepTimeLimit = this.sleepTimeLimit;

    json.__sleepTime = this.__sleepTime;
    json.__lastSleepyTime = this.__lastSleepyTime;

    json.vlambda = vec2.copy(json.vlambda || [], this.vlambda);

    return json;
};

PointPrototype.fromJSON = function fromJSON(json) {

    this.type = json.type;

    vec2.copy(this.position, json.position);
    vec2.copy(this.velocity, json.velocity);
    vec2.copy(this.force, json.force);

    this.linearDamping = json.linearDamping;

    this.mass = json.mass;
    this.invMass = json.invMass;

    this.motionState = json.motionState;

    this.allowSleep = json.allowSleep;
    this.sleepState = json.sleepState;

    this.sleepVelocityLimit = json.sleepVelocityLimit;
    this.sleepTimeLimit = json.sleepTimeLimit;

    this.__sleepTime = json.__sleepTime;
    this.__lastSleepyTime = json.__lastSleepyTime;

    vec2.copy(this.vlambda, json.vlambda);

    return this;
};
