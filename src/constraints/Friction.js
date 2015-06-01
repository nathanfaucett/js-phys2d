var vec2 = require("vec2"),
    createPool = require("create_pool"),
    Equation = require("./Equation");


var FrictionPrototype;


function Friction() {

    Equation.call(this);

    this.p = vec2.create();
    this.t = vec2.create();

    this.ri = vec2.create();
    this.rj = vec2.create();

    this.rixt = 0.0;
    this.rjxt = 0.0;
}
createPool(Friction);
FrictionPrototype = Friction.prototype;

FrictionPrototype.init = function(h) {
    var bi = this.bi,
        bj = this.bj,

        p = this.p,
        px = p[0],
        py = p[1],
        t = this.t,
        tx = t[0],
        ty = t[1],

        xi = bi.position,
        xj = bj.position,

        ri = this.ri,
        rix = px - xi[0],
        riy = py - xi[1],

        rj = this.rj,
        rjx = px - xj[0],
        rjy = py - xj[1],

        rixt = rix * ty - riy * tx,
        rjxt = rjx * ty - rjy * tx;

    ri[0] = rix;
    ri[1] = riy;

    rj[0] = rjx;
    rj[1] = rjy;

    this.rixt = rixt;
    this.rjxt = rjxt;

    this.lambda = 0;
    this.calculateB(h);
    this.calculateC();
};

FrictionPrototype.calculateB = function(h) {
    var bi = this.bi,
        bj = this.bj,

        t = this.t,
        tx = t[0],
        ty = t[1],

        vi = bi.velocity,
        wi = bi.angularVelocity,
        fi = bi.force,
        ti = bi.torque,
        invMi = bi.invMass,
        invIi = bi.invInertia,

        vj = bj.velocity,
        wj = bj.angularVelocity,
        fj = bj.force,
        tj = bj.torque,
        invMj = bj.invMass,
        invIj = bj.invInertia,

        ri = this.ri,
        rix = ri[0],
        riy = ri[1],
        rj = this.rj,
        rjx = rj[0],
        rjy = rj[1],

        Gq = 0,

        GWx = vj[0] + (-wj * rjy) - vi[0] - (-wi * riy),
        GWy = vj[1] + (wj * rjx) - vi[1] - (wi * rix),
        GW = GWx * tx + GWy * ty,

        GiMfx = fj[0] * invMj + (-tj * invIj * rjy) - fi[0] * invMi - (-ti * invIi * riy),
        GiMfy = fj[1] * invMj + (tj * invIj * rjx) - fi[1] * invMi - (ti * invIi * rix),
        GiMf = GiMfx * tx + GiMfy * ty;

    this.B = -this.a * Gq - this.b * GW - h * GiMf;
};

FrictionPrototype.calculateC = function() {
    var bi = this.bi,
        bj = this.bj,

        rixt = this.rixt,
        rjxt = this.rjxt,

        invIi = bi.invInertia,
        invIj = bj.invInertia,

        C = bi.invMass + bj.invMass + this.epsilon + invIi * rixt * rixt + invIj * rjxt * rjxt;

    this.invC = C === 0 ? 0 : 1 / C;
};

FrictionPrototype.calculateGWlambda = function() {
    var bi = this.bi,
        bj = this.bj,

        t = this.t,

        vlambdai = bi.vlambda,
        wlambdai = bi.wlambda,
        vlambdaj = bj.vlambda,
        wlambdaj = bj.wlambda,

        ulambdax = vlambdaj[0] - vlambdai[0],
        ulambday = vlambdaj[1] - vlambdai[1],

        GWlambda = ulambdax * t[0] + ulambday * t[1];

    if (wlambdai) {
        GWlambda -= wlambdai * this.rixt;
    }
    if (wlambdaj) {
        GWlambda += wlambdaj * this.rjxt;
    }

    return GWlambda;
};

FrictionPrototype.addToLambda = function(deltaLambda) {
    var bi = this.bi,
        bj = this.bj,

        t = this.t,
        tx = t[0],
        ty = t[1],

        invMi = bi.invMass,
        vlambdai = bi.vlambda,
        invMj = bj.invMass,
        vlambdaj = bj.vlambda;

    vlambdai[0] -= deltaLambda * invMi * tx;
    vlambdai[1] -= deltaLambda * invMi * ty;

    vlambdaj[0] += deltaLambda * invMj * tx;
    vlambdaj[1] += deltaLambda * invMj * ty;

    if (bi.wlambda) {
        bi.wlambda -= deltaLambda * bi.invInertia * this.rixt;
    }
    if (bj.wlambda) {
        bj.wlambda += deltaLambda * bj.invInertia * this.rjxt;
    }
};
