'use strict';

const MiFloraDriver = require('../../lib/MiFloraDriver.js');

module.exports = class MiFloraDriverStick extends MiFloraDriver {

  onInit() {
    this.setLocalName('Flower care');
    this.setVisibleName('Mi Flora Sensor');
  }

};
