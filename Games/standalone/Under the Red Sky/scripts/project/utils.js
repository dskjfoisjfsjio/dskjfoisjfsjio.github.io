import Vec3 from "./fedVector3.js";

//Utils class written by Federico Calchera, MIT License

export default class Utils {

    static get halfPI() {
        return 1.57079632679
    };
	
	static get TAU() {
        return 6.28318530718
    };
	
    //math
    static lerp(a, b, alpha) {
        return a + alpha * (b - a)
    };
	
	static angleClamp(angle, minimum, maximum) {
		//degrees
		const start = (minimum + maximum) * 0.5 - 180;
		const floored = Math.floor((angle - start) / 360) * 360;
		return Utils.clamp(angle, minimum + floored, maximum + floored)
	}
	
	static angleLerp(a, b, x) {
    const diff = Utils.angleDiff(a, b);
    if (Utils.angleClockwise(b, a))
        return Utils.clampAngle(a + diff * x);
    else
        return Utils.clampAngle(a - diff * x)
	};
	
	static angleDiff(a1, a2) {
    if (a1 === a2)
        return 0;
    let s1 = Math.sin(a1);
    let c1 = Math.cos(a1);
    let s2 = Math.sin(a2);
    let c2 = Math.cos(a2);
    let n = s1 * s2 + c1 * c2;
    if (n >= 1)
        return 0;
    if (n <= -1)
        return Math.PI;
    return Math.acos(n)
	};
	
	static angleClockwise(a1, a2) {
    let s1 = Math.sin(a1);
    let c1 = Math.cos(a1);
    let s2 = Math.sin(a2);
    let c2 = Math.cos(a2);
    return c1 * s2 - s1 * c2 <= 0
	};
	
	static clampAngle(a) {
    a %= Utils.TAU;
    if (a < 0)
        a += Utils.TAU;
    return a
	};

    static unlerp(min, max, value) {
        return (value - min) / (max - min);
    };
	
	static expDecay(a, b, decay, dt){
		//decay 1 - 25, from slow to fast
		return b + (a - b) * Math.exp(-decay * dt)
	}

    static remap(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    };

    static wrap0(value, max) {
        return (value % max + max) % max;
    };

    static wrap(value, min, max) {
        const diff = max - min;
        if (diff === 0)
            return max;
        if (value < min) {
            const r = max - (min - value) % diff;
            return r === max ? 0 : r
        } else
            return min + (value - min) % diff
    }

    static clamp(number, min, max) {
        return Math.max(min, Math.min(number, max));
    };

    static unrotate(angle, instX, instY, x, y) {
        return Math.cos(angle) * (x - instX) - Math.sin(angle) * (y - instY)
    };

    static snap(value, step) {
        return Math.floor(value / step) * step;
    };

	static toGrid(value, step) {
        return Math.floor(value / step);
    };

    static flipAngleHorizontally(angle) {
        return 180 - angle
    }
    static flipAngleVertically(angle) {
        return 360 - angle
    }

    static wrapDegrees(degrees) {
        (degrees % 360 + 360) % 360
    }
	
	static angleDiff(a1, a2) {
		if (a1 === a2)
        return 0;
		const s1 = Math.sin(a1);
		const c1 = Math.cos(a1);
		const s2 = Math.sin(a2);
		const c2 = Math.cos(a2);
		const n = s1 * s2 + c1 * c2;
		if (n >= 1)
			return 0;
		if (n <= -1)
			return Math.PI;
		return Math.acos(n)
	}

    //conversion
    static toRadians(degrees) {
        return (degrees * Math.PI) / 180
    };

    static toDegrees(radians) {
        return (radians * 180) / Math.PI
    };
	
	static pixelToMeter(pixel) {
		return pixel * 0.0125
	};
	
	static meterToPixel(meter) {
		return meter / 0.0125
	};

    //data
    static deduplicateArray(arr) {
        return Array.from(new Set(arr))
    };

	//misc
	static worldPosToHudPos(runtime, camPos, lookVector, x, y, z) {	
	    const normalToTarget = Vec3.normalBetween(camPos, new Vec3(x, y, z));
		
		//camera is looking away from position
	    if (lookVector.dot(normalToTarget) < 0) return false;
		
	    const canvasPos = runtime.layout.getLayer("environment").layerToCssPx(x, y, z);
	    return runtime.layout.getLayer("hud").cssPxToLayer(canvasPos[0], canvasPos[1])
	}

	static computeEulerRotation(forwardX, forwardY, forwardZ, upX, upY, upZ) {
		// Normalize the input vectors
		function normalize(x, y, z) {
			const length = Math.sqrt(x * x + y * y + z * z);
			return [x / length, y / length, z / length];
		}

		const [fX, fY, fZ] = normalize(forwardX, forwardY, forwardZ);
		const [uX, uY, uZ] = normalize(upX, upY, upZ);

		// Compute the right vector using cross product: right = up x forward
		const rX = uY * fZ - uZ * fY;
		const rY = uZ * fX - uX * fZ;
		const rZ = uX * fY - uY * fX;

		// Create the rotation matrix
		const rotationMatrix = [
			[rX, uX, -fX],
			[rY, uY, -fY],
			[rZ, uZ, -fZ]
		];

		// Extract Euler angles from the rotation matrix
		const sy = Math.sqrt(rotationMatrix[0][0] * rotationMatrix[0][0] + rotationMatrix[1][0] * rotationMatrix[1][0]);

		const singular = sy < 1e-6; // If sy is close to zero, we consider it as a singular case

		let x, y, z;
		if (!singular) {
			x = Math.atan2(rotationMatrix[2][1], rotationMatrix[2][2]);
			y = Math.atan2(-rotationMatrix[2][0], sy);
			z = Math.atan2(rotationMatrix[1][0], rotationMatrix[0][0]);
		} else {
			x = Math.atan2(-rotationMatrix[1][2], rotationMatrix[1][1]);
			y = Math.atan2(-rotationMatrix[2][0], sy);
			z = 0;
		}

		// Convert radians to degrees
		x = x * 180 / Math.PI;
		y = y * 180 / Math.PI;
		z = z * 180 / Math.PI;

		return { x, y, z };
	}

}
