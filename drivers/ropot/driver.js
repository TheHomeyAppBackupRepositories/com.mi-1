'use strict';

const MiFloraDriver = require('../../lib/MiFloraDriver.js');

module.exports = class FloraDriverRopot extends MiFloraDriver {

  onInit() {
    this.setLocalName('ropot');
    this.setVisibleName('Mi Flora Ropot');
  }

};
