'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

const MiUtil = require('../../lib/MiUtil');
const XiaomiBasicCluster = require('../../lib/XiaomiBasicCluster');

Cluster.addCluster(XiaomiBasicCluster);

class AqaraWeatherSensor extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    zclNode.endpoints[1].clusters[CLUSTER.BASIC.NAME]
      .on('attr.xiaomiLifeline', this.onXiaomiLifelineAttributeReport.bind(this));

    zclNode.endpoints[1].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME]
      .on('attr.measuredValue', this.onTemperatureMeasuredAttributeReport.bind(this));

    zclNode.endpoints[1].clusters[CLUSTER.RELATIVE_HUMIDITY_MEASUREMENT.NAME]
      .on('attr.measuredValue', this.onRelativeHumidityMeasuredAttributeReport.bind(this));

    zclNode.endpoints[1].clusters[CLUSTER.PRESSURE_MEASUREMENT.NAME]
      .on('attr.measuredValue', this.onPressureMeasuredAttributeReport.bind(this));
  }

  /**
   * Set `measure_temperature` when a `measureValue` attribute report is received on the
   * temperature measurement cluster.
   * @param {number} measuredValue
   */
  onTemperatureMeasuredAttributeReport(measuredValue) {
    const measuredValueParsed = MiUtil.roundToTwoDecimals(measuredValue / 100);
    this.log('temperature measured attribute report', measuredValueParsed);
    this.setCapabilityValue('measure_temperature', measuredValueParsed).catch(this.error);
  }

  /**
   * Set `measure_humidity` when a `measureValue` attribute report is received on the relative
   * humidity measurement cluster.
   * @param {number} measuredValue
   */
  onRelativeHumidityMeasuredAttributeReport(measuredValue) {
    const measuredValueParsed = MiUtil.roundToTwoDecimals(measuredValue / 100);
    this.log('relative humidity measured attribute report', measuredValueParsed);
    this.setCapabilityValue('measure_humidity', measuredValueParsed).catch(this.error);
  }

  /**
   * Set `measure_pressure` when a `measureValue` attribute report is received on the pressure
   * measurement cluster.
   * @param {number} measuredValue
   */
  onPressureMeasuredAttributeReport(measuredValue) {
    const measuredValueParsed = MiUtil.roundToTwoDecimals(measuredValue);
    this.log('pressure measured attribute report', measuredValueParsed);
    this.setCapabilityValue('measure_pressure', measuredValueParsed).catch(this.error);
  }

  /**
   * This is Xiaomi's custom lifeline attribute, it contains a lot of data, af which the most
   * interesting the battery level. The battery level divided by 1000 represents the battery
   * voltage. If the battery voltage drops below 2600 (2.6V) we assume it is almost empty, based
   * on the battery voltage curve of a CR2450.
   * @param {{batteryLevel: number}} lifeline
   */
  onXiaomiLifelineAttributeReport({
    state, humidity, pressure, batteryVoltage,
  } = {}) {
    this.log('lifeline attribute report', {
      batteryVoltage, state, humidity, pressure,
    });
    if (typeof state === 'number') this.onTemperatureMeasuredAttributeReport(state);
    if (typeof humidity === 'number') this.onRelativeHumidityMeasuredAttributeReport(humidity);
    if (typeof pressure === 'number') this.onPressureMeasuredAttributeReport(pressure / 100);
    if (typeof batteryVoltage === 'number') {
      this.setCapabilityValue('alarm_battery', batteryVoltage < 2600).catch(this.error);
    }
  }

}

module.exports = AqaraWeatherSensor;
