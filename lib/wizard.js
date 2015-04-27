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
  }, {
      type: 'input',
      name: 'email',
      message: 'Please provide your email so we can create your first admin user',
      default: options.email,
	  validate: function(input) {
		  // Declare function as asynchronous, and save the done callback
		  var done = this.async(),
			  re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
			  val = re.test(input);
		  if (val) return done(true);
		  done('Invalid input for email');
	  }
    }, {
	  type: 'input,',
	  name: 'username',
	  message: 'Please provide your username so we can create your first admin user',
	  default: options.username,
	  validate: required
  }];
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
    install.init(options, indexCb);
  });
};
