'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    logger = require('mean-logger'),
    express = require('express');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
var mean = require('../..');

// Initializing system variables
var config = require('./config');
var db = mongoose.connect(config.db);

// Register database dependency
mean.register('database', {
    connection: db
});

// Express settings
var app = express();
require('./express')(app, db);

// Register app dependency
mean.register('app', function() {
    return app;
});

// Register auth dependency
mean.register('auth', function() {
    return true;
});

// Start the app by listening on <port>
app.listen(config.port);
console.log('Mean app started on port ' + config.port + ' (' + process.env.NODE_ENV + ')');

// Initializing logger
logger.init(app, mongoose);

// Expose app
exports = module.exports = app;
