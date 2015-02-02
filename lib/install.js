'use strict';

var shell = require('shelljs'),
  fs = require('fs'),
  npm = require('npm'),
  _ = require('lodash'),
  chalk = require('chalk');


var utils = require('./utils');

var progress = new utils.Progress();

exports.init = function(options) {
  //appName
  var name = options.name;
  cloneMean(options);
  utils.loadPackageJson('./' + name + '/package.json', function (err, data) {
    if (err) { installError(); } //If error print error and exit
    printMeanIntro(); // Help text and asciiart
    addGitRemote(name); // Add a git remote called upstream
    var tasker = alterPackageJson(options, data);
    installDeps(options, name, tasker);
     /////////////// Implementation details...

    console.log(chalk.green('Version: %s cloned'), data.meanVersion);
    console.log();

  });
};


function cloneMean(options){
  if (!shell.which('git')) return console.log(chalk.red('    Prerequisite not installed: git'));
  var name = options.name;
  var source = (options.git ? 'git@github.com:linnovate/mean.git' : 'https://github.com/linnovate/mean.git');

  // Allow specifying specific repo
  if (options.repo) {
    source = options.repo;
  }

  console.log(chalk.green('Cloning branch: %s into destination folder:'), options.branch, name);

  progress.start();
  source = options.branch + ' ' + source + ' "' + name + '"';
  // Running clone
  shell.exec('git clone -b' + source);
  console.log('Finished clone');
  progress.stop();
}

function installError(){
  console.log(chalk.yellow('Something went wrong. Try again or use --git flag'));
  console.log(chalk.yellow('If the problem persists see past issues here: https://github.com/linnovate/mean/issues'));
  console.log(chalk.yellow('Or open a new issue here https://github.com/linnovate/mean/issues/new'));
  //fallback code here
  process.exit();
}

function printMeanIntro() {
  var logo = fs.readFileSync(__dirname + '/../img/logo.txt');
  console.log(logo.toString());
}

function addGitRemote(name) {
  shell.exec('cd '+ name + ' git remote rename origin upstream', function (code) {
    if (!code) {
      console.log('git remote upstream set');
      console.log();
    }
  });
}


function alterPackageJson(options, data){
  var tasker = shell.which(options.taskrunner);
  if (!tasker) {
    console.log(chalk.yellow(' Warning! Taskrunner not installed: ' + chalk.red(options.taskrunner)));
    console.log();
  }
/*
  var taskdir = options.name + '/tools/' + options.taskrunner + '/';
  var taskRunFile = options.taskrunner === 'gulp' ? 'gulpfile.js' : 'Gruntfile.js';
  var taskfile = taskdir + taskRunFile;
  var dst = shell.pwd() + '/' + options.name  ;
  console.log('Copying ' + taskfile + ' to '+  dst );
 shell.cp(taskfile, dst ,function(err){
 if (err) return console.log(chalk.red('Could not copy taskrunner file'),err);
 console.log('Successfully copied gulpfile');
 });
  */
  shell.cd(options.name);
  console.log('pwd:' + shell.pwd());

  var taskdir = './tools/' + options.taskrunner + '/';
  shell.cp(taskdir + (options.taskrunner === 'gulp' ? 'gulpfile.js' : 'Gruntfile.js'), '.');

  var taskJson = taskdir + options.taskrunner +'.json';
  utils.loadPackageJson(taskJson, function(err, taskdeps) {
    if (err) return console.log(chalk.yellow('Could not read taskrunner deps file'),err);
    delete data.meanVersion;
    _.merge(data, taskdeps);
    data.name = options.name ;
    fs.writeFileSync('./package.json', new Buffer(JSON.stringify(data, null, 2) + '\n'));
  });
  return tasker;
}


function installDeps(options, name, tasker){
// Install Mean dependencies - read mean.json
  if (options.meanDeps) {
  var meanjson = {
  dependencies: {}
  };
  options.meanDeps.forEach(function(dep) {
  meanjson.dependencies[dep] = 'latest';
  });
  fs.writeFileSync('./mean.json', new Buffer(JSON.stringify(meanjson, null, 2) + '\n'));
  }

  if (options.quick) {
    npm.load(function(err, npm) {
      console.log(chalk.green('   installing dependencies...'));
      console.log();
      npm.commands.install(function(err) {
        if (err) {
          console.log(chalk.red('Error: npm install failed'));
          return console.error(err);
        }
        console.log(chalk.green('   running the mean app...'));
        console.log();
        if (tasker) {
          shell.exec(options.taskrunner, ['-f']);
        } else {
          shell.exec('node server');
        }
      });
    });
  } else {
    console.log('   install dependencies:');
    console.log('     $ cd %s && npm install', name);
    console.log();
    console.log('   run the app:');
    console.log('     $', tasker ? options.taskrunner : 'node server');
    console.log();
  }
  console.log('   Extra Docs at http://mean.io');
  console.log();
}