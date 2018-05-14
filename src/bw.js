#!/usr/bin/env node

require('tsconfig-paths').register();
require('ts-node').register();
const main = require('./main.ts');
const m = new main.Main();
m.run();
