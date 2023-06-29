'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class AqaraCurtain extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    // Get Position
    zclNode.endpoints[1].clusters[CLUSTER.ANALOG_OUTPUT.NAME].on('attr.presentValue', presentValue => {
      this.log('analog output present value attribute report', presentValue);
      this.setCapabilityValue('windowcoverings_set', 1 - (presentValue / 100)).catch(this.error);
    });

    zclNode.endpoints[1].clusters[CLUSTER.WINDOW_COVERING.NAME].on('attr.currentPositionLiftPercentage', currentPositionLiftPercentage => {
      this.log('window covering current position lift percentage attribute report', currentPositionLiftPercentage);
      this.setCapabilityValue('windowcoverings_set', 1 - (currentPositionLiftPercentage / 100)).catch(this.error);
    });

    // Set Position
    this.registerCapabilityListener('windowcoverings_set', async value => {
      this.log('go to lift percentage', (1 - value) * 100);
      await zclNode.endpoints[1].clusters[CLUSTER.WINDOW_COVERING.NAME].goToLiftPercentage({
        percentageLiftValue: (1 - value) * 100,
      }, {
        // This is a workaround for the fact that this device does not repsonds with a default
        // response even though the ZCL command `goToLiftPercentage` demands that.
        waitForResponse: false,
      });
    });
  }

}

module.exports = AqaraCurtain;
