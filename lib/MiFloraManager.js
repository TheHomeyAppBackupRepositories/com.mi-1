'use strict';

const { EventEmitter } = require('events');

module.exports = class MiFloraManager extends EventEmitter {

  static SCAN_TIMEOUT = 1000 * 7.5; // 7.5s
  static SCAN_INTERVAL = 1000 * 60 * 2.5; // 2.5 min
  static DATA_SERVICE_UUID = '0000120400001000800000805f9b34fb';
  static DATA_CHARACTERISTIC_UUID = '00001a0100001000800000805f9b34fb';
  static REALTIME_CHARACTERISTIC_UUID = '00001a0000001000800000805f9b34fb';
  static REALTIME_META_VALUE = Buffer.from([0xA0, 0x1F]);
  static LOCAL_NAMES = ['Flower care', 'ropot'];

  constructor({ homey }) {
    super();

    this.homey = homey;

    this._advertisements = {};
    this._getFloraDeviceDataPromises = {};

    this._scanInterval = null;
    this._scanListeners = 0;
  }

  log(...props) {
    this.homey.log('[MiFloraManager]', ...props);
  }

  error(...props) {
    this.homey.error('[MiFloraManager]', ...props);
  }

  start() {
    this._scanListeners++;
    if (this._scanListeners === 1) {
      this.scan();
      this._scanInterval = this.homey.setInterval(() => {
        this.scan();
      }, this.constructor.SCAN_INTERVAL);
    }
  }

  stop() {
    this._scanListeners--;
    if (this._scanListeners === 0) {
      this.homey.clearInterval(this._scanInterval);
      this._scanInterval = null;
    }
  }

  scan({ timeout = this.constructor.SCAN_TIMEOUT } = {}) {
    Promise.resolve().then(async () => {
      const advertisements = await this.homey.ble.discover([], timeout);
      advertisements
        .filter(advertisement => this.constructor.LOCAL_NAMES.includes(advertisement.localName))
        .forEach(advertisement => {
          if (this._advertisements[advertisement.address]) return;
          this._advertisements[advertisement.address] = advertisement;

          this.log('Found a device', advertisement.address, advertisement.localName);

          process.nextTick(() => {
            this.emit('advertisement', advertisement);
            this.emit(`advertisement:${advertisement.address}`, advertisement);
          });
        });
    }).catch(err => this.error(err));
  }

  async getAdvertisements() {
    return this._advertisements;
  }

  async getAdvertisement({ address }) {
    if (this._advertisements[address]) {
      return this._advertisements[address];
    }

    return new Promise(resolve => {
      this.once(`advertisement:${address}`, resolve);
    });
  }

  async getFloraDeviceData({ address }) {
    this._getFloraDeviceDataPromises[address] = this._getFloraDeviceDataPromises[address] || Promise.resolve().then(async () => {
      const advertisement = this._advertisements[address];
      if (!advertisement) {
        throw new Error('Invalid Advertisement Address');
      }
      let peripheral;
      const cleanup = () => {
        delete this._getFloraDeviceDataPromises[address];
        if (peripheral) peripheral.disconnect().catch(() => { });
      };

      try {
        peripheral = await advertisement.connect();

        const services = await peripheral.discoverServices();
        const dataService = services.find(service => service.uuid === this.constructor.DATA_SERVICE_UUID);
        if (!dataService) {
          throw new Error('Missing data service');
        }

        const dataServiceCharacteristics = await dataService.discoverCharacteristics();
        const dataCharacteristic = dataServiceCharacteristics.find(characteristic => {
          return characteristic.uuid === this.constructor.DATA_CHARACTERISTIC_UUID;
        });
        if (!dataCharacteristic) {
          throw new Error('Missing data characteristic');
        }

        const realtimeCharacteristic = dataServiceCharacteristics.find(characteristic => {
          return characteristic.uuid === this.constructor.REALTIME_CHARACTERISTIC_UUID;
        });
        if (!realtimeCharacteristic) {
          throw new Error('Missing realtime characteristic');
        }

        await realtimeCharacteristic.write(this.constructor.REALTIME_META_VALUE);
        const dataCharacteristicValue = await dataCharacteristic.read();

        cleanup();
        return dataCharacteristicValue;
      } catch (err) {
        cleanup();
        throw err;
      }
    });

    return this._getFloraDeviceDataPromises[address];
  }

};
