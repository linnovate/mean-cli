'use strict';

var shell = require('shelljs'),
  fs = require('fs'),
  chalk = require('chalk'),
  utils = require('./utils');

var progress = new utils.Progress();

exports.init = function(options) {
  //appName
  var name = options.name;
  cloneMean(options);
  addGitRemote(name); // Add a git remote called upstream
  printMeanIntro(); // Help text and asciiart
  //checkoutStableTag(name); // Checkout to stable tag noted in the cli.
  //nextSteps(name); // Guide the user about the next steps

};
 // Implementation details

function cloneMean(options){
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
  progress.start();

  // Install the specified branch or the stableTag - No more MASTER!
  //var branch = options.branch ? options.branch : stableTag;
  var branch = options.branch;
  source = branch + ' ' + source + ' "' + name + '"';
  var gitCmd = 'git clone ' + shallow + ' -b' + source;
  console.log(chalk.green('Cloning branch: %s into destination folder:'), options.branch, name);
  console.log(chalk.green(gitCmd));

  // Running clone
  shell.exec(gitCmd);
  console.log('Finished clone');
  console.log();
  progress.stop();
}


function printMeanIntro() {
  var logo = fs.readFileSync(__dirname + '/../img/logo.txt');
  console.log(logo.toString());
}

function addGitRemote(name) {
  shell.exec('cd '+ name + ' git remote rename origin upstream', function (code) {
    if (!code) {
      console.log('  Added the "remote" upstream origin');
      console.log();
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

function nextSteps(name) {
  console.log('\tInstall node package dependencies:');
  console.log('\t  $ cd %s && npm install', name);
  console.log('\tBower install should be triggered for client side dependencies.');
  console.log('\tIf it did not run invoke it manually...');
  console.log('\t  $ cd %s && bower install', name);
  console.log();
  console.log('\tRun the app by running:');
  console.log('\t  $ cd ' + name + ' and then run..');
  console.log('\t  $ gulp');
  console.log();
}
*/