(function() {
    'use strict';

    function __class__($stateProvider) {
        $stateProvider.state('__name__ example page', {
            url: '/__name__/example',
            templateUrl: '__pkgName__/views/index.html'
        }).state('__name__ circles example', {
            url: '/__name__/example/:circle',
            templateUrl: '__pkgName__/views/example.html'
        });
    }

    angular
        .module('mean.__pkgName__')
        .config(__class__);

    __class__.$inject = ['$stateProvider'];

})();
