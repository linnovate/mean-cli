[![Build Status](https://travis-ci.org/linnovate/mean-cli.svg)](https://travis-ci.org/linnovate/mean-cli)
[![Circle CI](https://circleci.com/gh/linnovate/mean-cli.svg?style=svg)](https://circleci.com/gh/linnovate/mean-cli)
[![NPM version](https://badge.fury.io/js/mean-cli.svg)](http://badge.fury.io/js/mean-cli)
[![Dependency Status](https://david-dm.org/linnovate/mean-cli.svg)](https://david-dm.org/linnovate/mean-cli)
[![Gitter](https://badges.gitter.im/JoinChat.svg)](https://gitter.im/linnovate/mean?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Known Vulnerabilities](https://snyk.io/test/github/linnovate/mean-cli/badge.svg)](https://snyk.io/test/github/linnovate/mean-cli)

# [![MEAN Logo](http://mean.io/system/assets/img/logos/meanlogo.png)](http://mean.io/) MEAN Command Line

Source for npm package meanio. mean-cli is a core package of the mean.io project and is used primarily to manage packages for extending functionality, for example adding a package to enable inline editable tokens. 

The cli provides a lot of useful functionality, such as scaffolding options to create new packages, assign roles to users, check the mongo status, add/remove packages and list currently installed packages.

See http://mean.io/#!/docs for more in-depth information about mean.

## The repository contains
* The bin file used for cli operations.
* Core functionality for managing mean packages.

## Basic Usage

  Install Package:

    $ [sudo] npm install -g mean-cli

**Note:** You may need to use sudo only for OSX, *nix, BSD etc and run your command shell as Administrator (for Windows)

  Explore CLI functionality:

    $ mean --help

  Create a new mean app:

    $ mean init <NameOfYourApp>

  Install Dependencies:

    $ cd <NameOfYourApp> && npm install

  Create a sample mean package:

    $ mean package <NameOfYourPackage>

  Run your app:

    $ gulp
