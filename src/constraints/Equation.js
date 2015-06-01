var EquationPrototype;


module.exports = Equation;


function Equation() {

    this.bi = null;
    this.bj = null;

    this.minForce = -Number.MAX_VALUE;
    this.maxForce = Number.MAX_VALUE;

    this.relaxation = 4;
    this.stiffness = 1e6;

    this.a = 0;
    this.b = 0;
    this.epsilon = 0;

    this.lambda = 0;
    this.B = 0;
    this.invC = 0;
}
EquationPrototype = Equation.prototype;

EquationPrototype.updateConstants = function(h) {
    var k = this.stiffness,
        d = this.relaxation;

    this.a = 4.0 / (h * (1.0 + 4.0 * d));
    this.b = (4.0 * d) / (1.0 + 4.0 * d);
    this.epsilon = 4.0 / (h * h * k * (1.0 + 4.0 * d));
};
