(function () {
  'use strict';

  angular
    .module('mean.__pkgName__')
    .config(__pkgName__);

  __pkgName__.$inject = ['$stateProvider'];

  function __pkgName__($stateProvider) {
    $stateProvider.state('__name__ example page', {
      url: '/__name__/example',
      templateUrl: '__pkgName__/views/index.html'
    });
  }

})();
