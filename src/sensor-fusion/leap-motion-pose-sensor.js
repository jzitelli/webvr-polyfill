/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ComplementaryFilter = require('./complementary-filter.js');
var PosePredictor = require('./pose-predictor.js');
var TouchPanner = require('../touch-panner.js');
var THREE = require('../three-math.js');
var Util = require('../util.js');

function LeapMotionPoseSensor(host, port) {
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
LeapMotionPoseSensor.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: {x,y,z}}.
 */
LeapMotionPoseSensor.prototype.getState = ( function () {
  var lastFrameID;
  // tool ids:
  var toolA, idA = null;
  var toolB, idB = null;
  // normalized pointing directions of the tools:
  var directionA = new THREE.Vector3();
  var directionB = new THREE.Vector3();
  // used for computing orientation quaternion:
  const NZ = new THREE.Vector3(0, 0, -1);
  var Y = new THREE.Vector3();
  var cross = new THREE.Vector3();
  var avg = new THREE.Vector3();
  var quat = new THREE.Quaternion();
  const inv_sqrt2 = 1 / Math.sqrt(2);

  return function () {

    // Update state if new Leap Motion frame is available.
    var frame = this.leapController.frame();
    if (frame.valid && frame.id != lastFrameID) {

      lastFrameID = frame.id;

      // manage tool IDs:
      if (idA !== null) {
        // A was tracking, try to find it again
        toolA = frame.tool(idA);
        if (!toolA.valid) {
          // A is lost
          idA = null;
        }
      }
      if (idB !== null) {
        // B was tracking, try to find it again
        toolB = frame.tool(idB);
        if (!toolB.valid) {
          // B is lost
          idB = null;
        }
      }
      if (frame.tools.length === 1) {
        if (idA === null && idB === null) {
          // start tracking A
          toolA = frame.tools[0];
          idA = toolA.id;
        }
      } else if (frame.tools.length === 2) {
        if (idA !== null && idB === null) {
          // start tracking B
          toolB = (frame.tools[0].id === idA ? frame.tools[1] : frame.tools[0]);
          idB = toolB.id;
        } else if (idB !== null && idA === null) {
          toolA = (frame.tools[0].id === idB ? frame.tools[1] : frame.tools[1]);
          idA = toolA.id;
        }
      }

      if (idA !== null && idB !== null) {

        // set position to the average of the tips:
        this.position.set(0.0005 * (toolA.tipPosition[0] + toolB.tipPosition[0]),
                          0.0005 * (toolA.tipPosition[1] + toolB.tipPosition[1]),
                          0.0005 * (toolA.tipPosition[2] + toolB.tipPosition[2]));

        // determine orientation:
        directionA.fromArray(toolA.direction);
        directionB.fromArray(toolB.direction);

        cross.crossVectors(directionA, directionB);
        if (cross.y < 0) {
          cross.negate();
        }

        avg.addVectors(directionA, directionB);

        // not performed under assumption that A, B are orthogonal
        //avg.normalize();
        avg.multiplyScalar(inv_sqrt2);

        quat.setFromUnitVectors(NZ, avg);
        Y.set(0, 1, 0).applyQuaternion(quat);

        // not performed under assumption that A, B are orthogonal
        //cross.normalize();
        this.orientation.setFromUnitVectors(Y, cross);

        this.orientation.multiplyQuaternions(quat, this.orientation);

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
// LeapMotionPoseSensor.prototype.getOrientation = function() {
//   return this.orientation;
// };
// LeapMotionPoseSensor.prototype.getPosition = function() {
//   return this.position;
// };
// LeapMotionPoseSensor.prototype.resetSensor = function() {
// };

module.exports = LeapMotionPoseSensor;
