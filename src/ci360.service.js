'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ci = require('./ci360.utils');

var _ci2 = require('./ci360.constants');
const { forEach } = require('lodash');

require('./static/css/style.css');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CI360Viewer = function () {
  function CI360Viewer(container, fullscreen, ratio) {
    _classCallCheck(this, CI360Viewer);

    this.container = container;
    this.movementStart = { x: 0, y: 0 };
    this.isStartSpin = false;
    this.movingDirection = _ci2.ORIENTATIONS.CENTER;
    this.isClicked = false;
    this.loadedImagesX = 0;
    this.loadedImagesY = 0;
    this.imagesLoaded = false;
    this.reversed = false;
    this.fullscreenView = !!fullscreen;
    this.ratio = ratio;
    this.imagesX = [];
    this.imagesY = [];
    this.resizedImagesX = [];
    this.resizedImagesY = [];
    this.originalImagesX = [];
    this.originalImagesY = [];
    this.devicePixelRatio = Math.round(window.devicePixelRatio || 1);
    this.isMobile = !!('ontouchstart' in window || navigator.msMaxTouchPoints);
    this.id = container.id;
    this.init(container);
    this.clickedToZoom = false;
    this.isMagnifyOpen = false;
    this.isDragged = false;
    this.startPointerZoom = false;
    this.zoomIntensity = 0;
    this.mouseTracked = false;
    this.intialPositions = { x: 0, y: 0 };
    this.pointerCurrentPosition = { x: 0, y: 0 };
    this.startPinchZoom = false;
    this.prevDistanceBetweenFingers = 0;
  }

  _createClass(CI360Viewer, [{
    key: 'mouseDown',
    value: function mouseDown(event) {
      event.preventDefault();

      var pageX = event.pageX,
          pageY = event.pageY;


      if (!this.imagesLoaded) return;

      this.hideInitialIcons();

      if (this.autoplay || this.loopTimeoutId) {
        this.stop();
        this.autoplay = false;
      }

      this.intialPositions = { x: pageX, y: pageY };
      this.movementStart = { x: pageX, y: pageY };
      this.isClicked = true;
      this.isDragged = false;
    }
  }, {
    key: 'mouseUp',
    value: function mouseUp() {
      if (!this.imagesLoaded || !this.isClicked) return;
      this.movementStart = { x: 0, y: 0 };
      this.isStartSpin = false;
      this.isClicked = false;

      if (!this.clickedToZoom) {
        this.container.style.cursor = 'grab';
      } else {
        this.container.style.cursor = 'nesw-resize';
      }

      if (this.bottomCircle && !this.zoomIntensity) {
        this.show360ViewCircleIcon();
      }
    }
  }, {
    key: 'mouseMove',
    value: function mouseMove(event) {
      if (!this.imagesLoaded) return;

      var pageX = event.pageX,
          pageY = event.pageY;


      if (this.mouseTracked) {
        this.setCursorPosition(event);
      }

      if (this.isClicked) {
        var nextPositions = { x: pageX, y: pageY };

        this.container.style.cursor = 'grabbing';

        this.updateMovingDirection(this.intialPositions, nextPositions);
        this.onMoveHandler(event);

        this.isDragged = true;
      } else if (this.zoomIntensity) {
        this.update();
      }
    }
  }, {
    key: 'updateMovingDirection',
    value: function updateMovingDirection(prevPosition, nextPositions) {
      if (this.isStartSpin) return;

      var differenceInPositionX = Math.abs(prevPosition.x - nextPositions.x);
      var differenceInPositionY = Math.abs(prevPosition.y - nextPositions.y);
      var sensitivity = 10;

      if (differenceInPositionX > sensitivity) this.movingDirection = _ci2.ORIENTATIONS.X;

      if (differenceInPositionY > sensitivity && this.allowSpinY) this.movingDirection = _ci2.ORIENTATIONS.Y;
    }
  }, {
    key: 'mouseClick',
    value: function mouseClick(event) {
      if (!this.isDragged && this.clickedToZoom) {
        this.resetZoom();
      } else if (!this.isDragged) {
        this.clickedToZoom = true;
        this.container.style.cursor = 'nesw-resize';
      }
    }
  }, {
    key: 'mouseScroll',
    value: function mouseScroll(event) {
      if (this.disablePointerZoom || this.isMagnifyOpen) return;

      var isClickedToZoom = this.toStartPointerZoom === _ci2.TO_START_POINTER_ZOOM.CLICK_TO_START && this.clickedToZoom;
      var isScrolledToZoom = this.toStartPointerZoom === _ci2.TO_START_POINTER_ZOOM.SCROLL_TO_START;

      if (isClickedToZoom || isScrolledToZoom) {
        this.container.style.cursor = 'nesw-resize';

        this.initMouseScrollZoom(event);
      }
    }
  }, {
    key: 'closeZoomHandler',
    value: function closeZoomHandler() {
      this.container.style.cursor = 'grab';
      this.clickedToZoom = false;
      this.resetZoom();
    }
  }, {
    key: 'touchStart',
    value: function touchStart(event) {
      if (!this.imagesLoaded) return;

      var isPinchZoom = !this.disablePinchZoom && (0, _ci.isTwoFingers)(event) && !this.isMagnifyOpen;

      if (isPinchZoom) {
        this.initAndSetPinchZoom(event);
      };

      this.hideInitialIcons();

      if (this.autoplay || this.loopTimeoutId) {
        this.stop();
        this.autoplay = false;
      }

      this.intialPositions = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      this.movementStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      this.isClicked = true;
    }
  }, {
    key: 'touchEnd',
    value: function touchEnd() {
      if (!this.imagesLoaded) return;

      if (this.zoomIntensity) this.resetZoom();

      this.movementStart = { x: 0, y: 0 };
      this.isStartSpin = false;
      this.isClicked = false;

      if (this.bottomCircle) this.show360ViewCircleIcon();
    }
  }, {
    key: 'touchMove',
    value: function touchMove(event) {
      if (!this.isClicked || !this.imagesLoaded) return;

      if (!this.disablePinchZoom && (0, _ci.isTwoFingers)(event)) {
        this.fingersPinchZoom(event);
      } else {
        var nextPositions = { x: event.touches[0].clientX, y: event.touches[0].clientY };

        this.updateMovingDirection(this.intialPositions, nextPositions);
        this.onMoveHandler(event);
      }
    }
  }, {
    key: 'keyDownGeneral',
    value: function keyDownGeneral(event) {
      if (!this.imagesLoaded) return;

      if (this.glass) {
        this.closeMagnifier();
      }

      if (event.keyCode === 27) {
        //ESC
        if (this.clickedToZoom) {
          this.closeZoomHandler();
        }
      }
    }
  }, {
    key: 'hideInitialIcons',
    value: function hideInitialIcons() {
      if (this.glass) {
        this.closeMagnifier();
      }

      if (this.view360Icon) {
        this.remove360ViewIcon();
      }
    }
  }, {
    key: 'initMouseScrollZoom',
    value: function initMouseScrollZoom(event) {
      if (this.bottomCircle) this.hide360ViewCircleIcon();

      this.hideInitialIcons();
      this.mouseTracked = true;
      this.setCursorPosition(event);
      this.mouseScrollZoom(event);
    }
  }, {
    key: 'setCursorPosition',
    value: function setCursorPosition(event) {
      this.mousePositions = {
        x: event.clientX,
        y: event.clientY
      };
    }
  }, {
    key: 'getCursorPositionInCanvas',
    value: function getCursorPositionInCanvas() {
      var canvasRect = this.canvas.getBoundingClientRect();

      this.pointerCurrentPosition = {
        x: this.mousePositions.x - canvasRect.left,
        y: this.mousePositions.y - canvasRect.top
      };

      return this.pointerCurrentPosition;
    }
  }, {
    key: 'mouseScrollZoom',
    value: function mouseScrollZoom(event) {
      event.preventDefault();

      if (this.autoplay || this.loopTimeoutId) {
        this.stop();
        this.autoplay = false;
      }

      var zoomFactor = (0, _ci.normalizeZoomFactor)(event, this.pointerZoomFactor);
      var maxIntensity = (0, _ci.getMaxZoomIntensity)(this.canvas.width, this.maxScale);
      this.startPointerZoom = true;
      this.zoomIntensity += event.deltaY * zoomFactor;
      this.zoomIntensity = Math.min(Math.max(0, this.zoomIntensity), maxIntensity);

      if (this.zoomIntensity) {
        if (this.resetZoomIcon) this.showResetZoomIcon();
      } else {
        if (this.resetZoomIcon) this.hideResetZoomIcon();

        if (this.bottomCircle) this.show360ViewCircleIcon();

        this.startPointerZoom = false;
        this.mouseTracked = false;
      }

      this.update();
    }
  }, {
    key: 'initAndSetPinchZoom',
    value: function initAndSetPinchZoom(event) {
      if (this.bottomCircle) this.hide360ViewCircleIcon();

      var _getFingersPosition = this.getFingersPosition(event),
          _getFingersPosition2 = _slicedToArray(_getFingersPosition, 2),
          fingerOnePosition = _getFingersPosition2[0],
          fingerTwoPosition = _getFingersPosition2[1];

      this.prevDistanceBetweenFingers = this.getDistanceBetweenFingers(fingerOnePosition, fingerTwoPosition);
    }
  }, {
    key: 'getDistanceBetweenFingers',
    value: function getDistanceBetweenFingers(fingerOne, fingerTwo) {
      var xPosition = fingerTwo.x - fingerOne.x;
      var yPosition = fingerTwo.y - fingerOne.y;

      return Math.sqrt(Math.pow(xPosition, 2) + Math.pow(yPosition, 2));
    }
  }, {
    key: 'updateAveragePositionBetweenFingers',
    value: function updateAveragePositionBetweenFingers(fingerOne, fingerTwo) {
      var containerRect = this.canvas.getBoundingClientRect();
      var offSetX = containerRect.left;
      var offSetY = containerRect.top;

      this.pointerCurrentPosition.x = (fingerOne.x + fingerTwo.x) / 2 - offSetX;

      this.pointerCurrentPosition.y = (fingerOne.y + fingerTwo.y) / 2 - offSetY;
    }
  }, {
    key: 'getFingersPosition',
    value: function getFingersPosition(event) {
      var p1 = event.targetTouches[0];
      var p2 = event.targetTouches[1];

      var fingerOnePosition = { x: p1.clientX, y: p1.clientY };
      var fingerTwoPosition = { x: p2.clientX, y: p2.clientY };

      return [fingerOnePosition, fingerTwoPosition];
    }
  }, {
    key: 'fingersPinchZoom',
    value: function fingersPinchZoom(event) {
      var _getFingersPosition3 = this.getFingersPosition(event),
          _getFingersPosition4 = _slicedToArray(_getFingersPosition3, 2),
          fingerOnePosition = _getFingersPosition4[0],
          fingerTwoPosition = _getFingersPosition4[1];

      var currentDistanceBetweenFingers = this.getDistanceBetweenFingers(fingerOnePosition, fingerTwoPosition);
      var zoomFactor = this.pinchZoomFactor * 30;

      var zoomSensitivity = 1.5;
      var isZoomIn = currentDistanceBetweenFingers > this.prevDistanceBetweenFingers + zoomSensitivity;
      var isZoomOut = currentDistanceBetweenFingers + zoomSensitivity < this.prevDistanceBetweenFingers;
      var maxIntensity = (0, _ci.getMaxZoomIntensity)(this.canvas.width, this.maxScale);

      this.startPinchZoom = true;

      this.updateAveragePositionBetweenFingers(fingerOnePosition, fingerTwoPosition);

      if (isZoomIn && this.zoomIntensity <= maxIntensity) {
        this.zoomIntensity += zoomFactor;
      } else if (isZoomOut && this.zoomIntensity >= zoomFactor) {
        this.zoomIntensity -= zoomFactor;
      }

      this.update();
      this.prevDistanceBetweenFingers = currentDistanceBetweenFingers;
    }
  }, {
    key: 'resetZoom',
    value: function resetZoom() {
      this.startPointerZoom = false;
      this.startPinchZoom = false;
      this.mouseTracked = false;
      this.clickedToZoom = false;

      this.container.style.cursor = 'grab';

      if (this.resetZoomIcon) this.hideResetZoomIcon();

      if (this.zoomIntensity) {
        this.zoomIntensity = 0;
        this.update();
      }
    }
  }, {
    key: 'keyDown',
    value: function keyDown(event) {
      if (!this.imagesLoaded) return;

      if (this.glass) {
        this.closeMagnifier();
      }

      if ([37, 39].indexOf(event.keyCode) !== -1) {
        if (37 === event.keyCode) {
          if (this.reversed) this.left();else this.right();
        } else if (39 === event.keyCode) {
          if (this.reversed) this.right();else this.left();
        }

        this.onSpin();
      }
    }
  }, {
    key: 'onSpin',
    value: function onSpin() {
      if (this.bottomCircle) {
        this.hide360ViewCircleIcon();
      }

      if (this.view360Icon) {
        this.remove360ViewIcon();
      }

      if (this.autoplay || this.loopTimeoutId) {
        this.stop();
        this.autoplay = false;
      }
    }
  }, {
    key: 'keyUp',
    value: function keyUp(event) {
      if (!this.imagesLoaded) return;

      if ([37, 39].indexOf(event.keyCode) !== -1) {
        this.onFinishSpin();
      }
    }
  }, {
    key: 'onFinishSpin',
    value: function onFinishSpin() {
      if (this.bottomCircle) this.show360ViewCircleIcon();
    }
  }, {
    key: 'onMoveHandler',
    value: function onMoveHandler(event) {
      var currentPositionX = this.isMobile ? event.touches[0].clientX : event.pageX;
      var currentPositionY = this.isMobile ? event.touches[0].clientY : event.pageY;

      var isMoveRight = currentPositionX - this.movementStart.x >= this.speedFactor;
      var isMoveLeft = this.movementStart.x - currentPositionX >= this.speedFactor;
      var isMoveTop = this.movementStart.y - currentPositionY >= this.speedFactor;
      var isMoveBottom = currentPositionY - this.movementStart.y >= this.speedFactor;

      if (this.bottomCircle) this.hide360ViewCircleIcon();

      if (isMoveRight && this.movingDirection === _ci2.ORIENTATIONS.X) {
        this.moveRight(currentPositionX);

        this.isStartSpin = true;
      } else if (isMoveLeft && this.movingDirection === _ci2.ORIENTATIONS.X) {
        this.moveLeft(currentPositionX);

        this.isStartSpin = true;
      } else if (isMoveTop && this.movingDirection === _ci2.ORIENTATIONS.Y) {
        this.moveTop(currentPositionY);

        this.isStartSpin = true;
      } else if (isMoveBottom && this.movingDirection === _ci2.ORIENTATIONS.Y) {
        this.moveBottom(currentPositionY);

        this.isStartSpin = true;
      }
    }
  }, {
    key: 'moveRight',
    value: function moveRight(currentPositionX) {
      var itemsSkippedRight = Math.floor((currentPositionX - this.movementStart.x) / this.speedFactor) || 1;

      this.spinReverse ? this.moveActiveIndexDown(itemsSkippedRight) : this.moveActiveIndexUp(itemsSkippedRight);

      this.movementStart.x = currentPositionX;
      this.activeImageY = 1;
      this.update();
    }
  }, {
    key: 'moveLeft',
    value: function moveLeft(currentPositionX) {
      var itemsSkippedLeft = Math.floor((this.movementStart.x - currentPositionX) / this.speedFactor) || 1;

      this.spinReverse ? this.moveActiveIndexUp(itemsSkippedLeft) : this.moveActiveIndexDown(itemsSkippedLeft);

      this.activeImageY = 1;
      this.movementStart.x = currentPositionX;
      this.update();
    }
  }, {
    key: 'moveTop',
    value: function moveTop(currentPositionY) {
      var itemsSkippedTop = Math.floor((this.movementStart.y - currentPositionY) / this.speedFactor) || 1;

      this.spinReverse ? this.moveActiveYIndexUp(itemsSkippedTop) : this.moveActiveYIndexDown(itemsSkippedTop);

      this.activeImageX = 1;
      this.movementStart.y = currentPositionY;
      this.update();
    }
  }, {
    key: 'moveBottom',
    value: function moveBottom(currentPositionY) {
      var itemsSkippedBottom = Math.floor((currentPositionY - this.movementStart.y) / this.speedFactor) || 1;

      this.spinReverse ? this.moveActiveYIndexDown(itemsSkippedBottom) : this.moveActiveYIndexUp(itemsSkippedBottom);

      this.activeImageX = 1;
      this.movementStart.y = currentPositionY;
      this.update();
    }
  }, {
    key: 'moveActiveIndexUp',
    value: function moveActiveIndexUp(itemsSkipped) {
      var isReverse = this.controlReverse ? !this.spinReverse : this.spinReverse;

      if (this.stopAtEdges) {
        var isReachedTheEdge = this.activeImageX + itemsSkipped >= this.amountX;

        if (isReachedTheEdge) {
          this.activeImageX = this.amountX;

          if (isReverse ? this.prevElem : this.rightElem) {
            (0, _ci.addClass)(isReverse ? this.leftElem : this.leftElem, 'not-active');
          }
        } else {
          this.activeImageX += itemsSkipped;

          if (this.rightElem) (0, _ci.removeClass)(this.rightElem, 'not-active');

          if (this.leftElem) (0, _ci.removeClass)(this.leftElem, 'not-active');
        }
      } else {
        this.activeImageX = (this.activeImageX + itemsSkipped) % this.amountX || this.amountX;

        if (this.activeImageX === this.amountX && this.allowSpinY) this.spinY = true;
      }
    }
  }, {
    key: 'moveActiveIndexDown',
    value: function moveActiveIndexDown(itemsSkipped) {
      var isReverse = this.controlReverse ? !this.spinReverse : this.spinReverse;

      if (this.stopAtEdges) {
        var isReachedTheEdge = this.activeImageX - itemsSkipped <= 1;

        if (isReachedTheEdge) {
          this.activeImageX = 1;

          if (isReverse ? this.rightElem : this.leftElem) {
            (0, _ci.addClass)(isReverse ? this.rightElem : this.leftElem, 'not-active');
          }
        } else {
          this.activeImageX -= itemsSkipped;

          if (this.leftElem) (0, _ci.removeClass)(this.leftElem, 'not-active');

          if (this.rightElem) (0, _ci.removeClass)(this.rightElem, 'not-active');
        }
      } else {
        if (this.activeImageX - itemsSkipped < 1) {
          this.activeImageX = this.amountX + (this.activeImageX - itemsSkipped);
          this.spinY = true;
        } else {
          this.activeImageX -= itemsSkipped;
        }
      }
    }
  }, {
    key: 'moveActiveYIndexUp',
    value: function moveActiveYIndexUp(itemsSkipped) {
      var isReverse = this.controlReverse ? !this.spinReverse : this.spinReverse;

      if (this.stopAtEdges) {
        var isReachedTheEdge = this.activeImageY + itemsSkipped >= this.amountY;

        if (isReachedTheEdge) {
          this.activeImageY = this.amountY;

          if (isReverse ? this.bottomElem : this.topElem) {
            (0, _ci.addClass)(isReverse ? this.bottomElem : this.topElem, 'not-active');
          }
        } else {
          this.activeImageY += itemsSkipped;

          if (this.topElem) (0, _ci.removeClass)(this.topElem, 'not-active');

          if (this.bottomElem) (0, _ci.removeClass)(this.bottomElem, 'not-active');
        }
      } else {
        this.activeImageY = (this.activeImageY + itemsSkipped) % this.amountY || this.amountY;

        if (this.activeImageY === this.amountY) this.spinY = false;
      }
    }
  }, {
    key: 'moveActiveYIndexDown',
    value: function moveActiveYIndexDown(itemsSkipped) {
      var isReverse = this.controlReverse ? !this.spinReverse : this.spinReverse;

      if (this.stopAtEdges) {
        var isReachedTheEdge = this.activeImageY - itemsSkipped <= 1;

        if (isReachedTheEdge) {
          this.activeImageY = 1;

          if (isReverse ? this.topElem : this.bottomElem) {
            (0, _ci.addClass)(isReverse ? this.topElem : this.bottomElem, 'not-active');
          }
        } else {
          this.activeImageY -= itemsSkipped;

          if (this.bottomElem) (0, _ci.removeClass)(this.bottomElem, 'not-active');
          if (this.topElem) (0, _ci.removeClass)(this.topElem, 'not-active');
        }
      } else {
        if (this.activeImageY - itemsSkipped < 1) {
          this.activeImageY = this.amountY + (this.activeImageY - itemsSkipped);
          this.spinY = false;
        } else {
          this.activeImageY -= itemsSkipped;
        }
      }
    }
  }, {
    key: 'loop',
    value: function loop(reversed) {
      switch (this.autoplayBehavior) {
        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_Y:
          reversed ? this.bottom() : this.top();
          break;

        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_XY:
          if (this.spinY) {
            reversed ? this.bottom() : this.top();
          } else {
            reversed ? this.left() : this.right();
          }
          break;

        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_YX:
          if (this.spinY) {
            reversed ? this.bottom() : this.top();
          } else {
            reversed ? this.left() : this.right();
          }
          break;

        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_X:
        default:
          reversed ? this.left() : this.right();
      }
    }
  }, {
    key: 'right',
    value: function right() {
      this.movingDirection = _ci2.ORIENTATIONS.X;
      this.activeImageY = this.reversed ? this.amountY : 1;

      this.moveActiveIndexUp(1);
      this.update();
    }
  }, {
    key: 'left',
    value: function left() {
      this.movingDirection = _ci2.ORIENTATIONS.X;
      this.activeImageY = this.reversed ? this.amountY : 1;

      this.moveActiveIndexDown(1);
      this.update();
    }
  }, {
    key: 'top',
    value: function top() {
      this.movingDirection = _ci2.ORIENTATIONS.Y;
      this.activeImageX = this.reversed ? this.amountX : 1;

      this.moveActiveYIndexUp(1);
      this.update();
    }
  }, {
    key: 'bottom',
    value: function bottom() {
      this.movingDirection = _ci2.ORIENTATIONS.Y;
      this.activeImageX = this.reversed ? this.amountX : 1;

      this.moveActiveYIndexDown(1);
      this.update();
    }
  }, {
    key: 'onLoadResizedImages',
    value: function onLoadResizedImages(orientation, event) {
      this.incrementLoadedImages(orientation);

      var totalAmount = this.amountX + this.amountY;
      var totalLoadedImages = this.loadedImagesX + this.loadedImagesY;

      if (totalLoadedImages === totalAmount) {
        this.replaceImages(orientation);
        this.update();
      }
    }
  }, {
    key: 'replaceImages',
    value: function replaceImages(orientation) {
      if (orientation === _ci2.ORIENTATIONS.Y) {
        this.imagesY = this.resizedImagesY;
      } else {
        this.imagesX = this.originalImagesX;
      }
    }
  }, {
    key: 'requestNewImages',
    value: function requestNewImages(src, amount, orientation) {
      var _this = this;

      if (orientation === _ci2.ORIENTATIONS.Y) {
        this.resizedImagesY = [];
        this.loadedImagesY = 0;
      } else {
        this.resizedImagesX = [];
        this.loadedImagesX = 0;
      }

      [].concat(_toConsumableArray(new Array(amount))).map(function (_item, index) {
        var nextZeroFilledIndex = (0, _ci.pad)(index + 1, _this.indexZeroBase);
        var resultSrc = src.replace('{index}', nextZeroFilledIndex);

        _this.addUpdatedSizeImage(resultSrc, orientation, _this.lazyload, _this.lazySelector, index);
      });
    }
  }, {
    key: 'addUpdatedSizeImage',
    value: function addUpdatedSizeImage(resultSrc, orientation, lazyload, lazySelector, index) {
      var image = new Image();

      if (lazyload && !this.fullscreenView) {
        image.setAttribute('data-src', resultSrc);
        image.className = image.className.length ? image.className + (' ' + lazySelector) : lazySelector;

        if (index === 0) {
          this.lazyloadInitImage = image;
          image.style.position = 'absolute';
          image.style.top = '0';
          image.style.left = '0';
          this.innerBox.appendChild(image);
        }
      } else {
        image.src = resultSrc;
      }

      image.onload = this.onLoadResizedImages.bind(this, orientation);
      image.onerror = this.onLoadResizedImages.bind(this, orientation);

      if (orientation === _ci2.ORIENTATIONS.Y) {
        this.resizedImagesY.push(image);
      } else {
        this.resizedImagesX.push(image);
      }
    }
  }, {
    key: 'requestResizedImages',
    value: function requestResizedImages() {
      var srcX = this.getSrc(this.responsive, this.container, this.folder, this.filenameX, this.ciParams);

      this.requestNewImages(srcX, this.amountX, _ci2.ORIENTATIONS.X);

      if (this.allowSpinY) {
        var srcY = this.getSrc(this.responsive, this.container, this.folder, this.filenameY, this.ciParams);

        this.requestNewImages(srcY, this.amountY, _ci2.ORIENTATIONS.Y);
      }
    }
  }, {
    key: 'requestResizedImageList',
    value: function requestResizedImageList() {
      var srcX = this.getSrc(this.responsive, this.container, this.folder, this.filenameX, this.ciParams);

      this.originalImagesX.forEach(image => {
        let newImg = new Image();
        newImg.src = image.src;

        newImg.onload = this.onLoadResizedImages.bind(this, "x-axis");
        newImg.onerror = this.onLoadResizedImages.bind(this, "x-axis");
        this.resizedImagesX.push(newImg);

      })


    }
  }, {
    key: 'update',
    value: function update() {
      var image = this.imagesX[this.activeImageX - 1];

      if (this.movingDirection === _ci2.ORIENTATIONS.Y) {
        image = this.imagesY[this.activeImageY - 1];
      }

      var ctx = this.canvas.getContext("2d");

      ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

      if (this.fullscreenView) {
        this.canvas.width = window.innerWidth * this.devicePixelRatio;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.height = window.innerHeight * this.devicePixelRatio;
        this.canvas.style.height = window.innerHeight + 'px';

        var _contain = (0, _ci.contain)(this.canvas.width, this.canvas.height, image.width, image.height),
            offsetX = _contain.offsetX,
            offsetY = _contain.offsetY,
            width = _contain.width,
            height = _contain.height;

        ctx.drawImage(image, offsetX, offsetY, width, height);
      } else {
        this.canvas.width = this.container.offsetWidth * this.devicePixelRatio;
        this.canvas.style.width = this.container.offsetWidth + 'px';
        this.canvas.height = this.container.offsetWidth * this.devicePixelRatio / image.width * image.height;
        this.canvas.style.height = this.container.offsetWidth / image.width * image.height + 'px';

        if (this.startPointerZoom || this.startPinchZoom) {
          this.updateImageScale(ctx);
        } else {
          ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
        }
      }
    }
  }, {
    key: 'updateImageScale',
    value: function updateImageScale(ctx) {
      var image = this.originalImagesX[this.activeImageX - 1];

      if (this.movingDirection === _ci2.ORIENTATIONS.Y) {
        image = this.originalImagesY[this.activeImageY - 1];
      }

      var position = this.pointerCurrentPosition;

      if (this.startPointerZoom) position = this.getCursorPositionInCanvas();

      var imageWidth = this.canvas.width / this.devicePixelRatio;
      var imageHeight = this.canvas.height / this.devicePixelRatio;

      var width = this.canvas.width + this.zoomIntensity * (this.canvas.width / this.canvas.height);
      var height = this.canvas.height + this.zoomIntensity;

      var pointX = 0 - position.x / imageWidth * (width - this.canvas.width);
      var pointY = 0 - position.y / imageHeight * (height - this.canvas.height);

      ctx.drawImage(image, pointX, pointY, width, height);
    }
  }, {
    key: 'updatePercentageInLoader',
    value: function updatePercentageInLoader(percentage) {
      if (this.loader) {
        this.loader.style.width = percentage + '%';
      }

      if (this.view360Icon) {
        this.view360Icon.innerText = percentage + '%';
      }
    }
  }, {
    key: 'onAllImagesLoaded',
    value: function onAllImagesLoaded() {
      this.imagesLoaded = true;

      this.container.style.cursor = 'grab';
      if (this.disableDrag) this.container.style.cursor = 'default';

      this.removeLoader();

      if (!this.fullscreenView) {
        this.speedFactor = Math.floor(this.dragSpeed / 150 * 36 / this.amountX * 25 * this.container.offsetWidth / 1500) || 1;
      } else {
        var containerRatio = this.container.offsetHeight / this.container.offsetWidth;
        var imageOffsetWidth = this.container.offsetWidth;

        if (this.ratio > containerRatio) {
          imageOffsetWidth = this.container.offsetHeight / this.ratio;
        }

        this.speedFactor = Math.floor(this.dragSpeed / 150 * 36 / this.amountX * 25 * imageOffsetWidth / 1500) || 1;
      }

      if (this.imageOffset) {
        this.activeImageX = this.imageOffset;
      };

      if (this.autoplay) {
        this.play();
      }

      if (this.view360Icon) {
        this.view360Icon.innerText = '';
        (0, _ci.setView360Icon)(this.view360Icon, this.logoSrc);
      }

      this.initControls();
    }
  }, {
    key: 'onFirstImageLoaded',
    value: function onFirstImageLoaded(event) {
      var _this2 = this;

      if (!this.hide360Logo) {
        this.add360ViewIcon();
      }

      if (this.fullscreenView) {
        this.canvas.width = window.innerWidth * this.devicePixelRatio;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.height = window.innerHeight * this.devicePixelRatio;
        this.canvas.style.height = window.innerHeight + 'px';

        var ctx = this.canvas.getContext("2d");

        var _contain2 = (0, _ci.contain)(this.canvas.width, this.canvas.height, event.target.width, event.target.height),
            offsetX = _contain2.offsetX,
            offsetY = _contain2.offsetY,
            width = _contain2.width,
            height = _contain2.height;

        this.offset = { x: offsetX, y: offsetY };

        ctx.drawImage(event.target, offsetX, offsetY, width, height);
      } else {
        var _ctx = this.canvas.getContext("2d");
        var imagePreview = event.target;

        if (this.imageOffset) {
          imagePreview = this.imagesX[this.imageOffset];
        }

        if (this.container.offsetWidth === 0) {
          var modalRef = this.container.parentElement;

          this.canvas.width = parseInt(modalRef.style.width) * this.devicePixelRatio;
          this.canvas.style.width = modalRef.style.width;

          this.canvas.height = parseInt(modalRef.style.height) * this.devicePixelRatio / event.target.width * event.target.height;
          this.canvas.style.height = parseInt(modalRef.style.width) / event.target.width * event.target.height + 'px';
        }

        if (this.container.offsetWidth > 0) {
          this.canvas.width = this.container.offsetWidth * this.devicePixelRatio;
          this.canvas.style.width = this.container.offsetWidth + 'px';

          this.canvas.height = this.container.offsetWidth * this.devicePixelRatio / event.target.width * event.target.height;
          this.canvas.style.height = this.container.offsetWidth / event.target.width * event.target.height + 'px';
        }

        _ctx.drawImage(imagePreview, 0, 0, this.canvas.width, this.canvas.height);
      }

      if (this.lazyload && !this.fullscreenView) {
        this.imagesX.forEach(function (image, index) {
          if (index === 0) {
            _this2.innerBox.removeChild(_this2.lazyloadInitImage);
            return;
          }

          var dataSrc = image.getAttribute('data-src');

          if (dataSrc) {
            image.src = image.getAttribute('data-src');
          }
        });
      }

      if (this.ratio) {
        this.container.style.minHeight = 'auto';
      }

      if (this.fullscreenView) {
        this.addCloseFullscreenView();
      }

      if (this.magnifier && !this.fullscreenView || this.magnifyInFullscreen) {
        this.addMagnifier();
      }

      if (this.boxShadow && !this.fullscreenView) {
        this.addBoxShadow();
      }

      if (this.bottomCircle && !this.fullscreenView) {
        this.add360ViewCircleIcon();
      }

      if (this.fullscreen && !this.fullscreenView) {
        this.addFullscreenIcon();
      }

      if (!this.isMobile && !this.fullscreenView && !this.disablePointerZoom) {
        this.addResetZoomIcon();
      }
    }
  }, {
    key: 'incrementLoadedImages',
    value: function incrementLoadedImages(orientation) {
      if (orientation === _ci2.ORIENTATIONS.Y) {
        this.loadedImagesY += 1;
      } else {
        this.loadedImagesX += 1;
      }
    }
  }, {
    key: 'onImageLoad',
    value: function onImageLoad(index, orientation, event) {
      this.incrementLoadedImages(orientation);

      var totalAmount = this.amountX + this.amountY;
      var totalLoadedImages = this.loadedImagesX + this.loadedImagesY;

      var percentage = Math.round(totalLoadedImages / totalAmount * 100);

      this.updatePercentageInLoader(percentage);

      if (index === 0 && orientation !== _ci2.ORIENTATIONS.Y) {
        this.onFirstImageLoaded(event);
      }

      if (totalLoadedImages === totalAmount) {
        this.onAllImagesLoaded(event);
      }
    }
  }, {
    key: 'addCloseFullscreenView',
    value: function addCloseFullscreenView(event) {
      var closeFullscreenIcon = document.createElement('div');
      closeFullscreenIcon.className = 'cloudimage-360-close-fullscreen-icon';
      closeFullscreenIcon.onclick = this.setFullscreenEvents.bind(this, event);

      window.onkeyup = this.setFullscreenEvents.bind(this, event);

      this.iconsContainer.appendChild(closeFullscreenIcon);
    }
  }, {
    key: 'add360ViewIcon',
    value: function add360ViewIcon() {
      var view360Icon = document.createElement('div');

      view360Icon.className = 'cloudimage-360-view-360-icon';
      view360Icon.innerText = '0%';

      this.view360Icon = view360Icon;
      this.innerBox.appendChild(view360Icon);
    }
  }, {
    key: 'addFullscreenIcon',
    value: function addFullscreenIcon() {
      var fullscreenIcon = document.createElement('div');

      fullscreenIcon.className = 'cloudimage-360-fullscreen-icon';
      fullscreenIcon.onclick = this.openFullscreenModal.bind(this);

      this.fullscreenIcon = fullscreenIcon;

      this.iconsContainer.appendChild(fullscreenIcon);
    }
  }, {
    key: 'hideFullscreenIcon',
    value: function hideFullscreenIcon() {
      if (!this.fullscreenIcon) return;

      this.fullscreenIcon.style.display = 'none';
      this.fullscreenIcon.style.pointerEvents = 'none';
    }
  }, {
    key: 'showFullscreenIcon',
    value: function showFullscreenIcon() {
      if (!this.fullscreenIcon) return;

      this.fullscreenIcon.style.display = 'block';
      this.fullscreenIcon.style.pointerEvents = 'auto';
    }
  }, {
    key: 'addMagnifier',
    value: function addMagnifier() {
      var magnifyIcon = document.createElement('div');

      magnifyIcon.className = 'cloudimage-360-magnifier-icon';
      magnifyIcon.onclick = this.magnify.bind(this);

      this.magnifierIcon = magnifyIcon;

      this.iconsContainer.appendChild(magnifyIcon);
    }
  }, {
    key: 'disableMagnifierIcon',
    value: function disableMagnifierIcon() {
      if (!this.magnifierIcon) return;

      this.magnifierIcon.style.display = 'none';
      this.magnifierIcon.style.pointerEvents = 'none';
    }
  }, {
    key: 'enableMagnifierIcon',
    value: function enableMagnifierIcon() {
      if (!this.magnifierIcon) return;

      this.magnifierIcon.style.display = 'block';
      this.magnifierIcon.style.pointerEvents = 'auto';
    }
  }, {
    key: 'getOriginalSrc',
    value: function getOriginalSrc() {
      var currentImage = this.originalImagesX[this.activeImageX - 1];

      if (this.movingDirection === _ci2.ORIENTATIONS.Y) {
        currentImage = this.originalImagesY[this.activeImageY - 1];
      };

      return currentImage.src;
    }
  }, {
    key: 'magnify',
    value: function magnify() {
      var _this3 = this;

      var image = new Image();
      var src = this.getOriginalSrc();
      this.isMagnifyOpen = true;

      image.src = src;
      image.onload = function () {
        if (_this3.glass) {
          _this3.glass.style.cursor = 'none';
        }
      };

      this.glass = document.createElement('div');
      this.container.style.overflow = 'hidden';

      (0, _ci.magnify)(this.container, this.offset, src, this.glass, this.magnifier || 3);
    }
  }, {
    key: 'closeMagnifier',
    value: function closeMagnifier() {
      if (!this.glass) return;

      this.container.style.overflow = 'visible';
      this.container.removeChild(this.glass);
      this.glass = null;
      this.isMagnifyOpen = false;
    }
  }, {
    key: 'openFullscreenModal',
    value: function openFullscreenModal() {
      var fullscreenModal = document.createElement('div');

      fullscreenModal.className = 'cloudimage-360-fullscreen-modal';

      var fullscreenContainer = this.container.cloneNode();
      var image = this.imagesX[0];
      var ratio = image.height / image.width;

      fullscreenContainer.style.height = '100%';
      fullscreenContainer.style.maxHeight = '100%';

      fullscreenModal.appendChild(fullscreenContainer);

      window.document.body.style.overflow = 'hidden';
      window.document.body.appendChild(fullscreenModal);

      new CI360Viewer(fullscreenContainer, true, ratio);
    }
  }, {
    key: 'setFullscreenEvents',
    value: function setFullscreenEvents(_, event) {
      if (event.type === 'click') return this.closeFullscreenModal();
      if (event.key === 'Escape') return this.closeFullscreenModalOnEsc();
    }
  }, {
    key: 'closeFullscreenModalOnEsc',
    value: function closeFullscreenModalOnEsc() {

      if (this.container.parentNode.parentNode === document.body) {
        this.closeFullscreenModal();
      };
    }
  }, {
    key: 'closeFullscreenModal',
    value: function closeFullscreenModal() {
      document.body.removeChild(this.container.parentNode);
      window.document.body.style.overflow = 'visible';
    }
  }, {
    key: 'add360ViewCircleIcon',
    value: function add360ViewCircleIcon() {
      var view360CircleIcon = new Image();

      view360CircleIcon.src = 'https://scaleflex.ultrafast.io/https://scaleflex.api.airstore.io/v1/get/_/2236d56f-914a-5a8b-a3ae-f7bde1c50000/360.svg';

      view360CircleIcon.style.bottom = this.bottomCircleOffset + '%';
      view360CircleIcon.className = 'cloudimage-360-view-360-circle';

      this.view360CircleIcon = view360CircleIcon;
      this.innerBox.appendChild(view360CircleIcon);
    }
  }, {
    key: 'hide360ViewCircleIcon',
    value: function hide360ViewCircleIcon() {
      if (!this.view360CircleIcon) return;

      this.view360CircleIcon.style.opacity = '0';
    }
  }, {
    key: 'show360ViewCircleIcon',
    value: function show360ViewCircleIcon() {
      if (!this.view360CircleIcon) return;

      this.view360CircleIcon.style.opacity = '1';
    }
  }, {
    key: 'remove360ViewCircleIcon',
    value: function remove360ViewCircleIcon() {
      if (!this.view360CircleIcon) return;

      this.innerBox.removeChild(this.view360CircleIcon);
      this.view360CircleIcon = null;
    }
  }, {
    key: 'addResetZoomIcon',
    value: function addResetZoomIcon() {
      var resetZoomIcon = document.createElement('div');

      resetZoomIcon.className = 'cloudimage-360-reset-zoom-icon';
      this.resetZoomIcon = resetZoomIcon;

      resetZoomIcon.onmouseenter = this.resetZoom.bind(this);

      this.iconsContainer.appendChild(resetZoomIcon);
    }
  }, {
    key: 'hideResetZoomIcon',
    value: function hideResetZoomIcon() {
      if (!this.resetZoomIcon) return;
      if (this.magnifierIcon) this.enableMagnifierIcon();
      if (this.fullscreenIcon) this.showFullscreenIcon();

      this.resetZoomIcon.style.display = 'none';
    }
  }, {
    key: 'showResetZoomIcon',
    value: function showResetZoomIcon() {
      if (!this.resetZoomIcon) return;
      if (this.magnifierIcon) this.disableMagnifierIcon();
      if (this.fullscreenIcon) this.hideFullscreenIcon();

      this.resetZoomIcon.style.display = 'block';
    }
  }, {
    key: 'addLoader',
    value: function addLoader() {
      var loader = document.createElement('div');
      loader.className = 'cloudimage-360-loader';

      this.loader = loader;
      this.innerBox.appendChild(loader);
    }
  }, {
    key: 'addBoxShadow',
    value: function addBoxShadow() {
      var boxShadow = document.createElement('div');

      boxShadow.className = 'cloudimage-360-box-shadow';
      boxShadow.style.boxShadow = this.boxShadow;

      this.innerBox.appendChild(boxShadow);
    }
  }, {
    key: 'removeLoader',
    value: function removeLoader() {
      if (!this.loader) return;

      this.innerBox.removeChild(this.loader);
      this.loader = null;
    }
  }, {
    key: 'remove360ViewIcon',
    value: function remove360ViewIcon() {
      if (!this.view360Icon) return;

      this.innerBox.removeChild(this.view360Icon);
      this.view360Icon = null;
    }
  }, {
    key: 'isCompletedCyle',
    value: function isCompletedCyle() {
      switch (this.autoplayBehavior) {
        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_XY:
        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_Y:
          {
            var isReachedTheEdge = this.reversed ? this.activeImageY === 1 : this.activeImageY === this.amountY;

            if (isReachedTheEdge) return true;

            return false;
          }

        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_X:
        case _ci2.AUTOPLAY_BEHAVIOR.SPIN_YX:
        default:
          {
            var _isReachedTheEdge = this.reversed ? this.activeImageX === 1 : this.activeImageX === this.amountX;

            if (_isReachedTheEdge) return true;

            return false;
          }
      }
    }
  }, {
    key: 'play',
    value: function play() {
      var _this4 = this;

      if (this.bottomCircle) this.hide360ViewCircleIcon();
      this.remove360ViewIcon();

      this.loopTimeoutId = window.setInterval(function () {
        _this4.loop(_this4.reversed);

        var isPlayedOnce = _this4.isCompletedCyle();

        if (_this4.playOnce && isPlayedOnce) {
          window.clearTimeout(_this4.loopTimeoutId);

          _this4.add360ViewIcon();

          _this4.view360Icon.innerText = '';
          (0, _ci.setView360Icon)(_this4.view360Icon, _this4.logoSrc);
        }
      }, this.autoplaySpeed);
    }
  }, {
    key: 'stop',
    value: function stop() {
      if (this.bottomCircle && !this.zoomIntensity) this.show360ViewCircleIcon();
      window.clearTimeout(this.loopTimeoutId);
    }
  }, {
    key: 'getSrc',
    value: function getSrc(responsive, container, folder, filename, _ref) {
      var ciToken = _ref.ciToken,
          ciFilters = _ref.ciFilters,
          ciTransformation = _ref.ciTransformation;

      var src = '' + folder + filename;

      if (responsive) {
        var imageOffsetWidth = container.offsetWidth;

        if (this.fullscreenView) {
          var containerRatio = container.offsetHeight / container.offsetWidth;

          if (this.ratio > containerRatio) {
            imageOffsetWidth = container.offsetHeight / this.ratio;
          }
        }

        var ciSizeNext = (0, _ci.getSizeAccordingToPixelRatio)((0, _ci.getResponsiveWidthOfContainer)(imageOffsetWidth));

        src = 'https://' + ciToken + '.cloudimg.io/v7/' + src + '?' + (ciTransformation ? ciTransformation : 'width=' + ciSizeNext) + (ciFilters ? '&f=' + ciFilters : '');
      }

      return src;
    }
  }, {
    key: 'preloadImages',
    value: function preloadImages(amount, src) {
      var orientation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _ci2.ORIENTATIONS.X;
      var lazyload = arguments[3];
      var lazySelector = arguments[4];
      var container = arguments[5];

      var _this5 = this;

      var responsive = arguments[6];
      var ciParams = arguments[7];

      if (this.imageList) {
        try {
          var images = JSON.parse(this.imageList);

          this.amountX = images.length;
          images.forEach(function (src, index) {
            var folder = /(http(s?)):\/\//gi.test(src) ? '' : _this5.folder;
            var resultSrc = _this5.getSrc(responsive, container, folder, src, ciParams);
            var lastIndex = resultSrc.lastIndexOf('//');
            var originalSrc = resultSrc.slice(lastIndex);

            _this5.addImage(resultSrc, originalSrc, orientation, lazyload, lazySelector, index);
          });
        } catch (error) {
          console.error('Wrong format in image-list attribute: ' + error.message);
        }
      } else {
        [].concat(_toConsumableArray(new Array(amount))).map(function (_item, index) {
          var nextZeroFilledIndex = (0, _ci.pad)(index + 1, _this5.indexZeroBase);
          var resultSrc = src.replace('{index}', nextZeroFilledIndex);
          var originalSrc = resultSrc.replace(_ci2.ORGINAL_SIZE_REGEX, '').replace(_ci2.AND_SYMBOL_REGEX, '?');

          _this5.addImage(resultSrc, originalSrc, orientation, lazyload, lazySelector, index);
        });
      }
    }
  }, {
    key: 'addImage',
    value: function addImage(resultSrc, originalSrc, orientation, lazyload, lazySelector, index) {
      var image = new Image();
      var originalImage = new Image();

      if (lazyload && !this.fullscreenView) {
        image.setAttribute('data-src', resultSrc);
        image.className = image.className.length ? image.className + (' ' + lazySelector) : lazySelector;

        if (index === 0) {
          this.lazyloadInitImage = image;
          image.style.position = 'absolute';
          image.style.top = '0';
          image.style.left = '0';
          this.innerBox.appendChild(image);
        }
      } else {
        image.src = resultSrc;
        originalImage.src = originalSrc;
      }

      image.onload = this.onImageLoad.bind(this, index, orientation);
      image.onerror = this.onImageLoad.bind(this, index, orientation);

      if (orientation === _ci2.ORIENTATIONS.Y) {
        this.imagesY.push(image);
        this.originalImagesY.push(originalImage);
      } else {
        this.imagesX.push(image);
        this.originalImagesX.push(originalImage);
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      stop();

      var oldElement = this.container;
      var newElement = oldElement.cloneNode(true);
      var innerBox = newElement.querySelector('.cloudimage-360-inner-box');

      newElement.className = newElement.className.replace(' initialized', '');
      newElement.style.position = 'relative';
      newElement.style.width = '100%';
      newElement.style.cursor = 'default';
      newElement.setAttribute('draggable', 'false');
      newElement.style.minHeight = 'auto';
      newElement.removeChild(innerBox);
      oldElement.parentNode.replaceChild(newElement, oldElement);
    }
  }, {
    key: 'initControls',
    value: function initControls() {
      var _this6 = this;

      var isReverse = this.controlReverse ? !this.spinReverse : this.spinReverse;
      // TODO [deprecated]: remove .cloud-360-left, .cloud-360-right in the upcoming versions
      var left = this.container.querySelector('.cloudimage-360-left') || this.container.querySelector('.cloudimage-360-prev');
      var right = this.container.querySelector('.cloudimage-360-right') || this.container.querySelector('.cloudimage-360-next');

      var top = this.container.querySelector('.cloudimage-360-top');
      var bottom = this.container.querySelector('.cloudimage-360-bottom');

      if (!left && !right && !top && !bottom) return;

      var onLeftStart = function onLeftStart(event) {
        event.stopPropagation();
        _this6.onSpin();
        _this6.left();
        _this6.loopTimeoutId = window.setInterval(_this6.left.bind(_this6), _this6.autoplaySpeed);
      };
      var onRightStart = function onRightStart(event) {
        event.stopPropagation();
        _this6.onSpin();
        _this6.right();
        _this6.loopTimeoutId = window.setInterval(_this6.right.bind(_this6), _this6.autoplaySpeed);
      };

      var onTopStart = function onTopStart(event) {
        event.stopPropagation();
        _this6.onSpin();
        _this6.top();
        _this6.loopTimeoutId = window.setInterval(_this6.top.bind(_this6), _this6.autoplaySpeed);
      };

      var onBottomStart = function onBottomStart(event) {
        event.stopPropagation();
        _this6.onSpin();
        _this6.bottom();
        _this6.loopTimeoutId = window.setInterval(_this6.bottom.bind(_this6), _this6.autoplaySpeed);
      };

      var onLeftEnd = function onLeftEnd() {
        _this6.onFinishSpin();
        window.clearTimeout(_this6.loopTimeoutId);
      };

      var onRightEnd = function onRightEnd() {
        _this6.onFinishSpin();
        window.clearTimeout(_this6.loopTimeoutId);
      };

      var onTopEnd = function onTopEnd() {
        _this6.onFinishSpin();
        window.clearTimeout(_this6.loopTimeoutId);
      };

      var onBottomEnd = function onBottomEnd() {
        _this6.onFinishSpin();
        window.clearTimeout(_this6.loopTimeoutId);
      };

      if (left) {
        left.style.display = 'block';
        left.addEventListener('mousedown', isReverse ? onRightStart : onLeftStart);
        left.addEventListener('touchstart', isReverse ? onRightStart : onLeftStart, { passive: true });
        left.addEventListener('mouseup', isReverse ? onRightEnd : onLeftEnd);
        left.addEventListener('touchend', isReverse ? onRightEnd : onLeftEnd);

        this.leftElem = left;
      }

      if (right) {
        right.style.display = 'block';
        right.addEventListener('mousedown', isReverse ? onLeftStart : onRightStart);
        right.addEventListener('touchstart', isReverse ? onLeftStart : onRightStart, { passive: true });
        right.addEventListener('mouseup', isReverse ? onLeftEnd : onRightEnd);
        right.addEventListener('touchend', isReverse ? onLeftEnd : onRightEnd);

        this.rightElem = right;
      }

      if (top) {
        top.style.display = 'block';
        top.addEventListener('mousedown', isReverse ? onBottomStart : onTopStart);
        top.addEventListener('touchstart', isReverse ? onBottomStart : onTopStart);
        top.addEventListener('mouseup', isReverse ? onBottomEnd : onTopEnd);
        top.addEventListener('touchend', isReverse ? onBottomEnd : onTopEnd);

        this.topElem = top;
      }

      if (bottom) {
        bottom.style.display = 'block';
        bottom.addEventListener('mousedown', isReverse ? onTopStart : onBottomStart);
        bottom.addEventListener('touchstart', isReverse ? onTopStart : onBottomStart);
        bottom.addEventListener('mouseup', isReverse ? onTopEnd : onBottomEnd);
        bottom.addEventListener('touchend', isReverse ? onTopEnd : onBottomEnd);

        this.bottomElem = bottom;
      }

      if (isReverse ? right : left) {
        if (this.stopAtEdges) {
          (0, _ci.addClass)(isReverse ? right : left, 'not-active');
        }
      }
    }
  }, {
    key: 'addInnerBox',
    value: function addInnerBox() {
      this.innerBox = document.createElement('div');
      this.innerBox.className = 'cloudimage-360-inner-box';
      this.container.appendChild(this.innerBox);
    }
  }, {
    key: 'addIconsContainer',
    value: function addIconsContainer() {
      this.iconsContainer = document.createElement('div');
      this.iconsContainer.className = 'cloudimage-360-icons-container';

      this.innerBox.appendChild(this.iconsContainer);
    }
  }, {
    key: 'addCanvas',
    value: function addCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.fontSize = '0';

      if (this.ratio) {
        this.container.style.minHeight = this.container.offsetWidth * this.ratio + 'px';
        this.canvas.height = parseInt(this.container.style.minHeight);
      }

      this.innerBox.appendChild(this.canvas);
    }
  }, {
    key: 'attachEvents',
    value: function attachEvents(draggable, swipeable, keys) {
      var _this7 = this;

      window.addEventListener('resize', (0, _ci.debounce)(function () {
        
        if(_this7.imageList) {
            _this7.requestResizedImageList();
        } else {
            _this7.requestResizedImages();  
        }
      }, 300));

      if (draggable && !this.disableDrag) {
        this.container.addEventListener('mousedown', this.mouseDown.bind(this));
        this.container.addEventListener('mousemove', this.mouseMove.bind(this));
        document.addEventListener('mouseup', this.mouseUp.bind(this));
      }

      if (swipeable && !this.disableDrag) {
        this.container.addEventListener('touchstart', this.touchStart.bind(this), { passive: true });
        this.container.addEventListener('touchend', this.touchEnd.bind(this));
        this.container.addEventListener('touchmove', this.touchMove.bind(this), { passive: true });
      }

      if (!this.disablePointerZoom && !this.fullscreenView) {
        this.container.addEventListener('click', this.mouseClick.bind(this));
        this.container.addEventListener('wheel', this.mouseScroll.bind(this));
      }

      if (keys) {
        document.addEventListener('keydown', this.keyDown.bind(this));
        document.addEventListener('keyup', this.keyUp.bind(this));
      } else {
        document.addEventListener('keydown', this.keyDownGeneral.bind(this));
      }
    }
  }, {
    key: 'applyStylesToContainer',
    value: function applyStylesToContainer() {
      this.container.style.position = 'relative';
      this.container.style.width = '100%';
      this.container.style.cursor = 'wait';
      this.container.setAttribute('draggable', 'false');
      this.container.className = this.container.className + ' initialized';
    }
  }, {
    key: 'setMouseLeaveActions',
    value: function setMouseLeaveActions(actions) {
      var _this8 = this;

      var mouseLeaveActions = actions.split(',');

      mouseLeaveActions.forEach(function (action) {
        return _this8.applyMouseLeaveAction(action);
      });
    }
  }, {
    key: 'applyMouseLeaveAction',
    value: function applyMouseLeaveAction(action) {
      switch (action) {
        case _ci2.MOUSE_LEAVE_ACTIONS.RESET_ZOOM:
          this.container.addEventListener('mouseleave', this.resetZoom.bind(this));
          break;
      }
    }
  }, {
    key: 'init',
    value: function init(container) {
      var _get360ViewProps = (0, _ci.get360ViewProps)(container),
          folder = _get360ViewProps.folder,
          filenameX = _get360ViewProps.filenameX,
          filenameY = _get360ViewProps.filenameY,
          imageList = _get360ViewProps.imageList,
          indexZeroBase = _get360ViewProps.indexZeroBase,
          amountX = _get360ViewProps.amountX,
          amountY = _get360ViewProps.amountY,
          imageOffset = _get360ViewProps.imageOffset,
          _get360ViewProps$drag = _get360ViewProps.draggable,
          draggable = _get360ViewProps$drag === undefined ? true : _get360ViewProps$drag,
          _get360ViewProps$swip = _get360ViewProps.swipeable,
          swipeable = _get360ViewProps$swip === undefined ? true : _get360ViewProps$swip,
          keys = _get360ViewProps.keys,
          bottomCircle = _get360ViewProps.bottomCircle,
          bottomCircleOffset = _get360ViewProps.bottomCircleOffset,
          boxShadow = _get360ViewProps.boxShadow,
          autoplay = _get360ViewProps.autoplay,
          autoplayBehavior = _get360ViewProps.autoplayBehavior,
          playOnce = _get360ViewProps.playOnce,
          pointerZoomFactor = _get360ViewProps.pointerZoomFactor,
          pinchZoomFactor = _get360ViewProps.pinchZoomFactor,
          maxScale = _get360ViewProps.maxScale,
          toStartPointerZoom = _get360ViewProps.toStartPointerZoom,
          onMouseLeave = _get360ViewProps.onMouseLeave,
          _get360ViewProps$disa = _get360ViewProps.disablePointerZoom,
          disablePointerZoom = _get360ViewProps$disa === undefined ? true : _get360ViewProps$disa,
          _get360ViewProps$disa2 = _get360ViewProps.disablePinchZoom,
          disablePinchZoom = _get360ViewProps$disa2 === undefined ? true : _get360ViewProps$disa2,
          speed = _get360ViewProps.speed,
          autoplayReverse = _get360ViewProps.autoplayReverse,
          _get360ViewProps$disa3 = _get360ViewProps.disableDrag,
          disableDrag = _get360ViewProps$disa3 === undefined ? true : _get360ViewProps$disa3,
          fullscreen = _get360ViewProps.fullscreen,
          magnifier = _get360ViewProps.magnifier,
          magnifyInFullscreen = _get360ViewProps.magnifyInFullscreen,
          ratio = _get360ViewProps.ratio,
          responsive = _get360ViewProps.responsive,
          ciToken = _get360ViewProps.ciToken,
          ciFilters = _get360ViewProps.ciFilters,
          ciTransformation = _get360ViewProps.ciTransformation,
          lazyload = _get360ViewProps.lazyload,
          lazySelector = _get360ViewProps.lazySelector,
          spinReverse = _get360ViewProps.spinReverse,
          dragSpeed = _get360ViewProps.dragSpeed,
          stopAtEdges = _get360ViewProps.stopAtEdges,
          controlReverse = _get360ViewProps.controlReverse,
          hide360Logo = _get360ViewProps.hide360Logo,
          logoSrc = _get360ViewProps.logoSrc;

      var ciParams = { ciToken: ciToken, ciFilters: ciFilters, ciTransformation: ciTransformation };

      this.addInnerBox();
      this.addIconsContainer();
      this.addLoader();

      this.folder = folder;
      this.filenameX = filenameX;
      this.filenameY = filenameY;
      this.imageList = imageList;
      this.indexZeroBase = indexZeroBase;
      this.amountX = amountX;
      this.amountY = amountY;
      this.allowSpinY = !!amountY && !!filenameY;
      this.activeImageX = autoplayReverse ? amountX : 1;
      this.activeImageY = autoplayReverse ? amountY : 1;
      this.spinY = autoplayBehavior === _ci2.AUTOPLAY_BEHAVIOR.SPIN_YX ? true : false;
      this.imageOffset = imageOffset;
      this.bottomCircle = bottomCircle;
      this.bottomCircleOffset = bottomCircleOffset;
      this.boxShadow = boxShadow;
      this.autoplay = autoplay;
      this.autoplayBehavior = autoplayBehavior;
      this.playOnce = playOnce;
      this.toStartPointerZoom = toStartPointerZoom, this.disablePointerZoom = disablePointerZoom;
      this.disablePinchZoom = disablePinchZoom;
      this.pointerZoomFactor = pointerZoomFactor;
      this.pinchZoomFactor = pinchZoomFactor;
      this.maxScale = maxScale;
      this.speed = speed;
      this.reversed = autoplayReverse;
      this.disableDrag = disableDrag;
      this.fullscreen = fullscreen;
      this.magnifier = !this.isMobile && magnifier ? magnifier : false;
      this.magnifyInFullscreen = magnifyInFullscreen;
      this.lazyload = lazyload;
      this.lazySelector = lazySelector;
      this.ratio = ratio;
      this.spinReverse = spinReverse;
      this.controlReverse = controlReverse;
      this.dragSpeed = dragSpeed;
      this.autoplaySpeed = this.speed * 36 / this.amountX;
      this.stopAtEdges = stopAtEdges;
      this.hide360Logo = hide360Logo;
      this.logoSrc = logoSrc;
      this.responsive = responsive;
      this.ciParams = ciParams;

      this.applyStylesToContainer();

      this.addCanvas();

      var srcX = this.getSrc(responsive, container, folder, filenameX, ciParams);
      var srcY = this.getSrc(responsive, container, folder, filenameY, ciParams);

      this.preloadImages(amountX, srcX, _ci2.ORIENTATIONS.X, lazyload, lazySelector, container, responsive, ciParams);

      if (amountY) {
        this.preloadImages(amountY, srcY, _ci2.ORIENTATIONS.Y, lazyload, lazySelector, container, responsive, ciParams);
      }

      this.attachEvents(draggable, swipeable, keys);

      if (onMouseLeave) this.setMouseLeaveActions(onMouseLeave);
    }
  }]);

  return CI360Viewer;
}();

exports.default = CI360Viewer;