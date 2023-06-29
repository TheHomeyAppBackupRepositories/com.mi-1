'use strict';

const { App } = require('homey');
const MiFloraManager = require('./MiFloraManager');

module.exports = class MiApp extends App {

  getMiFloraManager() {
    if (!this.homey) {
      throw new Error('Homey App Destroyed');
    }

    if (!this.miFloraManager) {
      this.miFloraManager = new MiFloraManager({
        homey: this.homey,
      });
    }

    return this.miFloraManager;
  }

};
