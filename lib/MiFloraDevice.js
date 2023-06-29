'use strict';

const { Device } = require('homey');

module.exports = class MiFloraDevice extends Device {

  static POLL_INTERVAL = 1000 * 60 * 15; // 15 min

  constructor(...props) {
    super(...props);

    this._onPoll = this._onPoll.bind(this);
  }

  async onInit() {
    const { address } = this.getData();

    this._manager = this.homey.app.getMiFloraManager();
    this._manager.start();

    this._manager.getAdvertisement({ address }).then(() => {
      this._onPoll();
      this._onPollInterval = setInterval(this._onPoll, this.constructor.POLL_INTERVAL);
      this.setAvailable().catch(this.error);
    }).catch(err => {
      this.error(err);
      this.setUnavailable(err).catch(this.error);
    });
  }

  onDeleted() {
    if (this._onPollInterval) clearInterval(this._onPollInterval);
    if (this._manager) this._manager.stop();
  }

  _onPoll() {
    const { address } = this.getData();

    this._manager.getFloraDeviceData({ address })
      .then(data => this._onData(data))
      .catch(err => {
        this.error(err);
      });
  }

  _onData() {
    throw new Error('Overload Me');
  }

};
