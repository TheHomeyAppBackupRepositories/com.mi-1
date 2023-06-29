'use strict';

const Homey = require('homey');

class MyDriver extends Homey.Driver {

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    const advertisements = await this.homey.ble.discover().catch(this.error);
    return advertisements
      .filter(advertisement => advertisement.localName === 'LYWSD03MMC')
      .map(advertisement => {
        return {
          name: advertisement.localName,
          data: {
            id: advertisement.uuid,
          },
          store: {
            peripheralUuid: advertisement.uuid,
          },
        };
      });
  }

}

module.exports = MyDriver;
