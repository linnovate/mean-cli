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
// var request = require('request');
// var querystring = require('querystring');
var mongoose = require('monggose');
var Package = mongoose.model('Package');

exports.exists = function(name, callback) {
    console.log(name);
    Package.findOne({
        'data.name': name
    }, function(err, package) {
        callback(err, package);
    });

};