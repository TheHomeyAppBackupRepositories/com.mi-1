'use strict';

module.exports = class MiUtil {

  static async wait(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  static roundToTwoDecimals(value) {
    return Math.round(value * 100) / 100;
  }

};
