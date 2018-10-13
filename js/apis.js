console.log("it all starts here.");

var apis = 
{
    resultsMax: 10,
    eventfulKey : "NpnNdQRSnct6h9mZ",
    everbriteKey: "2ZICJIQQLA7K6R7F664Y",
    googleKey: "AIzaSyClc949NkCbUZ5VS2OB7Q1bamI6fBCfa3o",

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
            apis.callbacks.eventfulVenues(data, callback); 
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

    getMap: function(lat, lng)
    {
        var mapObject = $('<div id="map">');
        console.log(mapObject);
        map = new google.maps.Map(mapObject[0], {
            center: {lat: lat, lng: lng},
            zoom: 8
          });
        return mapObject;
    },

    callbacks:
    {
        eventfulVenues: function(data, callback) { callback(data); }
    }
}

function initMap() {}

$(document).ready(function()
{
    apis.eventfulVenues("Restaurants", "Miami", function(response) { console.log(response); });
    apis.everbriteSearchEvents("bike riding", "Miami", function(response) { console.log(response) });
    $('body').append(apis.getMap(-34.397, 150.644));
});

