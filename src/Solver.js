var mathf = require("mathf");


var SolverPrototype;


module.exports = Solver;


function Solver() {
    this.iterations = 10;
    this.tolerance = 1e-6;
}
SolverPrototype = Solver.prototype;

SolverPrototype.solve = function(h, equations) {
    var num = equations.length,
        eq, bi, bj,
        vlambdai, vlambdaj, vi, vj,
        iterations = this.iterations,
        iter = 0,
        toleranceSq = this.tolerance * this.tolerance,
        GWlambda, lambda, deltaLambda, deltaLambdaTotal,
        i, j;

    if (num > -1) {
        i = num;
        while (i--) {
            eq = equations[i];

            eq.updateConstants(h);
            eq.init(h);
        }

        i = iterations;
        while (i--) {

            iter++;
            deltaLambdaTotal = 0;

            j = num;
            while (j--) {
                eq = equations[j];

                GWlambda = eq.calculateGWlambda();
                lambda = eq.lambda;
                deltaLambda = eq.invC * (eq.B - GWlambda - eq.epsilon * lambda);

                eq.lambda = mathf.clamp(lambda + deltaLambda, eq.minForce, eq.maxForce);
                deltaLambda = eq.lambda - lambda;

                eq.addToLambda(deltaLambda);
                deltaLambdaTotal += deltaLambda;
            }

            if (deltaLambdaTotal * deltaLambdaTotal < toleranceSq) {
                break;
            }
        }

        i = num;
        while (i--) {
            eq = equations[i];

            bi = eq.bi;
            vi = bi.velocity;
            vlambdai = bi.vlambda;
            bj = eq.bj;
            vj = bj.velocity;
            vlambdaj = bj.vlambda;

            vi.x += vlambdai.x;
            vi.y += vlambdai.y;

            vj.x += vlambdaj.x;
            vj.y += vlambdaj.y;

            vlambdai.x = vlambdai.y = vlambdaj.x = vlambdaj.y = 0;

            if (bi.wlambda) {
                bi.angularVelocity += bi.wlambda;
                bi.wlambda = 0;
            }
            if (bj.wlambda) {
                bj.angularVelocity += bj.wlambda;
                bj.wlambda = 0;
            }
        }
    }

    return iter;
};
