'use strict';

var inquirer = require('inquirer'),
  _ = require('lodash');

// callback must be in form of function(results)
module.exports = function(options, callback) {

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
    '  You may choose to opt out of this collection now (by choosing \'N\' at the below prompt)' + '\n' +
    '  or at any time in the future by running the following command:' + '\n\n' +
    '  mean disable user-reporting' + '\n\n' +
    '  Do you want to help  (Y/n)? ',
    default: options.privacy,
    validate: required
  }, {
      type: 'input,',
      name: 'mail',
      message: 'Please provide your email so we can create your first admin user and register you to the mean network',
      default: options.email,
      validate: required
    }, {
	  type: 'input,',
	  name: 'username',
	  message: 'Please provide your username to ...',
	  default: options.username,
	  validate: required
  }
  ];
    /*{
    type: 'list',
    name: 'taskrunner',
    message: 'Do you prefer grunt or gulp as a taskrunner?',
    default: 'grunt',
    choices: ['grunt', 'gulp'],
    validate: required
  }, {
    type: 'checkbox',
    name: 'meanDeps',
    message: 'Which mean packages would you like to install?',
    choices: [
      {
        name: 'mean-admin',
        checked: false
      }
    ]

  }*/
  //];

  inquirer.prompt(questions, function(results) {
    _.assign(options, results);
    callback(options);
  });
};
