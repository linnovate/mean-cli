'use strict';

var prompt = require('prompt'),
	querystring = require('querystring'),
	request = require('request'),
	chalk = require('chalk'),
	config = require('../../config')(),
	utils = require('../utils'),
	napi = config.napiUrl;


var whoami = exports.whoami = function(callback) {

	var token = utils.readToken();

	if (token) {

		var options = {
			uri: napi + '/whoami',
			method: 'GET',
			headers: {
				'authorization': token
			}
		};

		request(options, function(error, response, body) {
			if (!error && (response.statusCode === 200 || response.statusCode === 201)) {

				if (callback) return callback(body);
				console.log(body);

			} else {
				console.log('Client is NOT Authorized. Invalid token.');
			}
		});

	} else {
		console.log('Client is NOT Authorized.');
	}
};


var authorize = exports.authorize = function(token, callback) {

	if (token) {
		utils.updateGlobalMeanJson({token: token}, function() {
			whoami();
		});

	} else {

		prompt.start();

		prompt.get({
				properties: {
					token: {
						hidden: true,
						required: true
					}
				}
			},
			function(err, result) {

				utils.updateGlobalMeanJson({token: result.token}, function() {
					whoami(callback);
				});
			});

	}
};

exports.login = function(options, callback) {

	prompt.start();

	prompt.get({
			properties: {
				email: {
					format: 'email',
					required: true,
					default: (options && options.email) ? options.email: ''
				},
				password: {
					minLength: 8,
					maxLength: 15,
					pattern: /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/,
					message: 'Password must be only letters, spaces, or dashes 8-15 characters long',
					hidden: true,
					required: true
				}
			}
		},
		function(err, result) {
        
			if (err) throw err;

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

					if (callback) callback(body.token.api);

				} else {
					console.log(chalk.red('Error: Login Failed!'));
					if (err) return console.error(err);
				}
			});

		});

};

exports.logout = function() {
	utils.updateGlobalMeanJson({token:null}, function() {});
};

var create = exports.create = function(user, callback) {

	var opt = {
		uri:  napi + '/user',
		method: 'POST',
		form: user,
		headers: {
			'Content-Type': 'multipart/form-data',
			'Content-Length': querystring.stringify(user).length
		}

	};

	request(opt, function(err, response, body) {
		if (!err && (response.statusCode === 200 || response.statusCode === 201)) {
			console.log('Registration Successful! \n Authorizing the mean client.');

			body = JSON.parse(body);

			authorize(body.token, function() {
				console.log('Run `mean whoami` to see authorized credentials');
			});

			if (callback) callback(body.token);

		} else if (!err) {
            console.log(chalk.red('Error: Registration Failed!'));
            console.log(chalk.red(body));
        } else return console.error(err);
	});
};

exports.register = function(options, callback) {

	prompt.start();

	prompt.get({
			properties: {
				name: {
					pattern: /^[a-zA-Z\s\-]+$/,
					minLength: 4,
					maxLength: 15,
					message: 'Name must be only letters, spaces, or dashes (min length of 4)',
					required: true
				},
				username: {
					minLength: 4,
					maxLength: 15,
					pattern: /^[a-zA-Z\s\-]+$/,
					message: 'Username must be only letters, spaces, or dashes (min length of 4)',
					required: true,
					default: (options && options.username) ? options.username: ''
				},
				email: {
					format: 'email',
					required: true,
					default: (options && options.email) ? options.email: ''
				},
				password: {
					minLength: 8,
					maxLength: 15,
					pattern: /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/,
					message: 'Password must be only letters, spaces, or dashes 8-15 characters long',
					hidden: true,
					required: true
				}
			}
		},
		function(err, result) {
			if (err) throw err;
			create(result, callback);
		});
};