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
    meanio: {
        host: 'http://localhost:3000'
    }
};
var request = require('request');
// var querystring = require('querystring');

exports.exists = function(name, callback) {

    console.log(name);

    request(config.host + '/meanApi/packages/' + name, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
    });

};
// var body = project;
// var options = {
//     uri: config.meanio.host + '/' + config.gitlab.apiVersion + '/users?private_token=' + config.gitlab.apiKey,
//     method: 'POST',
//     form: body,
//     headers: {
//         'Content-Type': 'multipart/form-data',
//         'Content-Length': querystring.stringify(body).length
//     }
// };

// request(options, function(error, response, body) {
//     console.log(response.statusCode);
//     if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
//         var info = JSON.parse(body);
//         if (callback) {
//             callback(info);
//         }
//     }
// });