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
}
LeapMotionPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: {x,y,z}}.
 */
LeapMotionPositionSensorVRDevice.prototype.getState = function() {
  // Update if new Leap Motion frame is available.


  return {
    hasOrientation: true,
    orientation: this.getOrientation(),
    hasPosition: true,
    position: this.getPosition()
  };
};

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
