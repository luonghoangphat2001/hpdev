'use strict';

const CacheConfig = require('./CacheConfig');
const memoryCache = require('./MemoryCache');
const { MemoryCache } = memoryCache;

module.exports = {
  CacheConfig,
  memoryCache,
  MemoryCache,
};
