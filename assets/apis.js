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
            //console.log(url);
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
                //console.log("eventSearchListener");
                //console.log(response);
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

                    var short = "";
                    if(temp.description.text)
                    {
                        short = temp.description.text.substring(200,temp.description.text.length - 1);
                        var pos = short.indexOf(" ");
                        pos = 200 + pos;
                        short = temp.description.text.substring(0, pos);
                    }                    

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
                        imageUrl: temp.logo ? temp.logo.url : "assets/img/index.svg",
                        imageId: temp.logo ? temp.logo.url : null
                    });
                }

                callback(result);
            },

            eventSearchFailed: function(callback)
            {
                //console.log("searching for events failed.");
                var response = null;
                callback(response);
            },

            getVenueListener: function(response, callback)
            {
                //console.log("get venue response handler");
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
                //console.log("get venue failed.");
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
            //console.log(mapObject);
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

        geocodeLatLng: function (lat, lng, callback) 
        {            
            var latlng = new google.maps.LatLng(lat, lng);
            var geocoder = new google.maps.Geocoder;
            geocoder.geocode({ 'location': latlng }, function(results, status) 
            {
                apis.maps.listeners.geocodeLatLngListener(results, status, callback);
            });
        },

        addressFind: function(value, address)
        {
            var result = null;
            var found = false;
            for(i = 0; i < address.length; i++)
            {
                var types = address[i].types;
                for(y = 0; y < types.length; y++)
                {
                    if(types[y] === value)
                    {
                        found = true;
                        break;
                    }
                }

                if(found)
                {
                    result = address[i]
                    break;
                }
            }
            return result;
        },
        
        listeners:
        {
            autocompletePlaceChanged(autocomplete, map)
            {
                var place = autocomplete.getPlace();
                //console.log(place);

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
            },

            geocodeLatLngListener(results, status, callback)
            {
                var result = null;

                if (status === 'OK') 
                {
                    if (results[0]) 
                    {
                        var place = results[0].address_components;
                        //console.log(place);
                        state = apis.maps.addressFind("administrative_area_level_1", place).short_name;
                        city = apis.maps.addressFind("locality", place).short_name;

                        result = city +', '+ state;
                    } 
                }

                callback(result);
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

    currentLoc = { lat: 25.76896, lng: -80.18998, region: "Miami, FL" };
    currentEvents = null;
    
    navigator.geolocation.getCurrentPosition(function geoGet(location) 
    {
        currentLoc = location.coords.latitude;
        currentLoc = location.coords.longitude;

        apis.maps.geocodeLatLng(location.coords.latitude, location.coords.longitude, function(response) 
        { 
            currentLoc.region = response;
            $("#location-input").val(response);
            pageMap = apis.maps.getNewMap(location.coords.latitude, location.coords.longitude);
            pageMap.bindAutocomplete($("#location-input")[0]);
            
        });
    });
    
    $("#location-input").val(currentLoc.region);
    pageMap = apis.maps.getNewMap(currentLoc.lat, currentLoc.lng);
    pageMap.bindAutocomplete($("#location-input")[0]);

    apis.eventbrite.searchEvents("", currentLoc.region, function(response) 
    { 
        currentEvents = response;
        //console.log(response);
        loadEventsOnScreen(0, 4, currentEvents.events);
    });

    $("#search-form").on("submit", function(event) 
    {
        event.preventDefault();

        var keyword = $("#keyword-input").val().trim();
        var location = $("#location-input").val().trim();

        if( keyword !== "" && location !== "")
        {
            apis.eventbrite.searchEvents(keyword, location, function(response) 
            { 
                currentEvents = response;
                //console.log(response);
                loadEventsOnScreen(0, 10, currentEvents.events);
            });
        }
    
    });

    $("#events").on("click", ".details-link", function(event) 
    {
        event.preventDefault();
        if (event.target !== this) return;
        
        var i = $(this).attr("data-index");
        var event = currentEvents.events[i];
        $("#details-container").empty();

        apis.eventbrite.getVenue(event.venueId, function(response) 
        { 
            pageMap.clearMarkers()
            pageMap.addMarker(response.lng, response.lat, event.name, event.shortDesc);
            $("#details-container").prepend(pageMap.element);

            var address2 = (response.address2) ? response.address2 : '';

            var body = $('<div class="modal2-body">\
                    <div class="row">\
                        <div class="col-12 col-md-8">\
                            <h1>'+ event.name +'</h1>\
                            <p>'+ event.desc +'</p>\
                            <a href="'+ event.url +'" target="_blank">Go to event page</a>\
                        </div>\
                        <div class="col-12 col-md-4">\
                            <h3>Starts</h3>\
                            <div>\
                                <span>'+ event.dateStart +'</span>\
                            </div>\
                            <h3>Location</h3>\
                            <div>\
                                <span class="d-block">'+ response.address1 +'</span>\
                                <span class="d-block">'+ address2 +'</span>\
                                <span class="d-block">'+ response.city +','+ response.region +' '+ response.postalCode +'</span>\
                            </div>\
                        </div>\
                    </div>\
                </div>');
                $("#details-container").append(body);
            $(".modal2").show();
            //console.log("done ...");
        });        
    });

    $(".modal2").on("click", function(event) 
    { 
        if (event.target !== this) return;

        //console.log("close"); 
        $(".modal2").hide(); 
    });

});

function loadEventsOnScreen(start, total, events)
{
    var eventsContainer = $("#events");
    eventsContainer.empty();
    var length =  start + total > events.length ? events.length : start + total;

    for(i = start; i < length; i++)
    {
        var event = events[i];
        var item = $('<div class="col-6 col-md-3">\
                <div class="card">\
                    <img class="card-img-top" src="'+ event.imageUrl +'" alt="Card image cap">\
                    <div class="card-body">\
                        <h5 class="card-title">'+ event.name +'</h5>\
                        <p class="card-text">'+ event.shortDesc +'</p>\
                        <a href="#" class="details-link card-link" data-index="'+ i +'">Learn more</a>\
                        <br>\
                        <a href="#" class="favorites-link card-link" data-index="'+ i +'">Add to Favorites</a>\
                    </div>\
                </div>\
            </div>');
        eventsContainer.append(item);
    }
}


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

    currentMap.bindAutocomplete($("#location-input")[0]);*/


    /*// from now on a test for google places -------------------------------------------------------------------------

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

