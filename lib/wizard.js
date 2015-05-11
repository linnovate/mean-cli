'use strict';

var inquirer = require('inquirer'),
	install = require('./install'),
  _ = require('lodash');

// callback must be in form of function(results)
module.exports = function(options, indexCb) {

	var message;
	if (options.privacy === 'Y')
	message = '  You may choose to opt out of this collection now (by choosing \'N\' at the below prompt)' + '\n' +
	'  or at any time in the future by running the following command:' + '\n\n' +
	'  mean disable user-reporting' + '\n\n' +
	'  Do you want to help us improve the mean network (Y/n)? ';
	else
	message = '  You have previously requested for us not to submit your anonymous data to the mean network'+
	'  therefore we changed the default settings not to submit the data' + '\n\n' +
	'  You can enable this in the future by running the following command:' + '\n\n' +
	'  mean enable user-reporting' + '\n\n' +
	'  Do you want to help us improve the mean network (Y/n)? ';

  function required(value) {
    return !!value.trim() || 'Required';
  }

  var questions = [{
    type: 'input',
    name: 'name',
    message: 'What would you name your mean app?',
    default: options.name,
    validate: required
  }, {
    type: 'input,',
    name: 'privacy',
    message: 'The Mean project is currently in developer preview. To help improve the -' + '\n' +
    '  quality of this product, we collect anonymized data on how the mean-cli is used -' + '\n' +
    message,
    default: options.privacy,
    validate: required
  }];

  inquirer.prompt(questions, function(results) {
    _.assign(options, results);
    install.init(options, indexCb);
  });
};
