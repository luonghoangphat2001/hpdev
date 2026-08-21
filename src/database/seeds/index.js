/**
 * @fileoverview index - Registry of all database seed modules.
 * @module database/seeds/index
 */
'use strict';

const seed001 = require("./001-seed-agent-runtime-states");
const seed002 = require("./002-seed-agent-autonomy");
const seed003 = require("./003-seed-sop-playbooks");

module.exports = Object.freeze([
  seed001,
  seed002,
  seed003
]);
