'use strict';

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

class JsonSchemaValidator {
  constructor(ajv = null) {
    this.ajv = ajv || addFormats(new Ajv2020({
      allErrors: true,
      strict: true,
      allowUnionTypes: true,
    }));
    this.validators = new Map();
  }

  validate(schema, value) {
    let validator = this.validators.get(schema.$id);
    if (!validator) {
      validator = this.ajv.compile(schema);
      this.validators.set(schema.$id, validator);
    }

    const valid = validator(value);
    return {
      valid,
      errors: valid ? [] : validator.errors.map((error) => ({
        path: error.instancePath || '/',
        keyword: error.keyword,
        message: error.message,
      })),
    };
  }
}

module.exports = JsonSchemaValidator;
