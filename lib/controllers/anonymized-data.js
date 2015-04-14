'use strict';

var config = require('../../config')(),
	napi = config.napiUrl,
	users = require('./users'),
	utils = require('../utils'),
	inquirer = require('inquirer'),
	request = require('request');


function registerOrLogin(options) {
	var questions = [{
		type: 'input,',
		name: 'exists',
		message: 'Do you have a network account (Y/n) ? ',
		default: 'Y'
	}];
	inquirer.prompt(questions, function(results) {
		if (results.exists === 'Y')
			users.login(options);
		else users.register(options);
	});

}


function checkPrivacy(options, callback) {
	var path = (options.cmd === 'init') ? process.cwd() + '/' + options.name + '/settings.json' : process.cwd() + '/settings.json';
	utils.loadPackageJson(path, function(err, settings) {
		if (settings.anonymizedData === false) {
			var token = utils.readToken();
			if (token) return callback(token);
			registerOrLogin(options);
		} else callback(null);
	});
};

exports.create = function(options) {
	checkPrivacy(options, function(token) {
		var data = {
			token: token,
			platform: process.platform,
			versions: process.versions,
			created: Date.now(),
			success: (options.err) ? false : true,
			err: options.err,
			command: options.cmd,
			data: options.data
		};

		var opt = {
			uri:  napi + '/user/login',
			method: 'POST',
			form: result,
			headers: {
				'Content-Type': 'multipart/form-data',
				'Content-Length': querystring.stringify(result).length
			}

		};

		request(opt, function(err, response, body) {
			if (!err && (response.statusCode === 200 || response.statusCode === 201)) {
				console.log('Login Successful! \n Authorizing the mean client.');

				body = JSON.parse(body);

				authorize(body.token.api, function() {
					console.log('Run `mean whoami` to see authorized credentials');
				});

				anonymizedData.create(options);

			} else {
				console.log(chalk.red('Error: Login Failed!'));
				if (err) {
					options.err = err;
					anonymizedData.create(options);
					return console.error(err);
				}
			}
		});
	});

};
/*
* requires root for load Json:
* mean deploy
* mean init ? i can know the root...
* mean install
* mean list
* mean logs?
* mean package
* mean postinstall
* mean preinstall (Error)
* mean publish
* mean status
* mean uninstall
* */