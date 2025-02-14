import Utils from "./utils.js";
import Vec3 from "./fedVector3.js";
import Vec2 from "./fedVector2.js";


function getZDataFromShape(inst, x, y) {

    let height = 0;
    let slopeRadians = 0;
    let slideAngle = 0;
    switch (inst.shape) {

        case "box":
            height = inst.zElevation + inst.zHeight;
            break;

        case "wedge":
            height = inst.zElevation + inst.zHeight * (Utils.unrotate(-inst.angle, inst.x, inst.y, x, y) + inst.width * 0.5) / inst.width;
            slopeRadians = Math.atan(inst.zHeight / inst.width);
            slideAngle = inst.angleDegrees - 180 * Math.sign(inst.width);
            break;

        case "prism":
            let f = (Utils.unrotate(-inst.angle + Utils.halfPI, inst.x, inst.y, x, y) + inst.height * 0.5) / inst.height;
            let angle = inst.angleDegrees + 90;
            if (f > 0.5) {
                f = 1 - f;
                angle += 180
            };
            height = inst.zElevation + inst.zHeight * f * 2;
            slideAngle = angle;
            slopeRadians = Math.atan(inst.zHeight / (inst.height * 0.5));
            break;
		
		case "pyramid":
			const unrotY = Utils.unrotate(-inst.angle + Utils.halfPI, inst.x, inst.y, x, y);
            const pyYF = (unrotY + inst.height * 0.5) / inst.height;
			const pyYFn = 1 - Math.abs(1 - 2 * (pyYF % 1))
            const unrotX = Utils.unrotate(-inst.angle, inst.x, inst.y, x, y);
            const pyXF = (unrotX + inst.width * 0.5) / inst.width;
			const pyXFn = 1 - Math.abs(1 - 2 * (pyXF % 1))
			if (pyXFn < pyYFn) {
				height = inst.zElevation + inst.zHeight * pyXFn;
				slideAngle = pyXF > 0.5 ? inst.angleDegrees : inst.angleDegrees + 180;
				slopeRadians = Math.atan(inst.zHeight / (inst.width * 0.5));
			}
			else {
				height = inst.zElevation + inst.zHeight * pyYFn;
				slideAngle = pyYF > 0.5 ? inst.angleDegrees - 90 : inst.angleDegrees + 90;
				slopeRadians = Math.atan(inst.zHeight / (inst.height * 0.5));
			}
			break;

        case "corner-in":
            const unrotatedY = Utils.unrotate(-inst.angle + Utils.halfPI, inst.x, inst.y, x, y);
            const yf = (unrotatedY + inst.height * 0.5) / inst.height;
            const unrotatedX = Utils.unrotate(-inst.angle, inst.x, inst.y, x, y);
            const xf = (unrotatedX + inst.width * 0.5) / inst.width;
            const addHeight = Math.min(inst.zHeight * (xf + yf), inst.zHeight);
            height = inst.zElevation + addHeight;
            slideAngle = Utils.toDegrees(Math.atan2(inst.height, inst.width)) + inst.angleDegrees + 90 * Math.sign(inst.height * inst.width);
            if (addHeight != inst.zHeight) {
                slopeRadians = Utils.halfPI - Math.acos((2 * inst.zHeight) / Math.sqrt(Math.pow(inst.width, 2) + Math.pow(inst.height, 2) + 4 * Math.pow(inst.zHeight, 2)));
            } else slopeRadians = 0;
            break;

        default:
            height = inst.zElevation + inst.zHeight
    };

    return {
        "height": height,
        "ZAngle": Utils.toDegrees(slopeRadians),
        "XAngle": slideAngle
    }
}

function getMaxZFromShape(inst, x, y) {
    switch (inst.shape) {

        case "box":
            return inst.zElevation + inst.zHeight;

        case "wedge":
            return inst.zElevation + inst.zHeight * (Utils.unrotate(-inst.angle, inst.x, inst.y, x, y) + inst.width * 0.5) / inst.width;

        case "prism":
             let f = (Utils.unrotate(-inst.angle + Utils.halfPI, inst.x, inst.y, x, y) + inst.height * 0.5) / inst.height;;
            if (f > 0.5) {
                f = 1 - f;
            };
            return inst.zElevation + inst.zHeight * f * 2;
			
		case "pyramid":
			const unrotY = Utils.unrotate(-inst.angle + Utils.halfPI, inst.x, inst.y, x, y);
            let pyYF = (unrotY + inst.height * 0.5) / inst.height;
			pyYF = 1 - Math.abs(1 - 2 * (pyYF % 1))
            const unrotX = Utils.unrotate(-inst.angle, inst.x, inst.y, x, y);
            let pyXF = (unrotX + inst.width * 0.5) / inst.width;
			pyXF = 1 - Math.abs(1 - 2 * (pyXF % 1))
			return inst.zElevation + inst.zHeight * Math.min(pyXF, pyYF);
			break;


        case "corner-in":
            const unrotatedY = Utils.unrotate(-inst.angle + Utils.halfPI, inst.x, inst.y, x, y);
            const yf = (unrotatedY + inst.height * 0.5) / inst.height;
            const unrotatedX = Utils.unrotate(-inst.angle, inst.x, inst.y, x, y);
            const xf = (unrotatedX + inst.width * 0.5) / inst.width;
            const addHeight = Math.min(inst.zHeight * (xf + yf), inst.zHeight);
            return inst.zElevation + addHeight;

        default:
            return inst.zElevation + inst.zHeight
    };
}

function getCandidatesAtPoint(runtime, objectTypes, x, y) {
    const candidates = runtime.collisions.getCollisionCandidates(objectTypes, new DOMRect(x, y, 0, 0));
    return Array.from(new Set(candidates));
}

export function castRay(runtime, fromX, fromY, fromZ, toX, toY, toZ, objectTypes, stepSize = 12) {
    //prepare stuff
    const cellSize = runtime.collisions.getCollisionCellSize();
    let curCell = [];
    let lastCell = [null, null];
    const from = new Vec3(fromX, fromY, fromZ);
    const cur = new Vec3(fromX, fromY, fromZ);
    const to = new Vec3(toX, toY, toZ);
    const stepVector = Vec3.normalBetween(from, to);
    stepVector.multiply(new Vec3(stepSize, stepSize, stepSize))
    const distance = from.distance(to);
    let rayCastData = runtime.objects.rayCastData.getFirstInstance();
    if (!rayCastData) {
        rayCastData = runtime.objects.rayCastData.createInstance("environment", 0, 0);
    }
    rayCastData.setPosition(fromX, fromY);
    rayCastData.angle = new Vec2(fromX, fromY).angle(new Vec2(toX, toY));
    rayCastData.width = new Vec2(fromX, fromY).distance(new Vec2(toX, toY));
    let candidates = [];
    let realCandidates = [];
    //step ray
    rayCastData.instVars.lastCastHit = false;
    const stepAmount = Math.ceil(distance / stepSize)
    for (let i = 0; i < stepAmount; i++) {
        //check if left collision cell
        curCell = [Utils.toGrid(cur.x, cellSize[0]), Utils.toGrid(cur.y, cellSize[1])];
        if (curCell[0] != lastCell[0] || curCell[1] != lastCell[1]) {
            lastCell = curCell;
            candidates = getCandidatesAtPoint(runtime, objectTypes, cur.x, cur.y);
            realCandidates = [];
			//pre-filter candidates
            for (const inst of candidates) {
                if (inst.zElevation + inst.zHeight >= Math.min(fromZ, toZ) && inst.zElevation <= Math.max(fromZ, toZ) && rayCastData.testOverlap(inst)) {
                    realCandidates.push(inst);
                }
            }
        }
        for (const inst of realCandidates) {
            if (inst.zElevation < cur.z && inst.containsPoint(cur.x, cur.y) && getMaxZFromShape(inst, cur.x, cur.y) > cur.z) {
                //set hit data to instance so it's accesible in the event sheet
                rayCastData.instVars.hitUID = inst.uid;
                rayCastData.instVars.lastCastHit = true;
                rayCastData.instVars.hitX = cur.x;
                rayCastData.instVars.hitY = cur.y;
                rayCastData.instVars.hitZ = cur.z;
                return false //hit obstacle
            }
        }
        cur.x += stepVector.x;
        cur.y += stepVector.y;
        cur.z += stepVector.z;
    }
    return true //didn't hit obsatacle
}

export function updateCollisionSpace(runtime) {
    const player = runtime.objects.player.getFirstInstance();
    const playerStepZ = player.zElevation + player.instVars.zStep;
    const playerHeight = player.zElevation + player.instVars.standHeight;
    const rect = player.getBoundingBox();
    rect.x -= 320;
    rect.y -= 320;
    rect.width += 640;
    rect.height += 640;

    const candidates = Utils.deduplicateArray(runtime.collisions.getCollisionCandidates(runtime.objects.solid, rect));

    let floor = -99999;
    let ceiling = 99999;
    for (const inst of candidates) {
        inst.behaviors.Solid.isEnabled = false;

        if (!inst.instVars.isEnabled) continue;

        const isOverlapping = player.testOverlap(inst);

        if (inst.zElevation >= playerHeight) {
            if (isOverlapping && inst.zElevation < ceiling) ceiling = inst.zElevation;
        } else {
            const height = getMaxZFromShape(inst, player.x, player.y);

            if (isOverlapping && height < playerStepZ && height > floor) {
                floor = height;
                player.instVars.floorUID = inst.uid;
            }
            if (playerStepZ <= height && playerHeight > inst.zElevation) inst.behaviors.Solid.isEnabled = true;
        }
    }
    //get more data of floor
    const inst = runtime.getInstanceByUid(player.instVars.floorUID);
    const {
        ZAngle: slopeAngle,
        XAngle: slideAngle
    } = getZDataFromShape(inst, player.x, player.y);

    player.instVars.floorAngle = slopeAngle;
    player.instVars.normalForce = Math.cos(Utils.toRadians(slopeAngle)) * player.instVars.gravity;
    player.instVars.slideAngle = slideAngle;
    player.instVars.shouldBePushed = Math.abs(player.instVars.floorAngle) > player.instVars.slopePushAngleThreshold && Math.abs(player.instVars.floorAngle) < 89;
    player.instVars.curGroundType = inst.instVars.groundType;
    player.instVars.curGroundSoundType = inst.instVars.groundSoundType;
    player.instVars.zCeiling = ceiling;
    player.instVars.zFloor = floor;
}