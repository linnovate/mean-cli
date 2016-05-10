(function() {
    'use strict';

    function __class__($http, $q) {
        return {
            name: '__pkgName__',
            checkCircle: function(circle) {
                var deferred = $q.defer();

                $http.get('/api/__name__/example/' + circle).success(function(response) {
                    deferred.resolve(response);
                }).error(function(response) {
                    deferred.reject(response);
                });
                return deferred.promise;

            }
        };
    }

    angular
        .module('mean.__pkgName__')
        .factory('__class__', __class__);

    __class__.$inject = ['$http', '$q'];

})();
