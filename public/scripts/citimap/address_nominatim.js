/**
 * Utilities for address geocoding using the Nominatim service
 * @namespace geocodeUtilities
 */
var geocodeUtilities = (function () {
    var addressTooltipElement;

    return {
        /** 
         * Parses the text in the "searchfield" control
         * and returns all matched addresses and address points in the results table
         * @memberof geocodeUtilities
         */
        geocode: function () {
            
            let search_string = $('#searchfield').val();
            var search_params = '?format=json';
            let mapsettings = mapPortal.readConfig("map");
            if (typeof mapsettings.address_country !== "undefined") {
                search_params = '?format=json&countrycodes=' + mapsettings.address_country;
            }
            if (search_string.trim() !== "") {
                $.ajax({
                    url: 'https://nominatim.openstreetmap.org/search/' + search_string + search_params,
                    async: false,
                    dataType: 'json',
                    success: function (data) {
                        geocodeUtilities.renderGeocodingResultsAsTable(data);
                        $('#searchResultsUl a').first().tab('show');
                    }
                });
            }
        },
        /**
         * Returns the address at the give lon/lat coordinates
         * @param {string} lon The longitude (WGS 84)
         * @param {string} lat The longitute (WGS 84)
         * @returns string
         * @memberof geocodeUtilities
         */
        reverse: function (lon, lat) {
            address = '';
            $.ajax({
                url: 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon +'&zoom=18&addressdetails=1&format=json',
                async: false,
                dataType: 'json',
                success: function (data) {
                    if (data) {
                        address= data.display_name;
                    }
                   
                }
            });
            return address;
        },
        /**
         * Renders the address objects in a dataTable
         * @param {object} jsonObj The GeoJSON object containing the address properties
         * @function renderGeocodingResultsAsTable
         * @memberof geocodeUtilities
         */
        renderGeocodingResultsAsTable: function (jsonObj) {
            var $map = $('#mapid').data('map');
            if (jsonObj.length > 0) {
                if (!$('#modSearchResults').is(':data(dialog)')) {
                    $('#modSearchResults').dialog({
                        autoOpen: false,
                        title: $.i18n._('_SEARCHRESULTS'),
                        height: 544,
                        width: 641,
                        buttons: [{
                            text: function () {
                                return $.i18n._('_CLOSE')
                            },
                            click: function () {
                                $(this).dialog("close");
                                searchUtilities.clearSearchTabs();
                            }
                        }],
                        close: function () {
                            searchUtilities.clearSearchTabs();
                        },
                        closeOnEscape: false
                    });
                }
                if ($('#tabSNominatim').length === 0) {
                    $('#searchResultsUl').append('<li class="nav-item"><a class="nav-link" href="#tabSNominatim" data-toggle="tab">' + $.i18n._('_ADDRESSFOUND') +'</a>');
                    $('#tabContentSearchResults').append('<div role="tabpanel" class="tab-pane" id="tabSNominatim"></div>');

                    var theader = '<br /><table class="table table-striped table-bordered" style="width:100%;" id="tblNominatim"><thead style="width:100%"><tr>';
                    theader = theader + '<th>&nbsp;</th><th>' + $.i18n._('_ADDRESS')   +'</th>';
                    $('#tabSNominatim').append(theader);
                }
                var cols = [];
                cols.push({
                    data: "lat",
                    width: "10px",
                    render: function (data, type, row, meta) {
                        var newP = new ol.geom.Point(ol.proj.transform([row.lon, row.lat], 'EPSG:4326', $map.getView().getProjection().getCode()));
                        var x = newP.getCoordinates()[0];
                        var y = newP.getCoordinates()[1];
                        str = "<a href='#' title='" + $.i18n._('_ZOOMTO') +"' onclick=\"geocodeUtilities.zoomToAddress(" + x + "," + y + ",'" + row.display_name + "')\"><i class=\"glyphicon glyphicon-globe text-success\"></i></a>";
                        return str;
                    },
                    orderable: false,
                    sorting: false
                });

                cols.push({
                    data: "display_name"

                });

                var langFileDt = '';
                if (typeof langfile !== "undefined") {
                    langFileDt = langfile.split('.')[0] + '-datatables.json'; // langfile variable must be already defined
                }
                var feat = jsonObj.features;
                var dt = $('#tblNominatim').DataTable({
                    "destroy": true, // This will make sure the table is destroyed first
                    "columnDefs": [
                        { sorting: false, orderable: false, targets: [0], order: [[0, 'asc']] },
                        { "className": "dt-center", "targets": [0] },
                        { "width": "20px", "targets": 0 }
                    ],
                    title: $.i18n._('_SEARCHRESULTS'),
                    "data": jsonObj,
                    "columns": cols,
                    "scrollY": "200px",
                    "scrollCollapse": true,
                    "scrollX": "50%",
                    language: {
                        url: 'scripts/' + langFileDt
                    }
                });
                dt.order([0, 'asc']).draw();
                $('#modSearchResults').dialog('open');
            }
        },
        /**
         * Zooms the map to the given X,Y coordinates and displays a tooltip
         * with the full address details at that position
         * @param {string} x X/Lon coordinate
         * @param {string} y Y/Lat coordinate
         * @param {string} address Address string
         * @function zoomToAddress
         * @memberof geocodeUtilities
         */
        zoomToAddress: function (x, y, address) {
            var $map = $('#mapid').data('map');
            $map.getView().setCenter([x, y]);
            // Zoom level based on Preferences
            mymap.getView().setZoom(Number(preferences.getPointZoom()));
            
            //Remove Address overlay if exists
            var ovlToRemove = [];
            $map.getOverlays().forEach(function (ovl) {
                if (ovl.getId() !== undefined && ovl.getId() === 'address_overlay') {
                    ovlToRemove.push(ovl);
                }
            });

            var len1 = ovlToRemove.length;
            for (var i = 0; i < len1; i++) {
                $map.removeOverlay(ovlToRemove[i]);
            }

            if (addressTooltipElement) {
                addressTooltipElement.parentNode.removeChild(addressTooltipElement);
            }
            // This will just create the pin
            addressTooltipElement = document.createElement('div');
            addressTooltipElement.setAttribute("id", "divAddressMarker");
            //addressTooltipElement.setAttribute("data-trigger", "focus"); // Will dismiss the popup on the next click
            addressTooltipElement.innerHTML = '<img src=\'https://oc2o.com/images/my-location-oc2o.png\' />';
            // Create the ol overlay
            var marker = new ol.Overlay({
                id: "address_overlay",
                position: [x, y],
                positioning: 'top-center',
                offset: [0, -23],
                element: addressTooltipElement,
                stopEvent: false
            });
            $map.addOverlay(marker);
            // Set the popover
            var popTemplate = '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>';
            $('#divAddressMarker').popover({
                content: address,
                html: true,
                title: 'X: ' + x.toFixed(2) + ' Y: ' + y.toFixed(2),
                template: popTemplate,
                placement: 'top'
            });
        }

    };
})();
window.Geocode = {};
var Geocode = window.Geocode;
Geocode.SearchButton = function () {
    //Create the HTML for the Search address option
    var str = '<li><a id="btnAdressSearch" href="#" onclick="geocodeUtilities.geocode();">_SEARCHADDRESS</a></li>';
    // Append to drop down
    $('#searchOpt').append(str);
    // Set the option label
    $("#btnAdressSearch").html($.i18n._('_SEARCHADDRESS'));
};
$(document).ready(function () {
    var $map = $('#mapid').data('map');
    var btn = new Geocode.SearchButton();
});