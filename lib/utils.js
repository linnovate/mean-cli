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
      throw('ROOT PERMISSIONS IN NPM');
    }
  });
  callback();
};
