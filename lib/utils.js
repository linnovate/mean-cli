'use strict';

var http = require('http');
var https = require('https');

exports.get = function(protocol, options, callback) {
    var chunks = '';
    var proto = (protocol === 'https') ? https : http;
    try {
        var req = proto.request(options, function(res) {

            res.setEncoding('utf8');
            res.on('error', function(error) {
                callback(error, null);
            });

            res.on('data', function(chunk) {
                chunks += chunk;
            });

            res.on('end', function(chunk) {
                if (chunk)
                    chunks += chunk;
                var json = JSON.parse(chunks);
                callback(null, json);

            });

            req.on('error', function(error) {
                callback(error, null);
            });
        });
        req.write('data\n');
        req.write('data\n');
        req.end();
    } catch (error) {
        callback(error, null);
    }
};


exports.post = function(protocol, options, post_data, callback) {
    var chunks = '';
    var proto = (protocol === 'https') ? https : http;
    try {
        var req = proto.request(options, function(res) {

            res.setEncoding('utf8');
            res.on('error', function(error) {
                callback(error, null);
            });

            res.on('data', function(chunk) {
                chunks += chunk;
            });

            res.on('end', function(chunk) {
                if (chunk)
                    chunks += chunk;

                //console.log(chunks);

                var json = JSON.parse(chunks);
                callback(null, json);

            });

            req.on('error', function(error) {
                callback(error, null);
            });
        });

        req.write(post_data);
        req.end();
    } catch (error) {
        callback(error, null);
    }
};