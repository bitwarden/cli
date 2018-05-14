#!/usr/bin/env node

require('tsconfig-paths').register();
require('ts-node').register();
const main = require('./main.ts');
new main.Main().run();
