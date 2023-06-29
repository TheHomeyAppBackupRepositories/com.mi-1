'use strict';

const MiFloraDevice = require('../../lib/MiFloraDevice.js');

module.exports = class MiFloraDeviceStick extends MiFloraDevice {

  async _onData(data) {
    const temperature = data.readUInt16LE(0) / 10;
    const luminance = data.readUInt32LE(3);
    const moisture = data.readUInt16BE(6);
    const fertility = data.readUInt16LE(8);

    await Promise.all([
      this.setCapabilityValue('measure_temperature', temperature),
      this.setCapabilityValue('measure_luminance', luminance),
      this.setCapabilityValue('flora_measure_moisture', moisture),
      this.setCapabilityValue('flora_measure_fertility', fertility),
    ]);
  }

};
