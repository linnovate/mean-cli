(function () {
  'use strict';

  /* jshint -W098 */
  angular
    .module('mean.__pkgName__')
    .controller('__class__Controller', __class__Controller);

  __class__Controller.$inject = ['$scope', 'Global', '__class__'];

  function __class__Controller($scope, Global, __class__) {
    $scope.global = Global;
    $scope.package = {
      name: '__pkgName__'
    };
  }
})();