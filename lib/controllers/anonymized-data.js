'use strict';

var config = require('../../config')(),
	napi = config.napiUrl,
	//users = require('./users'),
	utils = require('../utils'),
	//inquirer = require('inquirer'),
	request = require('request');


//function registerOrLogin() {
//	var questions = [{
//		type: 'input,',
//		name: 'exists',
//		message: 'Do you have a network account (Y/n) ? ',
//		default: 'Y'
//	}];
//	inquirer.prompt(questions).then(function(results) {
//		if (results.exists === 'Y')
//			users.login();
//		else users.register();
//	});
//}


function checkPrivacy(options, callback) {

	function create() {
		var token = utils.readToken();
		callback(token);
	}
	utils.loadPackageJson('./mean.json', function(err, settings) {
		if (err || !settings) {
			utils.loadPackageJson(utils.meanJsonPath(), function(err, settings) {
				if (settings && settings.anonymizedData) {
					create();
				}
			});
		} else if (settings && settings.anonymizedData)
			create();
	});

}

exports.create = function(options) {
	checkPrivacy(options, function(token) {
		var data = {
			token: token,
			platform: process.platform,
			versions: process.versions,
			created: new Date(),
			//success: (options.err) ? false : true,
			//err: options.err,
			command: options.cmd,
			data: options.data
		};

		var opt = {
			uri:  napi + '/index/cli/cli',
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json'
			}
		};

		request(opt, function() {});
	});

};
