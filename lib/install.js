'use strict';

var shell = require('shelljs');
var fs = require('fs');
var chalk = require('chalk');
var utils = require('./utils');
var series = require('async-series');

var progress = new utils.Progress();

exports.init = function(options) {
  progress.start();

  series([
      checkPermissions,
      utils.checkNpmPermission,
      function(done) { cloneMean(options, done); },
      printMeanIntro,
      function(done) { addGitRemote(options.name, done); },
    ],function(err) {
      if (err){ throw err; }
      nextSteps(options.name);
    }
    );
  progress.stop();

    //checkoutStableTag(name); // Checkout to stable tag noted in the cli.
    //nextSteps(name); // Guide the user about the next steps

};

function checkPermissions(done){
  if (utils.isWin){
    console.log('On windows platform - Please check permissions independently');
    console.log('All permissions should be run with the local users permissions');
  }
  if (process.getuid) {
   var uid = process.getuid();
   if (  uid === 0){
     console.log(chalk.red('Installation of mean should not be done as root! bailing out'));
     throw('RUNNING AS ROOT');

   }
 }
  done();
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
      throw output;
    }
    console.log();
    done();

  });
}

function addGitRemote(name, done) {
  shell.exec('cd '+ name + ' && git remote rename origin upstream', function (status, error) {
    if (!status) {
      console.log('  Added the "remote" upstream origin');
      console.log();
      done();
    } else {
      throw error;
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

function nextSteps(name) {
  // show the next steps after the person has seen the start/help text so sleep 1 second.
  setTimeout(function(){
    console.log('  Install node package dependencies:');
    console.log('    $ ' + chalk.green('cd %s && npm install'), name);
    console.log('  Bower install should be triggered for client side dependencies.');
    console.log('  If it did not run invoke it manually...');
    console.log('    $ ' + chalk.green('cd %s && bower install'), name);
    console.log();
    console.log('  Run the app by running:');
    console.log('    $ ' + chalk.green('cd %s and then run..'), name);
    console.log('    $ '+ chalk.green('gulp'));
    console.log();
  },1000);
}
