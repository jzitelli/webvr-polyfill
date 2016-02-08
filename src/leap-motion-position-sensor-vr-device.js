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

  // configure leap motion host/port via url params:
  location.search.substr(1).split("&").forEach( function(item) {
    var kv = item.split("=");
    if (kv[0] === 'host') {
      host = host || decodeURIComponent(kv[1]);
    }
    else if (kv[0] === 'port') {
      port = port || decodeURIComponent(kv[1]);
    }
  } );

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
  // tool ids (TODO):
  //var idA, idB;
  // normalized pointing directions of the tools:
  var directionA = new THREE.Vector3();
  var directionB = new THREE.Vector3();
  // used for computing orientation quaternion:
  var cross = new THREE.Vector3();
  var avg = new THREE.Vector3();
  var Y = new THREE.Vector3(0, 1, 0);
  var NZ = new THREE.Vector3(0, 0, -1);
  var quat = new THREE.Quaternion();

  return function () {

    // Update state if new Leap Motion frame is available.
    var frame = this.leapController.frame();
    if (frame.valid && frame.id != lastFrameID) {
      lastFrameID = frame.id;

      if (frame.tools.length === 2) {

        var toolA = frame.tools[0];
        var toolB = frame.tools[1];

        // set position to the average of the tips:
        this.position.set(0.0005 * (toolA.tipPosition[0] + toolB.tipPosition[0]),
                          0.0005 * (toolA.tipPosition[1] + toolB.tipPosition[1]),
                          0.0005 * (toolA.tipPosition[2] + toolB.tipPosition[2]));

        // determine orientation:
        cross.crossVectors(directionA.fromArray(toolA.direction), directionB.fromArray(toolB.direction));
        if (cross.y < 0) {
          cross.negate();
        }
        avg.addVectors(directionA, directionB).normalize();
        this.orientation.setFromUnitVectors(NZ, avg);
        Y.set(0, 1, 0).applyQuaternion(this.orientation);
        quat.setFromUnitVectors(Y, cross);
        this.orientation.multiplyQuaternions(this.orientation, quat);
      }

    }

    return {
      hasOrientation: true,
      orientation: this.orientation,
      hasPosition: true,
      position: this.position
    };

  };
} )();

// TODO:
// LeapMotionPositionSensorVRDevice.prototype.getOrientation = function() {
//   return this.orientation;
// };
// LeapMotionPositionSensorVRDevice.prototype.getPosition = function() {
//   return this.position;
// };
// LeapMotionPositionSensorVRDevice.prototype.resetSensor = function() {
// };

module.exports = LeapMotionPositionSensorVRDevice;
