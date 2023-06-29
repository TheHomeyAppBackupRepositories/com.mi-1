'use strict';

const Homey = require('homey');

const RETRY_INTERVAL = 10 * 1000; // 10 seconds
class MyDevice extends Homey.Device {

  _advertisement = null;
  _dataCharacteristic = null;
  _batteryCharacteristic = null;
  _interval = null;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.handleDataNotify = this.handleDataNotify.bind(this);

    this._interval = this.homey.setInterval(() => {
      this.scan().catch(this.error);
    }, RETRY_INTERVAL);
  }

  handleDataNotify(data) {
    const temperature = data.readUInt16LE(0) / 100;
    const humidity = data.readUInt8(2);
    const batteryVoltage = data.readUInt16LE(3) / 1000;

    // The voltage is about 3.1 volt when full and 2.1 volt when (basically) empty
    const battery = Math.min(Math.max(Math.round((batteryVoltage - 2.1) * 100), 0), 100);
    this.setCapabilityValue('measure_temperature', temperature).catch(this.error);
    this.setCapabilityValue('measure_humidity', humidity).catch(this.error);
    this.setCapabilityValue('measure_battery', battery).catch(this.error);
  }

  async scan() {
    if (!this._advertisement) {
      this.log('scanning for peripheral ', this.getStore().peripheralUuid);
      this._advertisement = await this.homey.ble.find(this.getStore().peripheralUuid).catch(this.error);
    }

    if (this._advertisement && !this._connection) {
      this._connection = await this._advertisement.connect();
      this._connection.once('disconnect', () => {
        this._connection = null;
      });
      await this.setupSubscriptions().catch(() => {
        this._connection = null;
      });
    }
  }

  async setupSubscriptions() {
    const services = await this._connection.discoverServices();
    const dataService = services.find(service => service.uuid === 'ebe0ccb07a0a4b0c8a1a6ff2997da3a6');
    if (!dataService) throw new Error('no_service_found');
    const dataCharacteristics = await dataService.discoverCharacteristics(['ebe0ccc17a0a4b0c8a1a6ff2997da3a6']);
    if (!dataCharacteristics || !dataCharacteristics.length) throw new Error('no_characteristic_found');
    this._dataCharacteristic = dataCharacteristics[0];
    await this._dataCharacteristic.subscribeToNotifications(this.handleDataNotify);
    this.log('Subscribed to data notifications');
  }


  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Mi thermo/hygrometer has been deleted');
    if (this._connection) this._connection.disconnect().catch(this.error);
    this.homey.clearInterval(this._interval);
  }

}

module.exports = MyDevice;
