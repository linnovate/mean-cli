'use strict';

// mean network related stuff (disabled)
//var config = require('../config')();
//var napi = config.napiUrl;
//var users = require('./controllers/users');
//var request = require('request');
//var querystring = require('querystring');

var shell = require('shelljs');
var chalk = require('chalk');
var utils = require('./utils');
var mongoCtrl = require('./controllers/mongo');
var series = require('async-series');
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
		  updateSettings(options, done);
	  },
	  function(done) {
		  createMeanJson(options, done);
	  },
	  //printMeanIntro,
      function(done) {
        addGitRemote(options.name, done);
      },
	  function(done) {
        renameMeanStarter(options.name, done);
      },
	  function(done) {
	    createLocalUser(options, function(err, user) {
		    console.log();
		    if (user) options.email = user.email;
		    if (err) return done(err);
		    done();
	    });
	  },
    ],function(err) {
      if (err) throw err;
      nextSteps(options.name);
    });

    progress.stop();

};

function updateSettings(options, done) {
    var data = {
        anonymizedData: options.anonymizedData,
        name: options.name
    };

    var path = process.cwd() + '/' + options.name + '/mean.json';

    utils.updateMeanJson(path, data, function() {
        done();
    });
}

function createMeanJson(options, done) {

	utils.updateGlobalMeanJson({anonymizedData:  options.privacy === 'Y'}, function() {
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

/*
function printMeanIntro(done) {
  var logo = fs.readFileSync(__dirname + '/../img/logo.txt');
  console.log(logo.toString());
  done();
}
*/

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

function createLocalUser(options, done) {

	console.log('Do you want to set up an admin user?');
	var questions = [{
		type: 'input',
		name: 'createUser',
		message: 'Yes',
		default: 'N'
	}];
	inquirer.prompt(questions).then(function(results) {
		if (results.createUser === 'Y' || results.createUser === 'y'|| results.createUser.toLowerCase() === 'yes') userWizard(options, done);
		else done();
	});
}

function userWizard(options, done) {

	var User, DB;

	function required(value) {
		return !!value.trim() || 'Required';
	}

	var questions = [{
		 type: 'input',
		 name: 'email',
		 message: 'Please provide your email so we can create your first admin user',
		 default: options.email,
		 validate: function(input) {
		    // Declare function as asynchronous, and save the done callback
			 var cb = this.async(),
			 re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
			 val = re.test(input);
			 if (val) return cb(null, true);
			 cb('Invalid input for email');
	    }
	 }, {
		 type: 'input,',
		 name: 'username',
		 message: 'Please provide your username so we can create your first admin user',
		 default: options.username,
		 validate: required
	 }];

	inquirer.prompt(questions).then(function(results) {
		mongoCtrl.connect('development', function(err, db) {
			DB = db;
			if (err) {
				console.error('Cannot create admin user');
				return done();
			}
			User = db.collection('users');

			find(results, function(user) {
				if (user) update(user);
				else create(results);
			});

		}, options.name);

	});



	function find(results, cb) {
		User.findOne({
			email: results.email
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
				email: user.email
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
				done(null, user);
			});
		}
		else {
			console.log('User ' + user.username + ' found with an admin role');
			DB.close();
			done(null, user);
		}
	}

	function create(results) {

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
					email: results.email,
					password: result.password,
					name: results.username,
					username: results.username
				});
				user.roles.push('admin');
				user.save(function(err) {
					if (err) console.log(err);
					else console.log('role admin added to your new user');
					DB.close();
					done(null, user);
				});
			});
	}
}


function addGitRemote(name, done) {
  shell.exec('cd '+ name + ' && git remote rename origin upstream', function (status, error) {
    if (!status) {
      console.log('  Added the "remote" upstream origin');
      done();
    } else {
      console.log(error);
	  done(error);
    }
  });
}

function renameMeanStarter(name,done){
  var source = name + '/packages/custom/meanStarter';
  var target = name + '/packages/custom/' + name;
  shell.exec('mv ' + source + ' ' + target , function (status, error) {

    if (!status) {
	  console.log('  Renamed meanStarter to: ' + target + ' (this is where your put your changes).');
	  console.log('  If you need additional modularity create your own package with the mean package command');
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

/*
function registerOrLogin(options, done , callback) {

	console.log();
	console.log('#############################################');
	console.log();
	console.log(chalk.green.bold('Register to the mean network'));
	console.log();
	console.log('The mean network is a free service that lets you control and recieve insights from your mean application.');

	var questions = [{
		type: 'input',
		name: 'netRegistration',
		message: 'Do you want to register to the Network? (Y/n) ? ',
		default: 'Y'
	}];
	inquirer.prompt(questions).then(function(results) {
		if (results.netRegistration === 'Y' || results.netRegistration === 'y') {
			questions = [{
				type: 'input',
				name: 'exists',
				message: 'Do you have an existing user? (y/N) ? ',
				default: 'N'
			}];
			inquirer.prompt(questions).then(function(results) {
				if (results.exists === 'Y' || results.exists === 'y')
					users.login(options, callback);
				else users.register(options, callback);
			});
		} else done();

	});
}
*/

/*
function createNetworkUser(options, done) {

	if (options.anonymizedData) {
		var token = utils.readToken();
		if (!token)
			registerOrLogin(options, done, function(token) {
				initApp(options.name, token,  done);
			});
		else {
			initApp(options.name, token, done);
		}
	}
}
*/

/*
function initApp(name, token, done) {

	utils.loadPackageJson('./' + name + '/package.json', function(err, pck) {
		if (err || !pck) return console.log('You must be in a package root');

		var body = {
			name: name,
			description: pck.description,
			version: pck.version,
			keywords: pck.keywords
		};

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

        var path = process.cwd() + '/' + name + '/mean.json';

		request(options, function(error, response, body) {
            if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
                var data = JSON.parse(body);
                utils.updateMeanJson(path, {
                    id: data._id,
                    name: data.name
                }, function(err) {

	                if (err) console.log('Your app did not save to network :(');
	                done();
                });
            } else {
	            console.log('Your app did not save to network :(');
	            done();
            }
        });
	});
}
*/
function nextSteps(name) {

	// show the next steps after the person has seen the start/help text so sleep 1 second.
	setTimeout(function() {
		console.log('#############################################');
    	console.log('');
    	console.log(chalk.green('All Done! - Now lets install the dependencies...'));
    	console.log('');
		console.log('  Install node package dependencies:');
		console.log('    $ ' + chalk.green('cd %s && npm install'), name);
		console.log('  Bower install should be triggered for client side dependencies.');
		console.log('  If it did not run invoke it manually...');
		console.log('    $ ' + chalk.green('cd %s && bower install'), name);
		console.log('  Run the app by running:');
		console.log('    $ ' + chalk.green('cd %s and then run..'), name);
		console.log('    $ '+ chalk.green('gulp'));
		console.log();
	},1000);
}
