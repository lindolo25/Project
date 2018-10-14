console.log("it all starts here.");

var apis = 
{
    resultsMax: 10,
    currentMap: null,
    eventfulKey : "NpnNdQRSnct6h9mZ",
    everbriteKey: "2ZICJIQQLA7K6R7F664Y",

    eventfulVenues: function(keyword, location, callback)
    {
        var oArgs = { 
            app_key: this.eventfulKey,
            keywords: keyword,
            location: location,
            within: 10,
            page_size: this.resultsMax,
            sort_order: "popularity",
        };
        EVDB.API.call("/venues/search", oArgs, function(data) 
        { 
            apis.listeners.eventful.eventfulVenues(data, callback); 
        }); 
    },

    everbriteSearchEvents: function(keyword, location, callback)
    {
        $.ajax({
            url: "https://www.eventbriteapi.com/v3/events/search/?q="+ keyword
            +"&location.address="+ location 
            +"&sort_by=best"
            +"&token=" + this.everbriteKey,
            method: "GET"
        }).then(callback);
    },

    maps: 
    {
        getNewMap: function(lat, lng)
        {
            var mapObject = $('<div class="map">');
            console.log(mapObject);
            map = new google.maps.Map(mapObject[0],
            {
                center: {lat: lat, lng: lng},
                zoom: 8
            });
            
            return { 
                map: map, 
                element: mapObject, 
                markers: [],  
                infoWindows: [],

                bindAutocomplete: function(input) { apis.maps.bindAutocomplete(input, this); },
                addMarker: function (lng, lat, title, desc) { apis.maps.addMarker(lng, lat, title, desc, this); },
                clearMarkers: function() { apis.maps.clearMarkers(this); }
            };
        },

        bindAutocomplete(input, map)
        {
            var autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.setFields(['address_components', 'geometry', 'icon', 'name']);
            autocomplete.bindTo('bounds', map.map);
            autocomplete.addListener('place_changed',function() 
            {
                apis.maps.listeners.autocompletePlaceChanged(autocomplete, map);
            });
        },

        addMarker: function(lng, lat, title, desc, map) 
        {
            var loc = new google.maps.LatLng(lat, lng);
            var marker = new google.maps.Marker({ map: map.map, anchorPoint: new google.maps.Point(0, -29) });            
            marker.setVisible(false);
            marker.setPosition(loc);
            marker.setVisible(true);

            map.map.setCenter(loc);
            map.map.setZoom(17);

            infoWindow = apis.maps.addInfoWindows(title, desc);
            marker.addListener('click', function() { infoWindow.open(map, marker); });
            
            map.markers.push(marker);
            return(marker);
        },

        addInfoWindows: function(title, desc)
        {
            var infowindow = new google.maps.InfoWindow();
            var infowindowContent = $('<div class="info-window"><h3 class="title">'+ title +'</h3><p>'+ desc +'</p></div>')[0];
            infowindow.setContent(infowindowContent);
            infowindow.close();
            
            return infowindow;
        },

        clearMarkers: function(map) 
        {
            this.setMapOnAll(null, map);
            map.markers = [];
        },

        setMapOnAll: function (value, map) 
        {
            for (var i = 0; i < map.markers.length; i++) 
            {
                map.markers[i].setMap(value);
            }
        },
        
        listeners:
        {
            autocompletePlaceChanged(autocomplete, map)
            {
                var place = autocomplete.getPlace();
                console.log(place);

                if (!place.geometry) 
                {
                    window.alert("No details available for input: '" + place.name + "'");
                    return;
                }
                
                if (place.geometry.viewport) 
                {
                    map.map.fitBounds(place.geometry.viewport);
                }

                var address = '';
                if (place.address_components)
                {
                    address = [
                        (place.address_components[0] && place.address_components[0].short_name || ''),
                        (place.address_components[1] && place.address_components[1].short_name || ''),
                        (place.address_components[2] && place.address_components[2].short_name || '')
                    ]
                    .join(', ');
                }

                apis.maps.addMarker(place.geometry.location.lng(), place.geometry.location.lat(), place.name, address, map);
            }
        }
    },
    
    listeners:
    {
        eventful: 
        {
            eventfulVenues: function(data, callback) { callback(data); }
        }
    }
}

$(document).ready(function()
{
    apis.eventfulVenues("Restaurants", "Miami", function(response) { console.log(response); });
    apis.everbriteSearchEvents("bike riding", "Miami", function(response) { console.log(response) });


    currentMap = apis.maps.getNewMap(-34.397, 150.644);
    $('body').append(currentMap.element);

    currentMap.bindAutocomplete($("#cop-test")[0]);
    


});

