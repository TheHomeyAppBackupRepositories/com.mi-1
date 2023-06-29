'use strict';

const { Driver } = require('homey');
const MiUtil = require('./MiUtil');

module.exports = class MiFloraDriver extends Driver {

  static SCAN_TIMEOUT = 10000; // in ms

  setLocalName(localName) {
    this._localName = localName;
  }

  setVisibleName(visibleName) {
    this._visibleName = visibleName;
  }

  async onPairListDevices() {
    const manager = this.homey.app.getMiFloraManager();

    manager.start();
    manager.scan({ timeout: this.constructor.SCAN_TIMEOUT - 1000 });
    await MiUtil.wait(this.constructor.SCAN_TIMEOUT);
    manager.stop();

    const advertisements = await manager.getAdvertisements();
    return Object.keys(advertisements)
      .filter(address => {
        const advertisement = advertisements[address];
        return advertisement.localName === this._localName;
      })
      .map(address => ({
        data: { address },
      }));
  }

};
