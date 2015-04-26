'use strict';

var utils = require('../utils'),
	chalk = require('chalk');


exports.connect = function(env, callback, appName) {

	var pkgJsonPath = (appName) ? process.cwd() + '/' + appName + '/package.json' : './package.json';

	utils.loadPackageJson(pkgJsonPath, function(err, data) {
		if (err) return callback(err);

		var path = (data.meanVersion < '0.4.0' ? '/server' : '') + '/config/env/' + env + '.js';

		var config = (appName) ? require(process.cwd() + '/' + appName + path) : require(process.cwd() + path);

		var db = require('mongoose').createConnection(config.db, config.dbOptions);
		db.on('error', console.error.bind(console, chalk.red('    Error Connecting to database:')));
		db.once('open', function() {
			console.log(chalk.green('    DB connection successful!'));
			console.log();
			db.options.url = config.db;
			callback(null, db);
		});
	});
};
