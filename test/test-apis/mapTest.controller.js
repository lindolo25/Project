(function () {

    angular.module("mapTestApp", [])
        .controller("mapTestController", ["$scope", mapTestController]);

    function mapTestController($scope) {

        $scope.appName = "Adding markers in map";
        $scope.location = {
            lat: 0,
            lng: 0
        }

        this.$onInit = function () {

        }

        $scope.onMapChange = function (newLocation) {
            if (newLocation) {
                $scope.location = newLocation;
                $scope.$apply();
            }
        }
    }

})();