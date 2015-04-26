'use strict';

var config = require('../config')();
var napi = config.napiUrl;
var shell = require('shelljs');
var fs = require('fs');
var chalk = require('chalk');
var utils = require('./utils');
var mongoCtrl = require('./controllers/mongo');
var users = require('./controllers/users');
var series = require('async-series');
var request = require('request');
var querystring = require('querystring');
var inquirer = require('inquirer');
var prompt = require('prompt');

var progress = new utils.Progress();

exports.init = function(options) {
  progress.start();

	options.anonymizedData = (options.privacy === 'Y' ||options.privacy === 'y' );

	series([
      checkPermissions,
      function(done) {
		  cloneMean(options, done);
      },
      function(done) {
	      createFirstUser(options, done);
      },
	  function(done) {
		  updateSettings(options, done);
	  },
	  function(done) {
		  createMeanJson(options, done);
	  },
	  printMeanIntro,
      function(done) {
        addGitRemote(options.name, done);
      }
    ],function(err) {
      if (err) throw err;
      nextSteps(options);
    });

    progress.stop();

    //checkoutStableTag(name); // Checkout to stable tag noted in the cli.
    //nextSteps(name); // Guide the user about the next steps

};

function updateSettings(options, done) {

	var outputFilename = process.cwd() + '/' + options.name + '/mean.json';

	// Load mean.json
	utils.loadPackageJson(outputFilename, function(err, data) {
		if (err || !data) return done();
		data.anonymizedData = options.anonymizedData;
		fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function() {
			done();
		});
	});

}

function createMeanJson(options, done) {

	utils.updateMeanJson({anonymizedData:  options.privacy === 'Y'}, function() {
		done();
	});
}


function checkPermissions(done) {
	if (utils.isWin) {
		console.log('On windows platform - Please check permissions independently');
		console.log('All permissions should be run with the local users permissions');
		done();
	} else {
		if (process.getuid) {
			var uid = process.getuid();
			if (  uid === 0) {
				console.log(chalk.red('Installation of mean should not be done as root! bailing out'));
				throw('RUNNING AS ROOT');
			}
		}
		utils.checkNpmPermission(done);
	}
}

function printMeanIntro(done) {
  var logo = fs.readFileSync(__dirname + '/../img/logo.txt');
  console.log(logo.toString());
  done();
}

function cloneMean(options, done){

  // TODO - Possibly remove depdendency of git all together and download and optionally add a remote.
  if (!shell.which('git')) return console.log(chalk.red('Prerequisite not installed: git'));
  var name = options.name;
  var source = (options.git ? 'git@github.com:linnovate/mean.git' : 'https://github.com/linnovate/mean.git');

  // Allow specifying specific repo
  if (options.repo) {
    source = options.repo;
  }

  // If full clone is specified do a normal clone - default is a shallow --depth 1 clone"
  var shallow = (options.full ? '' : ' --depth 1 ');

  // Install the specified branch or the stableTag - No more MASTER!
  //var branch = options.branch ? options.branch : stableTag;
  var branch = options.branch;
  source = branch + ' ' + source + ' "' + name + '"';
  var gitCmd = 'git clone ' + shallow + ' -b' + source;
  console.log(chalk.green('Cloning branch: %s into destination folder:'), options.branch, name);
  console.log(chalk.green(gitCmd));

  // Running clone
  shell.exec(gitCmd , function(status, output) {
    if (status) {
	    console.log(output);
	    return done(status);
    }
    console.log();
    done();

  });
}

function createFirstUser(options, done) {

	var User, DB, email = options.email;

	mongoCtrl.connect('development', function(err, db) {
		DB = db;
		if (err) {
			console.error('Cannot create admin user');
			return done();
		}
		User = db.collection('users');

		find(function(user) {
			if (user) update(user);
			else create();
		});

	}, options.name);

	function find(cb) {
		User.findOne({
			email: email
		}, function(err, user) {
			if (err) {
				console.error(err);
				return done();
			}
			else cb(user);
		});
	}
	function update(user) {
		if (user.roles.indexOf('admin') === -1) {
			User.update({
				email: email
			}, {$push: {roles: 'admin'}}, {
				w: 1,
				upsert: false,
				multi: false
			}, function(err) {
				if (err) {
					console.error(err);
					return done();
				}
				else console.log(chalk.green('role admin added to your user'));
				DB.close();
				done();
			});
		}
		else {
			console.log('User ' + user.username + ' found with an admin role');
			DB.close();
			done();
		}
	}
	//without schema
	//function create() {
	//	User.insert({email: email, roles: ['admin']}, function(err, user) {
	//		console.log('test', err, user);
	//	});
	//}
	function create() {

		console.log('Please provide password so we can create your first admin user');

		require('./models/user')(DB);
		var User = DB.model('User');

		prompt.start();

		prompt.get({
				properties: {
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
				var user  = new User({
					email: email,
					password: result.password,
					name: options.username,
					username: options.username
				});
				user.roles.push('admin');
				user.save(function(err) {
					if (err) console.log(err);
					else console.log('role admin added to your new user');
					DB.close();
					done();
				});
			});
	}
}


function addGitRemote(name, done) {
  shell.exec('cd '+ name + ' && git remote rename origin upstream', function (status, error) {
    if (!status) {
      console.log('  Added the "remote" upstream origin');
      console.log();
      done();
    } else {
      console.log(error);
	  done(error);
    }
  });
}





/*
function checkoutStableTag(name){
  utils.loadPackageJson('./' + name + '/package.json', function (err, data) {
    var stableTag = 'v'+ data.mean;
    console.log('xxx' ,data.mean);
    var tagCmd = 'cd ' + name + '&& git checkout  ' + stableTag;
    shell.exec(tagCmd);
    console.log(chalk.green('Checked out to stable Tag - '), stableTag);
  });

}
*/

function registerOrLogin(options, callback) {
	var questions = [{
		type: 'input',
		name: 'exists',
		message: 'Do you have a network account (Y/n) ? ',
		default: 'Y'
	}];
	inquirer.prompt(questions, function(results) {
		if (results.exists === 'Y' || results.exists === 'y')
			users.login(options, callback);
		else users.register(options, callback);
	});
}


function initApp(name) {

	//var path = (options.name) ? process.cwd() + '/' + options.name + '/settings.json' : utils.meanJsonPath();


	utils.loadPackageJson('./' + name + '/package.json', function(err, pck) {
		if (err || !pck) return console.log('You must be in a package root');

		var body = {
			name: name,
			description: pck.description,
			version: pck.version,
			keywords: pck.keywords
		};

		var token = utils.readToken();

		var options = {
			uri: napi + '/app/init',
			method: 'POST',
			form: querystring.stringify(body),
			headers: {
				'Content-Type': 'multipart/form-data',
				'Content-Length': querystring.stringify(body).length,
				'authorization': token
			}
		};

		request(options, function() {});
	});



}

function nextSteps(options) {

	var name = options.name;

	// show the next steps after the person has seen the start/help text so sleep 1 second.
	setTimeout(function(){
		console.log('  Install node package dependencies:');
		console.log('    $ ' + chalk.green('cd %s && npm install'), name);
		console.log('  Bower install should be triggered for client side dependencies.');
		console.log('  If it did not run invoke it manually...');
		console.log('    $ ' + chalk.green('cd %s && bower install'), name);
		console.log('  Run the app by running:');
		console.log('    $ ' + chalk.green('cd %s and then run..'), name);
		console.log('    $ '+ chalk.green('gulp'));
		console.log();
		console.log();
		console.log();
		if (options.anonymizedData) {
			var token = utils.readToken();
			if (!token)
				registerOrLogin(options, function(data) {
					options.token = data;
					initApp(name);
				});
			else {
				options.token = token;
				initApp(name);
			}
		}
	},1000);


}
