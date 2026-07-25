'use strict';

const { COMMON_DTO_SCHEMAS } = require('./common-dto.schemas');

class ContractRegistry {
  constructor(schemas = COMMON_DTO_SCHEMAS) {
    this.schemas = new Map();
    schemas.forEach((schema) => this.register(schema));
  }

  register(schema) {
    if (!schema?.$id) {
      throw new TypeError('Contract schema must define $id');
    }

    if (this.schemas.has(schema.$id)) {
      throw new TypeError(`Duplicate contract schema: ${schema.$id}`);
    }

    this.schemas.set(schema.$id, schema);
  }

  get(schemaId) {
    return this.schemas.get(schemaId) || null;
  }

  getByTitle(title) {
    return this.list().find((schema) => schema.title === title) || null;
  }

  list() {
    return Array.from(this.schemas.values());
  }
}

module.exports = new ContractRegistry();
module.exports.ContractRegistry = ContractRegistry;
