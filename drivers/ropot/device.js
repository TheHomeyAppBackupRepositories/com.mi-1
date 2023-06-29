'use strict';

const MiFloraDevice = require('../../lib/MiFloraDevice.js');

module.exports = class FloraDeviceRopot extends MiFloraDevice {

  async _onData(data) {
    const temperature = data.readUInt16LE(0) / 10;
    const moisture = data.readUInt16BE(6);
    const fertility = data.readUInt16LE(8);

    await Promise.all([
      this.setCapabilityValue('measure_temperature', temperature),
      this.setCapabilityValue('flora_measure_moisture', moisture),
      this.setCapabilityValue('flora_measure_fertility', fertility),
    ]);
  }

};
