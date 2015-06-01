var mathf = require("mathf"),
    create = require("create"),
    motionType = require("../consts/motionType"),
    sleepType = require("../consts/sleepType");


var BroadphaseSpatialHashPrototype;


function BroadphaseSpatialHash() {

    this.__cellSize = 1;
    this.__inverseCellSize = 1;

    this.cells = create(null);
    this.cellDeathFrameCount = 300;
}
BroadphaseSpatialHashPrototype = BroadphaseSpatialHash.prototype;

BroadphaseSpatialHashPrototype.setCellSize = function(value) {
    value = value >= 1 ? value : 1;

    this.__cellSize = mathf.floor(value);
    this.__inverseCellSize = 1 / this.__cellSize;

    return this;
};

BroadphaseSpatialHashPrototype.getCellSize = function() {
    return this._cellSize;
};

BroadphaseSpatialHashPrototype.collisions = function(bodies, pairsi, pairsj) {
    var cells = this.cells,
        cellSize = this.__cellSize,
        cellDeathFrameCount = this.cellDeathFrameCount,
        inverseCellSize = this.__inverseCellSize,
        aabb, min, max, minx, miny, body, shapes, shape, x, y,
        cell, key, si, sj, bi, bj, i, j, k, l, cellArray;

    for (key in cells) {
        cell = cells[key];
        if (cell.length === 0) {
            if (cell.__counter-- <= 0) {
                delete cells[key];
            }
        } else {
            cell.__counter = cellDeathFrameCount;
        }
        cell.length = 0;
    }
    pairsi.length = pairsj.length = 0;

    i = bodies.length;
    while (i--) {
        body = bodies[i];
        shapes = body.shapes;
        j = shapes.length;
        while (j--) {
            shape = shapes[j];
            aabb = shape.aabb;
            min = aabb.min;
            max = aabb.max;
            minx = (min.x * inverseCellSize | 0) * cellSize;
            miny = (min.y * inverseCellSize | 0) * cellSize;

            x = minx + ((max.x - min.x) * inverseCellSize | 0) * cellSize;
            y = miny + ((max.y - min.y) * inverseCellSize | 0) * cellSize;

            for (k = minx; k <= x; k += cellSize) {
                for (l = miny; l <= y; l += cellSize) {
                    key = k + ":" + l;
                    cellArray = (cells[key] || new Cell(cellDeathFrameCount)).array;
                    cellArray[cellArray.length] = shape;
                }
            }
        }
    }

    for (key in cells) {
        cell = cells[key];
        i = cell.length;

        while (i--) {
            j = 0;
            while (j !== i) {
                si = cell[i];
                sj = cell[j];
                j++;

                bi = si.body;
                bj = sj.body;

                if (bi && bj) {
                    if (bi.aabb.intersects(bj.aabb)) {
                        if (
                            (bi.motionState !== motionType.DYNAMIC && bj.motionState !== motionType.DYNAMIC) ||
                            (bi.sleepState === sleepType.SLEEPING && bj.sleepState === sleepType.SLEEPING)
                        ) {
                            continue;
                        }
                        if ((si.filterGroup & sj.filterMask) !== 0 && (sj.filterGroup & si.filterMask) !== 0) {
                            pairsi.push(si);
                            pairsj.push(sj);
                        }
                    }
                }
            }
        }
    }
};

BroadphaseSpatialHashPrototype.toJSON = function(json) {
    json = json || {};

    json.cellSize = this.__cellSize;
    json.cellDeathFrameCount = this.cellDeathFrameCount;

    return json;
};

BroadphaseSpatialHashPrototype.fromJSON = function(json) {

    this.setCellSize(json.cellSize);
    this.cellDeathFrameCount = json.cellDeathFrameCount;

    return this;
};

function Cell(counter) {
    this.array = [];
    this.__counter = counter;
}
