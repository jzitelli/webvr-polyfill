var PositionSensorVRDevice = require('./base.js').PositionSensorVRDevice;
var TouchPanner = require('./touch-panner.js');
var THREE = require('./three-math.js');
var Util = require('./util.js');

/**
 * Leap Motion position / orientation sensor (uses Leap Motion tool tracking functionality)
 */
function LeapMotionPositionSensorVRDevice(host, port) {
  this.deviceId = 'webvr-polyfill:leapmotion';
  this.deviceName = 'VR Position Device (webvr-polyfill:leapmotion)';

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new THREE.Quaternion();

  this.orientation = new THREE.Quaternion();
  this.position = new THREE.Vector3();

  // Leap Motion input
  var leapConfig = {
    background: true /* ,
    frameEventName: 'animationFrame' */
  };
  if (host) {
    leapConfig.host = host;
  }
  if (port) {
    leapConfig.port = port;
  }
  this.leapController = new Leap.Controller(leapConfig);

  this.leapController.on('connect', function () {
    console.log('LeapMotionPositionSensorVRDevice: connected to Leap Motion controller');
  });
  this.leapController.on('streamingStarted', function () {
    console.log('LeapMotionPositionSensorVRDevice: streaming started');
  });
  this.leapController.on('streamingStopped', function () {
    console.log('LeapMotionPositionSensorVRDevice: streaming stopped');
  });
  
  this.leapController.connect();
}
LeapMotionPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: {x,y,z}}.
 */
LeapMotionPositionSensorVRDevice.prototype.getState = ( function () {
  var lastFrameID;
  return function () {

    // Update state if new Leap Motion frame is available.
    var frame = this.leapController.frame();
    if (frame.valid && frame.id != lastFrameID) {
      lastFrameID = frame.id;
      if (frame.tools.length === 1) {
        var tool = frame.tools[0];
        this.position.fromArray(tool.stabilizedTipPosition).multiplyScalar(0.001);
      }
    }

    return {
      hasOrientation: true,
      orientation: this.getOrientation(),
      hasPosition: true,
      position: this.position
    };

  };
} )();

LeapMotionPositionSensorVRDevice.prototype.getOrientation = function() {
  return this.orientation;
};

LeapMotionPositionSensorVRDevice.prototype.getPosition = function() {
  return this.position;
};

LeapMotionPositionSensorVRDevice.prototype.resetSensor = function() {
  // TODO
};

module.exports = LeapMotionPositionSensorVRDevice;
