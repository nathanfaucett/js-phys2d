var motionType = require("../consts/motionType"),
    sleepType = require("../consts/sleepType");


var BroadphasePrototype;


module.exports = Broadphase;


function Broadphase() {}
BroadphasePrototype = Broadphase.prototype;

BroadphasePrototype.collisions = function(bodies, pairsi, pairsj) {
    var length = bodies.length,
        bi, bj, shapesi, shapesj, si, sj,
        i = length,
        j, k, l;

    pairsi.length = pairsj.length = 0;

    while (i--) {
        j = 0;
        while (j !== i) {
            bi = bodies[i];
            bj = bodies[j];
            j++;

            if (
                (bi.motionState !== motionType.DYNAMIC && bj.motionState !== motionType.DYNAMIC) ||
                (bi.sleepState === sleepType.SLEEPING && bj.sleepState === sleepType.SLEEPING)
            ) {
                continue;
            }

            shapesi = bi.shapes;
            shapesj = bj.shapes;

            if (bi.aabb.intersects(bj.aabb)) {
                k = shapesi.length;
                length = shapesj.length;
                while (k--) {
                    l = length;
                    while (l--) {
                        si = shapesi[k];
                        sj = shapesj[l];

                        if ((si.filterGroup & sj.filterMask) !== 0 && (sj.filterGroup & si.filterMask) !== 0) {
                            if (si.aabb.intersects(sj.aabb)) {
                                pairsi.push(si);
                                pairsj.push(sj);
                            }
                        }
                    }
                }
            }
        }
    }
};

BroadphasePrototype.toJSON = function(json) {
    json = json || {};
    return json;
};

BroadphasePrototype.fromJSON = function() {
    return this;
};
