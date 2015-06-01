var circleToCircle = require("circle_to_circle"),
    shapeType = require("../consts/shapeType");


var P2NearphasePrototype;


module.exports = P2Nearphase;


function P2Nearphase() {}
P2NearphasePrototype = P2Nearphase.prototype;

P2NearphasePrototype.collisions = function(pairsi, pairsj, contacts) {
    var si, sj,
        i = pairsi.length;

    contacts.length = 0;

    while (i--) {
        si = pairsi[i];
        sj = pairsj[i];

        collisionType(si, sj, contacts);
    }
};

function circleCircle(si, sj, contacts) {
    var xi = si.position,
        xj = sj.position,
        contact = circleToCircle(xi[0], xi[1], si.radius, xj[0], xj[1], sj.radius);

    if (contact) {
        contacts[contacts.length] = contact;
    }
}

function segmentCircle(si, sj, contacts) {

}

function convexCircle(si, sj, contacts) {

}

function convexSegment(si, sj, contacts) {

}

function convexConvex(si, sj, contacts) {

}

function segmentSegment(si, sj, contacts) {

}

function collisionType(si, sj, contacts) {
    var siType = si.type,
        sjType = sj.type;

    if (siType === shapeType.CIRCLE) {
        if (sjType === shapeType.CIRCLE) {
            circleCircle(si, sj, contacts);
        } else if (sjType === shapeType.SEGMENT) {
            segmentCircle(sj, si, contacts);
        } else if (sjType === shapeType.CONVEX) {
            convexCircle(sj, si, contacts);
        }
    } else if (siType === shapeType.CONVEX) {
        if (sjType === shapeType.CIRCLE) {
            convexCircle(si, sj, contacts);
        } else if (sjType === shapeType.SEGMENT) {
            convexSegment(si, sj, contacts);
        } else if (sjType === shapeType.CONVEX) {
            convexConvex(si, sj, contacts);
        }
    } else if (siType === shapeType.SEGMENT) {
        if (sjType === shapeType.CIRCLE) {
            segmentCircle(si, sj, contacts);
        } else if (sjType === shapeType.SEGMENT) {
            segmentSegment(si, sj, contacts);
        } else if (sjType === shapeType.CONVEX) {
            convexSegment(sj, si, contacts);
        }
    }
}
