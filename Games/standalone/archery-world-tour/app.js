var offsetButtons = { x: -35, y: 20 };
var skipTitle = window.famobi.hasFeature("skip_title");
var skipTutorial = window.famobi.hasFeature("skip_tutorial");
var externalStart = window.famobi.hasFeature("external_start");
var externalMute = window.famobi.hasFeature("external_mute");
var externalPause = window.famobi.hasFeature("external_pause");
var showCrossPromo =
  !window.famobi.hasFeature("standalone") &&
  !skipTitle &&
  window.famobi.getAppLink();
var forcedMode = window.famobi.hasFeature("forced_mode");
var masterVolume = window.famobi.getVolume();

var forcedModeProperties = { state: {}, override: {} };

window.famobi.onRequest("changeVolume", function (vol) {
  masterVolume = vol;
  if (!muted) {
    sound._volume = masterVolume;
    if (gameState == "game") {
      music.volume(0.5 * masterVolume);
    } else {
      music.volume(0.25 * masterVolume);
    }
  }
});

window.famobi.paused = false

window.famobi.onRequest("pauseGameplay", function () {
  window.famobi.paused = true;
});

window.famobi.onRequest("resumeGameplay", function () {
  window.famobi.paused = false;
});

window.famobi.onRequest("enableAudio", function () {
  //butEventHandler("enableAudio");
  /* Will not update button */
  if (muted) toggleMute();
});

window.famobi.onRequest("disableAudio", function () {
  //butEventHandler("disableAudio");
  /* Will not update button */
  if (!muted) toggleMute();
});

var lastUnlockedLevel = 0;
var currentWind = 0;
var Utils;
(function (Utils) {
  var AssetLoader = (function () {
    function AssetLoader(
      _lang,
      _aFileData,
      _ctx,
      _canvasWidth,
      _canvasHeight,
      _showBar
    ) {
      if (typeof _showBar === "undefined") {
        _showBar = true;
      }
      this.oAssetData = {};
      this.assetsLoaded = 0;
      this.textData = {};
      this.spinnerRot = 0;
      this.totalAssets = _aFileData.length;
      this.showBar = _showBar;
      for (var i = 0; i < _aFileData.length; i++) {
        if (_aFileData[i].file.indexOf(".json") != -1) {
          this.loadJSON(_aFileData[i]);
        } else {
          this.loadImage(_aFileData[i]);
        }
      }
      if (_showBar) {
        this.oLoaderImgData = preAssetLib.getData("loader");
        this.oLoadSpinnerImgData = preAssetLib.getData("loadSpinner");
      }
    }
    AssetLoader.prototype.render = function () {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        canvas.width / 2 - 150,
        canvas.height / 2 + 20,
        (300 / this.totalAssets) * this.assetsLoaded,
        30
      );
      ctx.drawImage(
        this.oLoaderImgData.img,
        canvas.width / 2 - this.oLoaderImgData.img.width / 2,
        canvas.height / 2 - this.oLoaderImgData.img.height / 2
      );
      this.spinnerRot += delta * 3;
      ctx.save();
      ctx.translate(canvas.width / 2 - 30, canvas.height / 2 - 16);
      ctx.rotate(this.spinnerRot);
      ctx.drawImage(
        this.oLoadSpinnerImgData.img,
        -this.oLoadSpinnerImgData.img.width / 2,
        -this.oLoadSpinnerImgData.img.height / 2
      );
      ctx.restore();
      this.displayNumbers();
    };
    AssetLoader.prototype.displayNumbers = function () {
      ctx.textAlign = "left";
      ctx.font = "bold 40px arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        Math.round((this.assetsLoaded / this.totalAssets) * 100) + "%",
        canvas.width / 2 + 0,
        canvas.height / 2 - 1
      );
    };
    AssetLoader.prototype.loadExtraAssets = function (_callback, _aFileData) {
      this.showBar = false;
      this.totalAssets = _aFileData.length;
      this.assetsLoaded = 0;
      this.loadedCallback = _callback;
      for (var i = 0; i < _aFileData.length; i++) {
        if (_aFileData[i].file.indexOf(".json") != -1) {
          this.loadJSON(_aFileData[i]);
        } else {
          this.loadImage(_aFileData[i]);
        }
      }
    };
    AssetLoader.prototype.loadJSON = function (_oData) {
      var _this = this;
      var xobj = new XMLHttpRequest();
      xobj.open("GET", _oData.file, true);
      xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == 200) {
          _this.textData[_oData.id] = JSON.parse(xobj.responseText);
          ++_this.assetsLoaded;
          _this.checkLoadComplete();
        }
      };
      xobj.send(null);
    };
    AssetLoader.prototype.loadImage = function (_oData) {
      var _this = this;
      var img = new Image();
      img.onload = function () {
        _this.oAssetData[_oData.id] = {};
        _this.oAssetData[_oData.id].img = img;
        _this.oAssetData[_oData.id].oData = {};
        var aSpriteSize = _this.getSpriteSize(_oData.file);
        if (aSpriteSize[0] != 0) {
          _this.oAssetData[_oData.id].oData.spriteWidth = aSpriteSize[0];
          _this.oAssetData[_oData.id].oData.spriteHeight = aSpriteSize[1];
        } else {
          _this.oAssetData[_oData.id].oData.spriteWidth =
            _this.oAssetData[_oData.id].img.width;
          _this.oAssetData[_oData.id].oData.spriteHeight =
            _this.oAssetData[_oData.id].img.height;
        }
        if (_oData.oAnims) {
          _this.oAssetData[_oData.id].oData.oAnims = _oData.oAnims;
        }
        if (_oData.oAtlasData) {
          _this.oAssetData[_oData.id].oData.oAtlasData = _oData.oAtlasData;
        } else {
          _this.oAssetData[_oData.id].oData.oAtlasData = {
            none: {
              x: 0,
              y: 0,
              width: _this.oAssetData[_oData.id].oData.spriteWidth,
              height: _this.oAssetData[_oData.id].oData.spriteHeight,
            },
          };
        }
        ++_this.assetsLoaded;
        _this.checkLoadComplete();
      };
      img.src = _oData.file;
    };
    AssetLoader.prototype.getSpriteSize = function (_file) {
      var aNew = new Array();
      var sizeY = "";
      var sizeX = "";
      var stage = 0;
      var inc = _file.lastIndexOf(".");
      var canCont = true;
      while (canCont) {
        inc--;
        if (stage == 0 && this.isNumber(_file.charAt(inc))) {
          sizeY = _file.charAt(inc) + sizeY;
        } else if (stage == 0 && sizeY.length > 0 && _file.charAt(inc) == "x") {
          inc--;
          stage = 1;
          sizeX = _file.charAt(inc) + sizeX;
        } else if (stage == 1 && this.isNumber(_file.charAt(inc))) {
          sizeX = _file.charAt(inc) + sizeX;
        } else if (stage == 1 && sizeX.length > 0 && _file.charAt(inc) == "_") {
          canCont = false;
          aNew = [parseInt(sizeX), parseInt(sizeY)];
        } else {
          canCont = false;
          aNew = [0, 0];
        }
      }
      return aNew;
    };
    AssetLoader.prototype.isNumber = function (n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    };
    AssetLoader.prototype.checkLoadComplete = function () {
      if (this.totalAssets > 10) {
        window.famobi.setPreloadProgress(
          Math.round((this.assetsLoaded / this.totalAssets) * 100)
        );
      }
      if (this.assetsLoaded == this.totalAssets) {
        this.loadedCallback();
      }
    };
    AssetLoader.prototype.onReady = function (_func) {
      this.loadedCallback = _func;
    };
    AssetLoader.prototype.getImg = function (_id) {
      return this.oAssetData[_id].img;
    };
    AssetLoader.prototype.getData = function (_id) {
      return this.oAssetData[_id];
    };
    return AssetLoader;
  })();
  Utils.AssetLoader = AssetLoader;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
  var AnimSprite = (function () {
    function AnimSprite(_oImgData, _fps, _radius, _animId) {
      this.x = 0;
      this.y = 0;
      this.rotation = 0;
      this.radius = 10;
      this.removeMe = false;
      this.frameInc = 0;
      this.animType = "loop";
      this.offsetX = 0;
      this.offsetY = 0;
      this.scaleX = 1;
      this.scaleY = 1;
      this.alpha = 1;
      this.oImgData = _oImgData;
      this.oAnims = this.oImgData.oData.oAnims;
      this.fps = _fps;
      this.radius = _radius;
      this.animId = _animId;
      this.centreX = Math.round(this.oImgData.oData.spriteWidth / 2);
      this.centreY = Math.round(this.oImgData.oData.spriteHeight / 2);
    }
    AnimSprite.prototype.updateAnimation = function (_delta) {
      this.frameInc += this.fps * _delta;
    };
    AnimSprite.prototype.changeImgData = function (_newImgData, _animId) {
      this.oImgData = _newImgData;
      this.oAnims = this.oImgData.oData.oAnims;
      this.animId = _animId;
      this.centreX = Math.round(this.oImgData.oData.spriteWidth / 2);
      this.centreY = Math.round(this.oImgData.oData.spriteHeight / 2);
      this.resetAnim();
    };
    AnimSprite.prototype.resetAnim = function () {
      this.frameInc = 0;
    };
    AnimSprite.prototype.setFrame = function (_frameNum) {
      this.fixedFrame = _frameNum;
    };
    AnimSprite.prototype.setAnimType = function (_type, _animId, _reset) {
      if (typeof _reset === "undefined") {
        _reset = true;
      }
      this.animId = _animId;
      this.animType = _type;
      if (_reset) {
        this.resetAnim();
      }
      switch (_type) {
        case "loop":
          break;
        case "once":
          this.maxIdx = this.oAnims[this.animId].length - 1;
          break;
      }
    };
    AnimSprite.prototype.render = function (_ctx) {
      _ctx.save();
      _ctx.translate(this.x, this.y);
      _ctx.rotate(this.rotation);
      _ctx.scale(this.scaleX, this.scaleY);
      _ctx.globalAlpha = this.alpha;
      if (this.animId != null) {
        var max = this.oAnims[this.animId].length;
        var idx = Math.floor(this.frameInc);
        this.curFrame = this.oAnims[this.animId][idx % max];
        var imgX =
          (this.curFrame * this.oImgData.oData.spriteWidth) %
          this.oImgData.img.width;
        var imgY =
          Math.floor(
            this.curFrame /
              (this.oImgData.img.width / this.oImgData.oData.spriteWidth)
          ) * this.oImgData.oData.spriteHeight;
        if (this.animType == "once") {
          if (idx > this.maxIdx) {
            this.fixedFrame = this.oAnims[this.animId][max - 1];
            this.animId = null;
            if (this.animEndedFunc != null) {
              this.animEndedFunc();
            }
            var imgX =
              (this.fixedFrame * this.oImgData.oData.spriteWidth) %
              this.oImgData.img.width;
            var imgY =
              Math.floor(
                this.fixedFrame /
                  (this.oImgData.img.width / this.oImgData.oData.spriteWidth)
              ) * this.oImgData.oData.spriteHeight;
          }
        }
      } else {
        var imgX =
          (this.fixedFrame * this.oImgData.oData.spriteWidth) %
          this.oImgData.img.width;
        var imgY =
          Math.floor(
            this.fixedFrame /
              (this.oImgData.img.width / this.oImgData.oData.spriteWidth)
          ) * this.oImgData.oData.spriteHeight;
      }
      _ctx.drawImage(
        this.oImgData.img,
        imgX,
        imgY,
        this.oImgData.oData.spriteWidth,
        this.oImgData.oData.spriteHeight,
        -this.centreX + this.offsetX,
        -this.centreY + this.offsetY,
        this.oImgData.oData.spriteWidth,
        this.oImgData.oData.spriteHeight
      );
      _ctx.restore();
    };
    AnimSprite.prototype.renderSimple = function (_ctx) {
      if (this.animId != null) {
        var max = this.oAnims[this.animId].length;
        var idx = Math.floor(this.frameInc);
        this.curFrame = this.oAnims[this.animId][idx % max];
        var imgX =
          (this.curFrame * this.oImgData.oData.spriteWidth) %
          this.oImgData.img.width;
        var imgY =
          Math.floor(
            this.curFrame /
              (this.oImgData.img.width / this.oImgData.oData.spriteWidth)
          ) * this.oImgData.oData.spriteHeight;
        if (this.animType == "once") {
          if (idx > this.maxIdx) {
            this.fixedFrame = this.oAnims[this.animId][max - 1];
            this.animId = null;
            if (this.animEndedFunc != null) {
              this.animEndedFunc();
            }
            var imgX =
              (this.fixedFrame * this.oImgData.oData.spriteWidth) %
              this.oImgData.img.width;
            var imgY =
              Math.floor(
                this.fixedFrame /
                  (this.oImgData.img.width / this.oImgData.oData.spriteWidth)
              ) * this.oImgData.oData.spriteHeight;
          }
        }
      } else {
        var imgX =
          (this.fixedFrame * this.oImgData.oData.spriteWidth) %
          this.oImgData.img.width;
        var imgY =
          Math.floor(
            this.fixedFrame /
              (this.oImgData.img.width / this.oImgData.oData.spriteWidth)
          ) * this.oImgData.oData.spriteHeight;
      }
      _ctx.drawImage(
        this.oImgData.img,
        imgX,
        imgY,
        this.oImgData.oData.spriteWidth,
        this.oImgData.oData.spriteHeight,
        this.x - (this.centreX - this.offsetX) * this.scaleX,
        this.y - (this.centreY - this.offsetY) * this.scaleY,
        this.oImgData.oData.spriteWidth * this.scaleX,
        this.oImgData.oData.spriteHeight * this.scaleY
      );
    };
    return AnimSprite;
  })();
  Utils.AnimSprite = AnimSprite;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
  var BasicSprite = (function () {
    function BasicSprite(_oImgData, _radius, _frame) {
      if (typeof _frame === "undefined") {
        _frame = 0;
      }
      this.x = 0;
      this.y = 0;
      this.rotation = 0;
      this.radius = 10;
      this.removeMe = false;
      this.offsetX = 0;
      this.offsetY = 0;
      this.scaleX = 1;
      this.scaleY = 1;
      this.oImgData = _oImgData;
      this.radius = _radius;
      this.setFrame(_frame);
    }
    BasicSprite.prototype.setFrame = function (_frameNum) {
      this.frameNum = _frameNum;
    };
    BasicSprite.prototype.render = function (_ctx) {
      _ctx.save();
      _ctx.translate(this.x, this.y);
      _ctx.rotate(this.rotation);
      _ctx.scale(this.scaleX, this.scaleY);
      var imgX =
        (this.frameNum * this.oImgData.oData.spriteWidth) %
        this.oImgData.img.width;
      var imgY =
        Math.floor(
          this.frameNum /
            (this.oImgData.img.width / this.oImgData.oData.spriteWidth)
        ) * this.oImgData.oData.spriteHeight;
      _ctx.drawImage(
        this.oImgData.img,
        imgX,
        imgY,
        this.oImgData.oData.spriteWidth,
        this.oImgData.oData.spriteHeight,
        -this.oImgData.oData.spriteWidth / 2 + this.offsetX,
        -this.oImgData.oData.spriteHeight / 2 + this.offsetY,
        this.oImgData.oData.spriteWidth,
        this.oImgData.oData.spriteHeight
      );
      _ctx.restore();
    };
    return BasicSprite;
  })();
  Utils.BasicSprite = BasicSprite;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
  var UserInput = (function () {
    function UserInput(_canvas, _isBugBrowser) {
      var _this = this;
      this.prevHitTime = 0;
      this.pauseIsOn = false;
      this.isDown = false;
      this.chromeMusicState = true;
      this.isBugBrowser = _isBugBrowser;
      this.keyDownEvtFunc = function (e) {
        _this.keyDown(e);
      };
      this.keyUpEvtFunc = function (e) {
        _this.keyUp(e);
      };
      _canvas.addEventListener(
        "touchstart",
        function (e) {
          for (var i = 0; i < e.changedTouches.length; i++) {
            _this.hitDown(
              e,
              e.changedTouches[i].pageX,
              e.changedTouches[i].pageY,
              e.changedTouches[i].identifier
            );
          }
        },
        false
      );
      _canvas.addEventListener(
        "touchend",
        function (e) {
          for (var i = 0; i < e.changedTouches.length; i++) {
            _this.hitUp(
              e,
              e.changedTouches[i].pageX,
              e.changedTouches[i].pageY,
              e.changedTouches[i].identifier
            );
          }
        },
        false
      );
      _canvas.addEventListener(
        "touchcancel",
        function (e) {
          for (var i = 0; i < e.changedTouches.length; i++) {
            _this.hitCancel(
              e,
              e.changedTouches[i].pageX,
              e.changedTouches[i].pageY,
              e.changedTouches[i].identifier
            );
          }
        },
        false
      );
      _canvas.addEventListener(
        "touchmove",
        function (e) {
          for (var i = 0; i < e.changedTouches.length; i++) {
            _this.move(
              e,
              e.changedTouches[i].pageX,
              e.changedTouches[i].pageY,
              e.changedTouches[i].identifier,
              true
            );
          }
        },
        false
      );
      _canvas.addEventListener(
        "mousedown",
        function (e) {
          _this.isDown = true;
          _this.hitDown(e, e.pageX, e.pageY, 1);
        },
        false
      );
      _canvas.addEventListener(
        "mouseup",
        function (e) {
          _this.isDown = false;
          _this.hitUp(e, e.pageX, e.pageY, 1);
        },
        false
      );
      _canvas.addEventListener(
        "mousemove",
        function (e) {
          _this.move(e, e.pageX, e.pageY, 1, _this.isDown);
        },
        false
      );
      _canvas.addEventListener(
        "mouseout",
        function (e) {
          _this.isDown = false;
          _this.hitUp(e, Math.abs(e.pageX), Math.abs(e.pageY), 1);
        },
        false
      );
      this.aHitAreas = new Array();
      this.aKeys = new Array();
    }
    UserInput.prototype.hitDown = function (e, _posX, _posY, _identifer) {
      e.preventDefault();
      e.stopPropagation();
      if (!hasFocus) {
        visibleResume();
      }
      if (this.chromeMusicState) {
        music.pause();
        music.play();
        this.chromeMusicState = false;
      }
      if (this.pauseIsOn) {
        return;
      }
      var curHitTime = new Date().getTime();
      _posX *= canvasScale;
      _posY *= canvasScale;
      for (var i = 0; i < this.aHitAreas.length; i++) {
        if (this.aHitAreas[i].rect) {
          var aX = canvas.width * this.aHitAreas[i].align[0];
          var aY = canvas.height * this.aHitAreas[i].align[1];
          if (
            _posX > aX + this.aHitAreas[i].area[0] &&
            _posY > aY + this.aHitAreas[i].area[1] &&
            _posX < aX + this.aHitAreas[i].area[2] &&
            _posY < aY + this.aHitAreas[i].area[3]
          ) {
            this.aHitAreas[i].aTouchIdentifiers.push(_identifer);
            this.aHitAreas[i].oData.hasLeft = false;
            if (!this.aHitAreas[i].oData.isDown) {
              this.aHitAreas[i].oData.isDown = true;
              this.aHitAreas[i].oData.isBeingDragged = false;
              this.aHitAreas[i].oData.x = _posX;
              this.aHitAreas[i].oData.y = _posY;
              if (
                curHitTime - this.prevHitTime < 500 &&
                (gameState != "game" || this.aHitAreas[i].id == "pause") &&
                isBugBrowser
              ) {
                return;
              }
              this.aHitAreas[i].callback(
                this.aHitAreas[i].id,
                this.aHitAreas[i].oData
              );
            }
            break;
          }
        } else {
        }
      }
      this.prevHitTime = curHitTime;
    };
    UserInput.prototype.hitUp = function (e, _posX, _posY, _identifer) {
      if (!ios9FirstTouch) {
        playSound("silence");
        ios9FirstTouch = true;
      }
      if (this.pauseIsOn) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      _posX *= canvasScale;
      _posY *= canvasScale;
      for (var i = 0; i < this.aHitAreas.length; i++) {
        if (this.aHitAreas[i].rect) {
          var aX = canvas.width * this.aHitAreas[i].align[0];
          var aY = canvas.height * this.aHitAreas[i].align[1];
          if (
            _posX > aX + this.aHitAreas[i].area[0] &&
            _posY > aY + this.aHitAreas[i].area[1] &&
            _posX < aX + this.aHitAreas[i].area[2] &&
            _posY < aY + this.aHitAreas[i].area[3]
          ) {
            for (
              var j = 0;
              j < this.aHitAreas[i].aTouchIdentifiers.length;
              j++
            ) {
              if (this.aHitAreas[i].aTouchIdentifiers[j] == _identifer) {
                this.aHitAreas[i].aTouchIdentifiers.splice(j, 1);
                j -= 1;
              }
            }
            if (this.aHitAreas[i].aTouchIdentifiers.length == 0) {
              this.aHitAreas[i].oData.isDown = false;
              if (this.aHitAreas[i].oData.multiTouch) {
                this.aHitAreas[i].oData.x = _posX;
                this.aHitAreas[i].oData.y = _posY;
                this.aHitAreas[i].callback(
                  this.aHitAreas[i].id,
                  this.aHitAreas[i].oData
                );
              }
            }
            break;
          }
        } else {
        }
      }
    };
    UserInput.prototype.hitCancel = function (e, _posX, _posY, _identifer) {
      e.preventDefault();
      e.stopPropagation();
      _posX *= canvasScale;
      _posY *= canvasScale;
      for (var i = 0; i < this.aHitAreas.length; i++) {
        if (this.aHitAreas[i].oData.isDown) {
          this.aHitAreas[i].oData.isDown = false;
          this.aHitAreas[i].aTouchIdentifiers = new Array();
          if (this.aHitAreas[i].oData.multiTouch) {
            this.aHitAreas[i].oData.x = _posX;
            this.aHitAreas[i].oData.y = _posY;
            this.aHitAreas[i].callback(
              this.aHitAreas[i].id,
              this.aHitAreas[i].oData
            );
          }
        }
      }
    };
    UserInput.prototype.move = function (e, _posX, _posY, _identifer, _isDown) {
      if (this.pauseIsOn) {
        return;
      }
      if (_isDown) {
        _posX *= canvasScale;
        _posY *= canvasScale;
        for (var i = 0; i < this.aHitAreas.length; i++) {
          if (this.aHitAreas[i].rect) {
            var aX = canvas.width * this.aHitAreas[i].align[0];
            var aY = canvas.height * this.aHitAreas[i].align[1];
            if (
              _posX > aX + this.aHitAreas[i].area[0] &&
              _posY > aY + this.aHitAreas[i].area[1] &&
              _posX < aX + this.aHitAreas[i].area[2] &&
              _posY < aY + this.aHitAreas[i].area[3]
            ) {
              this.aHitAreas[i].oData.hasLeft = false;
              if (
                this.aHitAreas[i].oData.isDraggable &&
                !this.aHitAreas[i].oData.isDown
              ) {
                this.aHitAreas[i].oData.isDown = true;
                this.aHitAreas[i].oData.x = _posX;
                this.aHitAreas[i].oData.y = _posY;
                this.aHitAreas[i].aTouchIdentifiers.push(_identifer);
                if (this.aHitAreas[i].oData.multiTouch) {
                  this.aHitAreas[i].callback(
                    this.aHitAreas[i].id,
                    this.aHitAreas[i].oData
                  );
                }
              }
              if (this.aHitAreas[i].oData.isDraggable) {
                this.aHitAreas[i].oData.isBeingDragged = true;
                this.aHitAreas[i].oData.x = _posX;
                this.aHitAreas[i].oData.y = _posY;
                this.aHitAreas[i].callback(
                  this.aHitAreas[i].id,
                  this.aHitAreas[i].oData
                );
                if (this.aHitAreas[i]) {
                  this.aHitAreas[i].oData.isBeingDragged = false;
                }
              }
            } else if (
              this.aHitAreas[i].oData.isDown &&
              !this.aHitAreas[i].oData.hasLeft
            ) {
              for (
                var j = 0;
                j < this.aHitAreas[i].aTouchIdentifiers.length;
                j++
              ) {
                if (this.aHitAreas[i].aTouchIdentifiers[j] == _identifer) {
                  this.aHitAreas[i].aTouchIdentifiers.splice(j, 1);
                  j -= 1;
                }
              }
              if (this.aHitAreas[i].aTouchIdentifiers.length == 0) {
                this.aHitAreas[i].oData.hasLeft = true;
                if (!this.aHitAreas[i].oData.isBeingDragged) {
                  this.aHitAreas[i].oData.isDown = false;
                }
                if (this.aHitAreas[i].oData.multiTouch) {
                  this.aHitAreas[i].callback(
                    this.aHitAreas[i].id,
                    this.aHitAreas[i].oData
                  );
                }
              }
            }
          }
        }
      }
    };
    UserInput.prototype.keyDown = function (e) {
      for (var i = 0; i < this.aKeys.length; i++) {
        if (e.keyCode == this.aKeys[i].keyCode) {
          e.preventDefault();
          this.aKeys[i].oData.isDown = true;
          this.aKeys[i].callback(this.aKeys[i].id, this.aKeys[i].oData);
        }
      }
    };
    UserInput.prototype.keyUp = function (e) {
      for (var i = 0; i < this.aKeys.length; i++) {
        if (e.keyCode == this.aKeys[i].keyCode) {
          e.preventDefault();
          this.aKeys[i].oData.isDown = false;
          this.aKeys[i].callback(this.aKeys[i].id, this.aKeys[i].oData);
        }
      }
    };
    UserInput.prototype.checkKeyFocus = function () {
      window.focus();
      if (this.aKeys.length > 0) {
        window.removeEventListener("keydown", this.keyDownEvtFunc, false);
        window.removeEventListener("keyup", this.keyUpEvtFunc, false);
        window.addEventListener("keydown", this.keyDownEvtFunc, false);
        window.addEventListener("keyup", this.keyUpEvtFunc, false);
      }
    };
    UserInput.prototype.addKey = function (
      _id,
      _callback,
      _oCallbackData,
      _keyCode
    ) {
      if (_oCallbackData == null) {
        _oCallbackData = new Object();
      }
      this.aKeys.push({
        id: _id,
        callback: _callback,
        oData: _oCallbackData,
        keyCode: _keyCode,
      });
      this.checkKeyFocus();
    };
    UserInput.prototype.removeKey = function (_id) {
      for (var i = 0; i < this.aKeys.length; i++) {
        if (this.aKeys[i].id == _id) {
          this.aKeys.splice(i, 1);
          i -= 1;
        }
      }
    };
    UserInput.prototype.addHitArea = function (
      _id,
      _callback,
      _oCallbackData,
      _type,
      _oAreaData,
      _isUnique
    ) {
      if (typeof _isUnique === "undefined") {
        _isUnique = false;
      }
      if (_oCallbackData == null) {
        _oCallbackData = new Object();
      }
      if (_isUnique) {
        this.removeHitArea(_id);
      }
      if (!_oAreaData.scale) {
        _oAreaData.scale = 1;
      }
      if (!_oAreaData.align) {
        _oAreaData.align = [0, 0];
      }
      var aTouchIdentifiers = new Array();
      switch (_type) {
        case "image":
          var aRect;
          aRect = new Array(
            _oAreaData.aPos[0] -
              (_oAreaData.oImgData.oData.oAtlasData[_oAreaData.id].width / 2) *
                _oAreaData.scale,
            _oAreaData.aPos[1] -
              (_oAreaData.oImgData.oData.oAtlasData[_oAreaData.id].height / 2) *
                _oAreaData.scale,
            _oAreaData.aPos[0] +
              (_oAreaData.oImgData.oData.oAtlasData[_oAreaData.id].width / 2) *
                _oAreaData.scale,
            _oAreaData.aPos[1] +
              (_oAreaData.oImgData.oData.oAtlasData[_oAreaData.id].height / 2) *
                _oAreaData.scale
          );
          this.aHitAreas.push({
            id: _id,
            aTouchIdentifiers: aTouchIdentifiers,
            callback: _callback,
            oData: _oCallbackData,
            rect: true,
            area: aRect,
            align: _oAreaData.align,
          });
          break;
        case "rect":
          this.aHitAreas.push({
            id: _id,
            aTouchIdentifiers: aTouchIdentifiers,
            callback: _callback,
            oData: _oCallbackData,
            rect: true,
            area: _oAreaData.aRect,
            align: _oAreaData.align,
          });
          break;
      }
    };
    UserInput.prototype.removeHitArea = function (_id) {
      for (var i = 0; i < this.aHitAreas.length; i++) {
        if (this.aHitAreas[i].id == _id) {
          this.aHitAreas.splice(i, 1);
          i -= 1;
        }
      }
    };
    UserInput.prototype.resetAll = function () {
      for (var i = 0; i < this.aHitAreas.length; i++) {
        this.aHitAreas[i].oData.isDown = false;
        this.aHitAreas[i].oData.isBeingDragged = false;
        this.aHitAreas[i].aTouchIdentifiers = new Array();
      }
      this.isDown = false;
    };
    return UserInput;
  })();
  Utils.UserInput = UserInput;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
  var FpsMeter = (function () {
    function FpsMeter(_canvasHeight) {
      this.updateFreq = 10;
      this.updateInc = 0;
      this.frameAverage = 0;
      this.display = 1;
      this.log = "";
      this.render = function (_ctx) {
        this.frameAverage += this.delta / this.updateFreq;
        if (++this.updateInc >= this.updateFreq) {
          this.updateInc = 0;
          this.display = this.frameAverage;
          this.frameAverage = 0;
        }
        _ctx.textAlign = "left";
        ctx.font = "10px Helvetica";
        _ctx.fillStyle = "#333333";
        _ctx.beginPath();
        _ctx.rect(0, this.canvasHeight - 15, 40, 15);
        _ctx.closePath();
        _ctx.fill();
        _ctx.fillStyle = "#ffffff";
        _ctx.fillText(
          Math.round(1000 / (this.display * 1000)) + " fps " + this.log,
          5,
          this.canvasHeight - 5
        );
      };
      this.canvasHeight = _canvasHeight;
    }
    FpsMeter.prototype.update = function (_delta) {
      this.delta = _delta;
    };
    return FpsMeter;
  })();
  Utils.FpsMeter = FpsMeter;
})(Utils || (Utils = {}));
var Elements;
(function (Elements) {
  var Background = (function () {
    function Background() {
      this.x = 0;
      this.y = 0;
      this.targY = 0;
      this.incY = 0;
      this.renderState = null;
      this.oImgData = assetLib.getData("background");
    }
    Background.prototype.render = function () {
      if (canvas.width > canvas.height) {
        ctx.drawImage(
          this.oImgData.img,
          0,
          ((1 - canvas.height / canvas.width) / 2) * this.oImgData.img.height,
          this.oImgData.img.width,
          (canvas.height / canvas.width) * this.oImgData.img.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
      } else {
        ctx.drawImage(
          this.oImgData.img,
          ((1 - canvas.width / canvas.height) / 2) * this.oImgData.img.width,
          0,
          (canvas.width / canvas.height) * this.oImgData.img.width,
          this.oImgData.img.width,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    };
    return Background;
  })();
  Elements.Background = Background;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var Panel = (function () {
    function Panel(_panelType, _aButs) {
      this.timer = 0.3;
      this.endTime = 0;
      this.posY = 0;
      this.largeNumberSpace = 41;
      this.incY = 0;
      this.flareRot = 0;
      this.levelNumberSpace = 20;
      this.oSplashLogoImgData = assetLib.getData("splashLogo");
      this.oCopyrightData = assetLib.getData("copyright");
      this.oUiElementsImgData = assetLib.getData(
        window.famobi.hasFeature("leaderboard") ? "uiElements" : "uiElements2"
      );
      this.oGreenNumbersImgData = assetLib.getData("numbersGreen");
      this.oBlueNumbersImgData = assetLib.getData("numbersBlue");
      this.oRedNumbersImgData = assetLib.getData("numbersRed");
      this.oLevelNumbersImgData = assetLib.getData("numbersLevel");
      this.oMapImgData = assetLib.getData("map");
      this.panelType = _panelType;
      this.aButs = _aButs;
      this.oTopFlareImgData = assetLib.getData("flare");
    }
    Panel.prototype.update = function () {
      this.incY += 10 * delta;
    };
    Panel.prototype.startTween1 = function () {
      this.posY = 500;
      TweenLite.to(this, 0.5, {
        posY: 0,
        ease: "Cubic.easeOut",
      });
    };
    Panel.prototype.tweenFinger = function () {
      var tempLevel = saveDataHandler.getLastUnlockedLevel();
      this.fingerArc = 0;
      this.fingerX = aLevelData[tempLevel - 1].mapX;
      this.fingerY = aLevelData[tempLevel - 1].mapY;
      TweenLite.to(this, 1, {
        fingerX: aLevelData[tempLevel].mapX,
        fingerY: aLevelData[tempLevel].mapY,
        fingerArc: -180 * radian,
        ease: "Quad.easeInOut",
        onComplete: function () {
          levelNum++;
          initLevelPreview();
        },
      });
    };
    Panel.prototype.switchBut = function (_id0, _id1, _aNewAPos, _aNewAlign) {
      if (typeof _aNewAPos === "undefined") {
        _aNewAPos = null;
      }
      if (typeof _aNewAlign === "undefined") {
        _aNewAlign = null;
      }
      var oButData = null;
      for (var i = 0; i < this.aButs.length; i++) {
        if (this.aButs[i].id == _id0) {
          this.aButs[i].id = _id1;
          oButData = this.aButs[i];
          if (_aNewAPos) {
            this.aButs[i].aPos = _aNewAPos;
          }
          if (_aNewAlign) {
            this.aButs[i].align = _aNewAlign;
          }
          break;
        }
      }
      return oButData;
    };
    Panel.prototype.render = function (_butsOnTop) {
      if (typeof _butsOnTop === "undefined") {
        _butsOnTop = true;
      }
      if (!_butsOnTop) {
        this.addButs(ctx);
      }
      switch (this.panelType) {
        case "splash":
          ctx.fillStyle = "rgba(0,0,0,.35)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            this.oSplashLogoImgData.img,
            canvas.width / 2 - this.oSplashLogoImgData.img.width / 2,
            canvas.height / 2 -
              this.oSplashLogoImgData.img.height / 2 -
              this.posY
          );
          break;
        case "start":
          this.flareRot += delta / 3;
          ctx.save();
          ctx.translate(canvas.width / 2 + this.posY + 90, canvas.height * 0.7);
          ctx.scale(0.6, 0.5);
          ctx.rotate(this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.translate(
            -(canvas.width / 2 + this.posY + 90),
            -(canvas.height * 0.7)
          );
          ctx.translate(canvas.width / 2 + this.posY + 90, canvas.height * 0.7);
          ctx.rotate(-this.flareRot * 2);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          ctx.save();
          ctx.translate(canvas.width / 2 + this.posY - 90, canvas.height * 0.7);
          ctx.scale(0.6, 0.5);
          ctx.rotate(this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.translate(
            -(canvas.width / 2 + this.posY - 90),
            -(canvas.height * 0.7)
          );
          ctx.translate(canvas.width / 2 + this.posY - 90, canvas.height * 0.7);
          ctx.rotate(-this.flareRot * 2);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.titleLogo].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.titleLogo].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.titleLogo].width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.titleLogo]
              .height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 - bWidth / 2 - this.posY - 10,
            canvas.height * 0.25 - bHeight / 2,
            bWidth,
            bHeight
          );
          var tempNum =
            saveDataHandler.oHighscoreData.stats.ever.highscore.toString();
          var tempScale = 0.5;
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 -
              bWidth -
              (tempNum.length / 2) * (this.largeNumberSpace * tempScale) +
              103 +
              this.posY,
            canvas.height * 0.7 + 70,
            bWidth,
            bHeight
          );
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oGreenNumbersImgData.oData.spriteWidth) %
              this.oGreenNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oGreenNumbersImgData.img.width /
                    this.oGreenNumbersImgData.oData.spriteWidth)
              ) * this.oGreenNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oGreenNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.largeNumberSpace * tempScale) -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale) +
                101 +
                this.posY,
              canvas.height * 0.7 + 75,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          var tempNum = saveDataHandler.getTotalScore().toString();
          var tempScale = 0.5;
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.miniCup].height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 -
              bWidth -
              (tempNum.length / 2) * (this.largeNumberSpace * tempScale) -
              75 +
              this.posY,
            canvas.height * 0.7 + 70,
            bWidth,
            bHeight
          );
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oGreenNumbersImgData.oData.spriteWidth) %
              this.oGreenNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oGreenNumbersImgData.img.width /
                    this.oGreenNumbersImgData.oData.spriteWidth)
              ) * this.oGreenNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oGreenNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.largeNumberSpace * tempScale) -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale) -
                77 +
                this.posY,
              canvas.height * 0.7 + 75,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale
            );
          }

          if (famobi.hasFeature("copyright")) {
            const copyrightSize = 75;
            const copyrightPadding = 10;

            ctx.globalAlpha = 0.4;
            ctx.drawImage(
              this.oCopyrightData.img,
              copyrightPadding,
              canvas.height - copyrightSize - copyrightPadding,
              copyrightSize,
              copyrightSize
            );
            ctx.globalAlpha = 1;
          }
          break;
        case "credits":
          ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            this.oSplashLogoImgData.img,
            canvas.width / 2 - this.oSplashLogoImgData.img.width / 2,
            canvas.height / 2 -
              this.oSplashLogoImgData.img.height / 2 -
              this.posY
          );
          break;
        case "map":
          mapPosRealY -= (mapPosRealY - mapPosY) * 8 * delta;
          mapPosRealX -= (mapPosRealX - mapPosX) * 8 * delta;
          ctx.drawImage(
            this.oMapImgData.img,
            mapPosRealX,
            mapPosRealY,
            Math.min(this.oMapImgData.img.width, canvas.width),
            Math.min(this.oMapImgData.img.height, canvas.height),
            0,
            0,
            canvas.width * mapScale,
            canvas.height * mapScale
          );
          var tempLevel = saveDataHandler.getLastUnlockedLevel();
          if (tempLevel != -1) {
            this.flareRot += delta / 3;
            var tempOffsetY = -80;
            if (aLevelData[tempLevel].y < 200) {
              tempOffsetY = 80;
            }
            ctx.save();
            ctx.translate(
              (aLevelData[tempLevel].mapX - mapPosRealX) * mapScale,
              (aLevelData[tempLevel].mapY - mapPosRealY) * mapScale
            );
            ctx.scale(0.5, 0.5);
            ctx.rotate(this.flareRot);
            ctx.drawImage(
              this.oTopFlareImgData.img,
              -this.oTopFlareImgData.img.width / 2,
              -this.oTopFlareImgData.img.height / 2
            );
            ctx.restore();
            ctx.save();
            ctx.translate(
              (aLevelData[tempLevel].mapX - mapPosRealX) * mapScale,
              (aLevelData[tempLevel].mapY - mapPosRealY) * mapScale
            );
            ctx.scale(0.5, 0.5);
            ctx.rotate(-this.flareRot);
            ctx.drawImage(
              this.oTopFlareImgData.img,
              -this.oTopFlareImgData.img.width / 2,
              -this.oTopFlareImgData.img.height / 2
            );
            ctx.restore();
          }
          this.displayMapIcons();
          if (tempLevel != -1) {
            var bX =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint].x;
            var bY =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint].y;
            var bWidth =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint]
                .width;
            var bHeight =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint]
                .height;
            ctx.drawImage(
              this.oUiElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              (aLevelData[tempLevel].mapX - bWidth / 2 - mapPosRealX + 4) *
                mapScale,
              (aLevelData[tempLevel].mapY -
                bHeight / 2 -
                mapPosRealY -
                100 +
                Math.sin(this.incY) * 10) *
                mapScale,
              bWidth * mapScale,
              bHeight * mapScale
            );
          }
          this.displayScore();
          break;
        case "levelPreview":
          ctx.drawImage(
            this.oMapImgData.img,
            mapPosRealX,
            mapPosRealY,
            Math.min(this.oMapImgData.img.width, canvas.width),
            Math.min(this.oMapImgData.img.height, canvas.height),
            0,
            0,
            canvas.width * mapScale,
            canvas.height * mapScale
          );
          this.displayMapIcons();
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel].width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel]
              .height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 - bWidth / 2 - this.posY,
            canvas.height / 2 - bHeight / 2,
            bWidth,
            bHeight
          );
          var bX = this.oUiElementsImgData.oData.oAtlasData[oImageIds.quiver].x;
          var bY = this.oUiElementsImgData.oData.oAtlasData[oImageIds.quiver].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.quiver].width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.quiver].height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 - bWidth / 2 - this.posY,
            canvas.height / 2 - bHeight / 2 - 110,
            bWidth,
            bHeight
          );
          var tempNum = aLevelData[levelNum].quiver.toString();
          var tempScale = 0.7;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oRedNumbersImgData.oData.spriteWidth) %
              this.oRedNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oRedNumbersImgData.img.width /
                    this.oRedNumbersImgData.oData.spriteWidth)
              ) * this.oRedNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oRedNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.largeNumberSpace * tempScale) -
                this.posY +
                1,
              canvas.height / 2 - 132,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          for (var i = 0; i < 3; i++) {
            var tempTarg = oImageIds["scoreTarget" + i];
            if (aLevelData[levelNum].misc.id == "balloons") {
              tempTarg = oImageIds["balloonTarget" + i];
            }
            var bX = this.oUiElementsImgData.oData.oAtlasData[tempTarg].x;
            var bY = this.oUiElementsImgData.oData.oAtlasData[tempTarg].y;
            var bWidth =
              this.oUiElementsImgData.oData.oAtlasData[tempTarg].width;
            var bHeight =
              this.oUiElementsImgData.oData.oAtlasData[tempTarg].height;
            ctx.drawImage(
              this.oUiElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width / 2 - bWidth / 2 - this.posY - 113 + i * 115,
              canvas.height / 2 - bHeight + 112,
              bWidth,
              bHeight
            );
            var tempNum = aLevelData[levelNum].aScoreTargs[i].toString();
            var tempScale = 0.85;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oBlueNumbersImgData.oData.spriteWidth) %
                this.oBlueNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oBlueNumbersImgData.img.width /
                      this.oBlueNumbersImgData.oData.spriteWidth)
                ) * this.oBlueNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oBlueNumbersImgData.img,
                imgX,
                imgY,
                this.oBlueNumbersImgData.oData.spriteWidth,
                this.oBlueNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale) -
                  this.posY -
                  (tempNum.length / 2) * (this.largeNumberSpace * tempScale) -
                  118 +
                  i * 115,
                canvas.height / 2 + 42,
                this.oBlueNumbersImgData.oData.spriteWidth * tempScale,
                this.oBlueNumbersImgData.oData.spriteHeight * tempScale
              );
            }
          }
          var tempNum = (levelNum + 1).toString();
          while (tempNum.length < 2) {
            tempNum = "0" + tempNum;
          }
          var tempScale = 1;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oLevelNumbersImgData.oData.spriteWidth) %
              this.oLevelNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oLevelNumbersImgData.img.width /
                    this.oLevelNumbersImgData.oData.spriteWidth)
              ) * this.oLevelNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oLevelNumbersImgData.img,
              imgX,
              imgY,
              this.oLevelNumbersImgData.oData.spriteWidth,
              this.oLevelNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.levelNumberSpace * tempScale) -
                this.posY -
                201,
              canvas.height / 2 - 154,
              this.oLevelNumbersImgData.oData.spriteWidth * tempScale,
              this.oLevelNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          this.flareRot += delta / 3;
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(-this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          break;
        case "levelSuccess":
          ctx.drawImage(
            this.oMapImgData.img,
            mapPosRealX,
            mapPosRealY,
            Math.min(this.oMapImgData.img.width, canvas.width),
            Math.min(this.oMapImgData.img.height, canvas.height),
            0,
            0,
            canvas.width * mapScale,
            canvas.height * mapScale
          );
          this.displayMapIcons();
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel].width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.bluePanel]
              .height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 - bWidth / 2 - this.posY,
            canvas.height / 2 - bHeight / 2,
            bWidth,
            bHeight
          );
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.scoreBgWin].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.scoreBgWin].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.scoreBgWin]
              .width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.scoreBgWin]
              .height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 - bWidth / 2 - this.posY,
            canvas.height / 2 - bHeight / 2 - 115,
            bWidth,
            bHeight
          );
          var tempNum = levelScore.toString();
          var tempScale = 0.85;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oBlueNumbersImgData.oData.spriteWidth) %
              this.oBlueNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oBlueNumbersImgData.img.width /
                    this.oBlueNumbersImgData.oData.spriteWidth)
              ) * this.oBlueNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oBlueNumbersImgData.img,
              imgX,
              imgY,
              this.oBlueNumbersImgData.oData.spriteWidth,
              this.oBlueNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.largeNumberSpace * tempScale) -
                this.posY -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
              canvas.height / 2 - 139,
              this.oBlueNumbersImgData.oData.spriteWidth * tempScale,
              this.oBlueNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          for (var i = 0; i < 3; i++) {
            ctx.save();
            if (i == 0) {
              if (
                levelScore >= aLevelData[levelNum].aScoreTargs[0] &&
                levelScore < aLevelData[levelNum].aScoreTargs[1]
              ) {
                ctx.globalAlpha = 1;
              } else {
                ctx.globalAlpha = 0.4;
              }
            } else if (i == 1) {
              if (
                levelScore >= aLevelData[levelNum].aScoreTargs[1] &&
                levelScore < aLevelData[levelNum].aScoreTargs[2]
              ) {
                ctx.globalAlpha = 1;
              } else {
                ctx.globalAlpha = 0.4;
              }
            } else if (i == 2) {
              if (levelScore >= aLevelData[levelNum].aScoreTargs[2]) {
                ctx.globalAlpha = 1;
              } else {
                ctx.globalAlpha = 0.4;
              }
            }
            var tempTarg = oImageIds["scoreTarget" + i];
            if (aLevelData[levelNum].misc.id == "balloons") {
              tempTarg = oImageIds["balloonTarget" + i];
            }
            var bX = this.oUiElementsImgData.oData.oAtlasData[tempTarg].x;
            var bY = this.oUiElementsImgData.oData.oAtlasData[tempTarg].y;
            var bWidth =
              this.oUiElementsImgData.oData.oAtlasData[tempTarg].width;
            var bHeight =
              this.oUiElementsImgData.oData.oAtlasData[tempTarg].height;
            ctx.drawImage(
              this.oUiElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width / 2 - bWidth / 2 - this.posY - 113 + i * 115,
              canvas.height / 2 - bHeight + 112,
              bWidth,
              bHeight
            );
            var tempNum = aLevelData[levelNum].aScoreTargs[i].toString();
            var tempScale = 0.85;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oBlueNumbersImgData.oData.spriteWidth) %
                this.oBlueNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oBlueNumbersImgData.img.width /
                      this.oBlueNumbersImgData.oData.spriteWidth)
                ) * this.oBlueNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oBlueNumbersImgData.img,
                imgX,
                imgY,
                this.oBlueNumbersImgData.oData.spriteWidth,
                this.oBlueNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale) -
                  this.posY -
                  (tempNum.length / 2) * (this.largeNumberSpace * tempScale) -
                  118 +
                  i * 115,
                canvas.height / 2 + 42,
                this.oBlueNumbersImgData.oData.spriteWidth * tempScale,
                this.oBlueNumbersImgData.oData.spriteHeight * tempScale
              );
            }
            ctx.restore();
          }
          var tempNum = (levelNum + 1).toString();
          while (tempNum.length < 2) {
            tempNum = "0" + tempNum;
          }
          var tempScale = 1;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oLevelNumbersImgData.oData.spriteWidth) %
              this.oLevelNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oLevelNumbersImgData.img.width /
                    this.oLevelNumbersImgData.oData.spriteWidth)
              ) * this.oLevelNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oLevelNumbersImgData.img,
              imgX,
              imgY,
              this.oLevelNumbersImgData.oData.spriteWidth,
              this.oLevelNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.levelNumberSpace * tempScale) -
                this.posY -
                201,
              canvas.height / 2 - 154,
              this.oLevelNumbersImgData.oData.spriteWidth * tempScale,
              this.oLevelNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          this.flareRot += delta / 3;
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(-this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          break;
        case "levelFail":
          ctx.drawImage(
            this.oMapImgData.img,
            mapPosRealX,
            mapPosRealY,
            Math.min(this.oMapImgData.img.width, canvas.width),
            Math.min(this.oMapImgData.img.height, canvas.height),
            0,
            0,
            canvas.width * mapScale,
            canvas.height * mapScale
          );
          this.displayMapIcons();
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.losePanel].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.losePanel].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.losePanel].width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.losePanel]
              .height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 - bWidth / 2 - this.posY,
            canvas.height / 2 - bHeight / 2,
            bWidth,
            bHeight
          );
          var tempNum = levelScore.toString();
          var tempScale = 0.85;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oRedNumbersImgData.oData.spriteWidth) %
              this.oRedNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oRedNumbersImgData.img.width /
                    this.oRedNumbersImgData.oData.spriteWidth)
              ) * this.oRedNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oRedNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.largeNumberSpace * tempScale) -
                this.posY -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
              canvas.height / 2 - 139,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          for (var i = 0; i < 3; i++) {
            ctx.save();
            if (levelScore >= aLevelData[levelNum].aScoreTargs[i]) {
              ctx.globalAlpha = 1;
            } else {
              ctx.globalAlpha = 0.4;
            }
            var tempTarg = oImageIds["scoreTarget" + i];
            if (aLevelData[levelNum].misc.id == "balloons") {
              tempTarg = oImageIds["balloonTarget" + i];
            }
            var bX = this.oUiElementsImgData.oData.oAtlasData[tempTarg].x;
            var bY = this.oUiElementsImgData.oData.oAtlasData[tempTarg].y;
            var bWidth =
              this.oUiElementsImgData.oData.oAtlasData[tempTarg].width;
            var bHeight =
              this.oUiElementsImgData.oData.oAtlasData[tempTarg].height;
            ctx.drawImage(
              this.oUiElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width / 2 - bWidth / 2 - this.posY - 113 + i * 115,
              canvas.height / 2 - bHeight + 112,
              bWidth,
              bHeight
            );
            var tempNum = aLevelData[levelNum].aScoreTargs[i].toString();
            var tempScale = 0.85;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oBlueNumbersImgData.oData.spriteWidth) %
                this.oBlueNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oBlueNumbersImgData.img.width /
                      this.oBlueNumbersImgData.oData.spriteWidth)
                ) * this.oBlueNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oBlueNumbersImgData.img,
                imgX,
                imgY,
                this.oBlueNumbersImgData.oData.spriteWidth,
                this.oBlueNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale) -
                  this.posY -
                  (tempNum.length / 2) * (this.largeNumberSpace * tempScale) -
                  118 +
                  i * 115,
                canvas.height / 2 + 42,
                this.oBlueNumbersImgData.oData.spriteWidth * tempScale,
                this.oBlueNumbersImgData.oData.spriteHeight * tempScale
              );
            }
            ctx.restore();
          }
          var tempNum = (levelNum + 1).toString();
          while (tempNum.length < 2) {
            tempNum = "0" + tempNum;
          }
          var tempScale = 1;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oLevelNumbersImgData.oData.spriteWidth) %
              this.oLevelNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oLevelNumbersImgData.img.width /
                    this.oLevelNumbersImgData.oData.spriteWidth)
              ) * this.oLevelNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oLevelNumbersImgData.img,
              imgX,
              imgY,
              this.oLevelNumbersImgData.oData.spriteWidth,
              this.oLevelNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.levelNumberSpace * tempScale) -
                this.posY -
                201,
              canvas.height / 2 - 154,
              this.oLevelNumbersImgData.oData.spriteWidth * tempScale,
              this.oLevelNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          this.flareRot += delta / 3;
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(-this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          break;
        case "challengeFail":
          ctx.drawImage(
            this.oMapImgData.img,
            mapPosRealX,
            mapPosRealY,
            Math.min(this.oMapImgData.img.width, canvas.width),
            Math.min(this.oMapImgData.img.height, canvas.height),
            0,
            0,
            canvas.width * mapScale,
            canvas.height * mapScale
          );
          this.displayMapIcons();
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.challengePanel]
              .x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.challengePanel]
              .y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.challengePanel]
              .width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.challengePanel]
              .height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 - bWidth / 2 - this.posY,
            canvas.height / 2 - bHeight / 2,
            bWidth,
            bHeight
          );
          var tempNum = levelScore.toString();
          var tempScale = 0.85;
          var offsetX = window.famobi.hasFeature("leaderboard") ? 0 : 7;
          var offsetY = window.famobi.hasFeature("leaderboard") ? 0 : 58;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oBlueNumbersImgData.oData.spriteWidth) %
              this.oBlueNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oBlueNumbersImgData.img.width /
                    this.oBlueNumbersImgData.oData.spriteWidth)
              ) * this.oBlueNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oBlueNumbersImgData.img,
              imgX,
              imgY,
              this.oBlueNumbersImgData.oData.spriteWidth,
              this.oBlueNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                j * (this.largeNumberSpace * tempScale) -
                this.posY -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale) -
                8 +
                offsetX,
              canvas.height / 2 - 145 + offsetY,
              this.oBlueNumbersImgData.oData.spriteWidth * tempScale,
              this.oBlueNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          var tempNum =
            saveDataHandler.oHighscoreData.stats.ever.highscore.toString();
          var offsetX = window.famobi.hasFeature("leaderboard") ? 0 : -130;
          var offsetY = window.famobi.hasFeature("leaderboard") ? 0 : 150;
          var tempScale = 0.5;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oBlueNumbersImgData.oData.spriteWidth) %
              this.oBlueNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oBlueNumbersImgData.img.width /
                    this.oBlueNumbersImgData.oData.spriteWidth)
              ) * this.oBlueNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oBlueNumbersImgData.img,
              imgX,
              imgY,
              this.oBlueNumbersImgData.oData.spriteWidth,
              this.oBlueNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                128 +
                j * (this.largeNumberSpace * tempScale) -
                this.posY +
                offsetX,
              canvas.height / 2 - 123 + offsetY,
              this.oBlueNumbersImgData.oData.spriteWidth * tempScale,
              this.oBlueNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          if (window.famobi.hasFeature("leaderboard")) {
            var tempHorizShift = Math.max(
              saveDataHandler.oHighscoreData.stats.ever.rank.toString().length *
                this.largeNumberSpace *
                0.4 +
                saveDataHandler.oHighscoreData.stats.ever.total.toString()
                  .length *
                  this.largeNumberSpace *
                  0.6 -
                140,
              30
            );
            var bX =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.highscoreTable]
                .x;
            var bY =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.highscoreTable]
                .y;
            var bWidth =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.highscoreTable]
                .width;
            var bHeight =
              this.oUiElementsImgData.oData.oAtlasData[oImageIds.highscoreTable]
                .height;
            ctx.drawImage(
              this.oUiElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width / 2 - bWidth / 2 - this.posY - tempHorizShift - 35,
              canvas.height / 2 - bHeight / 2 + 30,
              bWidth,
              bHeight
            );
            var tempNum =
              saveDataHandler.oHighscoreData.stats.day.rank.toString();
            var tempScale = 0.6;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oGreenNumbersImgData.oData.spriteWidth) %
                this.oGreenNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oGreenNumbersImgData.img.width /
                      this.oGreenNumbersImgData.oData.spriteWidth)
                ) * this.oGreenNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oGreenNumbersImgData.img,
                imgX,
                imgY,
                this.oGreenNumbersImgData.oData.spriteWidth,
                this.oGreenNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale) -
                  this.posY -
                  tempHorizShift,
                canvas.height / 2 - 60,
                this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
                this.oGreenNumbersImgData.oData.spriteHeight * tempScale
              );
            }
            var tempScale0 = 0.4;
            var id;
            id = 10;
            var imgX =
              (id * this.oRedNumbersImgData.oData.spriteWidth) %
              this.oRedNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oRedNumbersImgData.img.width /
                    this.oRedNumbersImgData.oData.spriteWidth)
              ) * this.oRedNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oRedNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                tempNum.length * (this.largeNumberSpace * tempScale) -
                this.posY +
                5 -
                tempHorizShift,
              canvas.height / 2 - 60,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale0
            );
            var tempNum0 =
              saveDataHandler.oHighscoreData.stats.day.total.toString();
            var tempScale0 = 0.4;
            for (var j = 0; j < tempNum0.length; j++) {
              var id;
              id = parseFloat(tempNum0.charAt(j));
              var imgX =
                (id * this.oRedNumbersImgData.oData.spriteWidth) %
                this.oRedNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oRedNumbersImgData.img.width /
                      this.oRedNumbersImgData.oData.spriteWidth)
                ) * this.oRedNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oRedNumbersImgData.img,
                imgX,
                imgY,
                this.oRedNumbersImgData.oData.spriteWidth,
                this.oRedNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale0) +
                  tempNum.length * (this.largeNumberSpace * tempScale) -
                  this.posY +
                  25 -
                  tempHorizShift,
                canvas.height / 2 - 60,
                this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
                this.oRedNumbersImgData.oData.spriteHeight * tempScale0
              );
            }
            var tempNum =
              saveDataHandler.oHighscoreData.stats.week.rank.toString();
            var tempScale = 0.6;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oGreenNumbersImgData.oData.spriteWidth) %
                this.oGreenNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oGreenNumbersImgData.img.width /
                      this.oGreenNumbersImgData.oData.spriteWidth)
                ) * this.oGreenNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oGreenNumbersImgData.img,
                imgX,
                imgY,
                this.oGreenNumbersImgData.oData.spriteWidth,
                this.oGreenNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale) -
                  this.posY -
                  tempHorizShift,
                canvas.height / 2 - 60 + 50,
                this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
                this.oGreenNumbersImgData.oData.spriteHeight * tempScale
              );
            }
            var tempScale0 = 0.4;
            var id;
            id = 10;
            var imgX =
              (id * this.oRedNumbersImgData.oData.spriteWidth) %
              this.oRedNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oRedNumbersImgData.img.width /
                    this.oRedNumbersImgData.oData.spriteWidth)
              ) * this.oRedNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oRedNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                tempNum.length * (this.largeNumberSpace * tempScale) -
                this.posY +
                5 -
                tempHorizShift,
              canvas.height / 2 - 60 + 50,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale0
            );
            var tempNum0 =
              saveDataHandler.oHighscoreData.stats.week.total.toString();
            var tempScale0 = 0.4;
            for (var j = 0; j < tempNum0.length; j++) {
              var id;
              id = parseFloat(tempNum0.charAt(j));
              var imgX =
                (id * this.oRedNumbersImgData.oData.spriteWidth) %
                this.oRedNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oRedNumbersImgData.img.width /
                      this.oRedNumbersImgData.oData.spriteWidth)
                ) * this.oRedNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oRedNumbersImgData.img,
                imgX,
                imgY,
                this.oRedNumbersImgData.oData.spriteWidth,
                this.oRedNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale0) +
                  tempNum.length * (this.largeNumberSpace * tempScale) -
                  this.posY +
                  25 -
                  tempHorizShift,
                canvas.height / 2 - 60 + 50,
                this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
                this.oRedNumbersImgData.oData.spriteHeight * tempScale0
              );
            }
            var tempNum =
              saveDataHandler.oHighscoreData.stats.month.rank.toString();
            var tempScale = 0.6;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oGreenNumbersImgData.oData.spriteWidth) %
                this.oGreenNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oGreenNumbersImgData.img.width /
                      this.oGreenNumbersImgData.oData.spriteWidth)
                ) * this.oGreenNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oGreenNumbersImgData.img,
                imgX,
                imgY,
                this.oGreenNumbersImgData.oData.spriteWidth,
                this.oGreenNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale) -
                  this.posY -
                  tempHorizShift,
                canvas.height / 2 - 60 + 100,
                this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
                this.oGreenNumbersImgData.oData.spriteHeight * tempScale
              );
            }
            var tempScale0 = 0.4;
            var id;
            id = 10;
            var imgX =
              (id * this.oRedNumbersImgData.oData.spriteWidth) %
              this.oRedNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oRedNumbersImgData.img.width /
                    this.oRedNumbersImgData.oData.spriteWidth)
              ) * this.oRedNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oRedNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                tempNum.length * (this.largeNumberSpace * tempScale) -
                this.posY +
                5 -
                tempHorizShift,
              canvas.height / 2 - 60 + 100,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale0
            );
            var tempNum0 =
              saveDataHandler.oHighscoreData.stats.month.total.toString();
            var tempScale0 = 0.4;
            for (var j = 0; j < tempNum0.length; j++) {
              var id;
              id = parseFloat(tempNum0.charAt(j));
              var imgX =
                (id * this.oRedNumbersImgData.oData.spriteWidth) %
                this.oRedNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oRedNumbersImgData.img.width /
                      this.oRedNumbersImgData.oData.spriteWidth)
                ) * this.oRedNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oRedNumbersImgData.img,
                imgX,
                imgY,
                this.oRedNumbersImgData.oData.spriteWidth,
                this.oRedNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale0) +
                  tempNum.length * (this.largeNumberSpace * tempScale) -
                  this.posY +
                  25 -
                  tempHorizShift,
                canvas.height / 2 - 60 + 100,
                this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
                this.oRedNumbersImgData.oData.spriteHeight * tempScale0
              );
            }
            var tempNum =
              saveDataHandler.oHighscoreData.stats.ever.rank.toString();
            var tempScale = 0.6;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oGreenNumbersImgData.oData.spriteWidth) %
                this.oGreenNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oGreenNumbersImgData.img.width /
                      this.oGreenNumbersImgData.oData.spriteWidth)
                ) * this.oGreenNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oGreenNumbersImgData.img,
                imgX,
                imgY,
                this.oGreenNumbersImgData.oData.spriteWidth,
                this.oGreenNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale) -
                  this.posY -
                  tempHorizShift,
                canvas.height / 2 - 60 + 150,
                this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
                this.oGreenNumbersImgData.oData.spriteHeight * tempScale
              );
            }
            var tempScale0 = 0.4;
            var id;
            id = 10;
            var imgX =
              (id * this.oRedNumbersImgData.oData.spriteWidth) %
              this.oRedNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oRedNumbersImgData.img.width /
                    this.oRedNumbersImgData.oData.spriteWidth)
              ) * this.oRedNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oRedNumbersImgData.img,
              imgX,
              imgY,
              this.oRedNumbersImgData.oData.spriteWidth,
              this.oRedNumbersImgData.oData.spriteHeight,
              canvas.width / 2 +
                tempNum.length * (this.largeNumberSpace * tempScale) -
                this.posY +
                5 -
                tempHorizShift,
              canvas.height / 2 - 60 + 150,
              this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
              this.oRedNumbersImgData.oData.spriteHeight * tempScale0
            );
            var tempNum0 =
              saveDataHandler.oHighscoreData.stats.ever.total.toString();
            var tempScale0 = 0.4;
            for (var j = 0; j < tempNum0.length; j++) {
              var id;
              id = parseFloat(tempNum0.charAt(j));
              var imgX =
                (id * this.oRedNumbersImgData.oData.spriteWidth) %
                this.oRedNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oRedNumbersImgData.img.width /
                      this.oRedNumbersImgData.oData.spriteWidth)
                ) * this.oRedNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oRedNumbersImgData.img,
                imgX,
                imgY,
                this.oRedNumbersImgData.oData.spriteWidth,
                this.oRedNumbersImgData.oData.spriteHeight,
                canvas.width / 2 +
                  j * (this.largeNumberSpace * tempScale0) +
                  tempNum.length * (this.largeNumberSpace * tempScale) -
                  this.posY +
                  25 -
                  tempHorizShift,
                canvas.height / 2 - 60 + 150,
                this.oRedNumbersImgData.oData.spriteWidth * tempScale0,
                this.oRedNumbersImgData.oData.spriteHeight * tempScale0
              );
            }
          }
          this.flareRot += delta / 3;
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          ctx.save();
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.translate(
            canvas.width / 2 + this.posY + 140,
            canvas.height / 2 + 170
          );
          ctx.scale(0.5, 0.3);
          ctx.rotate(-this.flareRot);
          ctx.drawImage(
            this.oTopFlareImgData.img,
            -this.oTopFlareImgData.img.width / 2,
            -this.oTopFlareImgData.img.height / 2
          );
          ctx.restore();
          break;
        case "game":
          break;
        case "animateMap":
          mapPosRealY -= (mapPosRealY - mapPosY) * 8 * delta;
          mapPosRealX -= (mapPosRealX - mapPosX) * 8 * delta;
          ctx.drawImage(
            this.oMapImgData.img,
            mapPosRealX,
            mapPosRealY,
            Math.min(this.oMapImgData.img.width, canvas.width),
            Math.min(this.oMapImgData.img.height, canvas.height),
            0,
            0,
            canvas.width * mapScale,
            canvas.height * mapScale
          );
          var tempLevel = saveDataHandler.getLastUnlockedLevel();
          if (tempLevel != -1) {
            this.flareRot += delta / 3;
            var tempOffsetY = -80;
            if (aLevelData[tempLevel].y < 200) {
              tempOffsetY = 80;
            }
            ctx.save();
            ctx.translate(
              (aLevelData[tempLevel].mapX - mapPosRealX) * mapScale,
              (aLevelData[tempLevel].mapY - mapPosRealY) * mapScale
            );
            ctx.scale(0.5, 0.5);
            ctx.rotate(this.flareRot);
            ctx.drawImage(
              this.oTopFlareImgData.img,
              -this.oTopFlareImgData.img.width / 2,
              -this.oTopFlareImgData.img.height / 2
            );
            ctx.restore();
            ctx.save();
            ctx.translate(
              (aLevelData[tempLevel].mapX - mapPosRealX) * mapScale,
              (aLevelData[tempLevel].mapY - mapPosRealY) * mapScale
            );
            ctx.scale(0.5, 0.5);
            ctx.rotate(-this.flareRot);
            ctx.drawImage(
              this.oTopFlareImgData.img,
              -this.oTopFlareImgData.img.width / 2,
              -this.oTopFlareImgData.img.height / 2
            );
            ctx.restore();
          }
          this.displayMapIcons();
          var bX =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint].x;
          var bY =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint].y;
          var bWidth =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint]
              .width;
          var bHeight =
            this.oUiElementsImgData.oData.oAtlasData[oImageIds.fingerPoint]
              .height;
          ctx.drawImage(
            this.oUiElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            (this.fingerX - bWidth / 2 - mapPosRealX + 4) * mapScale,
            (this.fingerY -
              bHeight / 2 -
              mapPosRealY -
              100 +
              Math.sin(this.fingerArc) * 50) *
              mapScale,
            bWidth * mapScale,
            bHeight * mapScale
          );
          break;
        case "pause":
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
      }
      if (_butsOnTop) {
        this.addButs(ctx);
      }
    };
    Panel.prototype.displayMapIcons = function () {
      for (var i = 0; i < 50; i++) {
        var tempLevelState = saveDataHandler.getLevelData(i).levelState;

        if (
          tempLevelState == 0 &&
          typeof famobi_unlock !== "undefined" &&
          famobi_unlock.isEnabled()
        ) {
          tempLevelState = 1;
        }
        if (aLevelData[i].misc.id == "balloons") {
          tempLevelState += 5;
        }
        var butId = oImageIds["mapBut" + tempLevelState];
        var tempOffsetX;
        var tempOffsetY;
        switch (saveDataHandler.getLevelData(i).levelState) {
          case 0:
            tempOffsetX = 10;
            tempOffsetY = 4;
            break;
          case 1:
            tempOffsetX = 4;
            tempOffsetY = 4;
            break;
          case 2:
          case 3:
          case 4:
            tempOffsetX = 0;
            tempOffsetY = -40;
            break;
        }
        var bX = this.oUiElementsImgData.oData.oAtlasData[butId].x;
        var bY = this.oUiElementsImgData.oData.oAtlasData[butId].y;
        var bWidth = this.oUiElementsImgData.oData.oAtlasData[butId].width;
        var bHeight = this.oUiElementsImgData.oData.oAtlasData[butId].height;
        ctx.drawImage(
          this.oUiElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          (aLevelData[i].mapX - bWidth / 2 - mapPosRealX + tempOffsetX) *
            mapScale,
          (aLevelData[i].mapY - bHeight / 2 - mapPosRealY + tempOffsetY) *
            mapScale,
          bWidth * mapScale,
          bHeight * mapScale
        );
      }
      var bX =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderTop].x;
      var bY =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderTop].y;
      var bWidth =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderTop].width;
      var bHeight =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderTop]
          .height;
      ctx.drawImage(
        this.oUiElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        0,
        0,
        canvas.width,
        bHeight
      );
      var bX =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderBottom].x;
      var bY =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderBottom].y;
      var bWidth =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderBottom]
          .width;
      var bHeight =
        this.oUiElementsImgData.oData.oAtlasData[oImageIds.fadeBorderBottom]
          .height;
      ctx.drawImage(
        this.oUiElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        0,
        canvas.height - bHeight,
        canvas.width,
        bHeight
      );
    };
    Panel.prototype.displayScore = function () {
      var tempNum = saveDataHandler.getTotalScore().toString();
      while (tempNum.length < 6) {
        tempNum = "0" + tempNum;
      }
      var tempScale = 0.7;
      for (var j = 0; j < tempNum.length; j++) {
        var id;
        id = parseFloat(tempNum.charAt(j));
        var imgX =
          (id * this.oGreenNumbersImgData.oData.spriteWidth) %
          this.oGreenNumbersImgData.img.width;
        var imgY =
          Math.floor(
            id /
              (this.oGreenNumbersImgData.img.width /
                this.oGreenNumbersImgData.oData.spriteWidth)
          ) * this.oGreenNumbersImgData.oData.spriteHeight;
        ctx.drawImage(
          this.oGreenNumbersImgData.img,
          imgX,
          imgY,
          this.oGreenNumbersImgData.oData.spriteWidth,
          this.oGreenNumbersImgData.oData.spriteHeight,
          canvas.width / 2 +
            j * (this.largeNumberSpace * tempScale) -
            (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
          8 - this.posY,
          this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
          this.oGreenNumbersImgData.oData.spriteHeight * tempScale
        );
      }
    };
    Panel.prototype.addButs = function (ctx) {
      for (var i = 0; i < this.aButs.length; i++) {
        var offsetPosY = this.posY;
        var floatY = 0;
        if (this.incY != 0 && !this.aButs[i].noMove) {
          floatY = Math.sin(this.incY + i * 45) * 3;
        }
        if (i % 2 == 0) {
        }
        if (!this.aButs[i].scale) {
          this.aButs[i].scale = 1;
        }
        var bX = this.aButs[i].oImgData.oData.oAtlasData[this.aButs[i].id].x;
        var bY = this.aButs[i].oImgData.oData.oAtlasData[this.aButs[i].id].y;
        var bWidth =
          this.aButs[i].oImgData.oData.oAtlasData[this.aButs[i].id].width;
        var bHeight =
          this.aButs[i].oImgData.oData.oAtlasData[this.aButs[i].id].height;
        var aX = canvas.width * this.aButs[i].align[0];
        var aY = canvas.height * this.aButs[i].align[1];
        ctx.drawImage(
          this.aButs[i].oImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          aX +
            this.aButs[i].aPos[0] -
            (bWidth / 2) * this.aButs[i].scale +
            offsetPosY -
            floatY / 2,
          aY +
            this.aButs[i].aPos[1] -
            (bHeight / 2) * this.aButs[i].scale +
            floatY / 2,
          bWidth * this.aButs[i].scale + floatY,
          bHeight * this.aButs[i].scale - floatY
        );
      }
    };
    return Panel;
  })();
  Elements.Panel = Panel;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var ArcheryView = (function () {
    function ArcheryView(_isStartScreen) {
      if (typeof _isStartScreen === "undefined") {
        _isStartScreen = false;
      }
      this.aTargData = new Array(
        {
          y: 3,
          scale: 0.77,
          dist: 30,
        },
        {
          y: 3,
          scale: 0.58,
          dist: 50,
        },
        {
          y: 3,
          scale: 0.45,
          dist: 70,
        },
        {
          y: 3,
          scale: 0.34,
          dist: 90,
        }
      );
      this.zoomScale = 1;
      this.initialTweenX = 0;
      this.scrollSegs = 100;
      this.tempInc = 0;
      this.isStartScreen = false;
      this.aDistMarker = new Array(400, 420, 450, 485);
      this.smallScale = 0.5461341790996472;
      this.oGameElementsImgData = assetLib.getData("gameElements");
      this.oTreesImgData = assetLib.getData("trees");
      if (gameMode == "levels") {
        sceneType = aLevelData[levelNum].bg;
        oTargetType = {
          id: aLevelData[levelNum].id,
          moveDist: aLevelData[levelNum].moveDist,
          windMin: aLevelData[levelNum].windMin,
          windMax: aLevelData[levelNum].windMax,
        };
        this.targPosId = aLevelData[levelNum].targPosId;
        if (levelNum < 30) {
          this.moveSpeed = 20;
          this.moveSpeedTarg = 20;
        } else {
          this.moveSpeed = 25;
          this.moveSpeedTarg = 25;
        }
      } else {
        sceneType = Math.floor(Math.random() * 5);
        var temp = this.getChallengeWind();
        for (var i = 0; i < aBirds.length; i++) {
          aBirds[i].reset();
        }
        if (challengeLevelNum == 0) {
          oTargetType = "static";
          this.challengeRot = 0;
          oChallengeBalloon = {
            rot: 0,
            hyp: 0,
            scale: Math.max(0.5, 1 - challengeLevelNum / 30),
          };
        } else {
          oTargetType =
            aTargetTypes[Math.floor(Math.random() * aTargetTypes.length)];
          oTargetType.windMin = temp;
          oTargetType.windMax = temp;
          this.challengeRot =
            (Math.random() * 1 - 0.5) * Math.min(challengeLevelNum / 10, 1);
          var tempAmgle = Math.random() * 360 * radian;
          oChallengeBalloon = {
            rot: Math.random() * (360 * radian),
            hyp: Math.random() * 100,
            scale: Math.max(0.75, 1 - challengeLevelNum / 100),
          };
        }
        this.targPosId = this.getChallengePosId();
        moveIncX = 0;
        moveIncY = 0;
        moveState = 0;
        this.moveSpeed = 20;
        this.moveSpeedTarg = 20;
        aArrowsFired = new Array();
      }
      this.oGroundImgData = assetLib.getData("ground" + sceneType);
      this.oHorizonImgData = assetLib.getData("horizon" + sceneType);
      setTreeData();
      this.isStartScreen = _isStartScreen;
      if (gameMode == "challenge") {
        this.targStyle = 3;
      } else if (this.isStartScreen) {
        this.targStyle = 0;
      } else {
        this.targStyle = aLevelData[levelNum].targType;
      }
      this.isScrollingGround = true;
      if (this.isStartScreen) {
        this.scrollSegs = 150;
        moveIncX = 0;
        moveIncY = 0;
        moveState = 0;
      }
      this.initialTweenX = -600;
      if (!firstRun) {
        this.introTween();
      }
    }
    ArcheryView.prototype.introTween = function () {
      this.startTween = TweenLite.to(this, 1, {
        initialTweenX: 0,
        ease: "Cubic.easeOut",
        onComplete: function () {},
      });
    };
    ArcheryView.prototype.getChallengePosId = function () {
      var temp = Math.min(Math.round(Math.random() * challengeLevelNum), 10);
      switch (temp) {
        case 0:
        case 1:
        case 2:
          return 0;
          break;
        case 3:
        case 4:
        case 5:
          return 1;
          break;
        case 6:
        case 7:
        case 8:
          return 2;
          break;
        case 9:
        case 10:
          return 3;
        default:
          if (Math.random() > 0.2) {
            return 3;
          } else {
            return Math.floor(Math.random() * 4);
          }
          break;
      }
      return Math.floor((Math.random() * challengeLevelNum) / 5);
    };
    ArcheryView.prototype.getChallengeWind = function () {
      if (challengeLevelNum == 0) {
        return 0;
      } else {
        return 0.5 + Math.random() * Math.min(challengeLevelNum / 20, 2);
      }
    };
    ArcheryView.prototype.update = function () {
      if (gameMode == "levels" && aLevelData[levelNum].rot != 0) {
        targRot += aLevelData[levelNum].rot * delta;
      } else if (gameMode == "challenge") {
        targRot += this.challengeRot * delta;
      }
      this.horizonY = canvas.height * 0.5;
      this.groundToHit =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.standSmall].height;
      switch (oTargetType.id) {
        case "horiz":
          if (moveState == 0) {
            this.moveSpeed -= (this.moveSpeed - this.moveSpeedTarg) * 0.05;
          } else {
            this.moveSpeed -= (this.moveSpeed + this.moveSpeedTarg) * 0.05;
          }
          moveIncX += delta * this.moveSpeed;
          if (moveIncX >= (oTargetType.moveDist * moveDistSeg) / 2) {
            moveState = 1;
          } else if (moveIncX <= (oTargetType.moveDist * -moveDistSeg) / 2) {
            moveState = 0;
          }
          break;
        case "vert":
          if (moveState == 0) {
            this.moveSpeed -= (this.moveSpeed - this.moveSpeedTarg) * 0.05;
          } else {
            this.moveSpeed -= (this.moveSpeed + this.moveSpeedTarg) * 0.05;
          }
          moveIncY += delta * this.moveSpeed;
          if (moveIncY >= oTargetType.moveDist * moveDistSeg) {
            moveState = 1;
          } else if (moveIncY <= 0) {
            moveState = 0;
          }
          break;
        case "diag0":
          if (moveState == 0) {
            this.moveSpeed -= (this.moveSpeed - this.moveSpeedTarg) * 0.05;
          } else {
            this.moveSpeed -= (this.moveSpeed + this.moveSpeedTarg) * 0.05;
          }
          moveIncY += delta * this.moveSpeed;
          moveIncX += delta * this.moveSpeed;
          if (moveIncY >= oTargetType.moveDist * moveDistSeg) {
            moveState = 1;
          } else if (moveIncY <= 0) {
            moveState = 0;
          }
          break;
        case "diag1":
          if (moveState == 0) {
            this.moveSpeed -= (this.moveSpeed - this.moveSpeedTarg) * 0.05;
          } else {
            this.moveSpeed -= (this.moveSpeed + this.moveSpeedTarg) * 0.05;
          }
          moveIncY += delta * this.moveSpeed;
          moveIncX -= delta * this.moveSpeed;
          if (moveIncY >= oTargetType.moveDist * moveDistSeg) {
            moveState = 1;
          } else if (moveIncY <= 0) {
            moveState = 0;
          }
          break;
        case "circle0":
          circleAngle += (delta * this.moveSpeed) / 55;
          moveIncX = Math.cos(circleAngle) * (oTargetType.moveDist * 200);
          moveIncY =
            Math.sin(circleAngle) * (oTargetType.moveDist * 200) +
            oTargetType.moveDist * 200;
          break;
        case "circle1":
          circleAngle -= (delta * this.moveSpeed) / 55;
          moveIncX = Math.cos(circleAngle) * (oTargetType.moveDist * 200);
          moveIncY =
            Math.sin(circleAngle) * (oTargetType.moveDist * 200) +
            oTargetType.moveDist * 200;
          break;
        case "triangle0":
          if (moveState == 0) {
            moveIncX += delta * this.moveSpeed;
          } else if (moveState == 1) {
            moveIncY += delta * this.moveSpeed * 0.8;
            moveIncX -= (delta * this.moveSpeed) / 2;
          } else {
            moveIncY -= delta * this.moveSpeed * 0.8;
            moveIncX -= (delta * this.moveSpeed) / 2;
          }
          if (moveIncX >= (oTargetType.moveDist * moveDistSeg) / 2) {
            moveState = 1;
          } else if (moveIncY >= oTargetType.moveDist * moveDistSeg * 0.8) {
            moveState = 2;
          } else if (moveIncX <= (oTargetType.moveDist * -moveDistSeg) / 2) {
            moveState = 0;
          }
          break;
        case "triangle1":
          if (moveState == 0) {
            moveIncX -= (delta * this.moveSpeed) / 2;
            moveIncY += delta * this.moveSpeed * 0.8;
          } else if (moveState == 1) {
            moveIncX += delta * this.moveSpeed;
          } else {
            moveIncY -= delta * this.moveSpeed * 0.8;
            moveIncX -= (delta * this.moveSpeed) / 2;
          }
          if (moveIncX <= (oTargetType.moveDist * -moveDistSeg) / 2) {
            moveState = 1;
          } else if (moveIncX >= (oTargetType.moveDist * moveDistSeg) / 2) {
            moveState = 2;
          } else if (moveIncY <= 0) {
            moveState = 0;
          }
          break;
        case "square":
          if (moveState == 0) {
            moveIncX += delta * this.moveSpeed;
          } else if (moveState == 1) {
            moveIncY += delta * this.moveSpeed;
          } else if (moveState == 2) {
            moveIncX -= delta * this.moveSpeed;
          } else {
            moveIncY -= delta * this.moveSpeed;
          }
          if (
            moveState == 0 &&
            moveIncX >= (oTargetType.moveDist * moveDistSeg) / 2
          ) {
            moveState = 1;
          } else if (
            moveState == 1 &&
            moveIncY >= oTargetType.moveDist * moveDistSeg * 0.8
          ) {
            moveState = 2;
          } else if (
            moveState == 2 &&
            moveIncX <= (oTargetType.moveDist * -moveDistSeg) / 2
          ) {
            moveState = 3;
          } else if (moveState == 3 && moveIncY <= 0) {
            moveState = 0;
          }
          break;
      }
      if (this.isStartScreen) {
        this.initialTweenX = Math.sin((this.tempInc += delta / 2)) * 600;
      }
    };
    ArcheryView.prototype.zoomIn = function () {
      this.sceneTween = TweenLite.to(this, 1, {
        zoomScale: 1.3,
        ease: "Quad.easeInOut",
      });
      this.startTween.kill();
      this.initialTweenX = 0;
      this.isScrollingGround = false;
    };
    ArcheryView.prototype.setThinLine = function () {
      ctx.strokeStyle = "#8F8B7B";
      ctx.lineWidth = 5 * this.aTargData[this.targPosId].scale * this.zoomScale;
    };
    ArcheryView.prototype.render = function () {
      ctx.drawImage(
        this.oHorizonImgData.img,
        0,
        0,
        this.oHorizonImgData.img.width,
        this.oHorizonImgData.img.height,
        canvas.width / 2 -
          (this.oHorizonImgData.img.width / 2) * this.zoomScale,
        this.horizonY - this.oHorizonImgData.img.height * this.zoomScale,
        this.oHorizonImgData.img.width * this.zoomScale,
        this.oHorizonImgData.img.height * this.zoomScale
      );
      if (this.isScrollingGround) {
        for (var i = 0; i < this.scrollSegs; i++) {
          ctx.drawImage(
            this.oGroundImgData.img,
            0,
            (this.oGroundImgData.img.height / this.scrollSegs) * i,
            this.oGroundImgData.img.width,
            this.oGroundImgData.img.height / this.scrollSegs + 1,
            canvas.width / 2 -
              (this.oGroundImgData.img.width / 2 +
                this.initialTweenX * (i / this.scrollSegs)) *
                this.zoomScale,
            this.horizonY +
              (this.oGroundImgData.img.height / this.scrollSegs) * i,
            this.oGroundImgData.img.width * this.zoomScale,
            (this.oGroundImgData.img.height / this.scrollSegs) *
              this.zoomScale +
              1
          );
        }
      } else {
        ctx.drawImage(
          this.oGroundImgData.img,
          0,
          0,
          this.oGroundImgData.img.width,
          this.oGroundImgData.img.height,
          canvas.width / 2 -
            (this.oGroundImgData.img.width / 2) * this.zoomScale,
          this.horizonY,
          this.oGroundImgData.img.width * this.zoomScale,
          this.oGroundImgData.img.height * this.zoomScale
        );
      }
      for (var i = 0; i < aBirds.length; i++) {
        aBirds[i].update();
        aBirds[i].render(ctx);
        if (aBirds[i].removeMe) {
          aBirds.splice(i, 1);
          i -= 1;
        }
      }
      for (var i = 0; i < treeNum; i++) {
        var bX =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idL]].x;
        var bY =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idL]].y;
        var bWidth =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idL]]
            .width;
        var bHeight =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idL]]
            .height;
        var tempI = i + 2;
        var tempScale =
          ((tempI * tempI * tempI) / 900 + 0.25) * aTreeData[i].scaleL;
        ctx.drawImage(
          this.oTreesImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          canvas.width / 2 -
            (bWidth / 2) * tempScale * this.zoomScale -
            i * 50 * tempScale * this.zoomScale -
            ((this.initialTweenX * (tempScale - 0.2)) / 6.5) * this.zoomScale -
            150 * this.zoomScale,
          this.horizonY -
            bHeight * tempScale * this.zoomScale +
            ((i * 12 + 15) * tempScale + 10) * this.zoomScale,
          bWidth * tempScale * this.zoomScale,
          bHeight * tempScale * this.zoomScale
        );
        var bX =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idR]].x;
        var bY =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idR]].y;
        var bWidth =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idR]]
            .width;
        var bHeight =
          this.oTreesImgData.oData.oAtlasData[oImageIds[aTreeData[i].idR]]
            .height;
        var tempI = i + 2;
        var tempScale =
          ((tempI * tempI * tempI) / 900 + 0.25) * aTreeData[i].scaleR;
        ctx.drawImage(
          this.oTreesImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          canvas.width / 2 -
            (bWidth / 2) * tempScale * this.zoomScale +
            i * 50 * tempScale * this.zoomScale -
            ((this.initialTweenX * (tempScale - 0.2)) / 6.5) * this.zoomScale +
            150 * this.zoomScale,
          this.horizonY -
            bHeight * tempScale * this.zoomScale +
            ((i * 12 + 15) * tempScale + 10) * this.zoomScale,
          bWidth * tempScale * this.zoomScale,
          bHeight * tempScale * this.zoomScale
        );
      }
      var initialTweenStand =
        (this.initialTweenX * (this.aTargData[this.targPosId].scale - 0.1)) / 7;
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].height;
      this.targetCentreX = canvas.width / 2;
      this.targetCentreY =
        this.horizonY - this.aTargData[this.targPosId].y * this.zoomScale;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        canvas.width / 2 -
          ((bWidth / 2 + this.aDistMarker[this.targPosId]) *
            0.6 *
            this.aTargData[this.targPosId].scale +
            initialTweenStand) *
            this.zoomScale,
        this.targetCentreY +
          77 * this.aTargData[this.targPosId].scale * this.zoomScale,
        bWidth * this.aTargData[this.targPosId].scale * 0.6 * this.zoomScale,
        bHeight * this.aTargData[this.targPosId].scale * 0.6 * this.zoomScale
      );
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["distMarker" + this.targPosId]
        ].height;
      this.targetCentreX = canvas.width / 2;
      this.targetCentreY =
        this.horizonY - this.aTargData[this.targPosId].y * this.zoomScale;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        canvas.width / 2 -
          ((bWidth / 2 - this.aDistMarker[this.targPosId]) *
            0.6 *
            this.aTargData[this.targPosId].scale +
            initialTweenStand) *
            this.zoomScale,
        this.targetCentreY +
          77 * this.aTargData[this.targPosId].scale * this.zoomScale,
        bWidth * this.aTargData[this.targPosId].scale * 0.6 * this.zoomScale,
        bHeight * this.aTargData[this.targPosId].scale * 0.6 * this.zoomScale
      );
      ctx.strokeStyle = "#6D695C";
      ctx.lineWidth =
        10 * this.aTargData[this.targPosId].scale * this.zoomScale;
      ctx.lineCap = "round";
      switch (oTargetType.id) {
        case "horiz":
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.stroke();
          break;
        case "vert":
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          break;
        case "diag0":
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                moveDistSeg *
                  oTargetType.moveDist *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                moveDistSeg *
                  oTargetType.moveDist *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          break;
        case "diag1":
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                moveDistSeg *
                  oTargetType.moveDist *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                moveDistSeg *
                  oTargetType.moveDist *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          break;
        case "circle0":
        case "circle1":
          ctx.beginPath();
          ctx.arc(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY -
              oTargetType.moveDist *
                200 *
                this.aTargData[this.targPosId].scale *
                this.zoomScale,
            oTargetType.moveDist *
              200 *
              this.aTargData[this.targPosId].scale *
              this.zoomScale,
            0,
            2 * Math.PI,
            false
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.arc(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY -
              oTargetType.moveDist *
                200 *
                this.aTargData[this.targPosId].scale *
                this.zoomScale,
            oTargetType.moveDist *
              200 *
              this.aTargData[this.targPosId].scale *
              this.zoomScale,
            0,
            2 * Math.PI,
            false
          );
          ctx.stroke();
          break;
        case "triangle0":
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.stroke();
          break;
        case "triangle1":
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX - initialTweenStand * this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              0.8 *
                moveDistSeg *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.stroke();
          break;
        case "square":
          ctx.beginPath();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                0.8 *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                0.8 *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.stroke();
          this.setThinLine();
          ctx.moveTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand +
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                0.8 *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY -
              moveDistSeg *
                0.8 *
                oTargetType.moveDist *
                this.aTargData[this.targPosId].scale *
                this.zoomScale
          );
          ctx.lineTo(
            this.targetCentreX -
              (initialTweenStand -
                ((moveDistSeg * oTargetType.moveDist) / 2) *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            this.targetCentreY
          );
          ctx.stroke();
          break;
      }
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.standSmall].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.standSmall].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.standSmall].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.standSmall].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        canvas.width / 2 -
          ((bWidth / 2) * this.aTargData[this.targPosId].scale +
            initialTweenStand) *
            this.zoomScale,
        this.targetCentreY,
        bWidth * this.aTargData[this.targPosId].scale * this.zoomScale,
        bHeight * this.aTargData[this.targPosId].scale * this.zoomScale
      );
      ctx.save();
      ctx.translate(
        this.targetCentreX -
          initialTweenStand -
          moveIncX * this.zoomScale * this.aTargData[this.targPosId].scale,
        this.targetCentreY -
          moveIncY * this.zoomScale * this.aTargData[this.targPosId].scale
      );
      ctx.rotate(targRot);
      ctx.scale(
        this.zoomScale * this.aTargData[this.targPosId].scale,
        this.zoomScale * this.aTargData[this.targPosId].scale
      );
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["targetSmall" + this.targStyle]
        ].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["targetSmall" + this.targStyle]
        ].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["targetSmall" + this.targStyle]
        ].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["targetSmall" + this.targStyle]
        ].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        -(bWidth / 2),
        -(bHeight / 2),
        bWidth,
        bHeight
      );
      ctx.restore();
      if (aLevelData[levelNum].misc.id == "balloons" && gameMode == "levels") {
        for (var i = 0; i < aLevelBalloonData.length; i++) {
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloonSmall" + aLevelBalloonData[i].colour]
            ].x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloonSmall" + aLevelBalloonData[i].colour]
            ].y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloonSmall" + aLevelBalloonData[i].colour]
            ].width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloonSmall" + aLevelBalloonData[i].colour]
            ].height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            this.targetCentreX -
              (((bWidth / 2) * aLevelBalloonData[i].scale + moveIncX) *
                this.aTargData[this.targPosId].scale -
                (-Math.cos(targRot + aLevelBalloonData[i].rot) *
                  aLevelBalloonData[i].hyp +
                  3.5 * aLevelBalloonData[i].scale) *
                  this.smallScale *
                  this.aTargData[this.targPosId].scale +
                initialTweenStand) *
                this.zoomScale,
            this.targetCentreY -
              (((bHeight / 2) * aLevelBalloonData[i].scale + moveIncY) *
                this.aTargData[this.targPosId].scale -
                (-Math.sin(targRot + aLevelBalloonData[i].rot) *
                  aLevelBalloonData[i].hyp +
                  5 * aLevelBalloonData[i].scale) *
                  this.smallScale *
                  this.aTargData[this.targPosId].scale) *
                this.zoomScale,
            bWidth *
              this.aTargData[this.targPosId].scale *
              this.zoomScale *
              aLevelBalloonData[i].scale,
            bHeight *
              this.aTargData[this.targPosId].scale *
              this.zoomScale *
              aLevelBalloonData[i].scale
          );
        }
      } else if (gameMode == "challenge") {
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloonSmall" + (challengeLevelNum % 7)]
          ].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloonSmall" + (challengeLevelNum % 7)]
          ].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloonSmall" + (challengeLevelNum % 7)]
          ].width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloonSmall" + (challengeLevelNum % 7)]
          ].height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          this.targetCentreX -
            (((bWidth / 2) * oChallengeBalloon.scale + moveIncX) *
              this.aTargData[this.targPosId].scale -
              (-Math.cos(targRot + oChallengeBalloon.rot) *
                oChallengeBalloon.hyp +
                3.5 * oChallengeBalloon.scale) *
                this.smallScale *
                this.aTargData[this.targPosId].scale +
              initialTweenStand) *
              this.zoomScale,
          this.targetCentreY -
            (((bHeight / 2) * oChallengeBalloon.scale + moveIncY) *
              this.aTargData[this.targPosId].scale -
              (-Math.sin(targRot + oChallengeBalloon.rot) *
                oChallengeBalloon.hyp +
                5 * oChallengeBalloon.scale) *
                this.smallScale *
                this.aTargData[this.targPosId].scale) *
              this.zoomScale,
          bWidth *
            this.aTargData[this.targPosId].scale *
            this.zoomScale *
            oChallengeBalloon.scale,
          bHeight *
            this.aTargData[this.targPosId].scale *
            this.zoomScale *
            oChallengeBalloon.scale
        );
      }
      for (var i = 0; i < aArrowsFired.length; i++) {
        if (!aArrowsFired[i].hitTarget) {
          continue;
        }
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.flushArrowHit].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.flushArrowHit].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.flushArrowHit]
            .width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.flushArrowHit]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          this.targetCentreX -
            ((-Math.cos(targRot + aArrowsFired[i].rot) *
              aArrowsFired[i].hyp *
              aimTargetRadius +
              bWidth / 2 +
              moveIncX) *
              this.aTargData[this.targPosId].scale +
              initialTweenStand) *
              this.zoomScale,
          this.targetCentreY -
            (-Math.sin(targRot + aArrowsFired[i].rot) *
              aArrowsFired[i].hyp *
              aimTargetRadius +
              2.5 +
              moveIncY) *
              this.aTargData[this.targPosId].scale *
              this.zoomScale,
          bWidth * this.aTargData[this.targPosId].scale * this.zoomScale,
          bHeight * this.aTargData[this.targPosId].scale * this.zoomScale
        );
      }
      if (this.isStartScreen) {
        for (var i = 0; i < 5; i++) {
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["lensFlare" + (i % 3)]
            ].x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["lensFlare" + (i % 3)]
            ].y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["lensFlare" + (i % 3)]
            ].width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["lensFlare" + (i % 3)]
            ].height;
          var tempY =
            canvas.height / 5 + canvas.height / (i + i) / 1 - bHeight / 2;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 -
              canvas.width / (i + i) -
              bWidth / 2 -
              (this.initialTweenX * tempY) / 10000,
            tempY,
            bWidth,
            bHeight
          );
        }
      }
    };
    return ArcheryView;
  })();
  Elements.ArcheryView = ArcheryView;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var Bow = (function () {
    function Bow() {
      this.tartgDistX = 66;
      this.dragX = 0;
      this.dragY = 0;
      this.targAimX = 0;
      this.targAimY = 0;
      this.startAimX = 0;
      this.startAimY = 0;
      this.isHeld = false;
      this.maxMoveSpeed = 10;
      this.easeTargX = 0;
      this.easeTargY = 0;
      this.arrowFireX = 0;
      this.arrowFireY = 0;
      this.arrowScale = 1;
      this.aScopeOffset = new Array({
        x: 60.5,
      });
      this.bowId = 0;
      this.isAiming = true;
      this.oGameElementsImgData = assetLib.getData("gameElements");
      this.scale = 0.5;
      this.startX = Math.random() * 25;
      this.startY = Math.random() * 25;
      this.initialTweenX = 200;
      this.initialTweenY = 200;
      if (!firstRun) {
        this.introTween();
      }
    }
    Bow.prototype.introTween = function () {
      this.easeTweenX = TweenLite.to(this, 1, {
        initialTweenX: 0,
        ease: "Quad.easeOut",
      });
      this.easeTweenY = TweenLite.to(this, 1, {
        initialTweenY: 0,
        ease: "Back.easeOut",
      });
    };
    Bow.prototype.zoomIn = function () {
      this.bowTween = TweenLite.to(this, 0.5, {
        scale: 1,
        ease: "Quad.easeInOut",
      });
      if (this.easeTweenX) {
        this.easeTweenX.kill();
      }
      if (this.easeTweenY) {
        this.easeTweenY.kill();
      }
      this.initialTweenX = 0;
      this.initialTweenY = 0;
    };
    Bow.prototype.fireArrow = function () {
      TweenLite.to(this, 0.1, {
        arrowFireX: -100,
        arrowFireY: -100,
        arrowScale: 0.2,
        ease: "Quad.easeIn",
        onComplete: function () {
          initArrowFire();
        },
      });
      this.isAiming = false;
    };
    Bow.prototype.update = function () {
      if (this.isAiming) {
        this.easeTargX -=
          (this.easeTargX - (this.targAimX - this.startAimX)) * (delta * 5);
        this.easeTargY -=
          (this.easeTargY - (this.targAimY - this.startAimY)) * (delta * 5);
        this.dragX = Math.max(
          Math.min(this.dragX + this.easeTargX * 3 * delta, canvas.width * 0.4),
          -canvas.width * 0.4
        );
        this.dragY = Math.max(
          Math.min(
            this.dragY + this.easeTargY * 3 * delta,
            canvas.height * 0.4
          ),
          -canvas.height * 0.4
        );
        this.x =
          canvas.width / 2 -
          this.tartgDistX * this.scale +
          this.startX +
          this.dragX +
          this.initialTweenX;
        this.y =
          canvas.height / 2 + this.startY + this.dragY + this.initialTweenY;
      }
    };
    Bow.prototype.render = function () {
      var bX = this.oGameElementsImgData.oData.oAtlasData[oImageIds.scope0].x;
      var bY = this.oGameElementsImgData.oData.oAtlasData[oImageIds.scope0].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.scope0].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.scope0].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        this.x,
        this.y - (bHeight / 2) * this.scale,
        bWidth * this.scale,
        bHeight * this.scale
      );
      var bX = this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowTop].x;
      var bY = this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowTop].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowTop].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowTop].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        this.x + 174 * this.scale,
        this.y - (bHeight + 338) * this.scale,
        bWidth * this.scale,
        bHeight * this.scale
      );
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowMiddle].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowMiddle].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowMiddle].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowMiddle].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        this.x + 170 * this.scale,
        this.y - 340 * this.scale,
        bWidth * this.scale,
        bHeight * this.scale
      );
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowBottom].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowBottom].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowBottom].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowBottom].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        this.x + 171 * this.scale,
        this.y +
          (this.oGameElementsImgData.oData.oAtlasData[oImageIds.bowMiddle]
            .height -
            342) *
            this.scale,
        bWidth * this.scale,
        bHeight * this.scale
      );
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInBow].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInBow].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInBow].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInBow].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        this.x + (220 - this.initialTweenX / 2 + this.arrowFireX) * this.scale,
        this.y + (100 - this.initialTweenX / 2 + this.arrowFireY) * this.scale,
        bWidth * this.scale * this.arrowScale,
        bHeight * this.scale * this.arrowScale
      );
      ctx.strokeStyle = "rgba(50,50,50, 1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + 250 * this.scale, this.y - 1130 * this.scale);
      ctx.lineTo(
        this.x +
          (610 - (this.initialTweenX / 2 + this.arrowFireX) * 1) * this.scale,
        this.y +
          (475 - (this.initialTweenX / 2 + this.arrowFireY) * 1) * this.scale
      );
      ctx.lineTo(this.x + 250 * this.scale, this.y + 1423 * this.scale);
      ctx.stroke();
    };
    return Bow;
  })();
  Elements.Bow = Bow;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var Hud = (function () {
    function Hud() {
      this.hasWind = false;
      this.largeNumberSpace = 41;
      this.scoreX = 0;
      this.scoreY = 0;
      this.levelScoreEase = 0;
      this.windYPerc = 0.65;
      this.oGameElementsImgData = assetLib.getData("gameElements");
      this.oGreenNumbersImgData = assetLib.getData("numbersGreen");
      this.oBlueNumbersImgData = assetLib.getData("numbersBlue");
      this.oRedNumbersImgData = assetLib.getData("numbersRed");
      if (firstRun) {
        this.tutorial = new Elements.Tutorial(assetLib.getData("tutorial"));
      }
      this.resetWind();
    }
    Hud.prototype.easeScore = function () {
      TweenLite.to(this, 0.3, {
        levelScoreEase: Math.min(
          levelScore,
          aLevelData[levelNum].aScoreTargs[2]
        ),
        ease: "Quad.easeOut",
      });
    };
    Hud.prototype.resetWind = function () {
      var _this = this;
      if (oTargetType.windMax > 0) {
        this.hasWind = true;
        var temp = 0;
        if (Math.random() > 0.5) {
          temp = 180;
        }
        if (gameMode == "challenge") {
          this.windYPerc = 0.5;
        }
        this.windDir = (Math.random() * 60 - 30 + temp) * radian;
        this.windPower =
          Math.round(
            Math.random() * (oTargetType.windMax - oTargetType.windMin) * 10
          ) /
            10 +
          oTargetType.windMin;

        this.windX = canvas.width / 2;
        this.windY = -100;
        this.windScale = 1.5;
        TweenLite.to(this, 1, {
          windX: canvas.width / 2,
          windScale: 1,
          ease: "Bounce.easeOut",
          onComplete: function () {
            TweenLite.to(_this, 0.5, {
              delay: 0,
              windX: 58,
              windY: 0,
              windScale: 0.6,
              ease: "Quad.easeOut",
              onComplete: function () {},
            });
          },
        });
      } else {
        this.windDir = 0;
        this.windPower = 0;
      }
    };
    Hud.prototype.showScore = function (_score) {
      var _this = this;
      this.scoreX = 0;
      this.scoreY = 0.5;
      this.scoreNum = _score;
      levelScore += this.scoreNum;
      this.easeScore();
      switch (this.scoreNum) {
        case 10:
        case 9:
          playSound("cheer" + Math.floor(Math.random() * 5));
        case 8:
        case 7:
        case 6:
        case 5:
        case 4:
        case 3:
        case 2:
        case 1:
          playSound("score" + Math.floor(Math.random() * 5));
          addFirework(1, canvas.width * 0.2, canvas.height * 0.5, 3);
          addFirework(1, canvas.width * 0.8, canvas.height * 0.5, 3);
          break;
        case 0:
          playSound("crowdSad");
          break;
      }
      this.scoreTween = TweenLite.to(this, 0.5, {
        delay: 0.1,
        scoreX: 0.5,
        scoreY: 0.75,
        ease: "Back.easeOut",
        onComplete: function () {
          if (_this.scoreNum >= 10) {
            for (var i = 0; i < 5; i++) {
              addFirework(
                0,
                canvas.width / 2 - 150 + i * (300 / 4),
                canvas.height * 0.75 + Math.random() * 200 - 100,
                Math.random() * 1 + 2
              );
            }
          }
          _this.scoreTween = TweenLite.to(_this, 0.5, {
            delay: 0.5,
            scoreX: -0.2,
            scoreY: 0.5,
            ease: "Back.easeIn",
            onComplete: function () {
              initNextShot();
            },
          });
        },
      });
    };
    Hud.prototype.showBalloonScore = function (_didHit) {
      var _this = this;
      this.scoreX = 0;
      this.scoreY = 0.5;
      if (_didHit) {
        if (typeof _didHit == "string") {
          window.famobi_analytics.trackStats("target_hit", {
            color: _didHit,
            value: 1,
          });
        } else {
          window.famobi_analytics.trackStats("target_hit", { value: 1 });
        }

        this.scoreNum = 1;
        levelScore += this.scoreNum;
        window.famobi_analytics.trackEvent("EVENT_LIVESCORE", {
          liveScore: levelScore,
        });
        addFirework(1, canvas.width * 0.2, canvas.height * 0.5, 3);
        addFirework(1, canvas.width * 0.8, canvas.height * 0.5, 3);
        playSound("cheer" + Math.floor(Math.random() * 5));
        playSound("score" + Math.floor(Math.random() * 5));
      } else {
        this.scoreNum = 0;
        playSound("crowdSad");
        window.famobi_analytics.trackStats("target_missed");
      }
      this.easeScore();
      this.scoreTween = TweenLite.to(this, 0.5, {
        delay: 0.1,
        scoreX: 0.5,
        scoreY: 0.75,
        ease: "Back.easeOut",
        onComplete: function () {
          for (var i = 0; i < 5; i++) {
            addFirework(
              0,
              canvas.width / 2 - 150 + i * (300 / 4),
              canvas.height * 0.75 + Math.random() * 200 - 100,
              Math.random() * 1 + 2
            );
          }
          _this.scoreTween = TweenLite.to(_this, 0.5, {
            delay: 0.5,
            scoreX: -0.2,
            scoreY: 0.5,
            ease: "Back.easeIn",
            onComplete: function () {
              if (gameMode == "levels") {
                initNextShot();
              } else if (gameMode == "challenge") {
                if (
                  _this.scoreNum == 0 &&
                  !forcedModeProperties.override.endless_challenge
                ) {
                  initChallengeFail();
                } else {
                  initNextShot();
                }
              }
            },
          });
        },
      });
    };
    Hud.prototype.update = function () {};
    Hud.prototype.render = function () {
      let hideScore, hideArrows, hideWind;
      if (forcedModeProperties.override.hide_ui) {
        hideScore = forcedModeProperties.override.hide_ui.includes("score");
        hideArrows =
          forcedModeProperties.override.hide_ui.includes("arrow_indicator");
        hideWind =
          forcedModeProperties.override.hide_ui.includes("wind_indicator");
      }
      if (!hideScore) {
        if (gameMode == "levels") {
          var topOffsetY = 30;
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar2]
              .x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar2]
              .y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar2]
              .width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar2]
              .height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            52 - bWidth / 2,
            20,
            bWidth,
            bHeight
          );
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar1]
              .x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar1]
              .y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar1]
              .width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar1]
              .height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY +
              topOffsetY +
              (171 / aLevelData[levelNum].aScoreTargs[2]) *
                (aLevelData[levelNum].aScoreTargs[2] -
                  aLevelData[levelNum].aScoreTargs[1]),
            bWidth,
            (171 / aLevelData[levelNum].aScoreTargs[2]) *
              aLevelData[levelNum].aScoreTargs[1],
            52 - bWidth / 2,
            20 +
              topOffsetY +
              (171 / aLevelData[levelNum].aScoreTargs[2]) *
                (aLevelData[levelNum].aScoreTargs[2] -
                  aLevelData[levelNum].aScoreTargs[1]),
            bWidth,
            (171 / aLevelData[levelNum].aScoreTargs[2]) *
              aLevelData[levelNum].aScoreTargs[1]
          );
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar0]
              .x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar0]
              .y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar0]
              .width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressBar0]
              .height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY +
              topOffsetY +
              (171 / aLevelData[levelNum].aScoreTargs[2]) *
                (aLevelData[levelNum].aScoreTargs[2] -
                  aLevelData[levelNum].aScoreTargs[0]),
            bWidth,
            (171 / aLevelData[levelNum].aScoreTargs[2]) *
              aLevelData[levelNum].aScoreTargs[0],
            52 - bWidth / 2,
            20 +
              topOffsetY +
              (171 / aLevelData[levelNum].aScoreTargs[2]) *
                (aLevelData[levelNum].aScoreTargs[2] -
                  aLevelData[levelNum].aScoreTargs[0]),
            bWidth,
            (171 / aLevelData[levelNum].aScoreTargs[2]) *
              aLevelData[levelNum].aScoreTargs[0]
          );
          var tempId = 0;
          if (this.levelScoreEase >= aLevelData[levelNum].aScoreTargs[2]) {
            tempId = 3;
          } else if (
            this.levelScoreEase >= aLevelData[levelNum].aScoreTargs[1]
          ) {
            tempId = 2;
          } else if (
            this.levelScoreEase >= aLevelData[levelNum].aScoreTargs[0]
          ) {
            tempId = 1;
          }
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["progressMarker" + tempId]
            ].x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["progressMarker" + tempId]
            ].y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["progressMarker" + tempId]
            ].width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["progressMarker" + tempId]
            ].height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            53 - bWidth / 2,
            20 -
              bHeight / 2 +
              topOffsetY +
              168 -
              (168 / aLevelData[levelNum].aScoreTargs[2]) *
                this.levelScoreEase -
              3,
            bWidth,
            bHeight
          );
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            58,
            20 +
              topOffsetY +
              (171 / aLevelData[levelNum].aScoreTargs[2]) *
                (aLevelData[levelNum].aScoreTargs[2] -
                  aLevelData[levelNum].aScoreTargs[0]) -
              bHeight / 2,
            bWidth,
            bHeight
          );
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg1]
              .x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg1]
              .y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg1]
              .width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg1]
              .height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            3,
            20 +
              topOffsetY +
              (171 / aLevelData[levelNum].aScoreTargs[2]) *
                (aLevelData[levelNum].aScoreTargs[2] -
                  aLevelData[levelNum].aScoreTargs[1]) -
              bHeight / 2,
            bWidth,
            bHeight
          );
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.progressNumBg0]
              .height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            58,
            50 - bHeight / 2,
            bWidth,
            bHeight
          );
          var tempNum = aLevelData[levelNum].aScoreTargs[0].toString();
          var tempScale = 0.3;
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oGreenNumbersImgData.oData.spriteWidth) %
              this.oGreenNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oGreenNumbersImgData.img.width /
                    this.oGreenNumbersImgData.oData.spriteWidth)
              ) * this.oGreenNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oGreenNumbersImgData.img,
              imgX,
              imgY,
              this.oGreenNumbersImgData.oData.spriteWidth,
              this.oGreenNumbersImgData.oData.spriteHeight,
              82 +
                j * (this.largeNumberSpace * tempScale) -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
              20 +
                topOffsetY +
                (171 / aLevelData[levelNum].aScoreTargs[2]) *
                  (aLevelData[levelNum].aScoreTargs[2] -
                    aLevelData[levelNum].aScoreTargs[0]) -
                9,
              this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
              this.oGreenNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          var tempNum = aLevelData[levelNum].aScoreTargs[1].toString();
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oGreenNumbersImgData.oData.spriteWidth) %
              this.oGreenNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oGreenNumbersImgData.img.width /
                    this.oGreenNumbersImgData.oData.spriteWidth)
              ) * this.oGreenNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oGreenNumbersImgData.img,
              imgX,
              imgY,
              this.oGreenNumbersImgData.oData.spriteWidth,
              this.oGreenNumbersImgData.oData.spriteHeight,
              18 +
                j * (this.largeNumberSpace * tempScale) -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
              20 +
                topOffsetY +
                (171 / aLevelData[levelNum].aScoreTargs[2]) *
                  (aLevelData[levelNum].aScoreTargs[2] -
                    aLevelData[levelNum].aScoreTargs[1]) -
                9,
              this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
              this.oGreenNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          var tempNum = aLevelData[levelNum].aScoreTargs[2].toString();
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oGreenNumbersImgData.oData.spriteWidth) %
              this.oGreenNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oGreenNumbersImgData.img.width /
                    this.oGreenNumbersImgData.oData.spriteWidth)
              ) * this.oGreenNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oGreenNumbersImgData.img,
              imgX,
              imgY,
              this.oGreenNumbersImgData.oData.spriteWidth,
              this.oGreenNumbersImgData.oData.spriteHeight,
              82 +
                j * (this.largeNumberSpace * tempScale) -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
              41,
              this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
              this.oGreenNumbersImgData.oData.spriteHeight * tempScale
            );
          }
          if (levelScore > 0) {
            var tempNum = levelScore.toString();
            var tempScale = 0.6;
            for (var j = 0; j < tempNum.length; j++) {
              var id;
              id = parseFloat(tempNum.charAt(j));
              var imgX =
                (id * this.oGreenNumbersImgData.oData.spriteWidth) %
                this.oGreenNumbersImgData.img.width;
              var imgY =
                Math.floor(
                  id /
                    (this.oGreenNumbersImgData.img.width /
                      this.oGreenNumbersImgData.oData.spriteWidth)
                ) * this.oGreenNumbersImgData.oData.spriteHeight;
              ctx.drawImage(
                this.oGreenNumbersImgData.img,
                imgX,
                imgY,
                this.oGreenNumbersImgData.oData.spriteWidth,
                this.oGreenNumbersImgData.oData.spriteHeight,
                48 +
                  j * (this.largeNumberSpace * tempScale) -
                  (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
                225,
                this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
                this.oGreenNumbersImgData.oData.spriteHeight * tempScale
              );
            }
          }
        } else {
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreBgGame].x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreBgGame].y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreBgGame]
              .width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreBgGame]
              .height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            52 - bWidth / 2,
            50 - bHeight / 2,
            bWidth,
            bHeight
          );
          var tempNum = levelScore.toString();
          var tempScale = 1;
          if (tempNum.length > 2) {
            tempScale = 0.6;
          } else if (tempNum.length > 1) {
            tempScale = 0.8;
          }
          for (var j = 0; j < tempNum.length; j++) {
            var id;
            id = parseFloat(tempNum.charAt(j));
            var imgX =
              (id * this.oGreenNumbersImgData.oData.spriteWidth) %
              this.oGreenNumbersImgData.img.width;
            var imgY =
              Math.floor(
                id /
                  (this.oGreenNumbersImgData.img.width /
                    this.oGreenNumbersImgData.oData.spriteWidth)
              ) * this.oGreenNumbersImgData.oData.spriteHeight;
            ctx.drawImage(
              this.oGreenNumbersImgData.img,
              imgX,
              imgY,
              this.oGreenNumbersImgData.oData.spriteWidth,
              this.oGreenNumbersImgData.oData.spriteHeight,
              48 +
                j * (this.largeNumberSpace * tempScale) -
                (tempNum.length / 2) * (this.largeNumberSpace * tempScale),
              65,
              this.oGreenNumbersImgData.oData.spriteWidth * tempScale,
              this.oGreenNumbersImgData.oData.spriteHeight * tempScale
            );
          }
        }
      }

      if (gameMode == "levels" && !hideArrows) {
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.quiverBgGame].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.quiverBgGame].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.quiverBgGame]
            .width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.quiverBgGame]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          58 - bWidth / 2,
          canvas.height - bHeight / 2 - 60,
          bWidth,
          bHeight
        );
        var tempNum = (aLevelData[levelNum].quiver - quiver + 1).toString();
        var tempScale = 0.6;
        for (var j = 0; j < tempNum.length; j++) {
          var id;
          id = parseFloat(tempNum.charAt(j));
          var imgX =
            (id * this.oRedNumbersImgData.oData.spriteWidth) %
            this.oRedNumbersImgData.img.width;
          var imgY =
            Math.floor(
              id /
                (this.oRedNumbersImgData.img.width /
                  this.oRedNumbersImgData.oData.spriteWidth)
            ) * this.oRedNumbersImgData.oData.spriteHeight;
          ctx.drawImage(
            this.oRedNumbersImgData.img,
            imgX,
            imgY,
            this.oRedNumbersImgData.oData.spriteWidth,
            this.oRedNumbersImgData.oData.spriteHeight,
            11,
            canvas.height - 55.5,
            this.oRedNumbersImgData.oData.spriteWidth * tempScale,
            this.oRedNumbersImgData.oData.spriteHeight * tempScale
          );
        }
        var tempNum = aLevelData[levelNum].quiver.toString();
        var tempScale = 0.6;
        for (var j = 0; j < tempNum.length; j++) {
          var id;
          id = parseFloat(tempNum.charAt(j));
          var imgX =
            (id * this.oRedNumbersImgData.oData.spriteWidth) %
            this.oRedNumbersImgData.img.width;
          var imgY =
            Math.floor(
              id /
                (this.oRedNumbersImgData.img.width /
                  this.oRedNumbersImgData.oData.spriteWidth)
            ) * this.oRedNumbersImgData.oData.spriteHeight;
          ctx.drawImage(
            this.oRedNumbersImgData.img,
            imgX,
            imgY,
            this.oRedNumbersImgData.oData.spriteWidth,
            this.oRedNumbersImgData.oData.spriteHeight,
            62,
            canvas.height - 55.5,
            this.oRedNumbersImgData.oData.spriteWidth * tempScale,
            this.oRedNumbersImgData.oData.spriteHeight * tempScale
          );
        }
      }
      if (this.hasWind && !hideWind) {
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.windPanel].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.windPanel].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.windPanel].width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.windPanel]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          this.windX - (bWidth / 2) * this.windScale,
          canvas.height * this.windYPerc +
            this.windY -
            (bHeight / 2) * this.windScale,
          bWidth * this.windScale,
          bHeight * this.windScale
        );
        ctx.save();
        ctx.translate(
          this.windX - 4,
          canvas.height * this.windYPerc + this.windY + 4
        );
        ctx.rotate(this.windDir);
        ctx.scale(this.windScale, this.windScale);
        var tempId = 0;
        if (this.windDir / radian > 90) {
          tempId = 1;
        }
        var windArrowCol = Math.round(this.windPower * 1.66);
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["windArrow" + tempId + windArrowCol]
          ].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["windArrow" + tempId + windArrowCol]
          ].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["windArrow" + tempId + windArrowCol]
          ].width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["windArrow" + tempId + windArrowCol]
          ].height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          -bWidth / 2,
          -bHeight / 2,
          bWidth,
          bHeight
        );
        ctx.restore();
        var tempNum = Math.round(this.windPower * 10).toString();
        while (tempNum.length < 2) {
          tempNum = "0" + tempNum;
        }
        var tempScale = 1;
        for (var j = 0; j < tempNum.length; j++) {
          var id;
          id = parseFloat(tempNum.charAt(j));
          var imgX =
            (id * this.oBlueNumbersImgData.oData.spriteWidth) %
            this.oBlueNumbersImgData.img.width;
          var imgY =
            Math.floor(
              id /
                (this.oBlueNumbersImgData.img.width /
                  this.oBlueNumbersImgData.oData.spriteWidth)
            ) * this.oBlueNumbersImgData.oData.spriteHeight;
          ctx.drawImage(
            this.oBlueNumbersImgData.img,
            imgX,
            imgY,
            this.oBlueNumbersImgData.oData.spriteWidth,
            this.oBlueNumbersImgData.oData.spriteHeight,
            this.windX +
              j * (63 * tempScale * this.windScale) -
              65 * tempScale * this.windScale,
            canvas.height * this.windYPerc + this.windY + 34 * this.windScale,
            this.oBlueNumbersImgData.oData.spriteWidth *
              tempScale *
              this.windScale,
            this.oBlueNumbersImgData.oData.spriteHeight *
              tempScale *
              this.windScale
          );
        }
      }
      if (canvas.width * this.scoreX > 0) {
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreDiagBg].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreDiagBg].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreDiagBg]
            .width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.scoreDiagBg]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          0,
          canvas.height * this.scoreY - (bHeight / 2) * (this.scoreX * 2) + 5,
          canvas.width,
          bHeight * (this.scoreX * 2)
        );
        if (
          aLevelData[levelNum].misc.id == "balloons" &&
          gameMode == "levels"
        ) {
          if (this.scoreNum == 1) {
            var bX =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.balloonScore]
                .x;
            var bY =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.balloonScore]
                .y;
            var bWidth =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.balloonScore]
                .width;
            var bHeight =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.balloonScore]
                .height;
            ctx.drawImage(
              this.oGameElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width * this.scoreX - bWidth / 2,
              canvas.height * this.scoreY - bHeight / 2,
              bWidth,
              bHeight
            );
          } else {
            var bX =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].x;
            var bY =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].y;
            var bWidth =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].width;
            var bHeight =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].height;
            ctx.drawImage(
              this.oGameElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width * this.scoreX - bWidth / 2,
              canvas.height * this.scoreY - bHeight / 2,
              bWidth,
              bHeight
            );
          }
        } else if (gameMode == "levels") {
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["score" + this.scoreNum]
            ].x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["score" + this.scoreNum]
            ].y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["score" + this.scoreNum]
            ].width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["score" + this.scoreNum]
            ].height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width * this.scoreX - bWidth / 2,
            canvas.height * this.scoreY - bHeight / 2,
            bWidth,
            bHeight
          );
        } else if (gameMode == "challenge") {
          if (this.scoreNum == 1) {
            var bX =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.thumbsUp].x;
            var bY =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.thumbsUp].y;
            var bWidth =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.thumbsUp]
                .width;
            var bHeight =
              this.oGameElementsImgData.oData.oAtlasData[oImageIds.thumbsUp]
                .height;
            ctx.drawImage(
              this.oGameElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width * this.scoreX - bWidth / 2,
              canvas.height * this.scoreY - bHeight / 2,
              bWidth,
              bHeight
            );
          } else {
            var bX =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].x;
            var bY =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].y;
            var bWidth =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].width;
            var bHeight =
              this.oGameElementsImgData.oData.oAtlasData[
                oImageIds["score" + this.scoreNum]
              ].height;
            ctx.drawImage(
              this.oGameElementsImgData.img,
              bX,
              bY,
              bWidth,
              bHeight,
              canvas.width * this.scoreX - bWidth / 2,
              canvas.height * this.scoreY - bHeight / 2,
              bWidth,
              bHeight
            );
          }
        }
      }
      if (firstRun) {
        this.tutorial.update();
        this.tutorial.render();
      }
    };
    return Hud;
  })();
  Elements.Hud = Hud;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var ScrollGround = (function () {
    function ScrollGround() {
      var _this = this;
      this.segNum = 200;
      this.aRowData = new Array();
      this.horizon = 0;
      this.scrollY = 0;
      this.scrollX = 0;
      this.targScrollSpeed = 0;
      this.scrollSpeed = 0;
      this.scrollInc = 0;
      this.lineRate = 1;
      this.goalScale = 0.3;
      this.isFlying = true;
      this.jiggleInc = 0;
      this.jiggleRot = 0;
      this.jiggleDamp = 1;
      this.targetCentreY = 140;
      this.groundSkew = 0;
      this.arrowPassedTarget = false;
      this.arrowWillHit = false;
      this.scaleMultiplier = 1.82962962962963;
      this.oScrollGroundImgData = assetLib.getData("scrollGround" + sceneType);
      this.oGameElementsImgData = assetLib.getData("gameElements");
      let forceSlowMotion,
        forceOff = false;
      switch (forcedModeProperties.override.slowmotion_mode) {
        case "always":
          forceSlowMotion = true;
          break;
        case "off":
          forceOff = true;
          break;
        default:
          break;
      }
      if (
        !forceOff &&
        (forceSlowMotion ||
          (gameMode == "levels" && quiver == 1) ||
          (gameMode == "challenge" && (levelScore + 1) % 5 == 0))
      ) {
        this.scrollInc = 150;
        this.specialArrowAlpha = 1;
        this.flightTime = 0.7 + 0.35 + archeryView.targPosId * 0.1;
        TweenLite.to(this, this.flightTime, {
          scrollInc: 1000,
          specialArrowAlpha: 0,
          ease: "Power4.easeIn",
        });
      } else {
        this.specialArrowAlpha = 0;
        this.scrollInc = 1000;
        this.flightTime = 0.35 + archeryView.targPosId * 0.1;
      }
      this.shotAngle = 5;
      this.hitBalloon = false;
      this.targetScale = 0.17;
      this.targetX = -500 * this.flightTime;
      this.targetY = -this.flightTime * 800;
      this.arrowX = canvas.width / 3;
      this.arrowY = canvas.height - 150;
      this.arrowScale = 3;
      this.arrowRot = -18 * radian;
      var endTargetScale = 1;
      this.localMoveIncX = moveIncX * this.scaleMultiplier;
      this.localMoveIncY = moveIncY * this.scaleMultiplier;
      this.localMoveDistSeg = moveDistSeg * this.scaleMultiplier;
      var tempHyp = Math.sqrt(hitPosX * hitPosX + hitPosY * hitPosY);
      var tempLandX = 0 + endTargetScale * hitTargetRadius * hitPosX;
      var tempLandY =
        this.targetCentreY + endTargetScale * hitTargetRadius * hitPosY;
      TweenLite.to(this, this.flightTime, {
        targetScale: endTargetScale,
        targetY: this.targetCentreY,
        targetX: 0,
        ease: "Quad.easeIn",
        onComplete: function () {
          _this.arrowPassedTarget = true;
          _this.isFlying = false;
        },
      });
      setTimeout(function () {
        playSound("landTarget" + Math.floor(Math.random() * 3));
      }, (this.flightTime - 0.35) * 1000);
      TweenLite.to(this, this.flightTime, {
        arrowX: tempLandX,
        arrowY: tempLandY,
        arrowScale: 0.4,
        ease: "Quad.easeInOut",
        onComplete: function () {
          if (
            aLevelData[levelNum].misc.id == "balloons" &&
            gameMode == "levels"
          ) {
            for (var i = 0; i < aLevelBalloonData.length; i++) {
              var tempX =
                -Math.cos(targRot + aLevelBalloonData[i].rot) *
                aLevelBalloonData[i].hyp;
              var tempY =
                -Math.sin(targRot + aLevelBalloonData[i].rot) *
                aLevelBalloonData[i].hyp;
              var a = _this.arrowX - tempX;
              var b = _this.arrowY - _this.targetCentreY - tempY;
              if (
                Math.sqrt(a * a + b * b) <
                28.3 * aLevelBalloonData[i].scale
              ) {
                addPop(
                  aLevelBalloonData[i].colour,
                  canvas.width / 2 + _this.targetX + tempX * _this.targetScale,
                  _this.targetY + tempY * _this.targetScale,
                  1 * aLevelBalloonData[i].scale
                );
                addFirework(
                  0,
                  canvas.width / 2 + _this.targetX + tempX * _this.targetScale,
                  _this.targetY + tempY * _this.targetScale,
                  0.6 * aLevelBalloonData[i].scale
                );
                switch (aLevelBalloonData[i].colour) {
                  case 0:
                    _this.hitBalloon = "red";
                    break;
                  case 1:
                    _this.hitBalloon = "purple";
                    break;
                  case 2:
                    _this.hitBalloon = "green";
                    break;
                  case 3:
                    _this.hitBalloon = "pink";
                    break;
                  case 4:
                    _this.hitBalloon = "yellow";
                    break;
                  case 5:
                    _this.hitBalloon = "blue";
                    break;
                  case 6:
                    _this.hitBalloon = "orange";
                    break;
                  default:
                    console.log("no color found!");
                    break;
                }
                aLevelBalloonData.splice(i, 1);
                playSound("pop" + Math.floor(Math.random() * 2));
              }
            }
            hud.showBalloonScore(_this.hitBalloon);
            TweenLite.to(_this, 1, {
              jiggleDamp: 0,
              ease: "Quad.easeOut",
              onComplete: function () {},
            });
          } else if (gameMode == "challenge") {
            var tempX =
              -Math.cos(targRot + oChallengeBalloon.rot) *
              oChallengeBalloon.hyp;
            var tempY =
              -Math.sin(targRot + oChallengeBalloon.rot) *
              oChallengeBalloon.hyp;
            var a = _this.arrowX - tempX;
            var b = _this.arrowY - _this.targetCentreY - tempY;
            if (Math.sqrt(a * a + b * b) < 28.3 * oChallengeBalloon.scale) {
              addPop(
                challengeLevelNum % 7,
                canvas.width / 2 + _this.targetX + tempX * _this.targetScale,
                _this.targetY + tempY * _this.targetScale,
                1 * oChallengeBalloon.scale
              );
              addFirework(
                0,
                canvas.width / 2 + _this.targetX + tempX * _this.targetScale,
                _this.targetY + tempY * _this.targetScale,
                0.6 * oChallengeBalloon.scale
              );
              _this.hitBalloon = true;
              playSound("pop" + Math.floor(Math.random() * 2));
            }
            hud.showBalloonScore(_this.hitBalloon);
            TweenLite.to(_this, 1, {
              jiggleDamp: 0,
              ease: "Quad.easeOut",
              onComplete: function () {},
            });
          } else {
            _this.arrowHitTarget();
          }
        },
      });
      if (
        tempHyp < 1 ||
        tempLandY >
          this.targetCentreY + archeryView.groundToHit * endTargetScale
      ) {
        this.arrowWillHit = true;
      } else {
        this.arrowWillHit = false;
      }
      for (var i = 0; i < this.segNum; i++) {
        this.aRowData.push({
          y: 0,
          scale: 0,
        });
      }
    }
    ScrollGround.prototype.arrowHitTarget = function () {
      var a = this.arrowX;
      var b = this.arrowY - 140;
      var tempScore = Math.max(
        10 - Math.floor(Math.sqrt(a * a + b * b) / 12),
        0
      );
      if (gameMode == "levels") {
        if (
          aLevelData[levelNum].targType > 0 &&
          aLevelData[levelNum].targType != 3
        ) {
          var a;
          var b;
          if (aLevelData[levelNum].targType < 3) {
            var tempX = -Math.cos(targRot + 180 * radian) * 100;
            var tempY = -Math.sin(targRot + 180 * radian) * 100;
            a = this.arrowX - tempX;
            b = this.arrowY - this.targetCentreY - tempY;
            if (Math.sqrt(a * a + b * b) < 83.18) {
              tempScore = 0;
            }
            if (aLevelData[levelNum].targType == 2) {
              var tempX = -Math.cos(targRot + 0 * radian) * 100;
              var tempY = -Math.sin(targRot + 0 * radian) * 100;
              a = this.arrowX - tempX;
              b = this.arrowY - this.targetCentreY - tempY;
              if (Math.sqrt(a * a + b * b) < 83.18) {
                tempScore = 0;
              }
            }
          } else if (aLevelData[levelNum].targType > 3) {
            var tempX = -Math.cos(targRot + 0 * radian) * 63.25;
            var tempY = -Math.sin(targRot + 0 * radian) * 63.25;
            a = this.arrowX - tempX;
            b = this.arrowY - this.targetCentreY - tempY;
            if (Math.sqrt(a * a + b * b) < 36.738) {
              tempScore = 0;
            }
            if (aLevelData[levelNum].targType > 4) {
              var tempX = -Math.cos(targRot + 120 * radian) * 63.25;
              var tempY = -Math.sin(targRot + 120 * radian) * 63.25;
              a = this.arrowX - tempX;
              b = this.arrowY - this.targetCentreY - tempY;
              if (Math.sqrt(a * a + b * b) < 36.738) {
                tempScore = 0;
              }
            }
            if (aLevelData[levelNum].targType > 5) {
              var tempX = -Math.cos(targRot + 240 * radian) * 63.25;
              var tempY = -Math.sin(targRot + 240 * radian) * 63.25;
              a = this.arrowX - tempX;
              b = this.arrowY - this.targetCentreY - tempY;
              if (Math.sqrt(a * a + b * b) < 36.738) {
                tempScore = 0;
              }
            }
          }
        }
      }
      TweenLite.to(this, 1, {
        jiggleDamp: 0,
        ease: "Quad.easeOut",
        onComplete: function () {},
      });
      window.famobi_analytics.trackStats("target_hit", { value: tempScore });
      hud.showScore(tempScore);
    };
    ScrollGround.prototype.setThinLine = function () {
      ctx.strokeStyle = "#8F8B7B";
      ctx.lineWidth = 7.5 * this.targetScale;
    };
    ScrollGround.prototype.update = function () {
      if (this.isFlying) {
        this.scrollY -= this.scrollInc * delta;
        if (this.scrollY < 0) {
          this.scrollY += 500;
        }
        this.targScrollSpeed = 0;
      } else if (this.arrowWillHit) {
        this.jiggleInc += delta;
        this.jiggleRot = (Math.sin(this.jiggleInc * 20) / 10) * this.jiggleDamp;
      }
      this.groundSkew = Math.max(canvas.width / canvas.height / -4, -0.8);
    };
    ScrollGround.prototype.render = function () {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var segHeightBefore = 500 / this.segNum;
      var rowHeight = 0;
      var temp = 1500;
      var grassWidth = 1200;
      for (var i = 0; i < this.segNum; i++) {
        this.tempInc = i;
        this.easeInc =
          -1 *
            (Math.sqrt(1 - (this.tempInc /= this.segNum) * this.tempInc) - 1) +
          0;
        this.nextRow = i + 1;
        this.segHeightAfter =
          -1 *
            (Math.sqrt(1 - (this.nextRow /= this.segNum) * this.nextRow) - 1) +
          0 -
          this.easeInc;
        var fitHeight = canvas.height * 1.4;
        this.aRowData[i].y = this.horizon + this.easeInc * fitHeight;
        if (rowHeight == 0) {
          this.rowId = i;
        }
        rowHeight += this.segHeightAfter * fitHeight;
        if (rowHeight > this.lineRate) {
          var a =
            ((i / this.segNum) * (temp / this.shotAngle) + this.scrollX) % 2000;
          if (a < 0) {
            a += 2000;
          }
          ctx.drawImage(
            this.oScrollGroundImgData.img,
            a,
            this.rowId * segHeightBefore + this.scrollY,
            2000 - (i / this.segNum) * temp,
            segHeightBefore,
            (canvas.width - grassWidth) / 2,
            this.aRowData[this.rowId].y,
            grassWidth,
            rowHeight + 1
          );
          rowHeight = 0;
        }
      }
      var a = (this.scrollX / 3) % temp;
      if (a < 0) {
        a += temp;
      }
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder1].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder1].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder1].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder1]
          .height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        canvas.width / 2 - 600,
        0,
        bWidth,
        canvas.height
      );
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder0].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder0].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder0].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.fadeBorder0]
          .height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        canvas.width / 2 + 600 - bWidth,
        0,
        bWidth,
        canvas.height
      );
      var renderArrowOnTop = true;
      ctx.strokeStyle = "#6D695C";
      ctx.lineWidth = 15 * this.targetScale;
      ctx.lineCap = "round";
      switch (oTargetType.id) {
        case "horiz":
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY
          );
          ctx.stroke();
          break;
        case "vert":
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 + this.targetX,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 + this.targetX,
            this.targetY -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 + this.targetX,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 + this.targetX,
            this.targetY -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          break;
        case "diag0":
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          break;
        case "diag1":
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              (this.localMoveDistSeg * oTargetType.moveDist +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              (this.localMoveDistSeg * oTargetType.moveDist +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          break;
        case "circle0":
        case "circle1":
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY +
              this.localMoveIncY * this.targetScale -
              this.scaleMultiplier *
                oTargetType.moveDist *
                200 *
                this.targetScale,
            this.scaleMultiplier *
              oTargetType.moveDist *
              200 *
              this.targetScale,
            0,
            2 * Math.PI,
            false
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY +
              this.localMoveIncY * this.targetScale -
              this.scaleMultiplier *
                oTargetType.moveDist *
                200 *
                this.targetScale,
            this.scaleMultiplier *
              oTargetType.moveDist *
              200 *
              this.targetScale,
            0,
            2 * Math.PI,
            false
          );
          ctx.stroke();
          break;
        case "triangle0":
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.stroke();
          break;
        case "triangle1":
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              this.localMoveIncX * this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.stroke();
          break;
        case "square":
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.stroke();
          this.setThinLine();
          ctx.beginPath();
          ctx.moveTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX +
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 +
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY -
              (0.8 * this.localMoveDistSeg * oTargetType.moveDist -
                this.localMoveIncY) *
                this.targetScale
          );
          ctx.lineTo(
            canvas.width / 2 +
              this.targetX -
              ((this.localMoveDistSeg * oTargetType.moveDist) / 2 -
                this.localMoveIncX) *
                this.targetScale,
            this.targetY + this.localMoveIncY * this.targetScale
          );
          ctx.stroke();
          break;
      }
      var bX = this.oGameElementsImgData.oData.oAtlasData[oImageIds.stand].x;
      var bY = this.oGameElementsImgData.oData.oAtlasData[oImageIds.stand].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.stand].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[oImageIds.stand].height;
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        canvas.width / 2 +
          this.targetX -
          (bWidth / 2 - this.localMoveIncX) * this.targetScale,
        this.targetY + this.localMoveIncY * this.targetScale,
        bWidth * this.targetScale,
        bHeight * this.targetScale
      );
      var bX =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["target" + archeryView.targStyle]
        ].x;
      var bY =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["target" + archeryView.targStyle]
        ].y;
      var bWidth =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["target" + archeryView.targStyle]
        ].width;
      var bHeight =
        this.oGameElementsImgData.oData.oAtlasData[
          oImageIds["target" + archeryView.targStyle]
        ].height;
      ctx.save();
      ctx.translate(canvas.width / 2 + this.targetX, this.targetY);
      ctx.rotate(targRot);
      ctx.scale(this.targetScale, this.targetScale);
      ctx.drawImage(
        this.oGameElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        -(bWidth / 2),
        -(bHeight / 2),
        bWidth,
        bHeight
      );
      ctx.restore();
      if (aLevelData[levelNum].misc.id == "balloons" && gameMode == "levels") {
        for (var i = 0; i < aLevelBalloonData.length; i++) {
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloon" + aLevelBalloonData[i].colour]
            ].x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloon" + aLevelBalloonData[i].colour]
            ].y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloon" + aLevelBalloonData[i].colour]
            ].width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds["balloon" + aLevelBalloonData[i].colour]
            ].height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            canvas.width / 2 +
              this.targetX -
              (bWidth / 2) * aLevelBalloonData[i].scale * this.targetScale +
              (-Math.cos(targRot + aLevelBalloonData[i].rot) *
                aLevelBalloonData[i].hyp +
                2.5 * aLevelBalloonData[i].scale) *
                this.targetScale,
            this.targetY -
              (bHeight / 2) * aLevelBalloonData[i].scale * this.targetScale +
              (-Math.sin(targRot + aLevelBalloonData[i].rot) *
                aLevelBalloonData[i].hyp +
                7 * aLevelBalloonData[i].scale) *
                this.targetScale,
            bWidth * this.targetScale * aLevelBalloonData[i].scale,
            bWidth * this.targetScale * aLevelBalloonData[i].scale
          );
        }
      } else if (gameMode == "challenge" && !this.hitBalloon) {
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloon" + (challengeLevelNum % 7)]
          ].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloon" + (challengeLevelNum % 7)]
          ].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloon" + (challengeLevelNum % 7)]
          ].width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[
            oImageIds["balloon" + (challengeLevelNum % 7)]
          ].height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          canvas.width / 2 +
            this.targetX -
            (bWidth / 2) * oChallengeBalloon.scale * this.targetScale +
            (-Math.cos(targRot + oChallengeBalloon.rot) *
              oChallengeBalloon.hyp +
              2.5 * oChallengeBalloon.scale) *
              this.targetScale,
          this.targetY -
            (bHeight / 2) * oChallengeBalloon.scale * this.targetScale +
            (-Math.sin(targRot + oChallengeBalloon.rot) *
              oChallengeBalloon.hyp +
              7 * oChallengeBalloon.scale) *
              this.targetScale,
          bWidth * this.targetScale * oChallengeBalloon.scale,
          bWidth * this.targetScale * oChallengeBalloon.scale
        );
      }
      if (renderArrowOnTop) {
        this.renderArrow();
      }
      for (var i = 0; i < aArrowsFired.length; i++) {
        if (!aArrowsFired[i].hitTarget) {
          continue;
        }
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow]
            .width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          canvas.width / 2 +
            this.targetX +
            (Math.cos(targRot + aArrowsFired[i].rot) *
              aArrowsFired[i].hyp *
              hitTargetRadius -
              bWidth / 2) *
              this.targetScale,
          this.targetY +
            (Math.sin(targRot + aArrowsFired[i].rot) *
              aArrowsFired[i].hyp *
              hitTargetRadius -
              4) *
              this.targetScale,
          bWidth * this.targetScale,
          bHeight * this.targetScale
        );
        ctx.save();
        ctx.translate(
          canvas.width / 2 +
            this.targetX +
            Math.cos(targRot + aArrowsFired[i].rot) *
              aArrowsFired[i].hyp *
              hitTargetRadius *
              this.targetScale,
          this.targetY +
            Math.sin(targRot + aArrowsFired[i].rot) *
              aArrowsFired[i].hyp *
              hitTargetRadius *
              this.targetScale
        );
        ctx.rotate(
          this.arrowRot +
            this.groundSkew +
            Math.sin((i + 1 + levelNum) * 1000) / 6
        );
        ctx.scale(0.4, 0.4);
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight]
            .width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          -bWidth / 2,
          1,
          bWidth,
          bHeight
        );
        ctx.restore();
      }
    };
    ScrollGround.prototype.renderArrow = function () {
      if (!this.isFlying && this.arrowWillHit) {
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow]
            .width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowShadow]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          canvas.width / 2 + this.arrowX - (bWidth / 2) * this.targetScale,
          this.arrowY - 4 * this.targetScale,
          bWidth * this.targetScale,
          bHeight * this.targetScale
        );
      }
      if (!this.isFlying && !this.arrowWillHit) {
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.missCross].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.missCross].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.missCross].width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.missCross]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          canvas.width / 2 + this.arrowX - bWidth / 2,
          this.arrowY - bHeight / 2,
          bWidth,
          bHeight
        );
      } else {
        ctx.save();
        ctx.translate(canvas.width / 2 + this.arrowX, this.arrowY);
        ctx.rotate(this.arrowRot + this.jiggleRot + this.groundSkew);
        ctx.scale(this.arrowScale, this.arrowScale);
        var bX =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight].x;
        var bY =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight].y;
        var bWidth =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight]
            .width;
        var bHeight =
          this.oGameElementsImgData.oData.oAtlasData[oImageIds.arrowInFlight]
            .height;
        ctx.drawImage(
          this.oGameElementsImgData.img,
          bX,
          bY,
          bWidth,
          bHeight,
          -bWidth / 2,
          0,
          bWidth,
          bHeight
        );
        if (this.specialArrowAlpha > 0) {
          ctx.globalAlpha =
            this.specialArrowAlpha -
            (Math.random() * this.specialArrowAlpha) / 5;
          var bX =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds.arrowInFlightSpecial
            ].x;
          var bY =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds.arrowInFlightSpecial
            ].y;
          var bWidth =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds.arrowInFlightSpecial
            ].width;
          var bHeight =
            this.oGameElementsImgData.oData.oAtlasData[
              oImageIds.arrowInFlightSpecial
            ].height;
          ctx.drawImage(
            this.oGameElementsImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            -bWidth / 2,
            0,
            bWidth,
            bHeight
          );
        }
      }
      ctx.restore();
    };
    return ScrollGround;
  })();
  Elements.ScrollGround = ScrollGround;
})(Elements || (Elements = {}));
var Utils;
(function (Utils) {
  var TextDisplay = (function () {
    function TextDisplay() {
      this.oTextData = {};
      this.inc = 0;
      this.createTextObjects();
    }
    TextDisplay.prototype.createTextObjects = function () {
      var cnt = 0;
      for (var i in assetLib.textData.langText.text[curLang]) {
        this.oTextData[i] = {};
        this.oTextData[i].aLineData = this.getCharData(
          assetLib.textData.langText.text[curLang][i]["@text"],
          assetLib.textData.langText.text[curLang][i]["@fontId"]
        );
        this.oTextData[i].aLineWidths = this.getLineWidths(
          this.oTextData[i].aLineData
        );
        this.oTextData[i].blockWidth = this.getBlockWidth(
          this.oTextData[i].aLineData
        );
        this.oTextData[i].blockHeight = this.getBlockHeight(
          this.oTextData[i].aLineData,
          assetLib.textData.langText.text[curLang][i]["@fontId"]
        );
        this.oTextData[i].lineHeight = parseInt(
          assetLib.textData[
            "fontData" + assetLib.textData.langText.text[curLang][i]["@fontId"]
          ].text.common["@lineHeight"]
        );
        this.oTextData[i].oFontImgData = assetLib.getData(
          "font" + assetLib.textData.langText.text[curLang][i]["@fontId"]
        );
      }
    };
    TextDisplay.prototype.getLineWidths = function (_aCharData) {
      var lineLength;
      var aLineWidths = new Array();
      for (var i = 0; i < _aCharData.length; i++) {
        lineLength = 0;
        for (var j = 0; j < _aCharData[i].length; j++) {
          lineLength += parseInt(_aCharData[i][j]["@xadvance"]);
          if (j == 0) {
            lineLength -= parseInt(_aCharData[i][j]["@xoffset"]);
          } else if (j == _aCharData[i].length - 1) {
            lineLength += parseInt(_aCharData[i][j]["@xoffset"]);
          }
        }
        aLineWidths.push(lineLength);
      }
      return aLineWidths;
    };
    TextDisplay.prototype.getBlockWidth = function (_aCharData) {
      var lineLength;
      var longestLineLength = 0;
      for (var i = 0; i < _aCharData.length; i++) {
        lineLength = 0;
        for (var j = 0; j < _aCharData[i].length; j++) {
          lineLength += parseInt(_aCharData[i][j]["@xadvance"]);
          if (j == 0) {
            lineLength -= parseInt(_aCharData[i][j]["@xoffset"]);
          } else if (j == _aCharData[i].length - 1) {
            lineLength += parseInt(_aCharData[i][j]["@xoffset"]);
          }
        }
        if (lineLength > longestLineLength) {
          longestLineLength = lineLength;
        }
      }
      return longestLineLength;
    };
    TextDisplay.prototype.getBlockHeight = function (_aCharData, _fontId) {
      return (
        _aCharData.length *
        parseInt(
          assetLib.textData["fontData" + _fontId].text.common["@lineHeight"]
        )
      );
    };
    TextDisplay.prototype.getCharData = function (_aLines, _fontId) {
      var aCharData = new Array();
      for (var k = 0; k < _aLines.length; k++) {
        aCharData[k] = new Array();
        for (var i = 0; i < _aLines[k].length; i++) {
          for (
            var j = 0;
            j < assetLib.textData["fontData" + _fontId].text.chars.char.length;
            j++
          ) {
            if (
              _aLines[k][i].charCodeAt() ==
              assetLib.textData["fontData" + _fontId].text.chars.char[j]["@id"]
            ) {
              aCharData[k].push(
                assetLib.textData["fontData" + _fontId].text.chars.char[j]
              );
            }
          }
        }
      }
      return aCharData;
    };
    TextDisplay.prototype.renderText = function (_oTextDisplayData) {
      var aLinesToRender = this.oTextData[_oTextDisplayData.text].aLineData;
      var oFontImgData = this.oTextData[_oTextDisplayData.text].oFontImgData;
      var shiftX;
      var offsetX = 0;
      var offsetY = 0;
      var lineOffsetY = 0;
      var manualScale = 1;
      var animY = 0;
      if (_oTextDisplayData.lineOffsetY) {
        lineOffsetY = _oTextDisplayData.lineOffsetY;
      }
      if (_oTextDisplayData.scale) {
        manualScale = _oTextDisplayData.scale;
      }
      var textScale = 1 * manualScale;
      if (
        _oTextDisplayData.maxWidth &&
        this.oTextData[_oTextDisplayData.text].blockWidth * manualScale >
          _oTextDisplayData.maxWidth
      ) {
        textScale =
          _oTextDisplayData.maxWidth /
          this.oTextData[_oTextDisplayData.text].blockWidth;
      }
      if (_oTextDisplayData.anim) {
        this.inc += delta * 7;
      }
      for (var i = 0; i < aLinesToRender.length; i++) {
        shiftX = 0;
        if (_oTextDisplayData.alignX == "centre") {
          offsetX = this.oTextData[_oTextDisplayData.text].aLineWidths[i] / 2;
        }
        if (_oTextDisplayData.alignY == "centre") {
          offsetY =
            this.oTextData[_oTextDisplayData.text].blockHeight / 2 +
            (lineOffsetY * (aLinesToRender.length - 1)) / 2;
        }
        for (var j = 0; j < aLinesToRender[i].length; j++) {
          var bX = aLinesToRender[i][j]["@x"];
          var bY = aLinesToRender[i][j]["@y"];
          var bWidth = aLinesToRender[i][j]["@width"];
          var bHeight = aLinesToRender[i][j]["@height"];
          if (_oTextDisplayData.anim) {
            animY = Math.sin(this.inc + j / 2) * ((bHeight / 15) * textScale);
          }
          ctx.drawImage(
            oFontImgData.img,
            bX,
            bY,
            bWidth,
            bHeight,
            _oTextDisplayData.x +
              (shiftX + parseInt(aLinesToRender[i][j]["@xoffset"]) - offsetX) *
                textScale,
            _oTextDisplayData.y +
              (parseInt(aLinesToRender[i][j]["@yoffset"]) +
                i * this.oTextData[_oTextDisplayData.text].lineHeight +
                i * lineOffsetY -
                offsetY) *
                textScale +
              animY,
            bWidth * textScale,
            bHeight * textScale
          );
          shiftX += parseInt(aLinesToRender[i][j]["@xadvance"]);
        }
      }
    };
    return TextDisplay;
  })();
  Utils.TextDisplay = TextDisplay;
})(Utils || (Utils = {}));
var __extends =
  this.__extends ||
  function (d, b) {
    function __() {
      this.constructor = d;
    }
    __.prototype = b.prototype;
    d.prototype = new __();
  };
var Elements;
(function (Elements) {
  var Firework = (function (_super) {
    __extends(Firework, _super);
    function Firework(_oImgData, _animId, _shouldFall) {
      _super.call(this, _oImgData, 25, 45, _animId);
      this.setAnimType("once", _animId);
      this.shouldFall = _shouldFall;
      this.animEndedFunc = function () {
        this.removeMe = true;
      };
    }
    Firework.prototype.update = function () {
      _super.prototype.updateAnimation.call(this, delta);
      if (this.shouldFall) {
        this.y += 100 * delta;
      }
    };
    Firework.prototype.render = function () {
      _super.prototype.renderSimple.call(this, ctx);
    };
    return Firework;
  })(Utils.AnimSprite);
  Elements.Firework = Firework;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var Drifters = (function (_super) {
    __extends(Drifters, _super);
    function Drifters(_oImgData, _animId) {
      _super.call(this, _oImgData, 15, 45, _animId);
      this.setAnimType("loop", _animId);
      this.frameInc = Math.floor(Math.random() * 18);
      this.driftX = Math.random() * 1 - 0.5;
      this.driftY = Math.random() * 1 - 0.5;
    }
    Drifters.prototype.update = function () {
      _super.prototype.updateAnimation.call(this, delta);
      this.scaleX = archeryView.zoomScale;
      if (archeryView.isStartScreen) {
        this.x +=
          (this.driftX + 1) * Math.cos(25 * radian) * delta * 50 * this.scaleX;
        this.y +=
          (this.driftY + 1) * Math.sin(25 * radian) * delta * 50 * this.scaleX;
      } else {
        this.x +=
          (this.driftX + hud.windPower) *
          Math.cos(hud.windDir) *
          delta *
          50 *
          this.scaleX;
        this.y +=
          (this.driftY + hud.windPower) *
          Math.sin(hud.windDir) *
          delta *
          50 *
          this.scaleX;
      }
      if (this.x > canvas.width + 120 * this.scaleX) {
        this.x = -120;
      } else if (this.x < -120) {
        this.x = canvas.width + 120 * this.scaleX;
      }
      if (this.y > canvas.height + 100 * this.scaleX) {
        this.y = -100;
      } else if (this.y < -100) {
        this.y = canvas.height + 100 * this.scaleX;
      }
    };
    Drifters.prototype.render = function () {
      _super.prototype.renderSimple.call(this, ctx);
    };
    return Drifters;
  })(Utils.AnimSprite);
  Elements.Drifters = Drifters;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var Tutorial = (function (_super) {
    __extends(Tutorial, _super);
    function Tutorial(_oImgData) {
      _super.call(this, _oImgData, 15, 45, "tut0");
      this.tutBg = 0;
      this.oUiElementsImgData = assetLib.getData(
        window.famobi.hasFeature("leaderboard") ? "uiElements" : "uiElements2"
      );
      this.setAnimType("once", "tut0");
      this.animEndedFunc = this.switchBg1;
    }
    Tutorial.prototype.switchBg1 = function () {
      this.setAnimType("once", "tut1");
      this.tutBg = 1;
      this.animEndedFunc = this.switchBg0;
    };
    Tutorial.prototype.switchBg0 = function () {
      this.setAnimType("once", "tut0");
      this.tutBg = 0;
      this.animEndedFunc = this.switchBg1;
    };
    Tutorial.prototype.update = function () {
      _super.prototype.updateAnimation.call(this, delta);
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
    };
    Tutorial.prototype.render = function () {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var bX =
        this.oUiElementsImgData.oData.oAtlasData[
          oImageIds["tutBg" + this.tutBg]
        ].x;
      var bY =
        this.oUiElementsImgData.oData.oAtlasData[
          oImageIds["tutBg" + this.tutBg]
        ].y;
      var bWidth =
        this.oUiElementsImgData.oData.oAtlasData[
          oImageIds["tutBg" + this.tutBg]
        ].width;
      var bHeight =
        this.oUiElementsImgData.oData.oAtlasData[
          oImageIds["tutBg" + this.tutBg]
        ].height;
      ctx.drawImage(
        this.oUiElementsImgData.img,
        bX,
        bY,
        bWidth,
        bHeight,
        this.x - bWidth / 2,
        this.y - bHeight / 2,
        bWidth,
        bHeight
      );
      _super.prototype.renderSimple.call(this, ctx);
    };
    return Tutorial;
  })(Utils.AnimSprite);
  Elements.Tutorial = Tutorial;
})(Elements || (Elements = {}));
var Elements;
(function (Elements) {
  var Bird = (function (_super) {
    __extends(Bird, _super);
    function Bird(_oImgData) {
      _super.call(this, _oImgData, 25, 45, "fly");
      this.reset();
    }
    Bird.prototype.reset = function () {
      this.posX =
        Math.random() * (canvas.width + 500) - (canvas.width + 500) / 2;
      this.speed = Math.random() * 10 + 30;
      this.posY = Math.random() * 200 + 150;
      this.scaleX = this.scaleY = Math.random() * 0.7 + 0.2;
    };
    Bird.prototype.update = function () {
      _super.prototype.updateAnimation.call(this, delta);
      this.posX += this.speed * delta * this.scaleX;
      if (this.x > canvas.width + 250) {
        this.posX = -(canvas.width + 500) / 2;
        this.speed = Math.random() * 10 + 30;
        this.posY = Math.random() * 200 + 150;
        this.scaleX = this.scaleY = Math.random() * 0.7 + 0.2;
      }
      this.x = canvas.width / 2 + this.posX * archeryView.zoomScale;
      this.y = canvas.height / 2 - this.posY * archeryView.zoomScale;
    };
    Bird.prototype.render = function () {
      _super.prototype.renderSimple.call(this, ctx);
    };
    return Bird;
  })(Utils.AnimSprite);
  Elements.Bird = Bird;
})(Elements || (Elements = {}));
var Utils;
(function (Utils) {
  var SaveDataHandler = (function () {
    function SaveDataHandler(_saveDataId) {
      var _this = this;
      this.dataGroupNum = 2;
      this.oHighscoreData = {};
      this.saveDataId = _saveDataId;
      this.oHighscoreData = {
        stats: {
          day: {
            highscore: 0,
            rank: 0,
            total: 0,
          },
          week: {
            highscore: 0,
            rank: 0,
            total: 0,
          },
          month: {
            highscore: 0,
            rank: 0,
            total: 0,
          },
          ever: {
            highscore: 0,
            rank: 0,
            total: 0,
          },
        },
      };
      window.famobi = window.famobi ? window.famobi : {};
      window.famobi.localStorage = window.famobi.localStorage
        ? window.famobi.localStorage
        : window.localStorage;
      window.famobi.sessionStorage = window.famobi.sessionStorage
        ? window.famobi.sessionStorage
        : window.sessionStorage;
    }
    SaveDataHandler.prototype.init = function (callback) {
      this.clearData();
      this.setInitialData();

      var _this = this;
      lastUnlockedLevel = this.getLastUnlockedLevel();

      if (window.famobi.hasFeature("leaderboard")) {
        try {
          window.simpleHighscoreAPI.get(function (response) {
            _this.setHighscores(response);
            callback();
          });
        } catch (e) {
          callback();
        }
      } else {
        callback();
      }
    };
    SaveDataHandler.prototype.getLevelData = function (_level) {
      return {
        levelState: this.aLevelStore[_level * 2 + 1],
        score: this.aLevelStore[_level * 2 + 1 + 1],
      };
    };
    SaveDataHandler.prototype.setHighscores = function (_oData) {
      this.oHighscoreData = _oData;
    };
    SaveDataHandler.prototype.setLevelData = function (
      _level,
      _levelState,
      _score
    ) {
      this.aLevelStore[_level * 2 + 1] = _levelState;
      if (_score > this.aLevelStore[_level * 2 + 1]) {
        this.aLevelStore[_level * 2 + 1 + 1] = _score;
      }
      this.saveData();
    };
    SaveDataHandler.prototype.setChallengeHighscore = function (_score) {
      if (window.famobi.hasFeature("leaderboard")) {
        var _this = this;
        try {
          window.simpleHighscoreAPI.set(_score, function (response) {
            _this.setHighscores(response);
          });
        } catch (e) {}
      } else {
        this.oHighscoreData.stats.ever.highscore = Math.max(
          this.oHighscoreData.stats.ever.highscore,
          _score
        );
        this.saveData();
      }
    };
    SaveDataHandler.prototype.getTotalScore = function () {
      var temp = 0;
      for (var i = 0; i < (this.aLevelStore.length - 1) / 2; i++) {
        temp += this.aLevelStore[i * 2 + 1 + 1];
      }
      return temp;
    };
    SaveDataHandler.prototype.getLastUnlockedLevel = function () {
      var temp = -1;
      for (var i = 0; i < (this.aLevelStore.length - 1) / 2; i++) {
        if (this.aLevelStore[i * 2 + 1] == 1) {
          temp = i;
          break;
        }
      }
      return temp;
    };
    SaveDataHandler.prototype.clearData = function () {
      this.aLevelStore = new Array();
      this.aLevelStore.push(0);
      this.aLevelStore.push(1);
      this.aLevelStore.push(0);
      for (var i = 0; i < 49; i++) {
        this.aLevelStore.push(0);
        this.aLevelStore.push(0);
      }
    };
    SaveDataHandler.prototype.resetData = function () {
      this.clearData();
      this.saveData();
    };
    SaveDataHandler.prototype.setInitialData = function () {
      if (
        window.famobi.localStorage.getItem(this.saveDataId) != null &&
        window.famobi.localStorage.getItem(this.saveDataId) != ""
      ) {
        this.aLevelStore = window.famobi.localStorage
          .getItem(this.saveDataId)
          .split(",");
        for (var a in this.aLevelStore) {
          this.aLevelStore[a] = parseInt(this.aLevelStore[a]);
        }
        if (!window.famobi.hasFeature("leaderboard")) {
          this.oHighscoreData.stats.ever.highscore =
            window.famobi.localStorage.getItem(
              this.saveDataId + "_challengeHS"
            ) || 0;
        }
      } else {
        this.saveData();
      }
    };
    SaveDataHandler.prototype.saveData = function () {
      var str = "";
      for (var i = 0; i < this.aLevelStore.length; i++) {
        str += this.aLevelStore[i];
        if (i < this.aLevelStore.length - 1) {
          str += ",";
        }
      }
      window.famobi.localStorage.setItem(this.saveDataId, str);
      if (!window.famobi.hasFeature("leaderboard")) {
        window.famobi.localStorage.setItem(
          this.saveDataId + "_challengeHS",
          this.oHighscoreData.stats.ever.highscore || 0
        );
      }
    };
    return SaveDataHandler;
  })();
  Utils.SaveDataHandler = SaveDataHandler;
})(Utils || (Utils = {}));
var requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60, new Date().getTime());
    }
  );
})();
var previousTime;
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var minSquareSize = 500;
var maxSquareSize = 700;
var canvasX;
var canvasY;
var canvasScale;
var div = document.getElementById("canvas-wrapper");
var sound;
var music;
var audioType = 0;
var muted = false;
var splashTimer = 0;
var assetLib;
var preAssetLib;
var isMobile = false;
var gameState = "loading";
var aLangs = new Array("EN");
var curLang = "";
var isBugBrowser = false;
var isIE10 = false;
var delta;
var radian = Math.PI / 180;
var ios9FirstTouch = false;
var hasFocus = true;
var firstRun = true;
var testVar = "";
var saveDataHandler = new Utils.SaveDataHandler("awtfamobiv1");
var famobiPauseActive = false;
if (navigator.userAgent.match(/MSIE\s([\d]+)/)) {
  isIE10 = true;
}
var deviceAgent = navigator.userAgent.toLowerCase();
if (
  deviceAgent.match(/(iphone|ipod|ipad)/) ||
  deviceAgent.match(/(android)/) ||
  deviceAgent.match(/(iemobile)/) ||
  deviceAgent.match(/iphone/i) ||
  deviceAgent.match(/ipad/i) ||
  deviceAgent.match(/ipod/i) ||
  deviceAgent.match(/blackberry/i) ||
  deviceAgent.match(/bada/i)
) {
  isMobile = true;
  if (deviceAgent.match(/(android)/) && !/Chrome/.test(navigator.userAgent)) {
    isBugBrowser = true;
  }
}
var userInput = new Utils.UserInput(canvas, isBugBrowser);
resizeCanvas();
window.onresize = function () {
  setTimeout(function () {
    resizeCanvas();
  }, 1);
};
function visibleResume() {
  if (famobiPauseActive) {
    return;
  }
  if (!hasFocus) {
    if (userInput) {
      userInput.checkKeyFocus();
    }
    if (
      !muted &&
      gameState != "pause" &&
      gameState != "splash" &&
      gameState != "loading"
    ) {
      Howler.mute(false);
      playMusic();
    }
  }
  hasFocus = true;
}
function visiblePause() {
  if (famobiPauseActive) {
    return;
  }
  hasFocus = false;
  Howler.mute(true);
  music.pause();
}

if(!window.famobi.hasFeature("external_focus")) {
  window.onpageshow = function () {
    if (famobiPauseActive) {
      return;
    }
    if (!hasFocus) {
      if (userInput) {
        userInput.checkKeyFocus();
      }
      if (
        !muted &&
        gameState != "pause" &&
        gameState != "splash" &&
        gameState != "loading"
      ) {
        Howler.mute(false);
        playMusic();
      }
    }
    hasFocus = true;
  };
  window.onpagehide = function () {
    if (famobiPauseActive) {
      return;
    }
    hasFocus = false;
    Howler.mute(true);
    music.pause();
  };
}

function playMusic() {
  if (!music.playing()) {
    music.play();
  }
}
window.addEventListener("load", function () {
  setTimeout(function () {
    resizeCanvas();
  }, 0);
  window.addEventListener(
    "orientationchange",
    function () {
      setTimeout(function () {
        resizeCanvas();
      }, 500);
      setTimeout(function () {
        resizeCanvas();
      }, 2000);
    },
    false
  );
});
function isStock() {
  var matches = window.navigator.userAgent.match(
    /Android.*AppleWebKit\/([\d.]+)/
  );
  return matches && parseFloat(matches[1]) < 537;
}
var ua = navigator.userAgent;
var isSharpStock = /SHL24|SH-01F/i.test(ua) && isStock();
var isXperiaAStock = /SO-04E/i.test(ua) && isStock();
var isFujitsuStock = /F-01F/i.test(ua) && isStock();
if (
  !isIE10 &&
  !isSharpStock &&
  !isXperiaAStock &&
  !isFujitsuStock &&
  (typeof window.AudioContext !== "undefined" ||
    typeof window.webkitAudioContext !== "undefined" ||
    navigator.userAgent.indexOf("Android") == -1)
) {
  audioType = 1;
  sound = new Howl({
    src: ["audio/sound.mp3"],
    sprite: {
      gameStart: [0, 800],
      cheer2: [1000, 3500],
      winGame: [5000, 6500],
      cheer4: [12000, 5000],
      cheer3: [17500, 5000],
      cheer0: [22500, 3500],
      cheer1: [26500, 4500],
      bow: [31500, 1000],
      crowdSad: [34000, 3500],
      gameFail: [38000, 1500],
      gameSuccess: [40000, 1200],
      score0: [41500, 1500],
      score1: [43500, 2000],
      score2: [46000, 1500],
      score3: [48500, 2000],
      score4: [51500, 1200],
      shoot0: [53500, 1000],
      shoot1: [55000, 1000],
      shoot2: [56500, 1000],
      shoot3: [58000, 1000],
      shoot4: [59500, 1000],
      landGround: [61000, 1300],
      landTarget0: [62500, 1700],
      landTarget1: [64500, 1500],
      landTarget2: [66500, 1500],
      pop0: [68500, 600],
      pop1: [69500, 600],
      click: [70500, 500],
      silence: [600, 200],
    },
  });
  music = new Howl({
    src: ["audio/music.mp3"],
    volume: 0,
    loop: true,
  });
} else {
  audioType = 0;
}
var panel;
var background;
var totalScore = 0;
var levelScore = 0;
var levelNum = 0;
var aTutorials = new Array();
var panelFrame;
var oLogoData = {};
var oLogoBut;
var musicTween;
var oImageIds = {};
var archeryView;
var bow;
var scrollGround;
var aimTargetRadius = 156.5 / 2;
var hitTargetRadius = 284 / 2;
var aTargetRings = new Array();
var hitPosX;
var hitPosY;
var aArrowsFired;
var moveIncX = 0;
var moveIncY = 0;
var moveDistSeg = 400;
var moveState = 0;
var targRot = 0;
var circleAngle = 0;
var aTreeData = new Array();
var treeNum = 10;
var mapTouchFirst = false;
var mapPosX;
var mapPosRealX;
var mapPosY;
var mapPosRealY;
var mapScale = 1;
var hud;
var aFireworks;
var aDrifters;
var quiver;
var aLevelBalloonData;
var gameMode;
var challengeLevelNum;
var aBalloonData = new Array(
  [
    {
      rot: 2.36,
      hyp: 87.68,
      scale: 1,
    },
    {
      rot: 0.79,
      hyp: 87.68,
      scale: 1,
    },
    {
      rot: -0.79,
      hyp: 87.68,
      scale: 1,
    },
    {
      rot: -2.36,
      hyp: 87.68,
      scale: 1,
    },
    {
      rot: 3.14,
      hyp: 86,
      scale: 1,
    },
    {
      rot: 1.57,
      hyp: 86,
      scale: 1,
    },
    {
      rot: -1.57,
      hyp: 86,
      scale: 1,
    },
    {
      rot: 0,
      hyp: 86,
      scale: 1,
    },
    {
      rot: 0,
      hyp: 0,
      scale: 1,
    },
  ],
  [
    {
      rot: 3.14,
      hyp: 80,
      scale: 0.8,
    },
    {
      rot: 1.57,
      hyp: 80,
      scale: 0.8,
    },
    {
      rot: -1.57,
      hyp: 80,
      scale: 0.8,
    },
    {
      rot: 0,
      hyp: 80,
      scale: 0.8,
    },
    {
      rot: 0,
      hyp: 0,
      scale: 1.18,
    },
  ],
  [
    {
      rot: 3.05,
      hyp: 97.42,
      scale: 0.6,
    },
    {
      rot: -2.67,
      hyp: 66.19,
      scale: 0.7,
    },
    {
      rot: 0.11,
      hyp: 84.48,
      scale: 1,
    },
    {
      rot: -0.79,
      hyp: 42.43,
      scale: 0.9,
    },
    {
      rot: 2.65,
      hyp: 19.24,
      scale: 0.8,
    },
  ],
  [
    {
      rot: 1.77,
      hyp: 34.71,
      scale: 1.02,
    },
    {
      rot: 2.4,
      hyp: 93.43,
      scale: 0.7,
    },
    {
      rot: 1.08,
      hyp: 93.06,
      scale: 0.67,
    },
    {
      rot: -0.58,
      hyp: 88.2,
      scale: 0.74,
    },
    {
      rot: -2.2,
      hyp: 83.01,
      scale: 0.67,
    },
    {
      rot: -3.07,
      hyp: 86.21,
      scale: 0.81,
    },
    {
      rot: -1.5,
      hyp: 89.2,
      scale: 0.88,
    },
    {
      rot: 0.32,
      hyp: 86.33,
      scale: 0.88,
    },
    {
      rot: -1.2,
      hyp: 30.08,
      scale: 0.63,
    },
  ],
  [
    {
      rot: -1.61,
      hyp: 99.08,
      scale: 0.6,
    },
    {
      rot: -1.04,
      hyp: 69.46,
      scale: 0.7,
    },
    {
      rot: 1.63,
      hyp: 83.15,
      scale: 1,
    },
    {
      rot: 0.69,
      hyp: 45.45,
      scale: 0.9,
    },
    {
      rot: -1.79,
      hyp: 18.44,
      scale: 0.8,
    },
  ],
  [
    {
      rot: 2.36,
      hyp: 96.17,
      scale: 0.75,
    },
    {
      rot: 2.71,
      hyp: 50.57,
      scale: 0.75,
    },
    {
      rot: -0.79,
      hyp: 96.17,
      scale: 0.75,
    },
    {
      rot: -0.43,
      hyp: 50.57,
      scale: 0.75,
    },
    {
      rot: 0.79,
      hyp: 96.17,
      scale: 0.75,
    },
    {
      rot: 1.14,
      hyp: 50.57,
      scale: 0.75,
    },
    {
      rot: -2.36,
      hyp: 96.17,
      scale: 0.75,
    },
    {
      rot: -2,
      hyp: 50.57,
      scale: 0.75,
    },
    {
      rot: 0,
      hyp: 0,
      scale: 0.75,
    },
  ],
  [
    {
      rot: 0,
      hyp: 0,
      scale: 0.68,
    },
    {
      rot: 2.35,
      hyp: 95.46,
      scale: 0.68,
    },
    {
      rot: 0.79,
      hyp: 96.17,
      scale: 0.68,
    },
    {
      rot: -0.79,
      hyp: 96.17,
      scale: 0.68,
    },
    {
      rot: -2.35,
      hyp: 95.46,
      scale: 0.68,
    },
    {
      rot: 3.14,
      hyp: 90,
      scale: 0.68,
    },
    {
      rot: 1.57,
      hyp: 90,
      scale: 0.68,
    },
    {
      rot: -1.57,
      hyp: 91,
      scale: 0.68,
    },
    {
      rot: 0,
      hyp: 91,
      scale: 0.68,
    },
  ],
  [
    {
      rot: -0.8,
      hyp: 68.59,
      scale: 0.94,
    },
    {
      rot: -2.32,
      hyp: 69.35,
      scale: 0.94,
    },
    {
      rot: 2.6,
      hyp: 87.46,
      scale: 0.75,
    },
    {
      rot: 1.98,
      hyp: 78.39,
      scale: 0.75,
    },
    {
      rot: 1.27,
      hyp: 75.29,
      scale: 0.75,
    },
    {
      rot: 0.59,
      hyp: 84.31,
      scale: 0.75,
    },
  ],
  [
    {
      rot: 3.14,
      hyp: 100,
      scale: 0.6,
    },
    {
      rot: 3.14,
      hyp: 55,
      scale: 0.8,
    },
    {
      rot: 0,
      hyp: 100,
      scale: 0.6,
    },
    {
      rot: 0,
      hyp: 55,
      scale: 0.8,
    },
    {
      rot: 1.57,
      hyp: 100,
      scale: 0.6,
    },
    {
      rot: 1.57,
      hyp: 54,
      scale: 0.8,
    },
    {
      rot: -1.57,
      hyp: 100,
      scale: 0.6,
    },
    {
      rot: -1.57,
      hyp: 56,
      scale: 0.8,
    },
    {
      rot: 0,
      hyp: 0,
      scale: 1,
    },
  ],
  [
    {
      rot: 2.46,
      hyp: 42.64,
      scale: 0.73,
    },
    {
      rot: 1.1,
      hyp: 41.59,
      scale: 0.73,
    },
    {
      rot: -0.81,
      hyp: 33.24,
      scale: 0.73,
    },
    {
      rot: -2.17,
      hyp: 46.04,
      scale: 0.73,
    },
    {
      rot: 2.31,
      hyp: 97.67,
      scale: 0.73,
    },
    {
      rot: 0.16,
      hyp: 73.98,
      scale: 0.73,
    },
    {
      rot: -1.12,
      hyp: 91.24,
      scale: 0.73,
    },
    {
      rot: -2.49,
      hyp: 95.6,
      scale: 0.73,
    },
    {
      rot: 3.09,
      hyp: 94.13,
      scale: 0.73,
    },
    {
      rot: 0.74,
      hyp: 103.32,
      scale: 0.73,
    },
    {
      rot: -1.8,
      hyp: 95.57,
      scale: 0.73,
    },
    {
      rot: -0.51,
      hyp: 98.49,
      scale: 0.73,
    },
    {
      rot: 1.62,
      hyp: 95.13,
      scale: 0.73,
    },
  ]
);
var aLevelData = new Array(
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 0,
    moveDist: 0,
    windMin: 0,
    windMax: 0,
    aScoreTargs: [6, 8, 10],
    quiver: 5,
    mapX: 133,
    mapY: 618,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 1,
    moveDist: 0,
    windMin: 0.2,
    windMax: 0.7,
    aScoreTargs: [9, 12, 15],
    quiver: 3,
    mapX: 271,
    mapY: 649,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 2,
    moveDist: 0,
    windMin: 0.4,
    windMax: 0.9,
    aScoreTargs: [12, 16, 20],
    quiver: 3,
    mapX: 422,
    mapY: 592,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 3,
    moveDist: 0,
    windMin: 0.5,
    windMax: 1,
    aScoreTargs: [15, 20, 25],
    quiver: 3,
    mapX: 592,
    mapY: 595,
  },
  {
    id: "static",
    misc: {
      id: "balloons",
      num: 0,
    },
    targType: 3,
    rot: 0.1,
    bg: 0,
    targPosId: 1,
    moveDist: 0,
    windMin: 0.5,
    windMax: 1,
    aScoreTargs: [2, 3, 4],
    quiver: 4,
    mapX: 749,
    mapY: 590,
  },
  {
    id: "horiz",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 0,
    moveDist: 0.3,
    windMin: 0,
    windMax: 0,
    aScoreTargs: [20, 25, 30],
    quiver: 4,
    mapX: 862,
    mapY: 499,
  },
  {
    id: "horiz",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 1,
    moveDist: 0.3,
    windMin: 0.5,
    windMax: 1,
    aScoreTargs: [20, 25, 30],
    quiver: 4,
    mapX: 720,
    mapY: 435,
  },
  {
    id: "horiz",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 0.75,
    windMax: 1.25,
    aScoreTargs: [20, 25, 30],
    quiver: 4,
    mapX: 564,
    mapY: 443,
  },
  {
    id: "horiz",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 0,
    targPosId: 3,
    moveDist: 0.3,
    windMin: 1,
    windMax: 1.5,
    aScoreTargs: [20, 25, 30],
    quiver: 4,
    mapX: 400,
    mapY: 449,
  },
  {
    id: "vert",
    misc: {
      id: "balloons",
      num: 1,
    },
    targType: 3,
    rot: 0.1,
    bg: 0,
    targPosId: 0,
    moveDist: 0.2,
    windMin: 0,
    windMax: 0,
    aScoreTargs: [2, 3, 4],
    quiver: 4,
    mapX: 269,
    mapY: 412,
  },
  {
    id: "vert",
    misc: {
      id: null,
      num: null,
    },
    targType: 4,
    rot: 0.2,
    bg: 1,
    targPosId: 1,
    moveDist: 0.2,
    windMin: 0.5,
    windMax: 1,
    aScoreTargs: [25, 30, 35],
    quiver: 4,
    mapX: 177,
    mapY: 307,
  },
  {
    id: "vert",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 1,
    targPosId: 2,
    moveDist: 0.2,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [25, 30, 35],
    quiver: 4,
    mapX: 139,
    mapY: 163,
  },
  {
    id: "vert",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 1,
    targPosId: 3,
    moveDist: 0.2,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [27, 31, 35],
    quiver: 4,
    mapX: 277,
    mapY: 186,
  },
  {
    id: "diag0",
    misc: {
      id: null,
      num: null,
    },
    targType: 4,
    rot: -0.2,
    bg: 1,
    targPosId: 1,
    moveDist: 0.2,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [27, 31, 35],
    quiver: 4,
    mapX: 357,
    mapY: 304,
  },
  {
    id: "diag1",
    misc: {
      id: "balloons",
      num: 2,
    },
    targType: 3,
    rot: -0.15,
    bg: 1,
    targPosId: 2,
    moveDist: 0.2,
    windMin: 1,
    windMax: 1.5,
    aScoreTargs: [2, 3, 4],
    quiver: 4,
    mapX: 433,
    mapY: 171,
  },
  {
    id: "diag0",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 1,
    targPosId: 3,
    moveDist: 0.2,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 33, 36],
    quiver: 4,
    mapX: 518,
    mapY: 300,
  },
  {
    id: "circle0",
    misc: {
      id: null,
      num: null,
    },
    targType: 5,
    rot: 0.2,
    bg: 1,
    targPosId: 0,
    moveDist: 0.2,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 33, 36],
    quiver: 4,
    mapX: 587,
    mapY: 160,
  },
  {
    id: "circle1",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 1,
    targPosId: 1,
    moveDist: 0.3,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 33, 36],
    quiver: 4,
    mapX: 666,
    mapY: 300,
  },
  {
    id: "circle0",
    misc: {
      id: null,
      num: null,
    },
    targType: 4,
    rot: -0.2,
    bg: 1,
    targPosId: 2,
    moveDist: 0.4,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 33, 36],
    quiver: 4,
    mapX: 761,
    mapY: 171,
  },
  {
    id: "circle1",
    misc: {
      id: "balloons",
      num: 3,
    },
    targType: 3,
    rot: 0.15,
    bg: 1,
    targPosId: 1,
    moveDist: 0.5,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [3, 4, 5],
    quiver: 5,
    mapX: 823,
    mapY: 296,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: -0.2,
    bg: 2,
    targPosId: 0,
    moveDist: 0,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 34, 37],
    quiver: 4,
    mapX: 949,
    mapY: 373,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: 0.3,
    bg: 2,
    targPosId: 1,
    moveDist: 0,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 34, 37],
    quiver: 4,
    mapX: 974,
    mapY: 241,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: -0.4,
    bg: 2,
    targPosId: 2,
    moveDist: 0,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 34, 37],
    quiver: 4,
    mapX: 1089,
    mapY: 162,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: 0.5,
    bg: 2,
    targPosId: 3,
    moveDist: 0,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [30, 34, 37],
    quiver: 4,
    mapX: 1240,
    mapY: 147,
  },
  {
    id: "triangle0",
    misc: {
      id: "balloons",
      num: 4,
    },
    targType: 3,
    rot: -0.2,
    bg: 2,
    targPosId: 1,
    moveDist: 0.4,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [3, 4, 5],
    quiver: 5,
    mapX: 1361,
    mapY: 232,
  },
  {
    id: "horiz",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: 0.2,
    bg: 2,
    targPosId: 0,
    moveDist: 0.3,
    windMin: 1,
    windMax: 1.5,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 1358,
    mapY: 373,
  },
  {
    id: "vert",
    misc: {
      id: null,
      num: null,
    },
    targType: 6,
    rot: -0.2,
    bg: 2,
    targPosId: 1,
    moveDist: 0.2,
    windMin: 1,
    windMax: 1.5,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 1335,
    mapY: 500,
  },
  {
    id: "horiz",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: 0.3,
    bg: 2,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 1,
    windMax: 1.5,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 1191,
    mapY: 441,
  },
  {
    id: "vert",
    misc: {
      id: null,
      num: null,
    },
    targType: 6,
    rot: -0.3,
    bg: 2,
    targPosId: 3,
    moveDist: 0.2,
    windMin: 1,
    windMax: 1.5,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 1062,
    mapY: 474,
  },
  {
    id: "horiz",
    misc: {
      id: "balloons",
      num: 5,
    },
    targType: 3,
    rot: 0.3,
    bg: 2,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 1,
    windMax: 1.5,
    aScoreTargs: [3, 4, 5],
    quiver: 5,
    mapX: 1000,
    mapY: 592,
  },
  {
    id: "triangle0",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0,
    bg: 3,
    targPosId: 1,
    moveDist: 0.4,
    windMin: 1.5,
    windMax: 2,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 924,
    mapY: 702,
  },
  {
    id: "triangle1",
    misc: {
      id: null,
      num: null,
    },
    targType: 4,
    rot: 0.3,
    bg: 3,
    targPosId: 2,
    moveDist: 0.4,
    windMin: 1.5,
    windMax: 2,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 757,
    mapY: 746,
  },
  {
    id: "triangle0",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: -0.25,
    bg: 3,
    targPosId: 3,
    moveDist: 0.4,
    windMin: 1.5,
    windMax: 2,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 865,
    mapY: 842,
  },
  {
    id: "triangle1",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: 0.25,
    bg: 3,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 1.5,
    windMax: 2,
    aScoreTargs: [31, 34, 37],
    quiver: 4,
    mapX: 1033,
    mapY: 831,
  },
  {
    id: "triangle0",
    misc: {
      id: "balloons",
      num: 6,
    },
    targType: 3,
    rot: 0.25,
    bg: 3,
    targPosId: 0,
    moveDist: 0.3,
    windMin: 1.5,
    windMax: 2,
    aScoreTargs: [3, 4, 5],
    quiver: 5,
    mapX: 1119,
    mapY: 697,
  },
  {
    id: "square",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: 0.3,
    bg: 3,
    targPosId: 0,
    moveDist: 0.3,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 1275,
    mapY: 679,
  },
  {
    id: "square",
    misc: {
      id: null,
      num: null,
    },
    targType: 2,
    rot: -0.15,
    bg: 3,
    targPosId: 1,
    moveDist: 0.3,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 1351,
    mapY: 779,
  },
  {
    id: "square",
    misc: {
      id: null,
      num: null,
    },
    targType: 6,
    rot: 0.15,
    bg: 3,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 1361,
    mapY: 914,
  },
  {
    id: "square",
    misc: {
      id: null,
      num: null,
    },
    targType: 2,
    rot: -0.15,
    bg: 3,
    targPosId: 3,
    moveDist: 0.3,
    windMin: 0.5,
    windMax: 1,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 1230,
    mapY: 982,
  },
  {
    id: "square",
    misc: {
      id: "balloons",
      num: 7,
    },
    targType: 3,
    rot: 0.25,
    bg: 3,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 1.5,
    windMax: 2.5,
    aScoreTargs: [3, 4, 5],
    quiver: 5,
    mapX: 1062,
    mapY: 998,
  },
  {
    id: "circle1",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0.4,
    bg: 4,
    targPosId: 3,
    moveDist: 0.3,
    windMin: 1.7,
    windMax: 2.5,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 900,
    mapY: 998,
  },
  {
    id: "vert",
    misc: {
      id: null,
      num: null,
    },
    targType: 6,
    rot: 0.2,
    bg: 4,
    targPosId: 2,
    moveDist: 0.2,
    windMin: 1.7,
    windMax: 2.5,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 737,
    mapY: 990,
  },
  {
    id: "triangle0",
    misc: {
      id: null,
      num: null,
    },
    targType: 1,
    rot: 0.4,
    bg: 4,
    targPosId: 3,
    moveDist: 0.3,
    windMin: 1.7,
    windMax: 2.5,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 603,
    mapY: 937,
  },
  {
    id: "diag1",
    misc: {
      id: null,
      num: null,
    },
    targType: 0,
    rot: 0.4,
    bg: 4,
    targPosId: 3,
    moveDist: 0.2,
    windMin: 1.7,
    windMax: 2.5,
    aScoreTargs: [33, 35, 37],
    quiver: 4,
    mapX: 479,
    mapY: 973,
  },
  {
    id: "horiz",
    misc: {
      id: "balloons",
      num: 8,
    },
    targType: 3,
    rot: 0.3,
    bg: 4,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 1.7,
    windMax: 2.5,
    aScoreTargs: [6, 7, 8],
    quiver: 8,
    mapX: 334,
    mapY: 987,
  },
  {
    id: "circle0",
    misc: {
      id: null,
      num: null,
    },
    targType: 4,
    rot: 0.5,
    bg: 4,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 2,
    windMax: 3,
    aScoreTargs: [34, 36, 38],
    quiver: 4,
    mapX: 189,
    mapY: 988,
  },
  {
    id: "diag0",
    misc: {
      id: null,
      num: null,
    },
    targType: 2,
    rot: 0.3,
    bg: 4,
    targPosId: 3,
    moveDist: 0.2,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [34, 36, 38],
    quiver: 4,
    mapX: 64,
    mapY: 930,
  },
  {
    id: "triangle1",
    misc: {
      id: null,
      num: null,
    },
    targType: 6,
    rot: 0.3,
    bg: 4,
    targPosId: 2,
    moveDist: 0.4,
    windMin: 2,
    windMax: 3,
    aScoreTargs: [34, 36, 38],
    quiver: 4,
    mapX: 103,
    mapY: 812,
  },
  {
    id: "square",
    misc: {
      id: null,
      num: null,
    },
    targType: 2,
    rot: 0.3,
    bg: 4,
    targPosId: 3,
    moveDist: 0.3,
    windMin: 1,
    windMax: 2,
    aScoreTargs: [34, 36, 38],
    quiver: 4,
    mapX: 234,
    mapY: 805,
  },
  {
    id: "circle1",
    misc: {
      id: "balloons",
      num: 9,
    },
    targType: 3,
    rot: 0.2,
    bg: 4,
    targPosId: 2,
    moveDist: 0.3,
    windMin: 1.8,
    windMax: 2.5,
    aScoreTargs: [7, 8, 9],
    quiver: 9,
    mapX: 374,
    mapY: 857,
  },
  {
    id: "static",
    misc: {
      id: null,
      num: null,
    },
    targType: 3,
    bg: 1,
    targPosId: 0,
    moveDist: 0,
    windMin: 0.5,
    windMax: 1,
    aScoreTargs: [6, 8, 10],
    quiver: 5,
    mapX: 133,
    mapY: 618,
  }
);
var aTargetTypes = new Array(
  {
    id: "horiz",
    moveDist: 0.3,
  },
  {
    id: "vert",
    moveDist: 0.2,
  },
  {
    id: "diag0",
    moveDist: 0.2,
  },
  {
    id: "diag1",
    moveDist: 0.2,
  },
  {
    id: "circle0",
    moveDist: 0.3,
  },
  {
    id: "circle1",
    moveDist: 0.3,
  },
  {
    id: "triangle0",
    moveDist: 0.3,
  },
  {
    id: "triangle1",
    moveDist: 0.3,
  },
  {
    id: "square",
    moveDist: 0.3,
  }
);
var oTargetType;
var sceneType;
var oChallengeBalloon;
var aBirds;
function extGameLoad() {
  loadPreAssets();
}
function initSplash() {
  gameState = "splash";
  resizeCanvas();
  window.famobi_onPauseRequested = function () {
    Howler.mute(true);
    music.pause();
    famobiPauseActive = true;
  };
  window.famobi_onResumeRequested = function () {
    if (!muted && gameState != "pause") {
      Howler.mute(false);
      music.play();
    }
    famobiPauseActive = false;
  };

  if (!!window.famobi.localStorage.getItem("muted")) {
    muted = false;
    toggleMute(true);
  }

  if (audioType == 1 && !muted) {
    playMusic();
    if (!hasFocus) {
      music.pause();
    }
  }

  window.famobi_game = {};

  window.famobi_game.startGame = function (isRestart) {
    initStartScreen();

    if (forcedMode) {
      forcedModeProperties = famobi.getFeatureProperties("forced_mode");

      forcedModeProperties.state = forcedModeProperties.state || {};
      forcedModeProperties.override = forcedModeProperties.override || {};

      if (skipTitle) {
        userInput.removeHitArea("backFromMap");
        userInput.removeHitArea("mapTouch");
        userInput.removeHitArea("mute");
      } else {
        userInput.removeHitArea("playFromStart0");
        userInput.removeHitArea("playFromStart1");
        userInput.removeHitArea("moreGamesFromStart");
        userInput.removeHitArea("creditsFromStart");
        userInput.removeHitArea("mute");
      }

      if (!window.famobi.hasFeature("external_start") || isRestart) {
        window.famobi_game.startLevel();
      }

      window.famobi.gameReady();
    }
  };

  window.famobi_game.startLevel = function () {
    /* :: LOAD LEVEL :: */
    let customLevel,
      challengeMode = false;
    levelNum = forcedModeProperties.state.level
      ? forcedModeProperties.state.level
      : 0;
    if (levelNum == -2) {
      levelNum = 0;
      customLevel = true;
    } else if (levelNum == -1) {
      levelNum = 0;
      challengeMode = true;
    }

    /* :: START LEVEL :: */
    if (forcedModeProperties.override.endless_normal) {
      aLevelData[levelNum].quiver = Infinity;
    }

    initGame(challengeMode ? "challenge" : "levels", false);

    /* ::: EDIT LEVEL ::: */
    if (customLevel) {
      //Shape
      let translateId = "static";
      if (typeof forcedModeProperties.override.movement_size == "number") {
        aLevelData[levelNum].moveDist = Math.min(
          Math.max(forcedModeProperties.override.movement_size, 0),
          1
        );
        if (aLevelData[levelNum].moveDist > 0) {
          switch (forcedModeProperties.override.movement_shape) {
            case 0:
              translateId = "static";
              break;
            case 1:
              translateId = "triangle0";
              break;
            case 2:
              translateId = "triangle1";
              break;
            case 3:
              translateId = "square";
              break;
            case 4:
              translateId = "circle0";
              break;
            case 5:
              translateId = "circle1";
              break;
            case 6:
              translateId = "horiz";
              break;
            case 7:
              translateId = "vert";
              break;
            case 8:
              translateId = "diag0";
              break;
            case 9:
              translateId = "diag1";
              break;
            default:
              break;
          }
        }
      }
      //Score
      if (typeof forcedModeProperties.override.score_bronze != "number") {
        forcedModeProperties.override.score_bronze =
          aLevelData[levelNum].aScoreTargs[0];
      }
      if (typeof forcedModeProperties.override.score_silver != "number") {
        forcedModeProperties.override.score_silver =
          aLevelData[levelNum].aScoreTargs[1];
      }
      if (typeof forcedModeProperties.override.score_gold != "number") {
        forcedModeProperties.override.score_gold =
          aLevelData[levelNum].aScoreTargs[2];
      }
      forcedModeProperties.override.score_bronze = Math.max(
        forcedModeProperties.override.score_bronze,
        0
      );
      forcedModeProperties.override.score_silver = Math.max(
        forcedModeProperties.override.score_silver,
        forcedModeProperties.override.score_bronze + 1
      );
      forcedModeProperties.override.score_gold = Math.max(
        forcedModeProperties.override.score_gold,
        forcedModeProperties.override.score_silver + 1
      );
      aLevelData[levelNum].aScoreTargs = [
        forcedModeProperties.override.score_bronze,
        forcedModeProperties.override.score_silver,
        forcedModeProperties.override.score_gold,
      ];
      //Type
      if (typeof forcedModeProperties.override.target_type == "number") {
        aLevelData[levelNum].targType = Math.min(
          Math.max(forcedModeProperties.override.target_type, 0),
          6
        );
      }
      aLevelData[levelNum].id = translateId;
      if (typeof forcedModeProperties.override.target_distance == "number") {
        aLevelData[levelNum].targPosId = Math.min(
          Math.max(forcedModeProperties.override.target_distance, 0),
          3
        );
      }
      if (typeof forcedModeProperties.override.balloon_layout != "number") {
        forcedModeProperties.override.balloon_layout = 0;
      }
      aLevelData[levelNum].misc = {
        id: forcedModeProperties.override.is_balloon_level ? "balloons" : null,
        num: Math.min(
          Math.max(forcedModeProperties.override.balloon_layout, 0),
          9
        ),
      };
      //Arrows
      if (typeof forcedModeProperties.override.arrow_amount == "number") {
        if (forcedModeProperties.override.arrow_amount <= 0) {
          aLevelData[levelNum].quiver = Infinity;
        } else {
          aLevelData[levelNum].quiver = Math.min(
            Math.max(forcedModeProperties.override.arrow_amount, 1),
            9
          );
        }
        quiver = aLevelData[levelNum].quiver;
      }
      //Wind
      if (typeof forcedModeProperties.override.wind_strength_min == "number") {
        aLevelData[levelNum].windMin = Math.min(
          Math.max(forcedModeProperties.override.wind_strength_min, 0),
          3
        );
        aLevelData[levelNum].windMax = aLevelData[levelNum].windMin;
      }
      if (typeof forcedModeProperties.override.wind_strength_max == "number") {
        aLevelData[levelNum].windMax = Math.min(
          Math.max(
            forcedModeProperties.override.wind_strength_max,
            aLevelData[levelNum].windMin
          ),
          3
        );
      }
      //Rotation
      if (
        typeof forcedModeProperties.override.target_rotation_speed == "number"
      ) {
        aLevelData[levelNum].rot = Math.min(
          Math.max(forcedModeProperties.override.target_rotation_speed, -10),
          10
        );
      }
    }
    //Close Tutorial
    if (!skipTutorial) {
      butEventHandler("tutDone");
    }
  };

  saveDataHandler.init(window.famobi_game.startGame);
}
function initStartScreen() {
  if (skipTitle) {
    butEventHandler("playFromStart0");
    return;
  }

  gameState = "start";
  try {
    window.famobi_analytics.trackScreen(famobi_analytics.SCREEN_HOME);
  } catch (e) {}
  levelNum = 0;
  gameMode = "levels";
  userInput.removeHitArea("moreGames");
  if (audioType == 1) {
    music.fade(music.volume(), 0.25 * masterVolume, 500);
  }
  if (
    saveDataHandler.getTotalScore() > 0 ||
    saveDataHandler.oHighscoreData.stats.ever.highscore > 0
  ) {
    firstRun = false;
  }
  if (skipTutorial) {
    firstRun = false;
  }
  var oPlayBut0 = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [-90 + 4, 0 - 2],
    align: [0.5, 0.7],
    id: oImageIds.playBut0,
  };
  var oPlayBut1 = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [90 + 10, 0],
    align: [0.5, 0.7],
    id: oImageIds.playBut1,
  };
  var oMoreGamesBut = {
    oImgData: assetLib.getData("moreGamesBut"),
    aPos: [82, -40],
    align: [0, 1],
    id: "none",
    scale: 0.25,
    noMove: true,
  };

  userInput.addHitArea(
    "playFromStart0",
    butEventHandler,
    null,
    "image",
    oPlayBut0
  );
  userInput.addHitArea(
    "playFromStart1",
    butEventHandler,
    null,
    "image",
    oPlayBut1
  );
  userInput.addHitArea(
    "moreGamesFromStart",
    butEventHandler,
    null,
    "image",
    oMoreGamesBut
  );

  var aButs = new Array(oPlayBut0, oPlayBut1, oMoreGamesBut);

  addMuteBut(aButs);
  aArrowsFired = new Array();
  aBirds = new Array();
  var temp = Math.floor(Math.random() * 4) + 4;
  for (var i = 0; i < temp; i++) {
    addBird();
  }
  levelNum = 50;
  if (aLevelData[levelNum].misc.id == "balloons") {
    aLevelBalloonData = new Array();
    for (
      var i = 0;
      i < aBalloonData[aLevelData[levelNum].misc.num].length;
      i++
    ) {
      aLevelBalloonData.push({
        rot: aBalloonData[aLevelData[levelNum].misc.num][i].rot,
        hyp: aBalloonData[aLevelData[levelNum].misc.num][i].hyp,
        scale: aBalloonData[aLevelData[levelNum].misc.num][i].scale,
        colour: i % 7,
      });
    }
  }
  archeryView = new Elements.ArcheryView(true);
  panel = new Elements.Panel(gameState, aButs);
  aDrifters = new Array();
  for (var i = 0; i < 4; i++) {
    var animId = "explode";
    var drifters = new Elements.Drifters(
      assetLib.getData("drifters"),
      "ambient"
    );
    drifters.x = (canvas.width / 2) * (i % 2) + canvas.width / 4;
    drifters.y = (canvas.height / 2) * Math.floor(i / 2) + canvas.height / 4;
    drifters.scaleX = drifters.scaleY = Math.random() * 0.4 + 0.8;
    aDrifters.push(drifters);
  }
  panel.startTween1();
  previousTime = new Date().getTime();
  updateStartScreenEvent();
  if (!forcedMode) {
    window.famobi.gameReady();
  }
}
function addMuteBut(_aButs) {
  if (externalMute) return;

  if (audioType == 1) {
    var mb = oImageIds.muteBut0;
    if (muted) {
      mb = oImageIds.muteBut1;
    }
    var oMuteBut = {
      oImgData: assetLib.getData("uiButs"),
      aPos: [-32 + offsetButtons.x, 32 + offsetButtons.y],
      align: [1, 0],
      id: mb,
      noMove: true,
    };
    userInput.addHitArea("mute", butEventHandler, null, "image", oMuteBut);
    _aButs.push(oMuteBut);
  }
}
function initCreditsScreen() {
  gameState = "credits";
  try {
    window.famobi_analytics.trackScreen(famobi_analytics.SCREEN_CREDITS);
  } catch (e) {}
  var oBackBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [55, -35],
    align: [0, 1],
    id: oImageIds.backBut,
    noMove: true,
  };
  var oResetBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [-55, -35],
    align: [1, 1],
    id: oImageIds.resetBut,
    noMove: true,
  };

  userInput.addHitArea(
    "backFromCredits",
    butEventHandler,
    null,
    "image",
    oBackBut
  );
  userInput.addHitArea("resetData", butEventHandler, null, "image", oResetBut);

  var aButs = new Array();

  if (showCrossPromo) {
    var oCrossPromoBut = {
      oImgData: assetLib.getData("crossPromoBut"),
      aPos: [0, 0 + 130],
      align: [0.5, 0.5],
      id: "none",
      scale: 0.3,
      noMove: true,
    };
    userInput.addHitArea(
      "crossPromoClicked",
      butEventHandler,
      null,
      "image",
      oCrossPromoBut
    );
    aButs = new Array(oBackBut, oResetBut, oCrossPromoBut);
  } else {
    aButs = new Array(oBackBut, oResetBut);
  }

  addMuteBut(aButs);
  panel = new Elements.Panel(gameState, aButs);
  panel.startTween1();
  aArrowsFired = new Array();
  archeryView = new Elements.ArcheryView(true);
  previousTime = new Date().getTime();
  updateCreditsScreenEvent();
}
function setTreeData() {
  aTreeData = new Array();
  for (var i = 0; i < treeNum; i++) {
    aTreeData.push({
      scaleL: Math.random() * 0.1 + 0.9,
      idL: "tree" + sceneType + Math.floor(Math.random() * 3),
      scaleR: Math.random() * 0.1 + 0.9,
      idR: "tree" + sceneType + Math.floor(Math.random() * 3),
    });
  }
}
function initMap() {
  gameState = "map";
  try {
    window.famobi_analytics.trackScreen(famobi_analytics.SCREEN_LEVELSELECT);
  } catch (e) {}
  if (audioType == 1) {
    music.fade(music.volume(), 0.25 * masterVolume, 500);
  }
  var oBackBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [55, -35],
    align: [0, 1],
    id: oImageIds.backBut,
    noMove: true,
  };

  var aButs = new Array();

  if (!skipTitle) {
    userInput.addHitArea(
      "backFromMap",
      butEventHandler,
      null,
      "image",
      oBackBut
    );
    aButs = new Array(oBackBut);
  }
  addMuteBut(aButs);
  panel = new Elements.Panel(gameState, aButs);
  userInput.addHitArea(
    "mapTouch",
    butEventHandler,
    {
      isDraggable: true,
      multiTouch: true,
    },
    "rect",
    {
      aRect: [0, 0, canvas.width, canvas.height],
    },
    true
  );
  panel.mapButIdToHighlight = -1;
  setMapData();
  panel.startTween1();
  aFireworks = new Array();
  previousTime = new Date().getTime();
  updateMapScreenEvent();
  if (!forcedMode) {
    window.famobi.gameReady();
  }
}
function setMapData() {
  var tempLevel = saveDataHandler.getLastUnlockedLevel();
  if (tempLevel == -1) {
    tempLevel = 50 - 1;
  }
  mapPosX = mapPosRealX = Math.max(
    Math.min(
      aLevelData[tempLevel].mapX - canvas.width / 2,
      1446 - canvas.width
    ),
    0
  );
  mapPosY = mapPosRealY = Math.max(
    Math.min(
      aLevelData[tempLevel].mapY - canvas.height / 2,
      1111 - canvas.height
    ),
    0
  );
  mapScale = 1;
  if (canvas.width > 1446) {
    mapScale = canvas.width / 1446;
  }
  if (canvas.height > 1111) {
    mapScale = Math.max(canvas.height / 1111, mapScale);
  }
}
function initLevelPreview() {
  gameState = "levelPreview";
  try {
    window.famobi_analytics.trackScreen(famobi_analytics.SCREEN_LEVELINTRO);
  } catch (e) {}
  var oNextBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [140, 170],
    align: [0.5, 0.5],
    id: oImageIds.nextBut,
  };
  var oBackBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [55, -35],
    align: [0, 1],
    id: oImageIds.backBut,
    noMove: true,
  };
  userInput.addHitArea(
    "nextFromPreview",
    butEventHandler,
    null,
    "image",
    oNextBut
  );
  userInput.addHitArea(
    "backFromPreview",
    butEventHandler,
    null,
    "image",
    oBackBut
  );
  var aButs = new Array(oBackBut, oNextBut);
  addMuteBut(aButs);
  setMapData();
  panel = new Elements.Panel(gameState, aButs);
  panel.startTween1();
  previousTime = new Date().getTime();
  updateLevelPreviewEvent();
}
function initGame(_mode, _restart) {
  window.famobi_analytics
    .trackEvent(
      _restart
        ? famobi_analytics.EVENT_LEVELRESTART
        : famobi_analytics.EVENT_LEVELSTART,
      {
        levelName: _mode == "levels" ? (levelNum + 1).toString() : "challenge",
      }
    )
    .then(function () {
      _initGame(_mode, _restart);
    });
}
function _initGame(_mode, _restart) {
  gameState = "game";
  gameMode = _mode;
  challengeLevelNum = 0;

  if (audioType == 1) {
    music.fade(music.volume(), 0.5 * masterVolume, 1000);
  }
  aArrowsFired = new Array();
  if (aLevelData[levelNum].targType > 0 && aLevelData[levelNum].targType < 3) {
    targRot = Math.random() * 360 * radian;
  } else {
    targRot = 0;
  }
  playSound("gameStart");
  var aButs = new Array();
  addMuteBut(aButs);

  if (skipTutorial) {
    firstRun = false;
  }

  if (firstRun) {
    var oDoneTutBut = {
      oImgData: assetLib.getData("uiButs"),
      aPos: [5, 155],
      align: [0.5, 0.5],
      id: oImageIds.nextBut,
    };
    userInput.addHitArea(
      "tutDone",
      butEventHandler,
      null,
      "image",
      oDoneTutBut
    );
    aButs.push(oDoneTutBut);
  } else {
    var oPauseBut = {
      oImgData: assetLib.getData("uiButs"),
      aPos: [-95 + offsetButtons.x, 32 + offsetButtons.y],
      align: [1, 0],
      id: oImageIds.pauseBut,
      noMove: true,
    };

    if (!externalPause) {
      userInput.addHitArea("pause", butEventHandler, null, "image", oPauseBut);
      aButs.push(oPauseBut);
    }

    userInput.addHitArea(
      "gameTouch",
      butEventHandler,
      {
        isDraggable: true,
        multiTouch: true,
      },
      "rect",
      {
        aRect: [0, 65, canvas.width, canvas.height],
      },
      true
    );
  }
  panel = new Elements.Panel(gameState, aButs);
  if (aLevelData[levelNum].misc.id == "balloons") {
    aLevelBalloonData = new Array();
    for (
      var i = 0;
      i < aBalloonData[aLevelData[levelNum].misc.num].length;
      i++
    ) {
      aLevelBalloonData.push({
        rot: aBalloonData[aLevelData[levelNum].misc.num][i].rot,
        hyp: aBalloonData[aLevelData[levelNum].misc.num][i].hyp,
        scale: aBalloonData[aLevelData[levelNum].misc.num][i].scale,
        colour: i % 7,
      });
    }
  }
  aBirds = new Array();
  var temp = Math.floor(Math.random() * 4) + 4;
  for (var i = 0; i < temp; i++) {
    addBird();
  }
  archeryView = new Elements.ArcheryView();
  aDrifters = new Array();
  for (var i = 0; i < 4; i++) {
    var animId = "explode";
    var drifters = new Elements.Drifters(
      assetLib.getData("drifters"),
      "ambient"
    );
    drifters.x = (canvas.width / 2) * (i % 2) + canvas.width / 4;
    drifters.y = (canvas.height / 2) * Math.floor(i / 2) + canvas.height / 4;
    drifters.scaleX = drifters.scaleY = Math.random() * 0.4 + 0.8;
    aDrifters.push(drifters);
  }
  bow = new Elements.Bow();
  hud = new Elements.Hud();
  panel.startTween1();
  aFireworks = new Array();
  moveIncX = 0;
  moveIncY = 0;
  moveState = 0;
  levelScore = 0;
  quiver = aLevelData[levelNum].quiver;
  previousTime = new Date().getTime();
  updateGameEvent();
  if (!firstRun) {
    window.famobi.playerReady();
  }
}
function resumeGame() {
  gameState = "game";
  var oPauseBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [-95 + offsetButtons.x, 32 + offsetButtons.y],
    align: [1, 0],
    id: oImageIds.pauseBut,
    noMove: true,
  };

  var aButs = new Array();
  if (!externalPause) {
    userInput.addHitArea("pause", butEventHandler, null, "image", oPauseBut);
    aButs = new Array(oPauseBut);
  }

  addMuteBut(aButs);
  userInput.addHitArea(
    "gameTouch",
    butEventHandler,
    {
      isDraggable: true,
      multiTouch: true,
    },
    "rect",
    {
      aRect: [0, 65, canvas.width, canvas.height],
    },
    true
  );
  panel = new Elements.Panel(gameState, aButs);
  panel.startTween1();
  previousTime = new Date().getTime();
  updateGameEvent();
}
function initPause() {
  gameState = "pause";
  try {
    window.famobi_analytics.trackScreen(famobi_analytics.SCREEN_PAUSE);
  } catch (e) {}
  var oResumeBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [0, -90],
    align: [0.5, 0.5],
    id: oImageIds.nextBut,
    noMove: true,
  };
  var oRestartBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [0, 0],
    align: [0.5, 0.5],
    id: oImageIds.restart1But,
    noMove: true,
  };
  var oQuitBut = {
    oImgData: assetLib.getData("uiButs"),
    aPos: [0, 90],
    align: [0.5, 0.5],
    id: oImageIds.quitBut,
    noMove: true,
  };
  userInput.addHitArea(
    "resumeGameFromPause",
    butEventHandler,
    null,
    "image",
    oResumeBut
  );
  userInput.addHitArea(
    "restartGameFromPause",
    butEventHandler,
    null,
    "image",
    oRestartBut
  );
  userInput.addHitArea(
    "quitGameFromPause",
    butEventHandler,
    null,
    "image",
    oQuitBut
  );

  var aButs = new Array();

  if (showCrossPromo) {
    var oCrossPromoBut = {
      oImgData: assetLib.getData("crossPromoBut"),
      aPos: [0, 190],
      align: [0.5, 0.5],
      scale: 0.3,
      id: "none",
      noMove: true,
    };

    userInput.addHitArea(
      "crossPromoClicked",
      butEventHandler,
      null,
      "image",
      oCrossPromoBut
    );
    aButs = new Array(oResumeBut, oRestartBut, oQuitBut, oCrossPromoBut);
  } else {
    aButs = new Array(oResumeBut, oRestartBut, oQuitBut);
  }

  panel = new Elements.Panel(gameState, aButs);
  panel.startTween1();
  previousTime = new Date().getTime();
  background = new Elements.Background();
  updatePauseEvent();
}
function initAnimateMap() {
  gameState = "animateMap";
  var aButs = new Array();
  addMuteBut(aButs);
  panel = new Elements.Panel(gameState, aButs);
  setMapData();
  panel.startTween1();
  panel.tweenFinger();
  previousTime = new Date().getTime();
  updateAnimateMapEvent();
}
function butEventHandler(_id, _oData) {
  if (window.famobi.paused) return;

  switch (_id) {
    case "langSelect":
      curLang = _oData.lang;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      userInput.removeHitArea("langSelect");
      preAssetLib = new Utils.AssetLoader(
        curLang,
        [
          {
            id: "preloadImage",
            file: "images/preloadImage.jpg",
          },
        ],
        ctx,
        canvas.width,
        canvas.height,
        false
      );
      preAssetLib.onReady(initLoadAssets);
      break;
    case "creditsFromStart":
      playSound("click");
      userInput.removeHitArea("playFromStart0");
      userInput.removeHitArea("playFromStart1");
      userInput.removeHitArea("moreGamesFromStart");
      userInput.removeHitArea("creditsFromStart");
      userInput.removeHitArea("mute");
      initCreditsScreen();
      break;
    case "backFromCredits":
      playSound("click");
      userInput.removeHitArea("backFromCredits");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("resetData");
      userInput.removeHitArea("mute");
      initStartScreen();
      break;
    case "moreGamesFromStart":
    case "moreGamesPause":
      playSound("click");
      try {
        window.famobi.moreGamesLink();
      } catch (e) {}
      break;
    case "resetData":
      playSound("click");
      userInput.removeHitArea("backFromCredits");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("resetData");
      userInput.removeHitArea("mute");
      saveDataHandler.resetData();
      firstRun = true;
      if (skipTutorial) {
        firstRun = false;
      }
      levelNum = 0;
      initStartScreen();
      break;
    case "crossPromoClicked":
      playSound("click");
      if (showCrossPromo) {
        var result = window.open(window.famobi.getAppLink(), "_blank");
      }
      break;
    case "playFromStart0":
      playSound("click");
      userInput.removeHitArea("playFromStart0");
      userInput.removeHitArea("playFromStart1");
      userInput.removeHitArea("moreGamesFromStart");
      userInput.removeHitArea("creditsFromStart");
      userInput.removeHitArea("mute");
      initMap();
      break;
    case "playFromStart1":
      playSound("click");
      userInput.removeHitArea("playFromStart0");
      userInput.removeHitArea("playFromStart1");
      userInput.removeHitArea("moreGamesFromStart");
      userInput.removeHitArea("creditsFromStart");
      userInput.removeHitArea("mute");
      initGame("challenge", false);
      break;
    case "mapTouch":
      if (_oData.isBeingDragged && !_oData.hasLeft && mapTouchFirst) {
        mapPosX = Math.max(
          Math.min(panel.mapStartX - _oData.x, 1446 - canvas.width),
          0
        );
        mapPosY = Math.max(
          Math.min(panel.mapStartY - _oData.y, 1111 - canvas.height),
          0
        );
      } else if (_oData.isDown && _oData.isBeingDragged == false) {
        if (panel.mapTween) {
          panel.mapTween.kill();
        }
        panel.mapStartX = mapPosRealX + _oData.x;
        panel.mapDragX = _oData.x;
        panel.mapStartY = mapPosRealY + _oData.y;
        panel.mapDragY = _oData.y;
        mapTouchFirst = true;
      } else if (mapTouchFirst) {
        mapTouchFirst = false;
        if (Math.abs(panel.mapDragY - _oData.y) < 10) {
          for (var i = 0; i < 50; i++) {
            var tempLevel = saveDataHandler.getLastUnlockedLevel();
            if (
              ((typeof famobi_unlock !== "undefined" &&
                famobi_unlock.isEnabled()) ||
                i <= tempLevel ||
                tempLevel == -1) &&
              _oData.x > (aLevelData[i].mapX - 50 - mapPosRealX) * mapScale &&
              _oData.x < (aLevelData[i].mapX + 50 - mapPosRealX) * mapScale &&
              _oData.y > (aLevelData[i].mapY - 50 - mapPosRealY) * mapScale &&
              _oData.y < (aLevelData[i].mapY + 50 - mapPosRealY) * mapScale
            ) {
              levelNum = i;
              userInput.removeHitArea("backFromMap");
              userInput.removeHitArea("mapTouch");
              userInput.removeHitArea("mute");
              playSound("click");
              initLevelPreview();
              break;
            }
          }
        }
      }
      break;
    case "backFromMap":
      playSound("click");
      userInput.removeHitArea("backFromMap");
      userInput.removeHitArea("mapTouch");
      userInput.removeHitArea("mute");
      initStartScreen();
      break;
    case "nextFromPreview":
      playSound("click");
      userInput.removeHitArea("nextFromPreview");
      userInput.removeHitArea("backFromPreview");
      userInput.removeHitArea("mute");
      initGame("levels", false);
      break;
    case "backFromPreview":
      playSound("click");
      userInput.removeHitArea("nextFromPreview");
      userInput.removeHitArea("backFromPreview");
      userInput.removeHitArea("mute");
      initMap();
      break;
    case "tutDone":
      playSound("click");
      userInput.removeHitArea("mute");
      userInput.removeHitArea("tutDone");
      try {
        window.famobi_analytics.trackEvent(
          famobi_analytics.EVENT_TUTORIALCOMPLETED
        );
        window.famobi.playerReady();
      } catch (e) {}
      var oPauseBut = {
        oImgData: assetLib.getData("uiButs"),
        aPos: [-95 + offsetButtons.x, 32 + offsetButtons.y],
        align: [1, 0],
        id: oImageIds.pauseBut,
        noMove: true,
      };

      panel.aButs = new Array();

      if (!externalPause) {
        userInput.addHitArea(
          "pause",
          butEventHandler,
          null,
          "image",
          oPauseBut
        );
        panel.aButs = new Array(oPauseBut);
      }

      userInput.addHitArea(
        "gameTouch",
        butEventHandler,
        {
          isDraggable: true,
          multiTouch: true,
        },
        "rect",
        {
          aRect: [0, 65, canvas.width, canvas.height],
        },
        true
      );
      addMuteBut(panel.aButs);
      firstRun = false;
      if (archeryView != null) {
        archeryView.introTween();
        if (bow != null) bow.introTween();
      }
      break;
    case "gameTouch":
      if (_oData.isBeingDragged && !_oData.hasLeft && bow.isHeld) {
        bow.targAimX = _oData.x;
        bow.targAimY = _oData.y;
      } else if (_oData.isDown && _oData.isBeingDragged == false) {
        bow.startAimX = bow.targAimX = _oData.x;
        bow.startAimY = bow.targAimY = _oData.y;
        bow.isHeld = true;
        playSound("bow");
        bow.zoomIn();
        archeryView.zoomIn();
      } else if (bow.isHeld) {
        var tempWindX =
          hud.windPower *
          Math.cos(hud.windDir) *
          (archeryView.aTargData[archeryView.targPosId].dist * 0.003);
        var tempWindY =
          hud.windPower *
          Math.sin(hud.windDir) *
          (archeryView.aTargData[archeryView.targPosId].dist * 0.003);
        var tempGravity =
          archeryView.aTargData[archeryView.targPosId].dist * 0.0005;
        hitPosX =
          (bow.x +
            bow.aScopeOffset[bow.bowId].x -
            archeryView.targetCentreX +
            moveIncX *
              archeryView.zoomScale *
              archeryView.aTargData[archeryView.targPosId].scale) /
            archeryView.aTargData[archeryView.targPosId].scale /
            archeryView.zoomScale /
            aimTargetRadius +
          tempWindX;
        hitPosY =
          (bow.y -
            archeryView.targetCentreY +
            moveIncY *
              archeryView.zoomScale *
              archeryView.aTargData[archeryView.targPosId].scale) /
            archeryView.aTargData[archeryView.targPosId].scale /
            archeryView.zoomScale /
            aimTargetRadius +
          tempWindY +
          tempGravity;
        bow.startAimX = bow.targAimX = 0;
        bow.startAimY = bow.targAimY = 0;
        userInput.removeHitArea("gameTouch");
        userInput.removeHitArea("mute");
        userInput.removeHitArea("pause");
        playSound("shoot" + Math.floor(Math.random() * 5));
        bow.fireArrow();
      }
      break;
    case "nextLevel":
      playSound("click");
      userInput.removeHitArea("jumpHeight");
      userInput.removeHitArea("dashLength");
      userInput.removeHitArea("turnRate");
      userInput.removeHitArea("nextLevel");
      levelScore = 0;
      levelNum++;
      initGame("levels", false);
      break;
    case "retryFromEnd":
      playSound("click");
      userInput.removeHitArea("retryFromEnd");
      userInput.removeHitArea("quitFromEnd");
      levelScore = 0;
      initGame(gameMode, true);
      break;
    case "quitFromEnd":
      playSound("click");
      userInput.removeHitArea("retryFromEnd");
      userInput.removeHitArea("quitFromEnd");
      initStartScreen();
      break;
    case "mute":
      playSound("click");
      toggleMute();
      if (muted) {
        panel.switchBut(oImageIds.muteBut0, oImageIds.muteBut1);
      } else {
        panel.switchBut(oImageIds.muteBut1, oImageIds.muteBut0);
      }
      break;
    case "enableAudio":
      if (muted) {
        toggleMute(!_oData);
        if (muted) {
          panel.switchBut(oImageIds.muteBut0, oImageIds.muteBut1);
        } else {
          panel.switchBut(oImageIds.muteBut1, oImageIds.muteBut0);
        }
      }
      break;
    case "disableAudio":
      if (!muted) {
        toggleMute(!_oData);
        if (muted) {
          panel.switchBut(oImageIds.muteBut0, oImageIds.muteBut1);
        } else {
          panel.switchBut(oImageIds.muteBut1, oImageIds.muteBut0);
        }
      }
      break;
    case "pause":
      if (_oData !== true) {
        playSound("click");
      }
      if (audioType == 1) {
        Howler.mute(true);
        music.pause();
      } else if (audioType == 2) {
        music.pause();
      }
      userInput.removeHitArea("pause");
      userInput.removeHitArea("gameTouch");
      userInput.removeHitArea("mute");
      initPause();
      break;
    case "resumeGameFromPause":
      if (_oData !== true) {
        playSound("click");
      }
      if (audioType == 1) {
        if (!muted) {
          Howler.mute(false);
          playMusic();
        }
      } else if (audioType == 2) {
        if (!muted) {
          playMusic();
        }
      }
      userInput.removeHitArea("resumeGameFromPause");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("restartGameFromPause");
      userInput.removeHitArea("quitGameFromPause");
      userInput.removeHitArea("mute");
      resumeGame();
      break;
    case "restartGameFromPause":
      playSound("click");
      if (gameMode == "levels") {
        try {
          window.famobi_analytics.trackEvent(famobi_analytics.EVENT_LEVELFAIL, {
            levelName: (levelNum + 1).toString(),
            reason: "draw",
          });
        } catch (e) {}
      } else {
        try {
          window.famobi_analytics.trackEvent(famobi_analytics.EVENT_LEVELFAIL, {
            levelName: (challengeLevelNum + 1).toString(),
            reason: "draw",
          });
        } catch (e) {}
      }
      if (audioType == 1) {
        if (!muted) {
          Howler.mute(false);
          playMusic();
        }
      } else if (audioType == 2) {
        if (!muted) {
          playMusic();
        }
      }
      userInput.removeHitArea("resumeGameFromPause");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("restartGameFromPause");
      userInput.removeHitArea("quitGameFromPause");
      userInput.removeHitArea("mute");
      initGame(gameMode, true);
      break;
    case "quitGameFromPause":
      playSound("click");

      if (audioType == 1) {
        if (!muted) {
          Howler.mute(false);
          playMusic();
        }
      } else if (audioType == 2) {
        if (!muted) {
          playMusic();
        }
      }
      userInput.removeHitArea("resumeGameFromPause");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("restartGameFromPause");
      userInput.removeHitArea("quitGameFromPause");
      userInput.removeHitArea("mute");
      levelScore = 0;

      gameState = "start";

      window.famobi_analytics
        .trackEvent(famobi_analytics.EVENT_LEVELFAIL, {
          levelName: "" + (gameMode == "levels" ? levelNum + 1 : "challenge"),
          reason: "quit",
        })
        .then(initStartScreen, initStartScreen);

      break;
    case "nextFromLevelSuccess":
      playSound("click");
      userInput.removeHitArea("nextFromLevelSuccess");
      userInput.removeHitArea("replayFromLevelSuccess");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("backFromLevelSuccess");
      if (levelNum + 1 == saveDataHandler.getLastUnlockedLevel()) {
        initAnimateMap();
      } else {
        initMap();
      }
      break;
    case "replayFromLevelSuccess":
      playSound("click");
      userInput.removeHitArea("nextFromLevelSuccess");
      userInput.removeHitArea("replayFromLevelSuccess");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("backFromLevelSuccess");
      initGame(gameMode, true);
      break;
    case "backFromLevelSuccess":
      playSound("click");
      userInput.removeHitArea("nextFromLevelSuccess");
      userInput.removeHitArea("replayFromLevelSuccess");
      userInput.removeHitArea("crossPromoClicked");
      userInput.removeHitArea("backFromLevelSuccess");
      initMap();
      break;
    case "replayFromLevelFail":
      playSound("click");
      userInput.removeHitArea("replayFromLevelFail");
      userInput.removeHitArea("backFromLevelFail");
      userInput.removeHitArea("crossPromoClicked");
      initGame(gameMode, true);
      break;
    case "backFromLevelFail":
      playSound("click");
      userInput.removeHitArea("replayFromLevelFail");
      userInput.removeHitArea("backFromLevelFail");
      userInput.removeHitArea("crossPromoClicked");
      initMap();
      break;
    case "replayFromChallengeFail":
      playSound("click");
      userInput.removeHitArea("replayFromChallengeFail");
      userInput.removeHitArea("backFromChallengeFail");
      userInput.removeHitArea("crossPromoClicked");
      initGame(gameMode, true);
      break;
    case "backFromChallengeFail":
      playSound("click");
      userInput.removeHitArea("replayFromChallengeFail");
      userInput.removeHitArea("backFromChallengeFail");
      userInput.removeHitArea("crossPromoClicked");
      initStartScreen();
      break;
  }
}
function addFirework(_id, _x, _y, _scale, _shouldFall) {
  if (typeof _scale === "undefined") {
    _scale = 1;
  }
  if (typeof _shouldFall === "undefined") {
    _shouldFall = true;
  }
  if (aFireworks.length > 15) {
    return;
  }
  var animId = "explode";
  var firework = new Elements.Firework(
    assetLib.getData("firework" + _id),
    animId,
    _shouldFall
  );
  firework.x = _x;
  firework.y = _y;
  firework.scaleX = firework.scaleY = _scale;
  aFireworks.push(firework);
}
function addBird() {
  var bird = new Elements.Bird(assetLib.getData("bird"));
  aBirds.push(bird);
}
function addPop(_id, _x, _y, _scale, _shouldFall) {
  if (typeof _scale === "undefined") {
    _scale = 1;
  }
  if (typeof _shouldFall === "undefined") {
    _shouldFall = false;
  }
  if (aFireworks.length > 15) {
    return;
  }
  var animId = "explode" + _id;
  var firework = new Elements.Firework(
    assetLib.getData("balloonPop"),
    animId,
    _shouldFall
  );
  firework.x = _x;
  firework.y = _y;
  firework.scaleX = firework.scaleY = _scale;
  aFireworks.push(firework);
}
function initArrowFire() {
  gameState = "arrowFire";
  scrollGround = new Elements.ScrollGround();
  var aButs = new Array();
  addMuteBut(aButs);
  panel = new Elements.Panel(gameState, aButs);
  panel.startTween1();
  previousTime = new Date().getTime();
  updateArrowFire();
}
function initNextShot() {
  if (gameMode == "levels") {
    quiver--;
  }
  if (
    !forcedModeProperties.override.endless_normal &&
    gameMode == "levels" &&
    (levelScore >= aLevelData[levelNum].aScoreTargs[2] || quiver <= 0)
  ) {
    if (levelScore >= aLevelData[levelNum].aScoreTargs[0]) {
      initLevelSuccess();
    } else {
      initLevelFail();
    }
  } else {
    gameState = "game";
    challengeLevelNum++;
    aArrowsFired.push({
      x: hitPosX,
      y: hitPosY,
      rot: Math.atan2(hitPosY, hitPosX) - targRot,
      hyp: Math.sqrt(hitPosX * hitPosX + hitPosY * hitPosY),
      hitTarget: Math.sqrt(hitPosX * hitPosX + hitPosY * hitPosY) <= 1,
    });
    var oPauseBut = {
      oImgData: assetLib.getData("uiButs"),
      aPos: [-95 + offsetButtons.x, 32 + offsetButtons.y],
      align: [1, 0],
      id: oImageIds.pauseBut,
      noMove: true,
    };

    var aButs = new Array();
    if (!externalPause) {
      userInput.addHitArea("pause", butEventHandler, null, "image", oPauseBut);
      aButs = new Array(oPauseBut);
    }
    addMuteBut(aButs);
    userInput.addHitArea(
      "gameTouch",
      butEventHandler,
      {
        isDraggable: true,
        multiTouch: true,
      },
      "rect",
      {
        aRect: [0, 65, canvas.width, canvas.height],
      },
      true
    );
    panel = new Elements.Panel(gameState, aButs);
    archeryView = new Elements.ArcheryView();
    bow = new Elements.Bow();
    hud.resetWind();
    panel.startTween1();
    previousTime = new Date().getTime();
    updateGameEvent();
  }
}
function updateScore(_inc) {
  levelScore += _inc;
}
function initLevelSuccess() {
  Promise.all([
    window.famobi_analytics.trackEvent(famobi_analytics.EVENT_CUSTOM, {
      event: "EVENT_LEVELSUCCESS",
      levelName: (levelNum + 1).toString(),
    }),
    window.famobi_analytics.trackEvent(famobi_analytics.EVENT_CUSTOM, {
      event: "EVENT_LEVELSCORE",
      levelName: (levelNum + 1).toString(),
      levelScore: levelScore,
    }),
  ]).then(_initLevelSuccess, _initLevelSuccess);
}
function _initLevelSuccess() {
  gameState = "levelSuccess";
  playSound("cheer" + Math.floor(Math.random() * 5));
  playSound("gameSuccess");
  var tempScore;
  var tempState;

  // todo: why limit score to target score?!
  if (levelScore >= aLevelData[levelNum].aScoreTargs[2]) {
    tempScore = aLevelData[levelNum].aScoreTargs[2];
    tempState = 4;
  } else if (levelScore >= aLevelData[levelNum].aScoreTargs[1]) {
    tempScore = aLevelData[levelNum].aScoreTargs[1];
    tempState = 3;
  } else {
    tempScore = aLevelData[levelNum].aScoreTargs[0];
    tempState = 2;
  }

  window.famobi_analytics
    .trackEvent("EVENT_CUSTOM", {
      eventName: "LEVELEND",
      result: "success",
      score: tempScore,
    })
    .then(
      function () {
        if (levelNum < 50 - 1) {
          if (levelNum == saveDataHandler.getLastUnlockedLevel()) {
            saveDataHandler.setLevelData(levelNum + 1, 1, 0);
          }
        }

        window.famobi_analytics.trackStats("stars_gained", tempState - 1);

        saveDataHandler.setLevelData(levelNum, tempState, tempScore);
        saveDataHandler.saveData();

        userInput.removeHitArea("gameTouch");
        userInput.removeHitArea("pause");
        var oNextBut = {
          oImgData: assetLib.getData("uiButs"),
          aPos: [140, 170],
          align: [0.5, 0.5],
          id: oImageIds.nextBut,
          scale: 0.0001,
        };
        var oReplayBut = {
          oImgData: assetLib.getData("uiButs"),
          aPos: [-135, 170],
          align: [0.5, 0.5],
          id: oImageIds.restart1But,
          noMove: true,
          scale: 0.0001,
        };
        var oBackBut = {
          oImgData: assetLib.getData("uiButs"),
          aPos: [55, -35],
          align: [0, 1],
          id: oImageIds.backBut,
          noMove: true,
          scale: 0.0001,
        };

        var aButs = new Array();

        if (showCrossPromo) {
          var oCrossPromoBut = {
            oImgData: assetLib.getData("crossPromoBut"),
            aPos: [0, -200],
            align: [0.5, 0.5],
            id: "none",
            noMove: true,
            scale: 0.0001,
          };

          aButs = new Array(oBackBut, oNextBut, oReplayBut, oCrossPromoBut);
        } else {
          aButs = new Array(oBackBut, oNextBut, oReplayBut);
        }

        addMuteBut(aButs);
        setMapData();
        aFireworks = new Array();
        panel = new Elements.Panel(gameState, aButs);
        panel.startTween1();
        previousTime = new Date().getTime();
        updateLevelSuccess();

        var showButtons = function () {
          if (!forcedMode) {
            oReplayBut.scale = 1;
            oBackBut.scale = 1;
            oNextBut.scale = 1;
            userInput.addHitArea(
              "nextFromLevelSuccess",
              butEventHandler,
              null,
              "image",
              oNextBut
            );
            userInput.addHitArea(
              "replayFromLevelSuccess",
              butEventHandler,
              null,
              "image",
              oReplayBut
            );
            userInput.addHitArea(
              "backFromLevelSuccess",
              butEventHandler,
              null,
              "image",
              oBackBut
            );
          }

          if (showCrossPromo) {
            oCrossPromoBut.scale = 0.3;
            userInput.addHitArea(
              "crossPromoClicked",
              butEventHandler,
              null,
              "image",
              oCrossPromoBut
            );
          }
        };

        if (lastUnlockedLevel != saveDataHandler.getLastUnlockedLevel()) {
          lastUnlockedLevel = saveDataHandler.getLastUnlockedLevel();
          window.famobi_analytics.trackStats("level_unlocked", {
            level: lastUnlockedLevel,
          });
        }

        setTimeout(
          function () {
            Promise.all([
              window.famobi_analytics.trackScreen(
                famobi_analytics.SCREEN_LEVELRESULT
              ),
              window.famobi_analytics.trackEvent(
                famobi_analytics.EVENT_LEVELSUCCESS,
                {
                  levelName: (levelNum + 1).toString(),
                }
              ),
              window.famobi_analytics.trackEvent(
                famobi_analytics.EVENT_LEVELSCORE,
                {
                  levelName: "levels",
                  levelScore: saveDataHandler.getTotalScore(),
                }
              ),
              window.famobi_analytics.trackEvent(
                famobi_analytics.EVENT_LEVELSCORE,
                {
                  levelName: "" + levelNum,
                  levelScore: levelScore,
                }
              ),
            ]).then(showButtons, showButtons);
          }.bind(this),
          1500
        );
      },
      function () {}
    );
}

function initLevelFail() {
  window.famobi_analytics
    .trackEvent(famobi_analytics.EVENT_CUSTOM, {
      event: "EVENT_LEVELFAIL",
      levelName: (levelNum + 1).toString(),
      reason: "dead",
    })
    .then(_initLevelFail, _initLevelFail);
}

function _initLevelFail() {
  gameState = "levelFail";

  if (audioType == 1) {
    music.fade(music.volume(), 0.25 * masterVolume, 500);
  }
  playSound("gameFail");
  playSound("crowdSad");

  window.famobi_analytics
    .trackEvent("EVENT_CUSTOM", {
      eventName: "LEVELEND",
      result: "fail",
      score: levelScore,
    })
    .then(
      function () {
        userInput.removeHitArea("gameTouch");
        userInput.removeHitArea("pause");
        var oReplayBut = {
          oImgData: assetLib.getData("uiButs"),
          aPos: [140, 170],
          align: [0.5, 0.5],
          id: oImageIds.restart0But,
          scale: 0.0001,
        };
        var oBackBut = {
          oImgData: assetLib.getData("uiButs"),
          aPos: [55, -35],
          align: [0, 1],
          id: oImageIds.backBut,
          noMove: true,
          scale: 0.0001,
        };

        var aButs = new Array();
        if (showCrossPromo) {
          var oCrossPromoBut = {
            oImgData: assetLib.getData("crossPromoBut"),
            aPos: [0, -200],
            align: [0.5, 0.5],
            id: "none",
            noMove: true,
            scale: 0.0001,
          };

          aButs = new Array(oReplayBut, oBackBut, oCrossPromoBut);
        } else {
          aButs = new Array(oReplayBut, oBackBut);
        }

        addMuteBut(aButs);
        setMapData();

        panel = new Elements.Panel(gameState, aButs);
        panel.startTween1();
        previousTime = new Date().getTime();
        updateLevelFail();

        var showButtons = function () {
          if (!forcedMode) {
            oReplayBut.scale = 1;
            oBackBut.scale = 1;
            userInput.addHitArea(
              "replayFromLevelFail",
              butEventHandler,
              null,
              "image",
              oReplayBut
            );
            userInput.addHitArea(
              "backFromLevelFail",
              butEventHandler,
              null,
              "image",
              oBackBut
            );

            if (showCrossPromo) {
              oCrossPromoBut.scale = 0.3;
              userInput.addHitArea(
                "crossPromoClicked",
                butEventHandler,
                null,
                "image",
                oCrossPromoBut
              );
            }
          }
        };

        setTimeout(
          function () {
            Promise.all([
              window.famobi_analytics.trackScreen(
                famobi_analytics.SCREEN_LEVELRESULT
              ),
              window.famobi_analytics.trackEvent(
                famobi_analytics.EVENT_LEVELFAIL,
                {
                  levelName: (levelNum + 1).toString(),
                  reason: "dead",
                }
              ),
            ]).then(showButtons, showButtons);
          }.bind(this),
          1500
        );
      },
      function () {}
    );
}
function initChallengeFail() {
  Promise.all([
    window.famobi_analytics.trackEvent(famobi_analytics.EVENT_CUSTOM, {
      event: "EVENT_LEVELFAIL",
      levelName: "challenge",
      reason: "dead",
    }),
    window.famobi_analytics.trackEvent(famobi_analytics.EVENT_CUSTOM, {
      event: "EVENT_LEVELSCORE",
      levelName: "challenge",
      levelScore: challengeLevelNum,
    }),
  ]).then(_initChallengeFail, _initChallengeFail);
}
function _initChallengeFail() {
  gameState = "challengeFail";

  if (audioType == 1) {
    music.fade(music.volume(), 0.25 * masterVolume, 500);
  }
  playSound("gameSuccess");
  playSound("cheer" + Math.floor(Math.random() * 5));
  window.famobi_analytics
    .trackEvent("EVENT_CUSTOM", {
      eventName: "LEVELEND",
      result: "fail",
      score: levelScore,
    })
    .then(
      function () {
        saveDataHandler.setChallengeHighscore(levelScore);
        userInput.removeHitArea("gameTouch");
        userInput.removeHitArea("pause");
        var oReplayBut = {
          oImgData: assetLib.getData("uiButs"),
          aPos: [140, 170],
          align: [0.5, 0.5],
          id: oImageIds.restart0But,
          scale: 0.0001,
        };
        var oBackBut = {
          oImgData: assetLib.getData("uiButs"),
          aPos: [55, -35],
          align: [0, 1],
          id: oImageIds.backBut,
          noMove: true,
          scale: 0.0001,
        };

        var aButs = new Array();
        if (showCrossPromo) {
          var oCrossPromoBut = {
            oImgData: assetLib.getData("crossPromoBut"),
            aPos: [0, -200],
            align: [0.5, 0.5],
            id: "none",
            noMove: true,
            scale: 0.0001,
          };

          aButs = new Array(oReplayBut, oBackBut, oCrossPromoBut);
        } else {
          aButs = new Array(oReplayBut, oBackBut);
        }

        addMuteBut(aButs);
        setMapData();
        aFireworks = new Array();
        panel = new Elements.Panel(gameState, aButs);
        panel.startTween1();
        previousTime = new Date().getTime();
        updateChallengeFail();

        var showButtons = function () {
          oReplayBut.scale = 1;
          oBackBut.scale = 1;
          userInput.addHitArea(
            "replayFromChallengeFail",
            butEventHandler,
            null,
            "image",
            oReplayBut
          );
          userInput.addHitArea(
            "backFromChallengeFail",
            butEventHandler,
            null,
            "image",
            oBackBut
          );

          if (showCrossPromo) {
            oCrossPromoBut.scale = 0.3;
            userInput.addHitArea(
              "crossPromoClicked",
              butEventHandler,
              null,
              "image",
              oCrossPromoBut
            );
          }
        };

        setTimeout(
          function () {
            Promise.all([
              window.famobi_analytics.trackScreen(
                famobi_analytics.SCREEN_GAMERESULT
              ),
              window.famobi_analytics.trackEvent(
                famobi_analytics.EVENT_LEVELFAIL,
                {
                  levelName: "challenge",
                  reason: "dead",
                }
              ),
              window.famobi_analytics.trackEvent(
                famobi_analytics.EVENT_LEVELSCORE,
                {
                  levelName: "challenge",
                  levelScore: challengeLevelNum,
                }
              ),
            ]).then(showButtons, showButtons);
          }.bind(this),
          1500
        );
      },
      function () {}
    );
}
function updateGameEvent() {
  if (gameState != "game") {
    return;
  }
  delta = getDelta();
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height);
  archeryView.update();
  archeryView.render();
  bow.update();
  bow.render();
  for (var i = 0; i < aDrifters.length; i++) {
    aDrifters[i].update();
    aDrifters[i].render(ctx);
  }
  hud.update();
  hud.render();
  for (var i = 0; i < aFireworks.length; i++) {
    aFireworks[i].update();
    aFireworks[i].render(ctx);
    if (aFireworks[i].removeMe) {
      aFireworks.splice(i, 1);
      i -= 1;
    }
  }
  panel.update();
  panel.render();
  requestAnimFrame(updateGameEvent);
}
function updateArrowFire() {
  if (gameState != "arrowFire") {
    return;
  }
  delta = getDelta();
  scrollGround.update();
  scrollGround.render();
  hud.update();
  hud.render();
  for (var i = 0; i < aFireworks.length; i++) {
    aFireworks[i].update();
    aFireworks[i].render(ctx);
    if (aFireworks[i].removeMe) {
      aFireworks.splice(i, 1);
      i -= 1;
    }
  }
  panel.update();
  panel.render();
  requestAnimFrame(updateArrowFire);
}
function updateMapScreenEvent() {
  if (gameState != "map") {
    return;
  }
  delta = getDelta();
  if (saveDataHandler.getLastUnlockedLevel() == -1 && Math.random() < 0.1) {
    addFirework(
      Math.floor(Math.random() * 2),
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 1 + 2
    );
  }
  panel.update();
  panel.render();
  for (var i = 0; i < aFireworks.length; i++) {
    aFireworks[i].update();
    aFireworks[i].render(ctx);
    if (aFireworks[i].removeMe) {
      aFireworks.splice(i, 1);
      i -= 1;
    }
  }
  requestAnimFrame(updateMapScreenEvent);
}
function updateAnimateMapEvent() {
  if (gameState != "animateMap") {
    return;
  }
  delta = getDelta();
  panel.update();
  panel.render();
  requestAnimFrame(updateAnimateMapEvent);
}
function updateLevelPreviewEvent() {
  if (gameState != "levelPreview") {
    return;
  }
  delta = getDelta();
  panel.update();
  panel.render();
  requestAnimFrame(updateLevelPreviewEvent);
}
function updateCreditsScreenEvent() {
  if (gameState != "credits") {
    return;
  }
  delta = getDelta();
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height);
  archeryView.update();
  archeryView.render();
  panel.update();
  panel.render();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "15px Helvetica";
  ctx.fillText("v1.0.5", canvas.width / 2 + panel.posY, canvas.height - 10);
  requestAnimFrame(updateCreditsScreenEvent);
}
function updateLevelSuccess() {
  if (gameState != "levelSuccess") {
    return;
  }
  delta = getDelta();
  if (Math.random() < 0.1) {
    addFirework(
      Math.floor(Math.random() * 2),
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 1 + 2
    );
  }
  panel.update();
  panel.render();
  for (var i = 0; i < aFireworks.length; i++) {
    aFireworks[i].update();
    aFireworks[i].render(ctx);
    if (aFireworks[i].removeMe) {
      aFireworks.splice(i, 1);
      i -= 1;
    }
  }
  requestAnimFrame(updateLevelSuccess);
}
function updateLevelFail() {
  if (gameState != "levelFail") {
    return;
  }
  delta = getDelta();
  panel.update();
  panel.render();
  requestAnimFrame(updateLevelFail);
}
function updateChallengeFail() {
  if (gameState != "challengeFail") {
    return;
  }
  delta = getDelta();
  if (Math.random() < 0.1) {
    addFirework(
      Math.floor(Math.random() * 2),
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 1 + 2
    );
  }
  panel.update();
  panel.render();
  for (var i = 0; i < aFireworks.length; i++) {
    aFireworks[i].update();
    aFireworks[i].render(ctx);
    if (aFireworks[i].removeMe) {
      aFireworks.splice(i, 1);
      i -= 1;
    }
  }
  requestAnimFrame(updateChallengeFail);
}
function updateSplashScreenEvent() {
  if (gameState != "splash") {
    return;
  }
  delta = getDelta();
  splashTimer += delta;
  if (splashTimer > 2.5) {
    if (audioType == 1 && !muted) {
      playMusic();
      if (!hasFocus) {
        music.pause();
      }
    }
    initStartScreen();
    return;
  }
  background.render();
  panel.update();
  panel.render();
  requestAnimFrame(updateSplashScreenEvent);
}
function updateStartScreenEvent() {
  if (gameState != "start") {
    return;
  }
  delta = getDelta();
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height);
  archeryView.update();
  archeryView.render();
  for (var i = 0; i < aDrifters.length; i++) {
    aDrifters[i].update();
    aDrifters[i].render(ctx);
  }
  panel.update();
  panel.render();
  requestAnimFrame(updateStartScreenEvent);
}
function updateLoaderEvent() {
  if (gameState != "load") {
    return;
  }
  delta = getDelta();
  assetLib.render();
  requestAnimFrame(updateLoaderEvent);
}
function updatePauseEvent() {
  if (gameState != "pause") {
    return;
  }
  delta = getDelta();
  background.render();
  panel.render();
  requestAnimFrame(updatePauseEvent);
}
function getDelta() {
  if(window.famobi.paused) {
    return 0;
  }
  var currentTime = new Date().getTime();
  var deltaTemp = (currentTime - previousTime) / 1000;
  previousTime = currentTime;
  if (deltaTemp > 0.5) {
    deltaTemp = 0;
  }
  return deltaTemp;
}
function checkSpriteCollision(_s1, _s2) {
  var s1XOffset = _s1.x;
  var s1YOffset = _s1.y;
  var s2XOffset = _s2.x;
  var s2YOffset = _s2.y;
  var distance_squared =
    (s1XOffset - s2XOffset) * (s1XOffset - s2XOffset) +
    (s1YOffset - s2YOffset) * (s1YOffset - s2YOffset);
  var radii_squared = _s1.radius * _s2.radius;
  if (distance_squared < radii_squared) {
    return true;
  } else {
    return false;
  }
}
function getScaleImageToMax(_oImgData, _aLimit) {
  var newScale;
  if (_oImgData.isSpriteSheet) {
    if (
      _aLimit[0] / _oImgData.oData.spriteWidth <
      _aLimit[1] / _oImgData.oData.spriteHeight
    ) {
      newScale = Math.min(_aLimit[0] / _oImgData.oData.spriteWidth, 1);
    } else {
      newScale = Math.min(_aLimit[1] / _oImgData.oData.spriteHeight, 1);
    }
  } else {
    if (_aLimit[0] / _oImgData.img.width < _aLimit[1] / _oImgData.img.height) {
      newScale = Math.min(_aLimit[0] / _oImgData.img.width, 1);
    } else {
      newScale = Math.min(_aLimit[1] / _oImgData.img.height, 1);
    }
  }
  return newScale;
}
function getCentreFromTopLeft(_aTopLeft, _oImgData, _imgScale) {
  var aCentre = new Array();
  aCentre.push(_aTopLeft[0] + (_oImgData.oData.spriteWidth / 2) * _imgScale);
  aCentre.push(_aTopLeft[1] + (_oImgData.oData.spriteHeight / 2) * _imgScale);
  return aCentre;
}
function loadPreAssets() {
  if (aLangs.length > 1) {
    var aLangLoadData = new Array();
    for (var i = 0; i < aLangs.length; i++) {
      aLangLoadData.push({
        id: "lang" + aLangs[i],
        file: "images/lang" + aLangs[i] + ".png",
      });
    }
    preAssetLib = new Utils.AssetLoader(
      curLang,
      aLangLoadData,
      ctx,
      canvas.width,
      canvas.height,
      false
    );
    preAssetLib.onReady(initLangSelect);
  } else {
    curLang = aLangs[0];
    preAssetLib = new Utils.AssetLoader(
      curLang,
      [
        {
          id: "loader",
          file: "images/loader.png",
        },
        {
          id: "loadSpinner",
          file: "images/loadSpinner.png",
        },
      ],
      ctx,
      canvas.width,
      canvas.height,
      false
    );
    preAssetLib.onReady(initLoadAssets);
  }
}
function initLangSelect() {
  var oImgData;
  var j;
  var k;
  var gap = 10;
  var tileWidthNum = 0;
  var tileHeightNum = 0;
  var butScale = 1;
  for (var i = 0; i < aLangs.length; i++) {
    oImgData = preAssetLib.getData("lang" + aLangs[i]);
    if (
      (i + 1) * (oImgData.img.width * butScale) + (i + 2) * gap <
      canvas.width
    ) {
      tileWidthNum++;
    } else {
      break;
    }
  }
  tileHeightNum = Math.ceil(aLangs.length / tileWidthNum);
  for (var i = 0; i < aLangs.length; i++) {
    oImgData = preAssetLib.getData("lang" + aLangs[i]);
    j =
      canvas.width / 2 -
      (tileWidthNum / 2) * (oImgData.img.width * butScale) -
      ((tileWidthNum - 1) / 2) * gap;
    j += (i % tileWidthNum) * (oImgData.img.width * butScale + gap);
    k =
      canvas.height / 2 -
      (tileHeightNum / 2) * (oImgData.img.height * butScale) -
      ((tileHeightNum - 1) / 2) * gap;
    k +=
      (Math.floor(i / tileWidthNum) % tileHeightNum) *
      (oImgData.img.height * butScale + gap);
    ctx.drawImage(
      oImgData.img,
      0,
      0,
      oImgData.img.width,
      oImgData.img.height,
      j,
      k,
      oImgData.img.width * butScale,
      oImgData.img.height * butScale
    );
    var oBut = {
      oImgData: oImgData,
      aPos: [
        j + (oImgData.img.width * butScale) / 2,
        k + (oImgData.img.height * butScale) / 2,
      ],
      scale: butScale,
      id: "none",
      noMove: true,
    };
    userInput.addHitArea(
      "langSelect",
      butEventHandler,
      {
        lang: aLangs[i],
      },
      "image",
      oBut
    );
  }
}
function initLoadAssets() {
  loadAssets();
}
function loadAssets() {
  var mg;
  try {
    mg = window.famobi.getBrandingButtonImage();
  } catch (e) {
    mg = "images/BrandingPlaceholderButton.png";
  }

  var cp = "images/cross-promo-btn.png";

  assetLib = new Utils.AssetLoader(
    curLang,
    [
      {
        id: "background",
        file: "images/bgMain.jpg",
      },
      {
        id: "splashLogo",
        file: "images/splashLogo.png",
      },
      {
        id: "flare",
        file: "images/flare.png",
      },
      {
        id: "copyright",
        file: "images/copyright.png",
      },
      {
        id: "uiButs",
        file: "images/uiButs.png",
        oAtlasData: {
          id0: {
            x: 375,
            y: 0,
            width: 58,
            height: 64,
          },
          id1: {
            x: 139,
            y: 364,
            width: 65,
            height: 66,
          },
          id10: {
            x: 278,
            y: 218,
            width: 136,
            height: 98,
          },
          id11: {
            x: 172,
            y: 0,
            width: 136,
            height: 98,
          },
          id12: {
            x: 0,
            y: 280,
            width: 137,
            height: 87,
          },
          id13: {
            x: 0,
            y: 134,
            width: 159,
            height: 144,
          },
          id2: {
            x: 310,
            y: 0,
            width: 63,
            height: 65,
          },
          id3: {
            x: 0,
            y: 0,
            width: 170,
            height: 132,
          },
          id4: {
            x: 139,
            y: 280,
            width: 137,
            height: 82,
          },
          id5: {
            x: 161,
            y: 134,
            width: 137,
            height: 82,
          },
          id6: {
            x: 0,
            y: 369,
            width: 96,
            height: 58,
          },
          id7: {
            x: 206,
            y: 364,
            width: 64,
            height: 68,
          },
          id8: {
            x: 300,
            y: 100,
            width: 96,
            height: 81,
          },
          id9: {
            x: 278,
            y: 318,
            width: 136,
            height: 83,
          },
        },
      },
      {
        id: window.famobi.hasFeature("leaderboard")
          ? "uiElements"
          : "uiElements2",
        file: window.famobi.hasFeature("leaderboard")
          ? "images/uiElements.png"
          : "images/uiElements2.png",
        oAtlasData: {
          id0: {
            x: 0,
            y: 0,
            width: 528,
            height: 137,
          },
          id1: {
            x: 561,
            y: 993,
            width: 185,
            height: 149,
          },
          id10: {
            x: 0,
            y: 865,
            width: 255,
            height: 83,
          },
          id11: {
            x: 0,
            y: 950,
            width: 240,
            height: 43,
          },
          id12: {
            x: 652,
            y: 0,
            width: 120,
            height: 133,
          },
          id13: {
            x: 937,
            y: 175,
            width: 119,
            height: 173,
          },
          id14: {
            x: 870,
            y: 842,
            width: 120,
            height: 200,
          },
          id15: {
            x: 0,
            y: 139,
            width: 472,
            height: 361,
          },
          id16: {
            x: 561,
            y: 842,
            width: 185,
            height: 149,
          },
          id17: {
            x: 0,
            y: 995,
            width: 185,
            height: 149,
          },
          id18: {
            x: 374,
            y: 865,
            width: 185,
            height: 149,
          },
          id19: {
            x: 257,
            y: 865,
            width: 108,
            height: 104,
          },
          id2: {
            x: 187,
            y: 995,
            width: 185,
            height: 149,
          },
          id20: {
            x: 937,
            y: 350,
            width: 86,
            height: 68,
          },
          id21: {
            x: 530,
            y: 0,
            width: 120,
            height: 133,
          },
          id22: {
            x: 937,
            y: 0,
            width: 119,
            height: 173,
          },
          id23: {
            x: 748,
            y: 842,
            width: 120,
            height: 200,
          },
          id24: {
            x: 474,
            y: 139,
            width: 461,
            height: 350,
          },
          id25: {
            x: 824,
            y: 491,
            width: 348,
            height: 349,
          },
          id26: {
            x: 474,
            y: 491,
            width: 348,
            height: 349,
          },
          id27: {
            x: 858,
            y: 1125,
            width: 34,
            height: 40,
          },
          id28: {
            x: 1030,
            y: 924,
            width: 79,
            height: 193,
          },
          id3: {
            x: 374,
            y: 1016,
            width: 185,
            height: 149,
          },
          id4: {
            x: 748,
            y: 1044,
            width: 108,
            height: 104,
          },
          id5: {
            x: 858,
            y: 1044,
            width: 87,
            height: 70,
          },
          id6: {
            x: 774,
            y: 0,
            width: 88,
            height: 131,
          },
          id7: {
            x: 947,
            y: 1044,
            width: 81,
            height: 79,
          },
          id8: {
            x: 992,
            y: 842,
            width: 81,
            height: 80,
          },
          id9: {
            x: 0,
            y: 502,
            width: 472,
            height: 361,
          },
        },
      },
      {
        id: "gameElements",
        file: "images/gameElements.png",
        oAtlasData: {
          id0: {
            x: 554,
            y: 753,
            width: 274,
            height: 274,
          },
          id1: {
            x: 0,
            y: 246,
            width: 508,
            height: 229,
          },
          id10: {
            x: 680,
            y: 472,
            width: 169,
            height: 121,
          },
          id11: {
            x: 1389,
            y: 1348,
            width: 74,
            height: 123,
          },
          id12: {
            x: 1210,
            y: 992,
            width: 101,
            height: 126,
          },
          id13: {
            x: 1288,
            y: 1348,
            width: 99,
            height: 126,
          },
          id14: {
            x: 1288,
            y: 1120,
            width: 101,
            height: 124,
          },
          id15: {
            x: 1134,
            y: 865,
            width: 105,
            height: 125,
          },
          id16: {
            x: 1344,
            y: 798,
            width: 95,
            height: 122,
          },
          id17: {
            x: 1096,
            y: 1019,
            width: 112,
            height: 128,
          },
          id18: {
            x: 1313,
            y: 991,
            width: 98,
            height: 127,
          },
          id19: {
            x: 1241,
            y: 865,
            width: 101,
            height: 124,
          },
          id2: {
            x: 982,
            y: 0,
            width: 150,
            height: 1017,
          },
          id20: {
            x: 510,
            y: 246,
            width: 224,
            height: 224,
          },
          id21: {
            x: 830,
            y: 1052,
            width: 150,
            height: 187,
          },
          id22: {
            x: 736,
            y: 167,
            width: 151,
            height: 150,
          },
          id23: {
            x: 761,
            y: 1305,
            width: 151,
            height: 150,
          },
          id24: {
            x: 889,
            y: 315,
            width: 85,
            height: 86,
          },
          id25: {
            x: 0,
            y: 0,
            width: 700,
            height: 244,
          },
          id26: {
            x: 889,
            y: 130,
            width: 91,
            height: 90,
          },
          id27: {
            x: 1285,
            y: 0,
            width: 145,
            height: 796,
          },
          id28: {
            x: 1134,
            y: 0,
            width: 149,
            height: 752,
          },
          id29: {
            x: 554,
            y: 1305,
            width: 205,
            height: 75,
          },
          id3: {
            x: 0,
            y: 477,
            width: 401,
            height: 387,
          },
          id30: {
            x: 554,
            y: 1459,
            width: 205,
            height: 75,
          },
          id31: {
            x: 333,
            y: 866,
            width: 205,
            height: 75,
          },
          id32: {
            x: 554,
            y: 1382,
            width: 205,
            height: 75,
          },
          id33: {
            x: 1432,
            y: 0,
            width: 63,
            height: 66,
          },
          id34: {
            x: 1409,
            y: 922,
            width: 63,
            height: 66,
          },
          id35: {
            x: 1344,
            y: 922,
            width: 63,
            height: 66,
          },
          id36: {
            x: 1390,
            y: 1246,
            width: 63,
            height: 66,
          },
          id37: {
            x: 1413,
            y: 990,
            width: 63,
            height: 66,
          },
          id38: {
            x: 1391,
            y: 1120,
            width: 63,
            height: 66,
          },
          id39: {
            x: 889,
            y: 403,
            width: 63,
            height: 66,
          },
          id4: {
            x: 1465,
            y: 1120,
            width: 25,
            height: 358,
          },
          id40: {
            x: 0,
            y: 988,
            width: 275,
            height: 274,
          },
          id41: {
            x: 830,
            y: 900,
            width: 150,
            height: 150,
          },
          id42: {
            x: 875,
            y: 1496,
            width: 36,
            height: 37,
          },
          id43: {
            x: 1096,
            y: 1149,
            width: 36,
            height: 37,
          },
          id44: {
            x: 875,
            y: 1457,
            width: 36,
            height: 37,
          },
          id45: {
            x: 495,
            y: 943,
            width: 36,
            height: 37,
          },
          id46: {
            x: 457,
            y: 943,
            width: 36,
            height: 37,
          },
          id47: {
            x: 876,
            y: 1241,
            width: 36,
            height: 37,
          },
          id48: {
            x: 419,
            y: 943,
            width: 36,
            height: 37,
          },
          id49: {
            x: 702,
            y: 0,
            width: 163,
            height: 165,
          },
          id5: {
            x: 0,
            y: 866,
            width: 331,
            height: 120,
          },
          id50: {
            x: 1432,
            y: 68,
            width: 35,
            height: 205,
          },
          id51: {
            x: 1432,
            y: 275,
            width: 35,
            height: 205,
          },
          id52: {
            x: 1432,
            y: 482,
            width: 35,
            height: 205,
          },
          id53: {
            x: 449,
            y: 818,
            width: 44,
            height: 45,
          },
          id54: {
            x: 403,
            y: 818,
            width: 44,
            height: 45,
          },
          id55: {
            x: 830,
            y: 1241,
            width: 44,
            height: 45,
          },
          id56: {
            x: 495,
            y: 818,
            width: 44,
            height: 45,
          },
          id57: {
            x: 333,
            y: 943,
            width: 41,
            height: 21,
          },
          id58: {
            x: 1288,
            y: 1246,
            width: 100,
            height: 100,
          },
          id59: {
            x: 1134,
            y: 754,
            width: 109,
            height: 109,
          },
          id6: {
            x: 517,
            y: 753,
            width: 10,
            height: 54,
          },
          id60: {
            x: 889,
            y: 222,
            width: 91,
            height: 91,
          },
          id61: {
            x: 851,
            y: 536,
            width: 102,
            height: 47,
          },
          id62: {
            x: 1066,
            y: 1344,
            width: 103,
            height: 47,
          },
          id63: {
            x: 833,
            y: 595,
            width: 128,
            height: 136,
          },
          id64: {
            x: 914,
            y: 1393,
            width: 123,
            height: 124,
          },
          id65: {
            x: 376,
            y: 943,
            width: 41,
            height: 21,
          },
          id66: {
            x: 1180,
            y: 1149,
            width: 106,
            height: 360,
          },
          id67: {
            x: 277,
            y: 988,
            width: 275,
            height: 274,
          },
          id68: {
            x: 736,
            y: 319,
            width: 151,
            height: 150,
          },
          id69: {
            x: 554,
            y: 1029,
            width: 274,
            height: 274,
          },
          id7: {
            x: 1413,
            y: 1058,
            width: 59,
            height: 60,
          },
          id70: {
            x: 914,
            y: 1241,
            width: 150,
            height: 150,
          },
          id71: {
            x: 403,
            y: 477,
            width: 275,
            height: 274,
          },
          id72: {
            x: 0,
            y: 1264,
            width: 275,
            height: 274,
          },
          id73: {
            x: 277,
            y: 1264,
            width: 275,
            height: 274,
          },
          id74: {
            x: 680,
            y: 595,
            width: 151,
            height: 150,
          },
          id75: {
            x: 851,
            y: 471,
            width: 112,
            height: 63,
          },
          id76: {
            x: 867,
            y: 0,
            width: 112,
            height: 63,
          },
          id77: {
            x: 867,
            y: 65,
            width: 112,
            height: 63,
          },
          id78: {
            x: 982,
            y: 1019,
            width: 112,
            height: 63,
          },
          id79: {
            x: 761,
            y: 1457,
            width: 112,
            height: 63,
          },
          id8: {
            x: 529,
            y: 753,
            width: 6,
            height: 25,
          },
          id80: {
            x: 982,
            y: 1149,
            width: 112,
            height: 63,
          },
          id81: {
            x: 1039,
            y: 1458,
            width: 112,
            height: 63,
          },
          id82: {
            x: 1039,
            y: 1393,
            width: 112,
            height: 63,
          },
          id83: {
            x: 1066,
            y: 1214,
            width: 112,
            height: 63,
          },
          id84: {
            x: 1066,
            y: 1279,
            width: 112,
            height: 63,
          },
          id85: {
            x: 982,
            y: 1084,
            width: 112,
            height: 63,
          },
          id86: {
            x: 403,
            y: 753,
            width: 112,
            height: 63,
          },
          id9: {
            x: 830,
            y: 747,
            width: 150,
            height: 151,
          },
        },
      },
      {
        id: "horizon0",
        file: "images/horizon0.jpg",
      },
      {
        id: "horizon1",
        file: "images/horizon1.jpg",
      },
      {
        id: "horizon2",
        file: "images/horizon2.jpg",
      },
      {
        id: "horizon3",
        file: "images/horizon3.jpg",
      },
      {
        id: "horizon4",
        file: "images/horizon4.jpg",
      },
      {
        id: "ground0",
        file: "images/ground0.jpg",
      },
      {
        id: "ground1",
        file: "images/ground1.jpg",
      },
      {
        id: "ground2",
        file: "images/ground2.jpg",
      },
      {
        id: "ground3",
        file: "images/ground3.jpg",
      },
      {
        id: "ground4",
        file: "images/ground4.jpg",
      },
      {
        id: "scrollGround0",
        file: "images/scrollGround0.jpg",
      },
      {
        id: "scrollGround1",
        file: "images/scrollGround1.jpg",
      },
      {
        id: "scrollGround2",
        file: "images/scrollGround2.jpg",
      },
      {
        id: "scrollGround3",
        file: "images/scrollGround3.jpg",
      },
      {
        id: "scrollGround4",
        file: "images/scrollGround4.jpg",
      },
      {
        id: "map",
        file: "images/mapBg.jpg",
      },
      {
        id: "numbersBlue",
        file: "images/numbersBlue_51x63.png",
      },
      {
        id: "numbersGreen",
        file: "images/numbersGreen_51x63.png",
      },
      {
        id: "numbersRed",
        file: "images/numbersRed_51x63.png",
      },
      {
        id: "numbersLevel",
        file: "images/numbersLevel_21x37.png",
      },
      {
        id: "firework0",
        file: "images/firework0_150x150.png",
        oAnims: {
          explode: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        },
      },
      {
        id: "firework1",
        file: "images/firework1_175x175.png",
        oAnims: {
          explode: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
            19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
          ],
        },
      },
      {
        id: "balloonPop",
        file: "images/balloonPop_86x85.png",
        oAnims: {
          explode0: [0, 1, 2, 3, 4],
          explode1: [5, 6, 7, 8, 9],
          explode2: [10, 11, 12, 13, 14],
          explode3: [15, 16, 17, 18, 19],
          explode4: [20, 21, 22, 23, 24],
          explode5: [25, 26, 27, 28, 29],
          explode6: [30, 31, 32, 33, 34],
        },
      },
      {
        id: "drifters",
        file: "images/drifters_210x194.png",
        oAnims: {
          ambient: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 16,
            15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
          ],
        },
      },
      {
        id: "trees",
        file: "images/trees.png",
        oAtlasData: {
          id0: {
            x: 0,
            y: 0,
            width: 289,
            height: 388,
          },
          id1: {
            x: 855,
            y: 840,
            width: 283,
            height: 390,
          },
          id10: {
            x: 1140,
            y: 0,
            width: 273,
            height: 534,
          },
          id11: {
            x: 1140,
            y: 1072,
            width: 273,
            height: 534,
          },
          id12: {
            x: 285,
            y: 789,
            width: 283,
            height: 357,
          },
          id13: {
            x: 0,
            y: 1148,
            width: 283,
            height: 356,
          },
          id14: {
            x: 0,
            y: 789,
            width: 283,
            height: 357,
          },
          id2: {
            x: 0,
            y: 390,
            width: 284,
            height: 397,
          },
          id3: {
            x: 855,
            y: 420,
            width: 283,
            height: 418,
          },
          id4: {
            x: 570,
            y: 426,
            width: 283,
            height: 417,
          },
          id5: {
            x: 576,
            y: 0,
            width: 283,
            height: 418,
          },
          id6: {
            x: 570,
            y: 845,
            width: 283,
            height: 424,
          },
          id7: {
            x: 285,
            y: 1148,
            width: 283,
            height: 424,
          },
          id8: {
            x: 291,
            y: 0,
            width: 283,
            height: 424,
          },
          id9: {
            x: 1140,
            y: 536,
            width: 273,
            height: 534,
          },
        },
      },
      {
        id: "tutorial",
        file: "images/tutorial_264x261.png",
        oAnims: {
          tut0: [
            0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9, 9, 10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 20, 20, 21, 22, 23, 24, 25,
            26, 27, 28, 29, 30, 31, 32, 33, 33, 33, 33, 33, 34, 35, 36, 37, 38,
          ],
          tut1: [
            39, 40, 41, 42, 43, 44, 45, 46, 45, 44, 43, 44, 45, 46, 45, 44, 43,
            44, 45, 46,
          ],
        },
      },
      {
        id: "bird",
        file: "images/bird_12x10.png",
        oAnims: {
          fly: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        },
      },
      {
        id: "moreGamesBut",
        file: mg,
      },
      {
        id: "crossPromoBut",
        file: cp,
      },
    ],
    ctx,
    canvas.width,
    canvas.height
  );
  oImageIds.infoBut = "id0";
  oImageIds.muteBut1 = "id1";
  oImageIds.muteBut0 = "id2";
  oImageIds.playBut1 = "id3";
  oImageIds.moreGamesBut = "id4";
  oImageIds.crossPromoBut = "id4";
  oImageIds.mapBut = "id5";
  oImageIds.backBut = "id6";
  oImageIds.pauseBut = "id7";
  oImageIds.resetBut = "id8";
  oImageIds.nextBut = "id9";
  oImageIds.restart0But = "id10";
  oImageIds.restart1But = "id11";
  oImageIds.quitBut = "id12";
  oImageIds.playBut0 = "id13";
  oImageIds.titleLogo = "id0";
  oImageIds.mapBut2 = "id1";
  oImageIds.mapBut3 = "id2";
  oImageIds.mapBut4 = "id3";
  oImageIds.mapBut1 = "id4";
  oImageIds.mapBut0 = "id5";
  oImageIds.fingerPoint = "id6";
  oImageIds.fadeBorderBottom = "id7";
  oImageIds.fadeBorderTop = "id8";
  oImageIds.bluePanel = "id9";
  oImageIds.scoreBgWin = "id10";
  oImageIds.quiver = "id11";
  oImageIds.scoreTarget0 = "id12";
  oImageIds.scoreTarget1 = "id13";
  oImageIds.scoreTarget2 = "id14";
  oImageIds.losePanel = "id15";
  oImageIds.mapBut7 = "id16";
  oImageIds.mapBut8 = "id17";
  oImageIds.mapBut9 = "id18";
  oImageIds.mapBut6 = "id19";
  oImageIds.mapBut5 = "id20";
  oImageIds.balloonTarget0 = "id21";
  oImageIds.balloonTarget1 = "id22";
  oImageIds.balloonTarget2 = "id23";
  oImageIds.challengePanel = "id24";
  oImageIds.tutBg0 = "id25";
  oImageIds.tutBg1 = "id26";
  oImageIds.miniCup = "id27";
  oImageIds.highscoreTable = "id28";
  oImageIds.target0 = "id0";
  oImageIds.stand = "id1";
  oImageIds.bowMiddle = "id2";
  oImageIds.arrowInBow = "id3";
  oImageIds.arrowInFlight = "id4";
  oImageIds.scope0 = "id5";
  oImageIds.arrowShadow = "id6";
  oImageIds.missCross = "id7";
  oImageIds.flushArrowHit = "id8";
  oImageIds.targetSmall0 = "id9";
  oImageIds.standSmall = "id10";
  oImageIds.score1 = "id11";
  oImageIds.score2 = "id12";
  oImageIds.score3 = "id13";
  oImageIds.score4 = "id14";
  oImageIds.score5 = "id15";
  oImageIds.score6 = "id16";
  oImageIds.score7 = "id17";
  oImageIds.score8 = "id18";
  oImageIds.score9 = "id19";
  oImageIds.score10 = "id20";
  oImageIds.windPanel = "id21";
  oImageIds.targetSmall5 = "id22";
  oImageIds.targetSmall6 = "id23";
  oImageIds.scoreBgGame = "id24";
  oImageIds.scoreDiagBg = "id25";
  oImageIds.quiverBgGame = "id26";
  oImageIds.bowTop = "id27";
  oImageIds.bowBottom = "id28";
  oImageIds.distMarker0 = "id29";
  oImageIds.distMarker1 = "id30";
  oImageIds.distMarker2 = "id31";
  oImageIds.distMarker3 = "id32";
  oImageIds.balloon0 = "id33";
  oImageIds.balloon1 = "id34";
  oImageIds.balloon2 = "id35";
  oImageIds.balloon3 = "id36";
  oImageIds.balloon4 = "id37";
  oImageIds.balloon5 = "id38";
  oImageIds.balloon6 = "id39";
  oImageIds.target3 = "id40";
  oImageIds.targetSmall3 = "id41";
  oImageIds.balloonSmall0 = "id42";
  oImageIds.balloonSmall1 = "id43";
  oImageIds.balloonSmall2 = "id44";
  oImageIds.balloonSmall3 = "id45";
  oImageIds.balloonSmall4 = "id46";
  oImageIds.balloonSmall5 = "id47";
  oImageIds.balloonSmall6 = "id48";
  oImageIds.balloonScore = "id49";
  oImageIds.progressBar0 = "id50";
  oImageIds.progressBar1 = "id51";
  oImageIds.progressBar2 = "id52";
  oImageIds.progressMarker0 = "id53";
  oImageIds.progressMarker1 = "id54";
  oImageIds.progressMarker2 = "id55";
  oImageIds.progressMarker3 = "id56";
  oImageIds.progressNumBg0 = "id57";
  oImageIds.lensFlare0 = "id58";
  oImageIds.lensFlare1 = "id59";
  oImageIds.lensFlare2 = "id60";
  oImageIds.fadeBorder0 = "id61";
  oImageIds.fadeBorder1 = "id62";
  oImageIds.thumbsUp = "id63";
  oImageIds.score0 = "id64";
  oImageIds.progressNumBg1 = "id65";
  oImageIds.arrowInFlightSpecial = "id66";
  oImageIds.target2 = "id67";
  oImageIds.targetSmall2 = "id68";
  oImageIds.target1 = "id69";
  oImageIds.targetSmall1 = "id70";
  oImageIds.target4 = "id71";
  oImageIds.target5 = "id72";
  oImageIds.target6 = "id73";
  oImageIds.targetSmall4 = "id74";
  oImageIds.windArrow00 = "id75";
  oImageIds.windArrow01 = "id76";
  oImageIds.windArrow02 = "id77";
  oImageIds.windArrow03 = "id78";
  oImageIds.windArrow04 = "id79";
  oImageIds.windArrow05 = "id80";
  oImageIds.windArrow10 = "id81";
  oImageIds.windArrow11 = "id82";
  oImageIds.windArrow12 = "id83";
  oImageIds.windArrow13 = "id84";
  oImageIds.windArrow14 = "id85";
  oImageIds.windArrow15 = "id86";
  oImageIds.tree00 = "id0";
  oImageIds.tree01 = "id1";
  oImageIds.tree02 = "id2";
  oImageIds.tree10 = "id3";
  oImageIds.tree11 = "id4";
  oImageIds.tree12 = "id5";
  oImageIds.tree20 = "id6";
  oImageIds.tree21 = "id7";
  oImageIds.tree22 = "id8";
  oImageIds.tree30 = "id9";
  oImageIds.tree31 = "id10";
  oImageIds.tree32 = "id11";
  oImageIds.tree40 = "id12";
  oImageIds.tree41 = "id13";
  oImageIds.tree42 = "id14";
  assetLib.onReady(initSplash);
  gameState = "load";
  previousTime = new Date().getTime();
  updateLoaderEvent();
}
function resizeCanvas() {
  var tempInnerWidth = fenster.innerWidth;
  var tempInnerHeight = fenster.innerHeight;
  canvas.height = tempInnerHeight;
  canvas.width = tempInnerWidth;
  canvas.style.width = tempInnerWidth + "px";
  canvas.style.height = tempInnerHeight + "px";
  if (tempInnerWidth > tempInnerHeight) {
    if (canvas.height < minSquareSize) {
      canvas.height = minSquareSize;
      canvas.width = minSquareSize * (tempInnerWidth / tempInnerHeight);
      canvasScale = minSquareSize / tempInnerHeight;
    } else if (canvas.height > maxSquareSize) {
      canvas.height = maxSquareSize;
      canvas.width = maxSquareSize * (tempInnerWidth / tempInnerHeight);
      canvasScale = maxSquareSize / tempInnerHeight;
    } else {
      canvasScale = 1;
    }
  } else {
    if (canvas.width < minSquareSize) {
      canvas.width = minSquareSize;
      canvas.height = minSquareSize * (tempInnerHeight / tempInnerWidth);
      canvasScale = minSquareSize / tempInnerWidth;
    } else if (canvas.width > maxSquareSize) {
      canvas.width = maxSquareSize;
      canvas.height = maxSquareSize * (tempInnerHeight / tempInnerWidth);
      canvasScale = maxSquareSize / tempInnerWidth;
    } else {
      canvasScale = 1;
    }
  }
  if (gameState == "game") {
    if (!bow.isHeld) {
      userInput.removeHitArea("gameTouch");
      userInput.addHitArea(
        "gameTouch",
        butEventHandler,
        {
          isDraggable: true,
          multiTouch: true,
        },
        "rect",
        {
          aRect: [0, 65, canvas.width, canvas.height],
        },
        true
      );
    }
  } else if (gameState == "map") {
    userInput.removeHitArea("mapTouch");
    userInput.addHitArea(
      "mapTouch",
      butEventHandler,
      {
        isDraggable: true,
        multiTouch: true,
      },
      "rect",
      {
        aRect: [0, 0, canvas.width, canvas.height],
      },
      true
    );
    mapScale = 1;
    if (canvas.width > 1446) {
      mapScale = canvas.width / 1446;
    }
    if (canvas.height > 1111) {
      mapScale = Math.max(canvas.height / 1111, mapScale);
    }
    var tempLevel = saveDataHandler.getLastUnlockedLevel();
    if (tempLevel == -1) {
      tempLevel = 50 - 1;
    }
    mapPosX = mapPosRealX = Math.max(
      Math.min(
        aLevelData[tempLevel].mapX - canvas.width / 2,
        1446 - canvas.width
      ),
      0
    );
    mapPosY = mapPosRealY = Math.max(
      Math.min(
        aLevelData[tempLevel].mapY - canvas.height / 2,
        1111 - canvas.height
      ),
      0
    );
  } else if (
    gameState == "levelPreview" ||
    gameState == "levelSuccess" ||
    gameState == "levelFail" ||
    gameState == "challengeFail"
  ) {
    mapScale = 1;
    if (canvas.width > 1446) {
      mapScale = canvas.width / 1446;
    }
    if (canvas.height > 1111) {
      mapScale = Math.max(canvas.height / 1111, mapScale);
    }
    var tempLevel = saveDataHandler.getLastUnlockedLevel();
    if (tempLevel == -1) {
      tempLevel = 50 - 1;
    }
    mapPosX = mapPosRealX = Math.max(
      Math.min(
        aLevelData[tempLevel].mapX - canvas.width / 2,
        1446 - canvas.width
      ),
      0
    );
    mapPosY = mapPosRealY = Math.max(
      Math.min(
        aLevelData[tempLevel].mapY - canvas.height / 2,
        1111 - canvas.height
      ),
      0
    );
  }
  window.scrollTo(0, 0);
}
function playSound(_id) {
  if (audioType == 1) {
    sound.play(_id);
  }
}
function toggleMute(skipTrackEvent) {
  muted = !muted;
  if (audioType == 1) {
    if (muted) {
      Howler.mute(true);
      music.pause();

      if (!skipTrackEvent) {
        window.famobi_analytics.trackEvent("EVENT_VOLUMECHANGE", {
          bgmVolume: 0,
          sfxVolume: 0,
        });
        window.famobi.localStorage.setItem("muted", "1");
      }
    } else {
      Howler.mute(false);
      playMusic();
      sound._volume = masterVolume;
      if (gameState == "game") {
        music.volume(0.5 * masterVolume);
      } else {
        music.volume(0.25 * masterVolume);
      }
      if (!skipTrackEvent) {
        window.famobi_analytics.trackEvent("EVENT_VOLUMECHANGE", {
          bgmVolume: 1 * masterVolume,
          sfxVolume: 1 * masterVolume,
        });
        window.famobi.localStorage.removeItem("muted");
      }
    }
  } else if (audioType == 2) {
    if (muted) {
      music.pause();
    } else {
      playMusic();
    }
  }
}
