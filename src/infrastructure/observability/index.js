'use strict';

const MetricsRegistry = require('./metrics-registry');

module.exports = new MetricsRegistry();
module.exports.MetricsRegistry = MetricsRegistry;
