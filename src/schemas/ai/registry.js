/**
 * @fileoverview registry - Provides registry functionality.
 */
'use strict';

const BaseSchema = require('../BaseSchema');
const COMMON_DTO_SCHEMAS = BaseSchema.COMMON_DTO_SCHEMAS;

/**
 * ContractRegistry
 * Manages contract registry logic.
 */
class ContractRegistry {
  /**
   * constructor - Executes constructor.
   * @param {*} schemas - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(schemas = COMMON_DTO_SCHEMAS) {
    this.schemas = new Map();
    schemas.forEach((schema) => this.register(schema));
  }

  /**
   * register - Executes register.
   * @param {*} schema - Input parameter.
   * @returns {*} Result of operation.
   */
  register(schema) {
    if (!schema?.$id) {
      throw new TypeError('Contract schema must define $id');
    }

    if (this.schemas.has(schema.$id)) {
      throw new TypeError(`Duplicate contract schema: ${schema.$id}`);
    }

    this.schemas.set(schema.$id, schema);
  }

  /**
   * get - Executes get.
   * @param {*} schemaId - Input parameter.
   * @returns {*} Result of operation.
   */
  get(schemaId) {
    return this.schemas.get(schemaId) || null;
  }

  /**
   * getByTitle - Executes get by title.
   * @param {*} title - Input parameter.
   * @returns {*} Result of operation.
   */
  getByTitle(title) {
    return this.list().find((schema) => schema.title === title) || null;
  }

  /**
   * list - Executes list.
   * @returns {*} Result of operation.
   */
  list() {
    return Array.from(this.schemas.values());
  }
}

module.exports = new ContractRegistry();
module.exports.ContractRegistry = ContractRegistry;
