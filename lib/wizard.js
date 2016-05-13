'use strict';

var inquirer = require('inquirer'),
	install = require('./install'),
  _ = require('lodash');

// callback must be in form of function(results)
module.exports = function(options, indexCb) {

  function required(value) {
    return !!value.trim() || 'Required';
  }

  var questions = [{
    type: 'input',
    name: 'name',
    message: 'What would you name your mean app?',
    default: options.name,
    validate: required
  }];

  inquirer.prompt(questions).then(function(results) {
    _.assign(options, results);
    install.init(options, indexCb);
  });
};
