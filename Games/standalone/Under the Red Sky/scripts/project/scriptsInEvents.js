import {
	pushGhostPosition,
	saveGhostData,
	startGhostPlayback,
	interpolateGhostPosition,
	clearGhostData
} from "./ghost.js";

import {updateCollisionSpace, castRay} from "./collision.js";
import Utils from "./utils.js";
import Vec3 from "./fedVector3.js";
import Vec2 from "./fedVector2.js";
import {getBestEndpoint} from "./getColyseusEndpoint.js"


const scriptsInEvents = {

	async Utils_Event1_Act1(runtime, localVars)
	{
		runtime.setReturnValue(Utils.angleClamp(localVars.angle1, localVars.minimum, localVars.maximum))
	},

	async Utils_Event2_Act1(runtime, localVars)
	{
		const temp = Utils.remap(localVars.value, localVars.fromMin, localVars.fromMax, localVars.toMin, localVars.toMax);
		runtime.setReturnValue(Utils.clamp(temp, localVars.toMin, localVars.toMax))
	},

	async Utils_Event3_Act1(runtime, localVars)
	{
		const distance = new Vec3(localVars.x1, localVars.y1, localVars.z1).distance(new Vec3(localVars.x2, localVars.y2, localVars.z2));
		runtime.setReturnValue(distance)
	},

	async Utils_Event4_Act1(runtime, localVars)
	{
		const distance = new Vec3(localVars.x1, localVars.y1, localVars.z1).distanceSquared(new Vec3(localVars.x2, localVars.y2, localVars.z2));
		runtime.setReturnValue(distance)
	},

	async Utils_Event6_Act1(runtime, localVars)
	{
		const inst = runtime.getInstanceByUid(localVars.uid);
		const player = runtime.objects.player.getFirstInstance();
		if (player.zElevation <= inst.zElevation + inst.zHeight && player.zElevation + player.instVars.standHeight >= inst.zElevation) runtime.setReturnValue(1);
	},

	async Utils_Event7_Act1(runtime, localVars)
	{
		const inst = runtime.getInstanceByUid(localVars.uid);
		const inst2 = runtime.getInstanceByUid(localVars.uid2);
		if (inst2.zElevation <= inst.zElevation + inst.zHeight && inst2.zElevation + inst2.zHeight >= inst.zElevation) runtime.setReturnValue(1);
	},

	async Utils_Event9_Act1(runtime, localVars)
	{
		runtime.setReturnValue(Utils.expDecay(localVars.a, localVars.b, localVars.decay, localVars.delta))
	},

	async Utils_Event13_Act1(runtime, localVars)
	{
		runtime.setReturnValue(Utils.pixelToMeter(localVars.pixel))
	},

	async Utils_Event14_Act1(runtime, localVars)
	{
		runtime.setReturnValue(Utils.meterToPixel(localVars.meter))
	},

	async Utils_Event15_Act1(runtime, localVars)
	{
		switch(localVars.colorName) {
			case "red" :
				runtime.setReturnValue(-270204982526975);
				break;
			case "offWhite" :
				runtime.setReturnValue(-259225688129535);
				break;
			case "almostBlack" :
				runtime.setReturnValue(-4398314972159);
				break;
			case "blue" :
				runtime.setReturnValue(-11443110911);
				break;
			case "lightGrey" :
				runtime.setReturnValue(-231736219611135);
				break;
			case "midGrey" :
				runtime.setReturnValue(-178681545370623);
				break;
			case "yellow" :
				runtime.setReturnValue(-281489388611583);
				break;
			default:
				//white
				runtime.setReturnValue(-281492157629439);	
		}
	},

	async Utils_Event23_Act1(runtime, localVars)
	{
		const colorValue = localVars.colorValue;
		const r = Math.round(parseInt(-colorValue / 2 ** 38) % 2048 * 255/ 1024);
		const g = Math.round(parseInt(-colorValue / 2 ** 24) % 2048 * 255 / 1024);
		const b = Math.round(parseInt(-colorValue / 2 ** 10) % 2048 * 255 / 1024);
		const hex = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
		
		runtime.setReturnValue(hex)
	},

	async Utils_Event24_Act1(runtime, localVars)
	{
		const o = runtime.getInstanceByUid(localVars.UID).getJsonDataCopy();
		if (localVars.path == "") runtime.setReturnValue(Object.keys(o).length);
		else runtime.setReturnValue(Object.keys(o[localVars.path]).length);
		
	},

	async Utils_Event43_Act1(runtime, localVars)
	{
		const fallback = "-1";
		
		try{
			const level = runtime.objects.save.getFirstInstance().getJsonDataCopy().lastPlayedLevel
			if (runtime.getLayout(level)){
		 		runtime.setReturnValue(level)
			}
			else runtime.setReturnValue(fallback)
		} catch(_) {
			runtime.setReturnValue(fallback)
		}
		
	},

	async Utils_Event44_Act1(runtime, localVars)
	{
		const fallback = "-1";
		
		try{
			const level = runtime.objects.save.getFirstInstance().getJsonDataCopy().lastPlayedHub
			if (runtime.getLayout(level)){
		 		runtime.setReturnValue(level)
			}
			else runtime.setReturnValue(fallback)
		} catch(_) {
			runtime.setReturnValue(fallback)
		}
		
	},

	async Utils_Event45_Act1(runtime, localVars)
	{
		const levelSequence = runtime.objects.levelData.getFirstInstance().getJsonDataCopy().levelOrder;
		let nextChapter = Object.keys(levelSequence)[0];
		let breakNext = false;
		for (const key of Object.keys(levelSequence)) {
		    if (breakNext) {
		        nextChapter = key;
		        break
		    }
		    if (localVars.chapter === key) breakNext = true;
		}
		runtime.setReturnValue(nextChapter)
	},

	async Utils_Event46_Act1(runtime, localVars)
	{
		const levelSequence = runtime.objects.levelData.getFirstInstance().getJsonDataCopy().levelOrder;
		let previousChapter = Object.keys(levelSequence)[Object.keys(levelSequence).length - 1];
		runtime.setReturnValue(previousChapter)
		for (const key of Object.keys(levelSequence)) {
		    if (localVars.chapter === key) {
		        runtime.setReturnValue(previousChapter);
		        break;
		    }
		    previousChapter = key;
		}
	},

	async Utils_Event56_Act1(runtime, localVars)
	{
		const levelData = runtime.objects.levelData.getFirstInstance().getJsonDataCopy().levelOrder;
		const saveData = runtime.objects.save.getFirstInstance().getJsonDataCopy().levels;
		let count = 0;
		for (const key of Object.keys(levelData)){
			if (key == localVars.chapterName) {
				for (const level of levelData[key]){
					if (level in saveData) count++;
				}
			}
		}
		runtime.setReturnValue(count)
	},

	async E_uicomponents_Event78_Act1(runtime, localVars)
	{
		const tokens = localVars.tokens.split(",");
		const isMatch = (element) => element == localVars.curToken;
		const tokenIndex = tokens.findIndex(isMatch);
		runtime.setReturnValue(tokens[Utils.wrap0(tokenIndex + 1, tokens.length)])
	},

	async E_dialogs_Event34_Act1(runtime, localVars)
	{
		const save = runtime.objects.save.getFirstInstance().getJsonDataCopy();
		const levels = runtime.objects.levelData.getFirstInstance().getJsonDataCopy();
		
		let stars = 0;
		for (const level of Object.keys(save.levels)) {
		    if (level in levels && typeof save.levels[level].bestTime === "number") {
		        const bestTime = save.levels[level].bestTime;
		        
		        if (levels[level]["4Star"] >= bestTime) {
		            stars += 4;
		        }
				else if (levels[level]["3Star"] >= bestTime) {
		            stars += 3;
		        }
				else if (levels[level]["2Star"] >= bestTime) {
		            stars += 2;
		        }
				else if (levels[level]["1Star"] >= bestTime) {
		            stars += 1;
		        }
		    }
		}
		
		runtime.setReturnValue(stars)
	},

	async E_dialogs_Event35_Act1(runtime, localVars)
	{
		const save = runtime.objects.save.getFirstInstance().getJsonDataCopy();
		
		let secrets = 0;
		for (const level of Object.keys(save.levels)) {
		    if (save.levels[level].foundSecret) secrets += 1;
		}
		
		runtime.setReturnValue(secrets)
	},

	async E_game_Event3_Act1(runtime, localVars)
	{
		for (const [index, solid] of runtime.objects.solid.getAllInstances().entries()){
			solid.zElevation += Math.abs(Math.sin(index) * 43758.5453123 % 1) - 0.5;
			}
	},

	async E_game_Event44_Act2(runtime, localVars)
	{
		const save = runtime.objects.save.getFirstInstance().getJsonDataCopy();
		const ghost = save.levels[runtime.layout.name].ghost;
		startGhostPlayback(ghost);
	},

	async E_game_Event45_Act1(runtime, localVars)
	{
		const ghost = runtime.objects.GhostShape.getFirstInstance();
		const player = runtime.objects.player.getFirstInstance();
		
		interpolateGhostPosition(ghost, runtime.globalVars.timerTime);
		ghost.opacity = (Vec3.fromInst(ghost).distance(Vec3.fromInst(player)) - 32) * 0.001;
	},

	async E_game_Event47_Act2(runtime, localVars)
	{
		clearGhostData();
		pushGhostPosition(runtime.objects.player.getFirstInstance(), runtime.globalVars.timerTime)
	},

	async E_game_Event48_Act1(runtime, localVars)
	{
		saveGhostData(runtime.objects.tempGhost.getFirstInstance())
	},

	async E_game_Event49_Act1(runtime, localVars)
	{
		pushGhostPosition(runtime.objects.player.getFirstInstance(), runtime.globalVars.timerTime)
	},

	async E_game_Event71(runtime, localVars)
	{
		const water = runtime.objects.deformPlane.getFirstInstance();
		const waveHeight = 1600;
		const currentScroll = localVars.currentScroll;
		const meshSize = water.getMeshSize();
		const scale = 14;
		
		for (let collumn = 0; collumn < meshSize[0]; collumn++)
		{
			for (let row = 0; row < meshSize[1]; row++)
				{
				water.setMeshPoint(collumn, row, {mode:"relative", x:0, y:0, zElevation: runtime.objects.AdvancedRandom.classic2d(currentScroll + row * scale, currentScroll + collumn * scale) * waveHeight} )	
				}
		}
	},

	async E_game_Event73(runtime, localVars)
	{
		const camPos = Vec3.fromArray(runtime.objects.camera.getCameraPosition())
		const distanceLimitSquared = 4000 * 4000
		for(const inst of runtime.objects.distanceCull3DObject.getAllInstances()){
			inst.isVisible = camPos.distanceSquared(Vec3.fromInst(inst)) < distanceLimitSquared
		}
	},

	async E_game_Event80(runtime, localVars)
	{
		const camPos = Vec3.fromArray(runtime.objects.camera.getCameraPosition());
		const camLook = Vec3.fromArray(runtime.objects.camera.getLookVector());
		
		for (const inst of runtime.objects.worldHudMarker.getAllInstances()) {
		    const target = runtime.getInstanceByUid(inst.instVars.targetUID);
			
			if(!target.isOnScreen() || !target.instVars.shouldBeMarkedInHud) {
				inst.isVisible = false;
				continue
			}
			const textInst = inst.getChildAt(0);
		    const targetPos = new Vec3(target.x, target.y, target.zElevation + 256);
		    const hudPos = Utils.worldPosToHudPos(runtime, camPos, camLook, target.x, target.y, target.zElevation + 256);
			inst.isVisible = !!hudPos;
			inst.setPosition(hudPos[0], hudPos[1]);
		    const distance = camPos.distance(targetPos);
		    textInst.text = Math.ceil(Utils.pixelToMeter(distance)) + "m"
		}
	},

	async E_game_Event84_Act1(runtime, localVars)
	{
		const playerPosition = Vec3.fromInst(runtime.objects.player.getFirstPickedInstance());
		
		for (const inst of runtime.objects.inspectables.getAllInstances()) {	
		    if (inst.instVars.inspectDistance * inst.instVars.inspectDistance > playerPosition.distanceSquared(Vec3.fromInst(inst))) {
		        runtime.setReturnValue(inst.uid);
		        break;
		    }
		}
	},

	async E_game_Event132_Act1(runtime, localVars)
	{
		const camPos = runtime.objects.camera.getCameraPosition();
		const inst = runtime.getInstanceByUid(localVars.uid);
		if (inst.isOnScreen() && 
			Vec2.fromInst(inst).distance(new Vec2(camPos[0], camPos[1], camPos[2])) <= localVars.castDistance && 
			castRay(runtime, camPos[0], camPos[1], camPos[2], inst.x, inst.y, inst.zElevation + 8, runtime.objects.solid)) {
		    runtime.setReturnValue(1);
		}
	},

	async E_game_Event134_Act1(runtime, localVars)
	{
		const camPos = runtime.objects.camera.getCameraPosition();
		const camLook = runtime.objects.camera.getLookVector();
		if (!castRay(runtime, camPos[0], camPos[1], camPos[2], camPos[0] + camLook[0] * localVars.castDistance, camPos[1] + camLook[1] * localVars.castDistance, camPos[2] + camLook[2] * localVars.castDistance, [runtime.objects.solid, runtime.objects[localVars.objectType]])) {
		    runtime.setReturnValue(runtime.objects.rayCastData.getFirstInstance().instVars.hitUID);
		} else runtime.setReturnValue(0)
	},

	async E_game_Event136_Act1(runtime, localVars)
	{
		const distanceThreshold = localVars.distanceThreshold;
		const thresholdSquared = (distanceThreshold + localVars.preFinish) * (distanceThreshold + localVars.preFinish);
		const player = Vec3.fromInst(runtime.objects.player.getFirstInstance());
		let tempX = 0;
		let tempY = 0;
		let tempZ = 0;
		let distanceSquared = 0;
		let alpha = 0;
		
		for (const inst of runtime.objects.scatterShape.getAllInstances()) {
		    if (inst.instVars.animationType === "distance") {
		        tempX = inst.instVars.targetX - player.x;
		        tempY = inst.instVars.targetY - player.y;
		        tempZ = inst.instVars.targetZ - player.z;
		        distanceSquared = tempX * tempX + tempY * tempY + tempZ * tempZ;
		        if (distanceSquared > thresholdSquared) continue;
		        alpha = 1 - Math.max(Math.sqrt(distanceSquared) - localVars.preFinish, 0) / distanceThreshold;
		
		    } else if (inst.instVars.animationType === "trigger") {
		        if (inst.instVars.state === "none") continue;
		        inst.instVars.time = Math.max(0, inst.instVars.time - inst.dt);
		        if (inst.instVars.state === "wait") {
		            if (inst.instVars.time === 0) {
		                inst.instVars.state = "animate";
		                inst.instVars.time = 1.5
		            } else continue;
		        } else if (inst.instVars.state === "animate")
		            alpha = 1 - (inst.instVars.time / 1.5);
		        if (inst.instVars.time === 0) inst.instVars.state = "none"
		    }
		
		    if (inst.instVars.randomizeX) inst.x = Utils.lerp(inst.instVars.randomX, inst.instVars.targetX, alpha);
		    if (inst.instVars.randomizeY) inst.y = Utils.lerp(inst.instVars.randomY, inst.instVars.targetY, alpha);
		    if (inst.instVars.randomizeZ) inst.zElevation = Utils.lerp(inst.instVars.randomZ, inst.instVars.targetZ, alpha);
		    if (inst.instVars.randomizeAngle) inst.angleDegrees = Utils.lerp(inst.instVars.randomAngle, inst.instVars.targetAngle, alpha);
		    if (inst.instVars.animateScale) {
		        inst.height = inst.instVars.targetHeight * alpha;
		        inst.width = inst.instVars.targetWidth * alpha;
		        inst.zHeight = inst.instVars.targetZHeight * alpha;
		
		    }
		}
	},

	async E_game_Event145_Act1(runtime, localVars)
	{
		const playerPos = Vec3.fromInst(runtime.objects.player.getFirstInstance());
		for (const inst of runtime.objects.proximityFadeText.getAllInstances()){
			const dist = Vec3.fromInst(inst).distance(playerPos);
			if (dist > inst.instVars.fadeStart + inst.instVars.fullVisibleDistance) {
				inst.isVisible = false;
				continue;}
			inst.isVisible = true;
			const remappedDist = 1 - (dist - inst.instVars.fullVisibleDistance) / inst.instVars.fadeStart;
			inst.effects[0].setParameter(2, Utils.clamp(remappedDist, 0, 1));
		}
	},

	async E_game_Event182_Act1(runtime, localVars)
	{
		const rng = runtime.objects.AdvancedRandom;
		localVars.progress += 16 * runtime.dt;
		const scale = 4;
		for (const flag of runtime.objects.flag.getAllInstances()) {
			const meshSize = flag.getMeshSize();
		    for (let x = 0; x < meshSize[0]; x++) {
		        for (let y = 0; y < meshSize[1]; y++) {
		            const connectedSidefactor = x / meshSize[0];
		            const random = (rng.classic2d((x + localVars.progress + flag.uid) * scale, (y + localVars.progress + flag.uid) * scale) * 2 - 1) * connectedSidefactor * 1.5;
		            flag.setMeshPoint(x, y, {
		                mode: "relative",
		                x: random,
		                y: random - y / meshSize[1],
		                zElevation: random * 25 + (y / meshSize[1] * flag.height),
		                u: 0,
		                v: 0
		            })
		        }
		    }
		}
	},

	async E_player_Event2_Act4(runtime, localVars)
	{
		updateCollisionSpace(runtime)
	},

	async E_player_Event101_Act1(runtime, localVars)
	{
		updateCollisionSpace(runtime)
	},

	async E_player_Event174_Act1(runtime, localVars)
	{
		
	},

	async E_player_Event278_Act1(runtime, localVars)
	{
		const strength = localVars.BOUNCE_GROUND_STRENGTH;
		const player = runtime.objects.player.getFirstInstance();
		const normal = Vec3.fromAngle(Utils.toRadians(player.instVars.slideAngle), Utils.toRadians(player.instVars.floorAngle));
		player.behaviors.Movement.vectorX = normal.x * strength;
		player.behaviors.Movement.vectorY = normal.y * strength;
		player.instVars.vectorZ = normal.z * strength;
		
		
	},

	async E_camera_Event23_Act1(runtime, localVars)
	{
		const player = runtime.objects.player.getFirstInstance();
		localVars.playerSpeed = new Vec3(player.behaviors.Movement.vectorX, player.behaviors.Movement.vectorY, player.instVars.vectorZ).magnitude
	},

	async E_levelprogress_Event15_Act1(runtime, localVars)
	{
		const levelSequence = runtime.objects.levelData.getFirstInstance().getJsonDataCopy().levelOrder;
		const manager = runtime.objects.globalManager.getFirstInstance();
		const layoutName = manager.instVars.curLevel;
		//setting a fallback level
		let nextLevel = "BAD REDIRECTION"
		
		let breakNext = false;
		loop: for (const [key, value] of Object.entries(levelSequence)) {
		    let index = 0;
		    for (const level of value) {
		        index++
		        if (breakNext) {
		            if (key === manager.instVars.curChapter) // only go to next if in the same section
		                nextLevel = level;
		            break loop;
		        }
		        if (layoutName === level) {
		            breakNext = true;
		            manager.instVars.curChapter = key;
		            manager.instVars.curChapterProgress = index;
		            manager.instVars.curChapterMaxProgress = value.length;
		        }
		    }
		}
		manager.instVars.nextLevel = nextLevel;
	},

	async E_savesystem_Event15_Act5(runtime, localVars)
	{
		const save = runtime.objects.save.getFirstInstance();
		    const saveDataUrl = await runtime.assets.getProjectFileUrl("jsons/saveState.json");
		    const saveDataResponse = await fetch(saveDataUrl);
		    save.setJsonDataCopy(await saveDataResponse.json());
	},

	async E_debug_Event4_Act1(runtime, localVars)
	{
		runtime.layout.getLayer("debugUI").isVisible = localVars.isDebugUIEnabled
	},

	async E_debug_Event5_Act1(runtime, localVars)
	{
		localVars.isDebugUIEnabled = !localVars.isDebugUIEnabled;
		runtime.layout.getLayer("debugUI").isVisible = localVars.isDebugUIEnabled
	},

	async E_remoteplayer_Event12_Act1(runtime, localVars)
	{
		runtime.callFunction("SetEndPoint", await getBestEndpoint(true))
	},

	async E_remoteplayer_Event13_Act1(runtime, localVars)
	{
		runtime.callFunction("SetEndPoint", await getBestEndpoint())
	},

	async E_remoteplayer_Event16_Act1(runtime, localVars)
	{
		globalThis._wakerWorker && globalThis._wakerWorker.postMessage("start");
	},

	async E_remoteplayer_Event17_Act1(runtime, localVars)
	{
		globalThis._wakerWorker && globalThis._wakerWorker.postMessage("stop");
	},

	async E_remoteplayer_Event27_Act1(runtime, localVars)
	{
		runtime.setReturnValue(globalThis.valToEnum(localVars.enum, localVars.value))
	},

	async E_remoteplayer_Event28_Act1(runtime, localVars)
	{
		runtime.setReturnValue(globalThis.enumToVal(localVars.enum, localVars.value))
	},

	async E_remoteplayer_Event37_Act4(runtime, localVars)
	{
const players = JSON.parse(localVars.stateJSON);
const sessionID = localVars.sessionID;
const remotePlayers = runtime.objects.RemotePlayer.getPickedInstances();

for (const [key, value] of Object.entries(players)) {
	if (sessionID == key) continue;
	let foundPlayer = false;
	for (const remoteInst of remotePlayers) {
		if (remoteInst.instVars.sessionId != key) continue;
		remoteInst.instVars.inState = true;
		remoteInst.x = value.x;
		remoteInst.y = value.y;
		remoteInst.zElevation = value.z;
		remoteInst.angleDegrees = runtime.callFunction("AngUnpack", value.angle);
		remoteInst.instVars.vx = value.vx;
		remoteInst.instVars.vy = value.vy;
		remoteInst.instVars.vz = value.vz;
		remoteInst.instVars.animation = globalThis.enumToVal("animation", value.animation);
		
		if (remoteInst.instVars.skin != value.skin) {
			remoteInst.instVars.skin = globalThis.enumToVal("skin", value.skin);
			remoteInst.signal("updateSkin");	
		}
		
		const emote = globalThis.enumToVal("emote", value.emote);
		if (emote != "") {
			runtime.callFunction("createEmoteAtUID", emote, remoteInst.uid)
		}

		const name = `${globalThis.enumToVal("firstName", value.firstName)} ${globalThis.enumToVal("secondName", value.secondName)}`;
		if (remoteInst.instVars.playerName != name) {
			runtime.callFunction("updateRemotePlayerName", name, remoteInst.uid)
		}

		foundPlayer = true;
		break;
	}
	if (!foundPlayer) runtime.callFunction("createRemotePlayer", key)
}
	},

	async E_remoteplayer_Event45_Act1(runtime, localVars)
	{
		const camPos = Vec3.fromArray(runtime.objects.camera.getCameraPosition());
		const first = 1024 * 1024;
		const second = 2048 * 2048;
		const third = 4096 * 4096;
		const fourth = 8192 * 8192;
		for (const inst of runtime.objects.distanceAnimationRate.getAllInstances()) {
		    const distSquared = camPos.distanceSquared(Vec3.fromInst(inst));
		    if (distSquared > first) {
		        inst.instVars.targetRate = 40;
		        if (distSquared > second) {
		            inst.instVars.targetRate = 20
		            if (distSquared > third) {
		                inst.instVars.targetRate = 10
		            }
						if (distSquared > fourth) {
		                inst.instVars.targetRate = 5
		            	}
		        }
		    } else inst.instVars.targetRate = 60
		}
	},

	async E_remoteplayer_Event54_Act1(runtime, localVars)
	{
		const remoteInst = runtime.objects.RemotePlayer.getFirstPickedInstance();
		const player = runtime.objects.player.getFirstInstance();
		const camera = runtime.objects.camera;
		
		remoteInst.x = player.x;
		remoteInst.y = player.y;
		remoteInst.zElevation = player.zElevation;
		remoteInst.angleDegrees = player.instVars.lookAngle;
		remoteInst.instVars.vx = player.behaviors.Movement.vectorX;
		remoteInst.instVars.vy = player.behaviors.Movement.vectorY;
		remoteInst.instVars.vz = player.instVars.vectorZ;
		remoteInst.instVars.inState = true;
		remoteInst.instVars.animation = player.instVars.state;
		//remoteInst.instVars.accessory = camera.accessory;
	},

	async E_remoteplayer_Event114(runtime, localVars)
	{
		const camPos = Vec3.fromArray(runtime.objects.camera.getCameraPosition());
		const camLook = Vec3.fromArray(runtime.objects.camera.getLookVector());
		
		for (const inst of runtime.objects.remotePlayerHudParent.getAllInstances()) {
		    const target = runtime.getInstanceByUid(inst.instVars.belongsToUid);
			const hudPos = Utils.worldPosToHudPos(runtime, camPos, camLook, target.x, target.y, target.zElevation + target.zHeight + 80);
		    inst.setPosition(hudPos[0], hudPos[1]);
		    inst.instVars.shouldBeVisible = !!hudPos;
			
		}
	},

	async E_remoteplayer_Event116_Act1(runtime, localVars)
	{
		const camPos = Vec3.fromArray(runtime.objects.camera.getCameraPosition());
		const threshold = 160 * 160;
		for(const inst of runtime.objects.remoteCharacter.getAllInstances()){
			let dist = camPos.distanceSquared(Vec3.fromInst(inst))
			if (dist < threshold) {
				dist = Math.sqrt(dist);
				//inst.effects[0].isActive = true;
				inst.effects[0].setParameter(2, (dist - 120) / 40);		
			}
			else {
				inst.effects[0].setParameter(2, 1)
				//inst.effects[0].isActive = false;
			}
		}
	},

	async E_skin_Event69(runtime, localVars)
	{
		const player = runtime.objects.player.getFirstInstance();
		castRay(runtime, player.x, player.y, player.zElevation + player.instVars.standHeight, player.x + Math.cos(Utils.toRadians(localVars.lookAngle)) * localVars.camPlayerDist, player.y + Math.sin(Utils.toRadians(localVars.lookAngle)) * localVars.camPlayerDist, player.zElevation + player.instVars.standHeight, runtime.objects.solid, 1)
	}

};

self.C3.ScriptsInEvents = scriptsInEvents;

