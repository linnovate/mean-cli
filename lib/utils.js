'use strict';

var fs = require('fs');

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
