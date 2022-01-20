// tslint:disable-next-line
const TSConsoleReporter = require('jasmine-ts-console-reporter');
jasmine.getEnv().clearReporters(); // Clear default console reporter
jasmine.getEnv().addReporter(new TSConsoleReporter());
