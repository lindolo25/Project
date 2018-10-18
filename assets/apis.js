var apis = 
{
    resultsMax: 10,
    eventfulKey : "NpnNdQRSnct6h9mZ",

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

    eventbrite: 
    {
        everbriteKey: "2ZICJIQQLA7K6R7F664Y",

        searchEvents: function(keyword, location, callback) 
        {
            this.searchEventsLoadMore(keyword, location, 1, callback);
        },

        searchEventsLoadMore: function(keyword, location, page, callback)
        {
            var url = "https://www.eventbriteapi.com/v3/events/search/?q="+ keyword
            +"&location.address="+ location
            +"&sort_by=best"
            +"&page="+ page
            +"&token=" + this.everbriteKey;
            console.log(url);
            $.ajax({
                url: url,
                method: "GET"
            })
            .done(function(response) { apis.eventbrite.listeners.eventSearchListener(keyword, location, response, callback); })
            .fail(function() { apis.eventbrite.listeners.eventSearchFailed(callback); });
        },

        getVenue: function(venueId, callback)
        {
            $.ajax({
                url: "https://www.eventbriteapi.com/v3/venues/"+ venueId +"/?token=" + this.everbriteKey,
                method: "GET"
            })
            .done(function(response) { apis.eventbrite.listeners.getVenueListener(response, callback); })
            .fail(function() { apis.eventbrite.listeners.getVenueFailed(callback); });
        },

        listeners:
        {
            eventSearchListener: function(keyword, location, response, callback)
            {
                console.log("eventSearchListener");
                console.log(response);
                if(response.events.length === 0)
                {
                    response = null;
                    callback(response);
                    return;
                }
                
                var loadMoreTemp = null;
                if(response.pagination.page_number !== response.pagination.page_count)
                {
                    loadMoreTemp = function(callback)
                    {
                        apis.eventbrite.searchEventsLoadMore(keyword, location, ++response.pagination.page_number, callback);
                    }
                }

                var result = {
                    events: [],
                    hasMoreItems: response.pagination.has_more_items,
                    loadMore: loadMoreTemp
                }

                for(i = 0; i < response.events.length; i++)
                {
                    temp = response.events[i];

                    var short = temp.description.text.substring(200,temp.description.text.length - 1);
                    var pos = short.indexOf(" ");
                    pos = 200 + pos;
                    short = temp.description.text.substring(0, pos);

                    result.events.push({
                        id: temp.id,
                        categoryId: temp.category_id,
                        name: temp.name.text,
                        desc: temp.description.text,
                        shortDesc: short,
                        dateCreated: temp.created,
                        dateStart: temp.start.utc,
                        dateEnd: temp.end.utc,
                        url: temp.url,
                        venueId: temp.venue_id,
                        imageUrl: temp.logo.url,
                        imageId: temp.logo.id
                    });
                }

                callback(result);
            },

            eventSearchFailed: function(callback)
            {
                console.log("searching for events failed.");
                var response = null;
                callback(response);
            },

            getVenueListener: function(response, callback)
            {
                console.log("get venue response handler");
                result = null;
                if(response === null || response === undefined)
                {
                    callback(result);
                    return;
                }
                
                var result = {
                    id: response.id,
                    name: response.name,
                    address1: response.address.address_1,
                    address2: response.address.address_2,
                    city: response.address.city,
                    region: response.address.region,
                    postalCode: response.address.postal_code,
                    country: response.address.country,
                    lat: response.latitude,
                    lng: response.longitude
                }
                callback(result);
            },

            getVenueFailed: function(callback)
            {
                console.log("get venue failed.");
                var response = null;
                callback(response);
            }
        }
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
                
                if (place.geometry.viewport) 
                {
                    map.map.fitBounds(place.geometry.viewport);
                }
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
    /*apis.eventfulVenues("Restaurants", "Miami", function(response) { console.log(response); });
    apis.eventbrite.searchEvents("dining", "Miami", function(response) 
    { 
        temp = response.events[0].venueId;
        apis.eventbrite.getVenue(temp, function(response) { console.log(response); });
        response.loadMore(function(response) { console.log(response); });
        console.log(response); 
    });


    currentMap = apis.maps.getNewMap(25.77481, -80.19773);
    $('#map').append(currentMap.element);

    currentMap.bindAutocomplete($("#cop-test")[0]);



    // from now on a test for google places -------------------------------------------------------------------------

    // Create the places service.
    var element = $("<div>")[0];
    var service = new google.maps.places.PlacesService(element);

    // Perform a nearby search.
    service.nearbySearch({
            location: new google.maps.LatLng(25.77481, -80.19773), 
            radius: 5000, 
            type: ['restaurant']
        },
        function(results, status, pagination) 
        {
            if (status !== 'OK') return;
            console.log("places");
            console.log(results);
        });*/

        navigator.geolocation.getCurrentPosition(function(location) {
            console.log(location.coords.latitude);
            console.log(location.coords.longitude);
            console.log(location.coords.accuracy);
          });
});

