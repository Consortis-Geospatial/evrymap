/**
 * Zoom to Coordinates dialog-specific functions
 * @namespace zoom2XY
 */
var zoom2XY = (function () {
    return {
        /**
         * Creates the HTML for the Zoom to Coordinates dialog
         * and adds it to the #mainparent div
         * @function createDialog
         * @memberof zoom2XY
         */
        createDialog: function () {
            proj4.defs("EPSG:2100","+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs");
            ol.proj.get('EPSG:2100').setExtent([104022.946289, 3850785.500488, 1007956.563293, 4624047.765686]);

            $.i18n.load(uiStrings);
            var $mymap = $('#mapid').data('map');
            var xydiv = document.createElement('div');
            xydiv.setAttribute('id', 'dlgXY');
            var prjName;
            //if (typeof mapPortal.readConfig("map")["projectionName"] === "undefined") {
            if (typeof cfg.map.projectionName === "undefined") {
                prjName = mymap.getView().getProjection().getCode();
            } else {
                prjName = mapPortal.readConfig("map")["projectionName"];
            }
            var divhtml = '<div class="container-fluid">' +
                '<div class="row">' +
                '    <div class="col-lg-12">' +
                '        <label for="sel1">' + $.i18n._("_CS") + '</label>' +
                '        <select class="form-control" id="sel1" onchange="zoom2XY.otfCoorTransform();">' +
                '            <option value="' + mymap.getView().getProjection().getCode().split(':')[1] + '">' + prjName + '</option>' +
                '            <option value="2100">EPSG:2100</option>' +
                '            <option value="4326">GPS</option>' +
                '            <option value="3857">Google</option>' +
                '        </select>' +
                '    </div>' +
                '</div>' +
                '<div class="row">' +
                '    <input type="hidden" id="prevCoorVal" />' +
                '    <div class="col-lg-6">' +
                '        <label for="xinput">' + $.i18n._("_XCOORD") + '</label>' +
                '        <input id="xinput" class="form-control" type="text" pattern="[0-9]+([,\.][0-9]+)?" title="' + $.i18n._("_XCOORDTT") + '" placeholder="' + $.i18n._("_XCOORD") + '" />' +
                '    </div>' +
                '    <div class="col-lg-6">' +
                '        <label for="yinput">' + $.i18n._("_YCOORD") + '</label>' +
                '        <input id="yinput" class="form-control" type="text" pattern="[0-9]+([,\.][0-9]+)?" title="' + $.i18n._("_YCOORDTT") + '" placeholder="' + $.i18n._("_YCOORD") + '" />' +
                '    </div>' +
                '</div>' +
                '<div class="row">' +
                '    <div class="col-lg-12">' +
                '        <label for="pinName">' + $.i18n._("_NAME") + '</label>' +
                '        <input id="pinName" class="form-control" type="text" title="' + $.i18n._("_PINNAMETT") + '" placeholder="' + $.i18n._("_PINNAMELABEL") + '" />' +
                '    </div>' +
                '</div>' +
                '</div>';
            $(xydiv).append(divhtml);
            $(xydiv).appendTo($("#mainparent"));
            // Set the selected projection value to the current map projection
            $('#sel1').val(mymap.getView().getProjection().getCode().split(':')[1]);
            zoom2XY.setXYDialog();
        },
        /**
         * Zooms to a coordinate by reading the settings from the
         * Zoom to XY dialog.
         * If the name parameter is not an empty string, a popup will
         * display when clicking the pin, showing the pin name and the coordinates
         * @function zoomToXY
         * @memberof zoom2XY
         */
        zoomToXY: function () {
            $mymap = $('#mapid').data('map');
            var xinput;
            var yinput;
            var coortype;
            var centerLayer;
            var checkLayerVal = true;

            // If params undefined, this is called from the ZoomToXY dialof
            if (typeof x === "undefined" || typeof y === "undefined" || typeof epsgcode === "undefined") {
                xinput = $('#xinput').val();
                yinput = $('#yinput').val();
                coortype = $('#sel1').val();
                pinName = $('#pinName').val().trim();
            } else { // From external call
                zoom2XY.deleteAllPinPoints();
                xinput = x;
                yinput = y;
                coortype = epsgcode;
                pinName = lbl;
            }

            //If empty coordinates, return
            if (xinput.trim() === "" || yinput.trim() === "") {
                return;
            }

            //If coordinates not numbers show message
            if (isNaN(Number(xinput.replace($.i18n._("_DECIMALSEPARATOR"), '.'))) || isNaN(Number(yinput.replace($.i18n._("_DECIMALSEPARATOR"), '.')))) {
                alert($.i18n._("_INVALIDCOORDS"));
                return;
            }

            var coordinate = [Number(xinput.replace($.i18n._("_DECIMALSEPARATOR"), '.')), Number(yinput.replace($.i18n._("_DECIMALSEPARATOR"), '.'))];

            var otfCoor = ol.proj.transform(coordinate, 'EPSG:' + coortype, $mymap.getView().getProjection().getCode());

            var iconFeature = zoom2XY.createPinFeature(otfCoor, pinName);

            // If pin has name, add it to local storage
            if (pinName !== "") {
                userUtils.addNamedPin($mymap, pinName, coordinate);
            }

            zoom2XY.addPin(iconFeature);

            $mymap.getView().setCenter(ol.proj.transform(coordinate, 'EPSG:' + coortype, $mymap.getView().getProjection().getCode()));
            mymap.getView().setZoom(Number(preferences.getPointZoom()));
            
        },
        /**
         * Returns a pin feature at the input coordinates
         * and sets its name property to the input name if not an empty string
         * @param {array} coords The XY coordinate pair
         * @param {string} name Pin "name"
         * @returns {object} The pin feature 
         * @function createPinFeature
         * @memberof zoom2XY
         */
        createPinFeature: function (coords, name) {
            var iconFeature = new ol.Feature({
                geometry: new ol.geom.Point(coords),
                xcoor: Number(coords[0].toString().replace($.i18n._("_DECIMALSEPARATOR"), '.')),
                ycoor: Number(coords[1].toString().replace($.i18n._("_DECIMALSEPARATOR"), '.'))
            });
            if (name !== "") {
                iconFeature.set('name', name);
            }
            var iconStyle = new ol.style.Style({
                image: new ol.style.Icon( /** @type {olx.style.IconOptions} */ {
                    anchor: [0.5, 23],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    src: 'https://oc2o.com/images/my-location-oc2o.png'
                })
            });

            iconFeature.setStyle(iconStyle);
            return iconFeature;
        },
        /**
         * Add the input point feature to the 'pinLayer' in the map
         * @param {*} pinFeature
         * @function addPin
         * @memberof zoom2XY 
         */
        addPin: function (pinFeature) {
            $mymap = $('#mapid').data('map');
            var pinlayer;
            foundpin = false;
            $mymap.getLayers().forEach(function (lyr, i) {
                if (lyr.get('name') === 'pinLayer') {
                    pinlayer = lyr;
                    foundpin = true;
                    return false;
                }
            });

            if (!foundpin) {
                var pinSource = new ol.source.Vector({});
                pinlayer = new ol.layer.Vector({
                    name: 'pinLayer',
                    source: pinSource
                });
                $mymap.addLayer(pinlayer);
            }
            // Check if there is a pin already in this position
            var newX = pinFeature.getGeometry().getCoordinates()[0].toFixed(3);
            var newY = pinFeature.getGeometry().getCoordinates()[1].toFixed(3);
            var pinExists = false;
            // Loop through existing features in the pinlayer and check each XY coordinate with the input feature
            for (var featureCount = 0; featureCount < pinlayer.getSource().getFeatures().length; featureCount++) {
                var tmpX = pinlayer.getSource().getFeatures()[featureCount].getGeometry().getCoordinates()[0].toFixed(3);
                var tmpY = pinlayer.getSource().getFeatures()[featureCount].getGeometry().getCoordinates()[1].toFixed(3);
                if (newX === tmpX && newY === tmpY) {
                    pinExists = true;
                    return false;
                }
            }
            // If no pin exists in this position add feature
            if (!pinExists) {
                //console.log('added pin');
                pinlayer.getSource().addFeature(pinFeature);
            }
        },
        /**
         * Makes the coordinate transormations inside the
         * Zoom to XY dialog
         * @function otfCoorTransform
         * @memberof zoom2XY
         */
        otfCoorTransform: function () {
            var $mymap = $('#mapid').data('map');
            var xinput;
            var yinput;
            var coortype;
            var prevCoorType;

            xinput = $('#xinput').val();
            yinput = $('#yinput').val();
            coortype = $('#sel1').val();
            prevCoorType = $('#prevCoorVal').val();
            //alert(coortype);

            var coordinate = [Number(xinput.replace(',', '.')), Number(yinput.replace(',', '.'))];
            var newCenter = ol.proj.transform(coordinate, 'EPSG:' + prevCoorType, 'EPSG:' + coortype);
            $('#xinput').val(String(newCenter[0]).replace('.', $.i18n._("_DECIMALSEPARATOR")));
            $('#yinput').val(String(newCenter[1]).replace('.', $.i18n._("_DECIMALSEPARATOR")));
            $('#prevCoorVal').val($('#sel1').val());
        },
        /**
         * Creates the Zoom to XY dialog as s jQueryUI dialog
         * @function setXYDialog
         * @memberof zoom2XY
         */
        setXYDialog: function () {
            $("#dlgXY").dialog({
                title: $.i18n._("_ZOOMTOXY"),
                autoOpen: false,
                height: 323,
                width: 434,
                position: {
                    my: "right-70 top+50",
                    at: "right top"
                },
                buttons: [{
                        id: "btnZoomToXY",
                        text: $.i18n._("_ZOOMIN"),
                        class: "btn btn-primary",
                        click: function () {
                            zoom2XY.zoomToXY();
                        }
                    },
                    {
                        id: "btnCloseXY",
                        text: $.i18n._("_CLOSE"),
                        class: "btn btn-default",
                        click: function () {
                            $("#dlgXY").dialog("close");
                        }
                    },
                    {
                        id: "btnRemoveAllPins",
                        text: $.i18n._("_CLEARALL"),
                        class: "btn btn-default",
                        click: function () {
                            zoom2XY.deleteAllPinPoints();
                        }
                    },
                    {
                        id: "btnGetXYFromMap",
                        text: $.i18n._("_GETCOORDFROMMAP"),
                        title: $.i18n._("_GETCOORDFROMMAPTT"),
                        class: "btn btn-default",
                        click: function () {
                            zoom2XY.initGetCoordsFromMap();
                        }
                    }
                ],
                open: function (event) { // Add classes manually because of jqueryui classes overlapping
                    $('#dlgXY').parent().addClass("cg_dialog_class");
                    document.getElementById("btnZoomToXY").removeAttribute("class");
                    $('#btnZoomToXY').addClass("btn btn-primary");
                    document.getElementById("btnCloseXY").removeAttribute("class");
                    $('#btnCloseXY').addClass("btn btn-default");
                    document.getElementById("btnRemoveAllPins").removeAttribute("class");
                    $('#btnRemoveAllPins').addClass("btn btn-default pull-left");
                    document.getElementById("btnGetXYFromMap").removeAttribute("class");
                    $('#btnGetXYFromMap').addClass("btn btn-default pull-left");
                    $('.glyphicon-resize-full').removeClass('ui-icon');
                    $('.glyphicon-resize-small').removeClass('ui-icon');
                }
            });

            $("#btnOpenXY").on("click", function () {
                var $osmap = $('#mapid').data('map');
                $('#prevCoorVal').val($('#sel1').val());
                var xin;
                var yin;
                var changedCenter;
                xin = $osmap.getView().getCenter()[0].toFixed(3);
                yin = $osmap.getView().getCenter()[1].toFixed(3);
                changedCenter = [xin, yin];
                var newCenter = ol.proj.transform(changedCenter, $osmap.getView().getProjection().getCode(), 'EPSG:' + $('#sel1').val());
                //Ensure that the newCenter array always contains strings
                newCenter = newCenter.map(String);
                $('#xinput').val(newCenter[0].replace('.', ','));
                $('#yinput').val(newCenter[1].replace('.', ','));
                $("#dlgXY").dialog("open");
            });
        },
        /**
         * Sets the onlclick event when getting
         * coordinats from the map 
         * @function initGetCoordsFromMap
         * @memberof zoom2XY
         */
        initGetCoordsFromMap: function () {
            // Remove any map click interactions
            mapUtils.resetMapInteractions(mymap);
            // Prompt user
            mapUtils.showMessage('info', $.i18n._('_GETCOORDFROMMAPPROMPT'), $.i18n._('_ZOOMTOXY'));
            // Add click interaction
            mymap.on('singleclick', zoom2XY.getCoordsFromMap);
        },
        getCoordsFromMap: function (evt) {
            //Get the map cpordinate in the map srid
            var click_coord = evt.coordinate;
            // Convert it to the coordinate system of the zoomxy dialog
            var proj_coord = ol.proj.transform(click_coord, projcode, 'EPSG:' + $('#sel1').val());
            // Update the X/Y fields
            $('#xinput').val(String(proj_coord[0].toFixed(3)).replace('.', $.i18n._("_DECIMALSEPARATOR")));
            $('#yinput').val(String(proj_coord[1].toFixed(3)).replace('.', $.i18n._("_DECIMALSEPARATOR")));
            // Create pin
            var pinF = zoom2XY.createPinFeature(click_coord);
            // Add pin to map
            zoom2XY.addPin(pinF);
            // Unset the singleclick event
            mymap.un('singleclick', zoom2XY.getCoordsFromMap);
        },
        deleteAllPinPoints: function () {
            mymap.getLayers().forEach(function (lyr, i) {
                if (lyr.get('name') === 'pinLayer') {
                    lyr.getSource().clear();
                    userUtils.clearPins();
                    return false;
                }
            });
        },
        deleteCertainPinPoint: function () {
            var centerPointSource;
            $mymap = $('#mapid').data('map');
            $mymap.getLayers().forEach(function (lyr, i) {
                if (lyr.get('name') === 'pinLayer') {
                    centerPointSource = lyr.getSource();
                    return false;
                }
            });

            var features = centerPointSource.getFeatures();
            if (features !== null && features.length > 0) {
                for (x in features) {
                    var properties = features[x].getProperties();
                    var coorx = properties.xcoor;
                    var coory = properties.ycoor;
                    if (coorx === Number($('#popupx').val()) && coory === Number($('#popupy').val())) {
                        centerPointSource.removeFeature(features[x]);
                        if (properties.name) {
                            userUtils.removeNamedPin(properties.name);
                        }
                        break;
                    }
                }
            }
            element = document.getElementById('popup');
            $(element).popover('destroy');
            $osmap = $('#mapid').data('map');
            $osmap.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.Select) {
                    interaction.getFeatures().clear();
                }
            });
        }
    };
})();
$(document).ready(function () {
    zoom2XY.createDialog();
});