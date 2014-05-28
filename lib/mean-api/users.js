'use strict';

var config = {
    db: 'mongodb://localhost/mean-gitlab',
    app: {
        name: 'MEAN - FullStack JS - Development'
    },
    facebook: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
    },
    twitter: {
        clientID: 'CONSUMER_KEY',
        clientSecret: 'CONSUMER_SECRET',
        callbackURL: 'http://localhost:3000/auth/twitter/callback'
    },
    github: {
        clientID: '15d587b87bd4cef7f78f',
        clientSecret: '7a7f8d2e1c4baed4b2bc5c27602a129cc1af858d',
        callbackURL: 'http://localhost:3000/auth/github/callback'
    },
    google: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/google/callback'
    },
    linkedin: {
        clientID: 'API_KEY',
        clientSecret: 'SECRET_KEY',
        callbackURL: 'http://localhost:3000/auth/linkedin/callback'
    },
    gitlab: {
        apiKey: 'rBhswMZfcijtUy616vyX',
        host: 'http://git.mean.io',
        apiVersion: 'api/v3'
    }
};
var request = require('request');
var querystring = require('querystring');

exports.create = function(user, callback) {

    var body = user;
    var options = {
        uri: config.gitlab.host + '/' + config.gitlab.apiVersion + '/users?private_token=' + config.gitlab.apiKey,
        method: 'POST',
        form: body,
        headers: {
            'Content-Type': 'multipart/form-data',
            'Content-Length': querystring.stringify(body).length
        }
    };

    request(options, function(error, response, body) {
        console.log(response.statusCode);
        if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
            var info = JSON.parse(body);
            if (callback) {
                callback(info);
            }
        }
    });
};

exports.findOne = function(id, callback) {
    var options = {
        uri: config.gitlab.host + '/' + config.gitlab.apiVersion + '/users/' + id + '?private_token=' + config.gitlab.apiKey,
        method: 'GET',
    };

    request(options, function(error, response, body) {
        console.log(response.statusCode);
        if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
            var info = JSON.parse(body);
            if (callback)
                callback(error, info);
        } else {
            if (callback)
                callback(error, null);
        }
    });
};

exports.login = function(email, password, callback) {
    var body = {
        email: email,
        password: password
    };
    var options = {
        uri: config.gitlab.host + '/' + config.gitlab.apiVersion + '/session',
        method: 'POST',
        form: body,
        headers: {
            'Content-Type': 'multipart/form-data',
            'Content-Length': querystring.stringify(body).length
        }
    };

    request(options, function(error, response, body) {
        if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
            var info = JSON.parse(body);
            if (callback)
                callback(error, info);
        }
    });
};