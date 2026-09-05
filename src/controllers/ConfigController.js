'use strict';

const ConfigService = require('@services/ConfigService');
const { memoryCache, CacheConfig } = require('@cache');

/**
 * Handles reading and updating the bot configuration (admin only).
 * Follows Single Responsibility and Dependency Inversion principles.
 */
class ConfigController {
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;
  /** @type {ConfigService} */
  #configService;

  /**
   * @param {import('../models/ConfigRepository')} configRepo
   * @param {ConfigService} [configService]
   */
  constructor(configRepo, configService = new ConfigService()) {
    this.#configRepo = configRepo;
    this.#configService = configService;
    this.get = this.get.bind(this);
    this.update = this.update.bind(this);
  }

  /**
   * GET /api/config
   * Returns complete configuration object with fallbacks and provider metadata.
   */
  get(_req, res) {
    const key = CacheConfig.KEYS.configExport();
    let configDto = memoryCache.get(key);
    if (!configDto) {
      configDto = this.#configService.export(this.#configRepo);
      memoryCache.set(key, configDto, CacheConfig.TTL.CONFIG);
    }
    res.json(configDto);
  }

  /**
   * POST /api/config
   * Updates partial or full configuration keys and executes change hooks.
   */
  async update(req, res) {
    await this.#configService.save(this.#configRepo, req.body);
    memoryCache.del(CacheConfig.KEYS.configExport());
    memoryCache.delByPrefix(CacheConfig.PREFIXES.MODELS);
    res.json({
      ok: true,
    });
  }
}

module.exports = ConfigController;
