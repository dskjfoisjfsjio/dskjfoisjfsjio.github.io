//fedVectors: vector 3 class with c3 specific methods. Written by Federico Calchera v0.3, MIT License

export default class Vec3 {

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
		
    get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    }

    get angleX() {
        return Math.asin(this.y / this.magnitude)
    }

    get angleXDegrees() {
        return Vec3._toDegrees(Math.asin(this.y / this.magnitude))
    }

    get angleZ() {
        return Math.atan2(this.z, this.x)
    }

    get angleZDegrees() {
        return _toDegrees(Math.atan2(this.z, this.x))
    }

    static _toDegrees(radians) {
        return (radians * 180) / Math.PI
    }

    static fromInst(inst) {
        return new Vec3(inst.x, inst.y, inst.zElevation)
    }

    static fromArray(arr) {
        return new Vec3(arr[0], arr[1], arr[2])
    }

	static fromAngle(angleZ, angleX) {
        return new Vec3(Math.cos(angleZ) * Math.cos(angleX), Math.sin(angleZ) * Math.sin(angleX), Math.sin(angleX) )
    }

    static lerp(vec3a, vec3b, alpha) {
        const tempVec3 = new Vec3(0, 0, 0);
        tempVec3.x = vec3a.x + alpha * (vec3b.x - vec3a.x);
        tempVec3.y = vec3a.y + alpha * (vec3b.y - vec3a.y);
        tempVec3.z = vec3a.z + alpha * (vec3b.z - vec3a.z);
        return tempVec3
    }
	
	static normalBetween(vec3a, vec3b){
		const tempVec3 = vec3b.duplicate().subtract(vec3a)
		return tempVec3.normalize();
	}
	
	toInst(inst) {
        inst.x = this.x;
        inst.y = this.y;
        inst.zElevation = this.z;
    }

    distance(vec3) {
        const tempVec3 = new Vec3(this.x - vec3.x, this.y - vec3.y, this.z - vec3.z);
        return Math.sqrt(tempVec3.x * tempVec3.x + tempVec3.y * tempVec3.y + tempVec3.z * tempVec3.z);
    }

	distanceSquared(vec3) {
        const tempVec3 = new Vec3(this.x - vec3.x, this.y - vec3.y, this.z - vec3.z);
        return tempVec3.x * tempVec3.x + tempVec3.y * tempVec3.y + tempVec3.z * tempVec3.z;
    }

    normalize() {
		const mag = 1 / this.magnitude;
		this.x *= mag;
		this.y *= mag;
		this.z *= mag;
        return this
    }

    divide(vec3) {
        this.x /= vec3.x;
        this.y /= vec3.y;
        this.z /= vec3.z;
        return this;
    }

    multiply(vec3) {
        this.x *= vec3.x;
        this.y *= vec3.y;
        this.z *= vec3.z;
        return this;
    }

    add(vec3) {
        this.x += vec3.x;
        this.y += vec3.y;
        this.z += vec3.z;
        return this;
    }

    subtract(vec3) {
        this.x -= vec3.x;
        this.y -= vec3.y;
        this.z -= vec3.z;
        return this;
    }

    dot(vec3) {
        return this.x * vec3.x + this.y * vec3.y + this.z * vec3.z
    }

    cross(vec3) {
        tempVec3 = new Vec3();
        tempVec3.x = this.y * vec3.z - this.z * vec3.y;
        tempVec3.y = this.z * vec3.x - this.x * vec3.z;
        tempVec3.z = this.x * vec3.y - this.y * vec3.x;

        return tempVec3;
    }

    duplicate() {
        return new Vec3(this.x, this.y, this.z)
    }
}