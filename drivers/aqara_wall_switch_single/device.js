'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

const XiaomiBasicCluster = require('../../lib/XiaomiBasicCluster');

Cluster.addCluster(XiaomiBasicCluster);

module.exports = class AqaraWallSwitchSingle extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    // Lifeline
    zclNode.endpoints[1].clusters[XiaomiBasicCluster.NAME].on('attr.xiaomiLifeline', ({ batteryVoltage }) => {
      this.setCapabilityValue('alarm_battery', batteryVoltage < 2600).catch(this.error);
    });

    // Button press
    zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', value => {
      if (value !== true) return;

      this.homey.flow
        .getDeviceTriggerCard(`${this.driver.manifest.id}:press_1x`)
        .trigger(this)
        .catch(this.error);
    });
  }

};
