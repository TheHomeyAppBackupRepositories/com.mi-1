'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

const XiaomiBasicCluster = require('../../lib/XiaomiBasicCluster');

Cluster.addCluster(XiaomiBasicCluster);

class AqaraMotionSensor extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    zclNode.endpoints[1].clusters[CLUSTER.OCCUPANCY_SENSING.NAME]
      .on('attr.occupancy', this.onOccupancyAttributeReport.bind(this));

    zclNode.endpoints[1].clusters[CLUSTER.BASIC.NAME]
      .on('attr.xiaomiLifeline', this.onXiaomiLifelineAttributeReport.bind(this));

    zclNode.endpoints[1].clusters[CLUSTER.ILLUMINANCE_MEASUREMENT.NAME]
      .on('attr.measuredValue', this.onLuminanceMeasuredValueAttributeReport.bind(this));
  }

  /**
   * When an occupancy attribute report is received `alarm_motion` is set true. After the
   * timeout has expired (and no motion has been detected since) the `alarm_motion` is set false.
   * @param {boolean} occupied - True if motion is detected
   */
  onOccupancyAttributeReport({ occupied }) {
    this.log('occupancy attribute report', occupied);

    this.setCapabilityValue('alarm_motion', occupied).catch(this.error);

    // Set a timeout after which the alarm_motion capability is reset
    if (this.motionAlarmTimeout) clearTimeout(this.motionAlarmTimeout);
    this.motionAlarmTimeout = setTimeout(() => {
      this.log('reset alarm_motion after timeout');
      this.setCapabilityValue('alarm_motion', false).catch(this.error);
    }, this.getSetting('motion_alarm_timeout') * 1000);
  }

  /**
   * Set `measure_luminance` when a `measureValue` attribute report is received on the measure
   * luminance cluster.
   * @param {number} measuredValue
   */
  onLuminanceMeasuredValueAttributeReport(measuredValue) {
    this.log('illuminance measuredValue report', measuredValue);
    this.setCapabilityValue('measure_luminance', measuredValue).catch(this.error);
  }

  /**
   * This is Xiaomi's custom lifeline attribute, it contains a lot of data, af which the most
   * interesting the battery level. The battery level divided by 1000 represents the battery
   * voltage. If the battery voltage drops below 2600 (2.6V) we assume it is almost empty, based
   * on the battery voltage curve of a CR2450.
   * @param {{batteryLevel: number}} lifeline
   */
  onXiaomiLifelineAttributeReport({ batteryVoltage } = {}) {
    this.log('lifeline attribute report', { batteryVoltage });
    this.setCapabilityValue('alarm_battery', batteryVoltage < 2600).catch(this.error);
  }

}

module.exports = AqaraMotionSensor;
