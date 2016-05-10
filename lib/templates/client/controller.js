(function() {
    'use strict';

    /* jshint -W098 */

    function __class__Controller($scope, Global, __class__, $stateParams) {
        $scope.global = Global;
        $scope.package = {
            name: '__pkgName__'
        };

        $scope.checkCircle = function() {
            __class__.checkCircle($stateParams.circle).then(function(response) {
                $scope.res = response;
                $scope.resStatus = 'info';
            }, function(error) {
                $scope.res = error;
                $scope.resStatus = 'danger';
            });
        };
    }

    angular
        .module('mean.__pkgName__')
        .controller('__class__Controller', __class__Controller);

    __class__Controller.$inject = ['$scope', 'Global', '__class__', '$stateParams'];

})();
