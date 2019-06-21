(function () {

    let mapComponent = {
        template: '<div id="map"><div>',
        bindings: {
            ngModel: '<',
            onChange: '<',
            autocomplete: '@'
        },
        controller: mapController
    }

    angular.module("mapTestApp")
        .component('ngMap', mapComponent);

    mapController.$inject = ["$scope", "$element"];

    function mapController($scope, $element) {
        $ctrl = this;
        $scope.appName = "Adding markers in map";
        $scope.map = null;
        $scope.marker = null;
        $scope.autocomplete = null;
        $scope.geocoder = new google.maps.Geocoder();
        $scope.infowindow = new google.maps.InfoWindow();

        $ctrl.$onInit = function () {
            $scope.map = initMap();
            $scope.autocomplete = initAutocomplete($ctrl.autocomplete);
        }

        $ctrl.$onChanges = function (changes) {
            if (changes.ngModel && !angular.equals($ctrl.ngModel, $ctrl.previousModel)) {
                $ctrl.previousModel = $ctrl.ngModel
                let latLng = new google.maps.LatLng($ctrl.ngModel.lat, $ctrl.ngModel.lng);
                fidnPlace(latLng);
                console.log('model changed ....');
            }
        }

        function initMap() {

            let haightAshbury = { lat: 37.769, lng: -122.446 };

            let map = new google.maps.Map($element[0].children[0], {
                zoom: 12,
                center: haightAshbury,
                mapTypeId: 'terrain'
            });

            // This event listener will call findPlace() when the map is clicked.
            map.addListener('click', function (event) {
                console.log(event.latLng.lat(), event.latLng.lng());
                fidnPlace(event.latLng);
            });

            return map;
        }

        function initAutocomplete(selector) {

            let autocompleteElement = angular.element(selector);
            if (autocompleteElement && autocompleteElement.length > 0) {
                let autocomplete = new google.maps.places.Autocomplete(autocompleteElement[0]);
                autocomplete.setFields(['address_components', 'geometry', 'icon', 'name']);
                autocomplete.bindTo('bounds', $scope.map);
                autocomplete.addListener('place_changed', function () {
                    let place = $scope.autocomplete.getPlace();
                    console.log(place);

                    if (!place.geometry) {
                        window.alert("No details available for input: '" + place.name + "'");
                        return null;
                    }

                    addMarker(place.geometry.location, place);
                });
                return autocomplete;
            }
            else { return null }
        }

        function fidnPlace(location) {
            $scope.geocoder.geocode({ 'location': location }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        addMarker(location, results[0]);
                    } else {
                        window.alert('No results found');
                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
            });
        }

        function addMarker(location, place) {

            setMap(null);
            $scope.marker = new google.maps.Marker({
                position: location,
                draggable: true,
                map: $scope.map
            });
            $scope.marker.addListener("dragend", onDragEnded);
            setInfoWindow(place.formatted_address);
            if ($ctrl.onChange && typeof ($ctrl.onChange) === "function") {
                $ctrl.onChange(getLocationObject(location, place.address_components));
            }

            if (place.geometry.viewport) {
                $scope.map.fitBounds(place.geometry.viewport);
            }
        }

        function onDragEnded(event) {
            fidnPlace(event.latLng);
        }

        function setInfoWindow(content) {
            $scope.infowindow.setContent(content);
            $scope.infowindow.open($scope.map, $scope.marker);
        }

        function getLocationObject(loc, addressComponents) {
            return {
                lat: loc.lat(),
                lng: loc.lng(),
                address1: getAddressComponent(addressComponents, [
                    { value: "street_number", property: "long_name" },
                    { value: "route", property: "short_name" }]),
                city: getAddressComponent(addressComponents, [{ value: "locality", property: "long_name" }]),
                state: getAddressComponent(addressComponents, [{ value: "administrative_area_level_1", property: "short_name" }]),
                zipCode: getAddressComponent(addressComponents, [{ value: "postal_code", property: "long_name" }])
            }
        }

        function getAddressComponent(adc, values) {
            let tmp = values.map(x => {
                let part = adc.find(y => y.types.includes(x.value))
                return part ? part[x.property] : "";
            });
            let returnValue = tmp.join(" ").trim();
            return returnValue;
        }

        // Sets the map on all markers in the array.
        function setMap(map) {
            if ($scope.marker) {
                $scope.marker.setMap(map);
            }
        }
    }

})();