'use strict';

var fs = require('fs'),
path = require('path'),
npm = require('npm'),
shell = require('shelljs'),
chalk = require('chalk'),
request = require('request'),
querystring = require('querystring'),
mongoCtrl = require('./controllers/mongo'),
cliVersion = require('../package').version,
prompt = require('prompt');

/* Breaking functionality into submodules */
var utils = require('./utils'),
install = require('./install');

var pkgType = {
  contrib: 'Contrib',
  custom: 'Custom',
  core: 'Core'
};

/*process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
*/// From express
function emptyDirectory(path, callback) {
  fs.readdir('./' + path, function(err, files) {
    if (err && 'ENOENT' !== err.code) throw new Error(err);
    callback(!files || !files.length);
  });
}

function ensureEmpty(path, force, callback) {
  emptyDirectory(path, function(empty) {
    if (empty || force) {
      callback();
    } else {
      console.log(chalk.yellow('Destination is not empty:'), path);
    }
  });
}

function getPackageInfo(type, data) {
 if (!data) return;
var author = data.author ? chalk.green('  Author: ') + data.author.name : '';

if (type === pkgType.custom && data.author.name === 'Linnovate') type = pkgType.core;
return chalk.green('   ' + type + ': ') + data.name + '@' + data.version + author;
}


function checkVersion() {
  console.log();
  console.log('    checking meanio and global mean-cli versions');
  var meanioVersion, latest;
  utils.loadPackageJson(process.cwd() + '/node_modules/meanio/package.json', function(err, data) {
    if (err) return console.log(chalk.yellow('Invalid MEAN app or not in app root'));
    meanioVersion = data.version;
  });

  npm.load({
    loglevel: 'warn'
  }, function(err, npm) {
    npm.commands.outdated('meanio', true, function(err, list) {
      if (err) {
        console.log(chalk.red('Error: npm outdated failed'));
        return console.error(err);
      }
      latest = list[0] ? list[0][3] : meanioVersion; // list[0][3] holds the 'latest' value
      if (latest < meanioVersion) {
        console.log(chalk.yellow('    meanio is out of date'));
        console.log('    Current: ' + meanioVersion + ' Latest: ' + latest);
      } else {
        console.log(chalk.green('    meanio at latest version:'), meanioVersion);
      }
    });
  });

  npm.load({
    global: true,
    loglevel: 'warn'
  }, function(err, npm) {
    npm.commands.outdated('mean-cli', true, function(err, list) {
      if (err) {
        console.log(chalk.red('Error: npm outdated failed'));
        return console.error(err);
      }
      latest = list[0] ? list[0][3] : cliVersion; // list[0][3] holds the 'latest' value
      if (latest < cliVersion) {
        console.log(chalk.yellow('    mean-cli is out of date'));
        console.log('    Current: ' + cliVersion + ' Latest: ' + latest);
      } else {
        console.log(chalk.green('    mean-cli at latest version:'), cliVersion);
      }
    });
  });
}

function requiresRoot(callback) {
  utils.loadPackageJson(process.cwd() + '/package.json', function(err, data) {
    if (err || (data.name !== 'mean' && !data.mean)) {
      console.log(chalk.yellow('Invalid MEAN app or not in app root'));
    } else {
      callback(data);
    }
  });
}


/* START OF NETWORK FUNCTIONS - TODO refactor to network.js */
function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.addKey = function() {

  var home = getUserHome();

  var keys = shell.ls(home + '/.ssh');

  keys.forEach(function(key, index) {
    console.log('[' + (index + 1) + '] ' + key);
  });

  console.log('Select SSH key to associate to your account:');

  prompt.start();

  prompt.get({
    properties: {
      key: {
        format: 'number',
        required: true
      }
    }
  },
  function(err, result) {
    if (!keys[result.key - 1]) return console.log('Invalid selection');

    var sshKey = shell.cat(home + '/.ssh/' + keys[result.key - 1]);

    var token = utils.readToken();

    if (token) {

      var keyData = {
        key: sshKey,
        title: keys[result.key - 1]
      };

      var options = {
        uri: 'https://network.mean.io/api/v0.1/keys',
        method: 'POST',
        form: keyData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Content-Length': querystring.stringify(keyData).length,
          'authorization': token
        }
      };

      request(options, function(error, response, body) {
        if (!error && (response.statusCode === 200 || response.statusCode === 201)) {

          console.log(body);
        } else {
          console.log('Add Key Failed!');
        }
      });
    }
  });
};

function checKeys(callback) {

  var token = utils.readToken();
  if (!token) return console.log('Client not authorized! Use `mean authorize` or `mean register` to create a user.');

  var options = {
    uri: 'https://network.mean.io/api/v0.1/keys',
    method: 'GET',
    headers: {
      'authorization': token
    }
  };

  request(options, function(error, response, body) {
    if (!error && response.statusCode === 200 && response.body.length) {
      callback(JSON.parse(body));
    } else {
      callback([]);
    }
  });
}

exports.publish = function(options) {

  utils.loadPackageJson('./package.json', function(err, pck) {
    if (err || !pck) return console.log('You must be in a package root');

    checKeys(function(keys) {
      if (!keys.length) return console.log('You do not have any SSH keys. User `mean addKey`');

      if (!shell.which('git')) return console.log(chalk.red('    Prerequisite not installed: git'));

      console.log(chalk.green('    You are about to publish your package.'));
      console.log(chalk.green('    In doing so your package, once moderated and approved'));
      console.log(chalk.green('    will be available for all to use on the mean network.'));
      console.log(chalk.green('    An email with instructions will be sent to you once approved'));
      console.log(chalk.green('    (A package only needs approval on first publication)'));
      console.log();
      console.log(chalk.green('    I agree y/Y'));
      console.log(chalk.green('    No. Anything else'));
      prompt.start();

      prompt.get({
        properties: {
          agree: {
            pattern: /^[a-zA-Z\s\-]+$/,
            minLength: 1,
            maxLength: 5,
            message: 'Do you agree to publish your package? y/Y for YES, Anything else NO',
            required: true
          }
        }
      },
      function(err, result) {

        if (err) throw err;
        if (result.agree.toLowerCase() !== 'y') return console.log(chalk.red('Package publish aborted by user...'));

        publishPackage(pck, options, function(data) {

          if (!shell.test('-d', '.git')) {

            shell.exec('git init', function(code) {
              if (code) return console.log(chalk.red('Error: git init failed'));

            });
          }

          if (!shell.test('-e', '.gitignore')) {
            fs.writeFileSync('.gitignore', 'node_modules');
          }

            var silentState = shell.config.silent; // save old silent state
            shell.config.silent = true;

            shell.exec('git remote add meanio ' + data.repo, function(code) {
              if (!code) {
                console.log(chalk.yellow('Remote added'));
                console.log(chalk.green('Package Created: ' + data.name));
                console.log(chalk.green('You can now push your code to update latest/master '));
                console.log(chalk.green('    `git push meanio master`'));
                console.log(chalk.green('Running the publish command again will make a tag of the version pushed '));
                console.log(chalk.green('    `mean publish`'));
              }
            });

            shell.exec('git log -n 1', function(code) {

              if (!code) {
                shell.exec('git tag -f ' + data.version.toString(), function(code) {
                  shell.config.silent = silentState;

                  if (!code) {
                    shell.exec('git push meanio --force ' + data.version.toString(), function(code) {

                      if (!code) {
                        console.log(chalk.green('Publish Success! ' + data.name + '@' + data.version));
                        console.log('Use the `git add ` and `git commit ` then git push meanio master` to push your code');
                        console.log('Use `mean publish` to create tags based on your current version in package.json');
                      }
                    });
                  }
                });

              }
            });

          });
      });
    });
  });
};

function publishPackage() {
  console.log(chalk.green('mean packages have moved to npm try npm publish instead'));
}
exports.search = function(keywords) {

  var options = {
    uri: 'https://network.mean.io/api/v0.1/packages/search?q=' + keywords,
    method: 'GET'
  };

  request(options, function(error, response, body) {

    if (!error && (response.statusCode === 200 || response.statusCode === 201)) {

      var results = JSON.parse(body);
      console.log(chalk.green(results.length + ' found.'));
      results.forEach(function(pkg) {
        var authors = [];
        pkg.authors.forEach(function(author) {
          authors.push(author.username);
        });
        console.log(chalk.green(pkg.name) + '@' + pkg.version + ' ' + pkg.description + chalk.green(' by: ') + authors.join(','));
      });
    } else {

      console.log(error);
    }
  });
};
/* END OF NETWORK FUNCTIONS */

exports.init = function(options) {
  install.init(options);
};

function getPackage(name, callback) {

  shell.exec('npm install meanio-'+ name +' --save', function(code) {

    if (code) return console.log(code);

    console.log(chalk.green('    Dependencies installed for package ' + name));

    require('bower').commands.install().on('error', function(err) {
      console.log(chalk.yellow('    ' + err + ' ' + name));
        callback();
    });

  });

}

exports.install = function(module, options) {
  options = options || {};
  requiresRoot(function() {

    utils.loadPackageJson('./node_modules/meanio/package.json', function() {

      var packageDetails = module.split('@');

      var packageName = packageDetails[0];

      var tag = 'master';

      tag = tag === 'latest' ? 'master' : tag;

      console.log('TAG:' + tag);
      getPackage(packageName, function() {
        console.log(chalk.green('Installing module: %s:'), packageName);

         });
    });
  });
};


exports.postinstall = function() {
  requiresRoot(function() {
    var bower = require('bower');
    console.log(chalk.green('Installing Bower dependencies'));
    bower.commands.update().on('error', function(err) {
      console.log(chalk.red(err));
    });


    packagesNpmInstall('packages');
    packagesNpmInstall('packages/custom');
    packagesNpmInstall('packages/core');

    // Load mean.json

    var source = process.cwd();
    packagesMeanJson(source);

  });
};

function packagesNpmInstall(source) {
  var packages = path.join(process.cwd(), source);
  npm.load({
    loglevel: 'error'
  }, function(err, npm) {
    fs.readdir(packages, function(err, files) {
      if (err && 'ENOENT' !== err.code) throw Error(err);

      if (!files || !files.length) return;
      console.log(chalk.green('Auto installing package dependencies'));

      files.forEach(function(file) {
        var pkgPath = path.join(packages, file);

        packagesMeanJson(pkgPath);

        utils.loadPackageJson(path.join(pkgPath, 'package.json'), function(err, data) {
          if (err || !data.mean) return;

          npm.commands.install(pkgPath, [pkgPath], function(err) {
            if (err) {
              console.log(chalk.red('Error: npm install failed'));
              return console.error(err);
            } else {
              console.log(chalk.green('    Dependencies installed for package ' + file));
            }
          });
        });
      });
    });
  });
}

function packagesMeanJson(source) {
  // Load mean.json
  utils.loadPackageJson(path.join(source, 'mean.json'), function(err, data) {
    if (err || !data) return;

    for (var dep in data.dependencies) {
      shell.cd(process.cwd());
      exports.install(dep + '@' + data.dependencies[dep]);
    }
  });

}

exports.uninstall = function(module) {
  requiresRoot(function() {
    console.log(chalk.yellow('Removing module:'), module);

    if (shell.test('-d', './packages/' + module)) {
      shell.rm('-rf', './packages/' + module);
    } else if (shell.test('-d', './packages/core/' + module)) {
      shell.rm('-rf', './packages/core/' + module);
    } else if (shell.test('-d', './packages/contrib/' + module)) {
      shell.rm('-rf', './packages/contrib/' + module);
    } else if (shell.test('-d', './packages/custom/' + module)) {
      shell.rm('-rf', './packages/custom/' + module);
    }

    console.log(chalk.green('   uninstall complete'));
  });
};

exports.list = function() {
  requiresRoot(function() {

    console.log(chalk.green('   MEAN Packages List:'));

    function lookInNM() {
      var foundModule = false;
      var path = './node_modules/';

      fs.readdir(path, function(err, files) {
        if (err || !files.length) return console.log(chalk.yellow('   No node_modules Packages'));
        files.forEach(function(file) {
          if(file.startsWith('meanio-')) {  
            foundModule = true;
            utils.loadPackageJson(path + file + '/package.json', function(err, data) {
              if (!err && data.mean) {
                if(file.includes('admin')||file.includes('system')||file.includes('users')||file.includes('circles'))
                  console.log(getPackageInfo('core', data));
                else console.log(getPackageInfo('contrib', data));
              }
            });
          }
        });
        if(!foundModule)
          console.log(chalk.yellow('   No node_modules Packages'));
      });
    }

    function look(type) {
      var path = './packages/' + type + '/';

      fs.readdir(path, function(err, files) {
        if (err || !files.length) return console.log(chalk.yellow('   No ' + type + ' Packages'));
        files.forEach(function(file) {
          utils.loadPackageJson(path + file + '/package.json', function(err, data) {
            if (!err && data.mean) console.log(getPackageInfo(type, data));
          });
        });
      });
    }
    // look in node_modules for external packages
/*    look('core');
*/
    // look in node_modules for external packages
   /* look('contrib');-------- look in node_module */ 
   lookInNM();

    // look in packages for local packages
    look('custom');
  });
};

exports.status = function(options) {
  requiresRoot(function() {
    console.log();
    console.log(chalk.green('    MEAN Status'));
    console.log('    -----------');
    console.log();
    utils.loadPackageJson('./package.json', function(err, data) {
      if (err) throw new Error(err);
      console.log('    MEAN VERSION: ' + data.meanVersion);
      console.log();
      mongoCtrl.connect(options.env, function(err, db) {
        if (err) throw new Error(err);
        console.log('    MongoDB URI: ' + db.options.url);
        checkVersion();
        db.close();
      });
    });
  });
};

exports.pkg = function(name, options) {
  requiresRoot(function() {
    if (options.delete) {
      console.log(chalk.yellow('Removing package:'), name);
      shell.rm('-rf', './packages/custom/' + name);
    } else {
      ensureEmpty('./packages/custom/' + name, options.force, function() {
        require('./scaffold.js').packages(name, options);
      });
    }
  });
};

exports.printUser = function(email, options) {
  requiresRoot(function() {
    mongoCtrl.connect(options.env, function(err, db) {
      if (err) throw new Error(err);
      db.collection('users').find({
        email: email
      }).toArray(function(err, user) {
        console.dir(user);
        db.close();
      });
    });
  });
};

exports.updateRole = function(email, options, type) {
  requiresRoot(function() {
    var update = {};
    switch (type) {
      case 'a':
      console.log('  Adding role `' + options.addRole + '` to user `' + email + '`');
      update.$push = {
        roles: options.addRole
      };
      break;
      case 'r':
      console.log('  Removing role `' + options.removeRole + '` from user `' + email + '`');
      update.$pull = {
        roles: options.removeRole
      };
      break;
      default:
      return;
    }
    mongoCtrl.connect(options.env, function(err, db) {
      if (err) throw new Error(err);
      db.collection('users').update({
        email: email
      }, update, {
        w: 1,
        upsert: false,
        multi: false
      }, function(err) {
        if (err) console.error(err);
        else console.log(chalk.green('successfully updated'));
        db.close();
      });
    });
  });
};

exports.toggleReporting = function(enable, name) {
	var action = (enable) ? 'enable' : 'disable';

	if (name === 'user-reporting')
		utils.updateGlobalMeanJson({anonymizedData: enable}, function(err) {
			if (!err) console.log(action + ' reporting');
			else console.log('Sorry, try again.');
		});
	else {
		var message = name  + ' is not a';
		message += (action === 'disable') ? ' ' : 'n ';
		message += action + ' command';
		console.log(message);
	}
};
