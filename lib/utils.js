'use strict';

var fs = require('fs');
var shell = require('shelljs');
var chalk = require('chalk');

var isWin = (process.platform === 'win32');
exports.isWin = isWin;

exports.Progress = function(){
  var interval, counter;

  function printMsg() {
    switch (counter) {
      case 0:
        console.log('Use `mean --help` from command line for all CLI options');
        break;
      case 1:
        console.log('Be sure to checkout all the docs on http://mean.io');
        break;
      case 2:
        console.log('This may take a little while depending on your connection speed');
        break;
      case 15:
        console.log('Seems a bit slow. Check your internet connection...');
        break;
      default:
        console.log('Still cloning...');
        break;
    }
    counter++;
  }

  return {
    start: function() {
      counter = 0;
      interval = setInterval(printMsg, 3000);
    },
    stop: function() {
      clearInterval(interval);
    }
  };
};

exports.loadPackageJson = function(path, callback) {
  fs.readFile(path, function(err, data) {
    if (err) return callback(err);

    try {
      var pkg = JSON.parse(data.toString());
      pkg.meanVersion = pkg.mean || pkg.version;
      callback(null, pkg);
    } catch (err) {
      return callback(err);
    }
  });
};

exports.checkNpmPermission = function (callback){
  var homeDir = process.env[isWin ? 'USERPROFILE' : 'HOME'];
  var findCmd = 'find ' + homeDir +'/.npm ' + '-user root';
  shell.exec(findCmd, function( status, output){
    var hasRootFiles = output.split(/\r\n|\r|\n/).length;
    if (hasRootFiles > 1){
      console.log (chalk.red('There are ' + hasRootFiles + ' files in your ~/.npm owned by root'));
      console.log(chalk.green('Please change the permissions by running -'), 'chown -R `whoami` ~/.npm ');
	    return callback('ROOT PERMISSIONS IN NPM');
    }
  });
  callback();
};

var meanJsonPath = exports.meanJsonPath = function () {
	var file = (process.platform === 'win32') ? '_mean' : '.mean';
	var path = getUserHome() + '/' + file;
	return path;
};

var readToken = exports.readToken = function() {
	var token;

	var path = meanJsonPath();

	if (!shell.test('-e', path)) return null;

	var data = fs.readFileSync(path);
	try {
		var json = JSON.parse(data.toString());
		token = json.token;
	} catch (err) {
		token = shell.cat(path);
		token = token.replace(/(\r\n|\n|\r)/gm,'');
	}

	return token;
};

exports.readMeanSync = function(param) {
	var value;

	var path = meanJsonPath();

	if (!shell.test('-e', path)) return null;

	var data = fs.readFileSync(path);
	try {
		var json = JSON.parse(data.toString());
		value = json[param];
	} catch (err) {
		value = null;
	}

	return value;
};

function getUserHome() {
	return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.updateGlobalMeanJson = function(values, callback) {

	var path = meanJsonPath();

	fs.lstat(path, function(err, stat) {
		if (err || !stat) {
			writeMeanJson(path, values, function() {
				callback();
			});
		} else {
			fs.readFile(path, function(err, file) {
				if (err) return callback(err);

				try {
					var json = JSON.parse(file.toString());

					for (var index in values)
						json[index] = values[index];

				writeMeanJson(path, json, function(err) {
					callback(err);
				});

				} catch (err) { // old mean-cli
					var data = {};
					data = values;
					data.token = readToken();
					writeMeanJson(path, data, function(err) {
						callback(err);
					});
				}
			});
		}
	});
};

function writeMeanJson(path, data, cb) {
	fs.writeFile(path, JSON.stringify(data, null, 4) , function(err) {
		cb(err);
	});
}


exports.updateMeanJson = function(path , values, callback) {

    fs.readFile(path, function(err, file) {
        if (err) return callback(err);

        var json = JSON.parse(file.toString());

        for (var index in values)
            json[index] = values[index];

        writeMeanJson(path, json, function(err) {
            callback(err);
        });
    });
};



