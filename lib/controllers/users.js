'use strict';

var shell = require('shelljs'),
	prompt = require('prompt'),
	querystring = require('querystring'),
	request = require('request'),
	chalk = require('chalk'),
	fs = require('fs');

function getUserHome() {
	return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function readToken() {
	var file = (process.platform === 'win32') ? '_mean' : '.mean';
	var path = getUserHome() + '/' + file;

	if (!shell.test('-e', path)) return null;

	return shell.cat(path);
}


var whoami = exports.whoami = function(callback) {

	var token = readToken();

	if (token) {

		var options = {
			uri: 'https://network.mean.io/api/v0.1/whoami',
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

	var file = (process.platform === 'win32') ? '_mean' : '.mean';
	var path = getUserHome() + '/' + file;

	if (token) {
		fs.writeFile(path, token, function(err) {
			if (err) console.log(err);

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

				fs.writeFile(path, result.token, function(err) {
					if (err) console.log(err);

					whoami(callback);
				});

			});

	}
};

exports.login = function() {

	prompt.start();

	prompt.get({
			properties: {
				email: {
					format: 'email',
					required: true
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

			var options = {
				uri: 'https://network.mean.io/api/v0.1/user/login',
				method: 'POST',
				form: result,
				headers: {
					'Content-Type': 'multipart/form-data',
					'Content-Length': querystring.stringify(result).length
				}

			};

			request(options, function(err, response, body) {
				if (!err && (response.statusCode === 200 || response.statusCode === 201)) {
					console.log('Login Successful! \n Authorizing the mean client.');

					body = JSON.parse(body);

					authorize(body.token.api, function() {
						console.log('Run `mean whoami` to see authorized credentials');
					});

				} else {
					console.log(chalk.red('Error: Login Failed!'));
					if (err) {
						return console.error(err);
					}
				}
			});

		});

};

exports.logout = function() {
	var file = (process.platform === 'win32') ? '_mean' : '.mean';
	var path = getUserHome() + '/' + file;
	shell.rm(path);
};

exports.register = function() {

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
					required: true
				},
				email: {
					format: 'email',
					required: true
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

			var options = {
				uri: 'https://network.mean.io/api/v0.1/user',
				method: 'POST',
				form: result,
				headers: {
					'Content-Type': 'multipart/form-data',
					'Content-Length': querystring.stringify(result).length
				}

			};

			request(options, function(err, response, body) {
				if (!err && (response.statusCode === 200 || response.statusCode === 201)) {
					console.log('Registration Successful! \n Authorizing the mean client.');

					body = JSON.parse(body);

					authorize(body.token, function() {
						console.log('Run `mean whoami` to see authorized credentials');
					});

				} else {
					console.log(chalk.red('Error: Registration Failed!'));
					if (err) {
						return console.error(err);
					}
				}
			});

		});
};