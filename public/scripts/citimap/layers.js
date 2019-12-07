var mapUtils = (function () {
    var infoOptions = [];
    var infoTitle = [];
    var searchFields = {};
    var identifyFields = {};
    return {
        /**
         * initlayers: Reads the config file and sets up map and layers
         * @param {string} projcode Project code e.g. EPSG:2100
         * @param {string} projdescr Project description
         * @param {string} mapextent Map extent. 4 numbers separated by comma
         */
        initlayers: function (projcode, projdescr, mapextent) {
            var layers;
            oslayers = [];
            groups = {};

            layers = mapPortal.readConfig("layers");

            mymap = mapUtils.createMap(layers, oslayers, infoOptions, infoTitle, searchFields, projcode, projdescr, mapextent, identifyFields);
            //mymap.addControl(mousePositionControl);
            $('#mapid').data('map', mymap);

            //Make sure vector layers are at the top
            mymap.getLayers().forEach(function (lyr, i) {
                //alert(lyr.get('name'));
                if (lyr instanceof ol.layer.Vector) {
                    lyr.setZIndex(99);
                } else if (lyr instanceof ol.layer.Group) {
                    lyr.getLayers().forEach(function (sublayer, j) {
                        if (lyr instanceof ol.layer.Vector) {
                            sublayer.setZIndex(99);
                        }
                    });
                }
            });
            mapUtils.setLyrVisibility(mymap);

            //Graphic scalebar -REMOVED. PV 22-JUL-18
            //var scaleLineControl = new ol.control.ScaleLine({
            //    'target': 'graphicScaleBar'
            //});
            //mymap.getControls().push(scaleLineControl);

            //Show current scale
            mapUtils.updScaleControl(mymap, mymap.getView().getResolution());
            //Update scale when zoom in/out updating the placeholder attr
            mymap.getView().on('propertychange', function (e) {
                //setLyrVisibility();
                //console.log(e.key);
                switch (e.key) {
                    case 'resolution':
                    case 'moveend':

                        break;
                }
            });

            var nav_his = [];
            var size = -1;
            var undo_redo = false;
            mymap.on('moveend', function (e) {
                var res = mymap.getView().getResolution();
                var projection = mymap.getView().getProjection();
                var resolutionAtCoords = ol.proj.getPointResolution(projection, res, mymap.getView().getCenter());
                mapUtils.updScaleControl(mymap, resolutionAtCoords);
                //anonymousUser.writeSettings(mymap);
                if (undo_redo === false) {
                    if (size < nav_his.length - 1) {
                        for (var i = nav_his.length - 1; i > size; i--) {
                            nav_his.pop();
                        }
                    }
                    nav_his.push({
                        extent: mymap.getView().calculateExtent(mymap.getSize()),
                        size: mymap.getSize(),
                        zoom: mymap.getView().getZoom()
                    });
                    size = size + 1;
                }
                if (nav_his.length === 1 && (size === -1 || size === 0)) {
                    $('#btnPrevEx').prop("disabled", true);
                    $('#btnNextEx').prop("disabled", true);
                } else {
                    $('#btnPrevEx').prop("disabled", false);
                    if (size < nav_his.length - 1) {
                        $('#btnNextEx').prop("disabled", false);
                    } else {
                        $('#btnNextEx').prop("disabled", true);
                    }
                }

                //console.log("size: " + size);
                //console.log(" nav_his.length: " + nav_his.length);
            });

            /** control for Zoom to Previous*/
            $('#btnPrevEx').on('click', function () {
                if (size > 0) {
                    undo_redo = true;
                    mymap.getView().fit(nav_his[size - 1].extent, nav_his[size - 1].size);
                    mymap.getView().setZoom(nav_his[size - 1].zoom);
                    setTimeout(function () {
                        undo_redo = false;
                    }, 360);
                    size = size - 1;
                }
            });

            /** control for Zoom to Next*/
            $('#btnNextEx').on('click', function () {
                if (size < nav_his.length - 1) {
                    undo_redo = true;
                    mymap.getView().fit(nav_his[size + 1].extent, nav_his[size + 1].size);
                    mymap.getView().setZoom(nav_his[size + 1].zoom);
                    setTimeout(function () {
                        undo_redo = false;
                    }, 360);
                    size = size + 1;
                }
            });

            mymap.on('postrender', function (event) {});

            mymap.on('change', function (event) {
                //anonymousUser.writeSettings(mymap);
            });
            // Remove placeholder when user clicks in scale textbox
            $('#curScale').click(function () {
                $('#curScale').attr("placeholder", "");
            });

            //Set scale when user presses enter in scale textbox
            $('#curScale').bind('keyup', function (e) {
                if (e.keyCode === 13 && $('#curScale').val().trim() !== "") { // 13 is enter key
                    mapUtils.zoomToScale(mymap, Number($('#curScale').val().trim()));
                }
            });
            //Set Scale when selecting from the dropdown
            $('#curScale').on('input', function () {
                var val = this.value;
                if ($('#scales').find('option').filter(function () {
                        return this.value === val;
                    }).length) {
                    mapUtils.zoomToScale(mymap, Number($('#curScale').val()));
                }
            });

            mapUtils.createAndAddInteractions(infoOptions, infoTitle, mymap, searchFields, identifyFields);
            //var $schbtn = document.getElementById("searchbtn");
            var lyrtosent = mymap.getLayers();
            $('#searchbtn').on('click', function () {
                searchUtilities.performSearch($('#searchfield').val(), searchFields, layers, identifyFields);
            });

            //Check if there is a Home view
            if (userUtils.getMapSet("Home") !== null) {
                userUtils.setMapView(mymap, "Home");
            }
        },
        convertGeometryToDestProjection: function (type, geom) {
            if (type === 'Polygon') {
                // A polygon is an array of rings, the first ring is
                // the exterior ring, any others are the interior rings
                var ringArray = [];
                for (i = 0; i < geom.getCoordinates().length; i++) {
                    var ring = [];
                    for (j = 0; j < geom.getCoordinates()[i].length; j++) {
                        //Transform each vertex in destination projection
                        var coordInDest = ol.proj.transform(geom.getCoordinates()[i][j], mymap.getView().getProjection(), ol.proj.get(destprojcode));
                        ring.push(coordInDest);
                    }
                    ringArray.push(ring);
                }
                var polygon = new ol.geom.Polygon(ringArray);
                return polygon;
            } else if (type === 'LineString') {
                // A polygon is an array of rings, the first ring is
                // the exterior ring, any others are the interior rings
                var coordArray = [];
                for (j = 0; j < geom.getCoordinates().length; j++) {
                    //Transform each vertex in destination projection
                    coordInDest = ol.proj.transform(geom.getCoordinates()[j], mymap.getView().getProjection(), ol.proj.get(destprojcode));
                    coordArray.push(coordInDest);
                }
                var line = new ol.geom.LineString(coordArray);
                return line;
            }
        },
        createMap: function (layers, oslayers, infoOptions, infoTitle, searchFields, projcode, projdescr, mapextent, identifyFields) {
            // Set source and destination projections
            if (typeof projDef === "undefined") { //Projection definitions is not set
                proj4.defs(
                    projcode,
                    projdescr
                );
                // Set destination projection (used for measuring and coordinate display)
                proj4.defs(
                    destprojcode,
                    destprojdescr
                );
            } else {
                $.each(projDef, function (key, val) { 
                    if (key=== projcode ) {
                        proj4.defs(
                            destprojcode,
                            val
                        );
                    }
                }); 
                $.each(projDef, function (key, val) { 
                    if (key=== destprojcode ) {
                        proj4.defs(
                            destprojcode,
                            val
                        );
                    }
                }); 
            }
            var extentarray = mapextent.split(',');
            var extent = [Number(extentarray[0]), Number(extentarray[1]), Number(extentarray[2]), Number(extentarray[3])];
            var projection = ol.proj.get(projcode);
            // TODO: Setting the extent will mess up the map when layers are in different projections,
            // TODO: BUT without this line, the BING layer won't display - getting a proj4js error
            // TODO: possible because there is no set extent? NEEDS REVISITING. The ASP.NET version
            // TODO: includes this line
            //projection.setExtent(extent);

            // Setting the 'invisible' selection layer. This is used to highlight features
            // when using the identify or select by rectangle buttons
            var vectorSourceSel = new ol.source.Vector();
            var vectorSel = new ol.layer.Vector({
                source: vectorSourceSel,
                style: mapUtils.setSelectedStyle(),
                defaultDataProjection: projection
            });
            vectorSel.set('name', 'selection');
            vectorSel.set('label', 'selection');
            var mapservUrl = $('#hidMS').val();
            if (typeof useGMap !== "undefined") {
                var googleLayer = new olgm.layer.Google();
                oslayers.push(googleLayer);
            }
            // --------------------------------------
            // Create layers loop
            // --------------------------------------
            $.each(layers, function (key, val) {
                //console.log(searchFields);
                var grp = val.group;
                if (typeof val.group !== "undefined") {
                    if (!(grp in groups)) {
                        groups[grp] = [];
                    }
                }
               
                // OSM Tiles
                if (val.type === "OSM" && typeof useGMap === "undefined") {
                    let url = "http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png";
                    if (typeof val.url !== "undefined" && val.url.trim() !== "") {
                        url = val.url;
                    }
                    var osm =
                        new ol.layer.Tile({
                            source: new ol.source.OSM({
                                crossOrigin: 'anonymous',
                                url: url
                            })
                        });
                    osm.set('name', val.name);
                    osm.set('label', val.label);
                    osm.set('tag', [val.type, '']);
                    osm.set('group', val.group); // this maybe undefined
                    osm.setVisible(val.display_on_startup);
                    oslayers.push(osm);
                    // Bing Maps
                } else if (val.type === "Bing" && typeof useGMap === "undefined") {
                    var bing =
                        new ol.layer.Tile({
                            visible: false,
                            preload: Infinity,
                            source: new ol.source.BingMaps({
                                key: val.bing_key,
                                imagerySet: val.bing_style,
                                // use maxZoom 19 to see stretched tiles instead of the BingMaps
                                // "no photos at this zoom level" tiles
                                maxZoom: 19
                            })
                        });
                    bing.set('name', val.name);
                    bing.set('label', val.label);
                    bing.set('tag', [val.type, '']);
                    bing.set('group', val.group); // this maybe undefined
                    bing.setVisible(val.display_on_startup);
                    oslayers.push(bing);
                    // WMS Layers
                } else if (val.type === "WMS") {
                    var wmsUrl = '';
                    let mapSettings = mapPortal.readConfig("map");
                    var tmplyr;
                    mapserver = mapSettings.mapserver;
                    if (typeof val.mapfile !== "undefined") {
                        if (mapSettings.useWrappedMS !== "undefined" && mapSettings.useWrappedMS === true) {
                            wmsUrl = window.location.protocol + '//' + mapservUrl + '/' + val.mapfile.split('\\')[val.mapfile.split('\\').length - 1].split('.')[0];
                        } else {
                            wmsUrl = window.location.protocol + '//' + mapservUrl + '?map=' + val.mapfile;
                        }
                    } else if (typeof val.url !== "undefined") {
                        wmsUrl = val.url;
                    } else {
                        console.log("WMS Url not found - ignoring layer");
                        return false;
                    }
                    //Get layer SOURCE projection from config. If undefined use map projection;
                    var lyrProj;
                    if (typeof val.projection === "undefined")
                        lyrProj = projcode;
                    else {
                        if (typeof projDef[val.projection] === "undefined" && val.projection != "EPSG:4326" && val.projection != "EPSG:3857") {
                            alert("Projection " + val.projection + " is not defined in the Projection Definition file (projdef.json)");
                            return;
                        } else {
                            lyrProj = val.projection;
                        }
                    }
                    if (typeof val.tiled === "undefined" || val.tiled === false) {
                        tmplyr =
                            new ol.layer.Image({
                                source: new ol.source.ImageWMS({
                                    url: wmsUrl,
                                    params: {
                                        'LAYERS': val.name,
                                        'CRS': projcode
                                    },
                                    serverType: 'mapserver',
                                    crossOrigin: 'anonymous',
                                    projection: lyrProj
                                })
                            });
                    } else {
                        tmplyr =
                            new ol.layer.Tile({
                                source: new ol.source.TileWMS({
                                    url: wmsUrl,
                                    params: {
                                        'LAYERS': val.name,
                                        'TILED': true,
                                        'CRS': projcode
                                    },
                                    serverType: 'mapserver',
                                    crossOrigin: 'anonymous',
                                    projection: lyrProj
                                })
                            });
                    }
                    tmplyr.set('name', val.name);
                    tmplyr.set('label', val.label);
                    tmplyr.set('tiled', val.tiled);
                    tmplyr.set("tag", [val.type, wmsUrl]);
                    if (typeof val.srid === "undefined") {
                        tmplyr.set("srid", projcode);
                    } else {
                        tmplyr.set("srid", val.srid);
                    }
                    tmplyr.set('feature_info_format', "GEOJSON");
                    tmplyr.set('identify_fields', val.identify_fields);
                    tmplyr.set('group', val.group); // this maybe undefined
                    if (typeof val.queryable !== "undefined") {
                        tmplyr.set('queryable', val.queryable);
                    } else {
                        tmplyr.set('queryable', false);
                    }
                    tmplyr.set('search_fields', val.search_fields);
                    tmplyr.setVisible(val.display_on_startup);
                    if (typeof val.exportable !== "undefined") {
                        tmplyr.set('exportable', val.exportable);
                    } else {
                        tmplyr.set('exportable', false);
                    }
                    if (typeof val.relation !== "undefined") {
                        tmplyr.set('has_relation', true);
                        tmplyr.set('relation_details', val.relation);
                    } else {
                        tmplyr.set('has_relation', false);
                    }
                    if (typeof val.custom_record_action !== "undefined") {
                        tmplyr.set('custom_record_action', val.custom_record_action);
                    }
                    tmplyr.set('edit_fields', val.edit_fields);
                    // Check if layer is editable
                    if (typeof val.editable !== "undefined") {
                        tmplyr.set('editable', val.editable);
                        if (val.editable === true && typeof val.edit_pk !== "undefined" && typeof val.edit_fields !== "undefined" &&
                            typeof val.edit_service_url !== "undefined" && typeof val.edit_geomcol !== "undefined" && typeof val.edit_geomtype !== "undefined") {
                            tmplyr.set('table_name', val.table_name);
                            tmplyr.set('edit_pk', val.edit_pk);
                            tmplyr.set('edit_geomcol', val.edit_geomcol);
                            tmplyr.set('edit_geomtype', val.edit_geomtype);
                            tmplyr.set('edit_snapping_layers', val.edit_snapping_layers);
                            tmplyr.set('edit_fields', val.edit_fields);
                            tmplyr.set('edit_service_url', val.edit_service_url);
                            if (typeof val.edit_allow_split !== "undefined" && val.edit_allow_split === true) {
                                tmplyr.set('edit_allow_split', val.edit_allow_split);
                                tmplyr.set('edit_split_layer', val.edit_split_layer);
                                tmplyr.set('edit_split_url', val.edit_split_url);
                            }
                            if (typeof val.edit_hump_url !== "undefined") {
                                tmplyr.set('edit_hump_url', val.edit_hump_url);
                            }
                            if (typeof val.edit_merge_url !== "undefined") {
                                tmplyr.set('edit_merge_url', val.edit_merge_url);
                            }
                        } else {
                            tmplyr.set('editable', false);
                        }
                    } else {
                        tmplyr.set('editable', false);
                    }
                    // End Check if layer is editable

                    oslayers.push(tmplyr);
                } else if (val.type === "GeoJSON") {
                    let wfsUrl = '';
                    let mapSettings = mapPortal.readConfig("map");

                    mapserver = mapSettings.mapserver;
                    if (mapSettings.useWrappedMS !== "undefined" && mapSettings.useWrappedMS === true) {
                        wfsUrl = window.location.protocol + '//' + mapservUrl + '/' + val.mapfile.split('\\')[val.mapfile.split('\\').length - 1].split('.')[0];
                    } else {
                        wfsUrl = window.location.protocol + '//' + mapservUrl + '?map=' + val.mapfile;
                    }
                    tmpvector = mapUtils.createVectorJsonLayer(val.mapfile, val.table_name, val.color, val.linewidth, val.fill, val.fillcolor, mapSettings.useWrappedMS);
                    tmpvector.set('name', val.name);
                    tmpvector.set('table_name', val.table_name);
                    tmpvector.set('tag', [val.type, wfsUrl]);
                    if (typeof val.srid === "undefined") {
                        tmpvector.set("srid", projcode);
                    } else {
                        tmpvector.set("srid", val.srid);
                    }
                    tmpvector.set('feature_info_format', "GEOJSON");
                    tmpvector.set('label', val.label);
                    tmpvector.set('identify_fields', val.identify_fields);
                    tmpvector.set('search_fields', val.search_fields);
                    tmpvector.set('group', val.group); // this maybe undefined
                    if (typeof val.queryable !== "undefined") {
                        tmpvector.set('queryable', val.queryable);
                    } else {
                        tmpvector.set('queryable', false);
                    }
                    tmpvector.setVisible(val.display_on_startup);
                    if (typeof val.exportable !== "undefined") {
                        tmpvector.set('exportable', val.exportable);
                    } else {
                        tmpvector.set('exportable', false);
                    }
                    if (typeof val.legend_image !== "undefined") {
                        tmpvector.set('legend_image', val.legend_image);
                    }
                    if (typeof val.legend_wh !== "undefined") {
                        tmpvector.set('legend_wh', val.legend_wh);
                    }
                    if (typeof val.relation !== "undefined") {
                        tmpvector.set('has_relation', true);
                        tmpvector.set('relation_details', val.relation);
                    } else {
                        tmpvector.set('has_relation', false);
                    }
                    if (typeof val.custom_record_action !== "undefined") {
                        tmpvector.set('custom_record_action', val.custom_record_action);
                    }
                    tmpvector.set('edit_fields', val.edit_fields);
                    // Check if layer is editable
                    if (typeof val.editable !== "undefined") {
                        tmpvector.set('editable', val.editable);
                        if (val.editable === true && typeof val.edit_pk !== "undefined" && typeof val.edit_fields !== "undefined" &&
                            typeof val.edit_service_url !== "undefined" && typeof val.edit_geomcol !== "undefined" && typeof val.edit_geomtype !== "undefined") {
                            tmpvector.set('edit_pk', val.edit_pk);
                            tmpvector.set('edit_geomcol', val.edit_geomcol);
                            tmpvector.set('edit_geomtype', val.edit_geomtype);
                            tmpvector.set('edit_snapping_layers', val.edit_snapping_layers);
                            tmpvector.set('edit_fields', val.edit_fields);
                            tmpvector.set('edit_service_url', val.edit_service_url);
                            if (typeof val.edit_allow_split !== "undefined" && val.edit_allow_split === true) {
                                tmpvector.set('edit_split_layer', val.edit_split_layer);
                                tmpvector.set('edit_split_url', val.edit_split_url);
                            }
                            if (typeof val.edit_hump_url !== "undefined") {
                                tmpvector.set('edit_hump_url', val.edit_hump_url);
                            }
                            if (typeof val.edit_merge_url !== "undefined") {
                                tmpvector.set('edit_merge_url', val.edit_merge_url);
                            }
                        } else {
                            tmpvector.set('editable', false);
                        }
                    } else {
                        tmpvector.set('editable', false);
                    }
                    // End Check if layer is editable

                    if (typeof val.group !== "undefined") {
                        groups[grp].push(tmplyr);
                    } else {
                        oslayers.push(tmpvector);
                    }
                } else if (val.type === "ESRIRESTTILE") {
                    var esriurl = val.url;
                    var esriname = val.name;
                    var lbl = val.label;
                    var srid = val.srid;
                    var group = val.group;
                    var arcgislayer = esriUtils.createEsriRestTile(esriname, esriurl, lbl, srid, group);
                    arcgislayer.setVisible(val.display_on_startup);
                    oslayers.push(arcgislayer);
                }

                if (typeof val.queryable !== "undefined" && val.queryable === true) {
                    infoOptions.push({
                        key: val.name,
                        value: val.identify_fields
                    });
                    infoTitle.push({
                        key: val.name,
                        value: val.label
                    });
                    searchFields[val.name] = val.search_fields;
                    if (typeof val.identify_fields !== "undefined") {
                        identifyFields[val.name] = val.identify_fields;
                    } else {
                        identifyFields[val.name] = "";
                    }
                }
            }); // End Create layers loop
            
            // Add the selection layer now so its at the topp
            oslayers.push(vectorSel);
            // Experiment with google layers
            //var gmaplayer = new ol.layer.Tile({
            //    source: new ol.source.OSM({
            //        url: 'http://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            //        attributions: [
            //            new ol.Attribution({ html: '© Google' }),
            //            new ol.Attribution({ html: '<a href="https://developers.google.com/maps/terms">Terms of Use.</a>' })
            //        ]
            //    })
            //});
            //oslayers.push(gmaplayer);

            // Create tool to display the mouse coordinates
            var mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: function (coordinate) {
                    return ol.coordinate.format(coordinate, 'X: {x}, Y: {y}', 3);
                }, //ol.coordinate.createStringXY(3),
                projection: destprojcode,
                // comment the following two lines to have the mouse position
                // be placed within the map.
                target: document.getElementById('mcoords'),
                undefinedHTML: '&nbsp;'
            });
            var emcenter = mcenter.split(',');
            var centerpoint = [Number(emcenter[0]), Number(emcenter[1])];

            initzoomlevel = Number(initzoomlevel);
            if (typeof (initzoomlevel) === "undefined" || isNaN(initzoomlevel)) {
                initzoomlevel = 2;
            }

            var mySpan = document.createElement("span");
            mySpan.className = "glyphicon glyphicon-home";

            // Create the map object
            mymap = new ol.Map({
                controls: [
                    new ol.control.Attribution(),
                    mousePositionControl,
                    new ol.control.ScaleLine({
                        className: 'custom-scale'
                    })
                ],
                interactions: ol.interaction.defaults({
                    shiftDragZoom: false,
                    DragZoom: false, //Remove the default drag zoom interaction as we will add it manually
                    doubleClickZoom: false,
                    onFocusOnly: true
                }),
                layers: oslayers,
                target: 'mapid',
                view: new ol.View({
                    center: centerpoint,
                    zoom: initzoomlevel,
                    projection: projection //,
                    //extent: extent
                })
            });
            mymap.getView().setZoom(initzoomlevel);
            if (typeof useGMap !== "undefined") {
                // Activate the library
                var olGM = new olgm.OLGoogleMaps({
                    map: mymap
                });
                olGM.activate();
            }

            // Create the navigation toolbar on the left
            var navBtnsHtml = '<button id="btnZoomIn" type="button" class="btn btn-primary mapnav" onclick="mapUtils.fixedZoom(1);" autocomplete= "off">' +
                '    <i class="glyphicon glyphicon-plus"></i>' +
                '</button>' +
                '<button id="btnZoomOut" type="button" class="btn btn-primary mapnav" onclick="mapUtils.fixedZoom(-1);" autocomplete= "off">' +
                '    <i class="glyphicon glyphicon-minus"></i>' +
                '</button>' +
                '<button id="btnHome" type="button" class="btn btn-primary mapnav" onclick="mapUtils.zoomHome();" autocomplete= "off">' +
                '    <i class="glyphicon glyphicon-home"></i>' +
                '</button>' +
                '<button id="btnPan" type="button" class="btn btn-primary mapnav" onclick="mapUtils.pan();" autocomplete= "off">' +
                '    <i class="far fa-hand-paper"></i>' +
                '</button>' +
                '<button id="btnPrevEx" type="button" class="btn btn-primary mapnav" autocomplete= "off">' +
                '    <i class="glyphicon glyphicon-arrow-left"></i>' +
                '</button>' +
                '<button id="btnNextEx" type="button" class="btn btn-primary mapnav" autocomplete= "off">' +
                '    <i class="glyphicon glyphicon glyphicon-arrow-right"></i>' +
                '</button>' +
                '<button id="btnZoomInBox" type="button" class="btn btn-primary mapnav" onclick="mapUtils.toggleZoomInOutBox(this, false);" autocomplete= "off">' +
                '    <i class="glyphicon glyphicon-zoom-in"></i>' +
                '</button>' +
                '<button id="btnZoomOutBox" type="button" class="btn btn-primary mapnav"  onclick="mapUtils.toggleZoomInOutBox(this, true);" autocomplete= "off">' +
                '    <i class="glyphicon glyphicon-zoom-out"></i>' +
                '</button>';
            $("#zoomTools").append(navBtnsHtml);
            $("#btnZoomIn").prop("title", $.i18n._('_ZOOMIN'));
            $("#btnZoomOut").prop("title", $.i18n._('_ZOOMOUT'));
            $("#btnHome").prop("title", $.i18n._('_HOMEEXTENT'));
            $("#btnPan").prop("title", $.i18n._('_PAN'));
            $("#btnZoomInBox").prop("title", $.i18n._('_ZOOMINTT'));
            $("#btnZoomOutBox").prop("title", $.i18n._('_ZOOMOUTTT'));
            $("#btnNextEx").prop("title", $.i18n._('_NEXTZOOMTT'));
            $("#btnPrevEx").prop("title", $.i18n._('_PREVZOOMTT'));
            $("#lblScaleBar").html($.i18n._('_SCALELBL'));
            $("#btnOpenXY").prop("title", $.i18n._('_ZOOMTOXY'));
            $("#searchfield").prop("placeholder", $.i18n._('_SEARCHTT'));
            $("#searchbtn").prop("title", $.i18n._('_SEARCH'));

            //Make pan the default button
            $("#btnPan").addClass("active");
             return mymap;
        },
        createVectorJsonLayer: function (mapfile, table_name, color, linewidth, hasfill, fillcolor, iswrapped) {
            let vectorStyle = new ol.style.Style();
            let fill;
            if ((typeof hasfill !== "undefined" || hasfill === true) && typeof fillcolor !== "undefined") {
                fill = new ol.style.Fill({
                    color: fillcolor
                });
            } else {
                fill = false;
            }
            var geoJsonLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    format: new ol.format.GeoJSON({
                        defaultDataProjection: projcode,
                        featureProjection: destprojcode
                    }),
                    url: function (x) {
                        let wfsurl='';
                        let mappath = '';
                        if (iswrapped !== "undefined" && iswrapped === true) {
                            mappath = '/' + mapfile.split('\\')[mapfile.split('\\').length - 1].split('.')[0];
                        } else {
                            mappath = '?map=' + mapfile;
                        }
                        if (window.location.host === $('#hidMS').val().split('/')[0]) {
                            wfsurl = window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                'bbox=' + x.join(',');
                        } else {
                            wfsurl = proxyUrl + window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                'bbox=' + x.join(',');
                        }
                        /* if (window.location.host === $('#hidMS').val().split('/')[0]) {
                            return window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                'bbox=' + mapextent;
                        } else {
                            return proxyUrl + window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                'bbox=' + mapextent;
                        }*/
                        return wfsurl;
                    },
                    strategy: ol.loadingstrategy.bbox,
                    crossOrigin: 'anonymous',
                    minResolution: 0,
                    maxResolution: 500 // 500 resolution will display vector layers at a scale of 1: 2,500,000
                }),
                style: new ol.style.Style({
                    fill,
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: linewidth
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: color
                        })
                    })
                }),
            });
            return geoJsonLayer;
        },
        updScaleControl: function (map, res) {
            scale = res * (map.getView().getProjection().getMetersPerUnit() / (1 / 96 * 0.0254));
            $('#curScale').val("");
            var ceilScale;
            var floorScale;
            if (scale < 1000) {
                ceilScale = Math.ceil(scale / 100) * 100;
                floorScale = Math.floor(scale / 100) * 100;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else if (scale < 10000) {
                ceilScale = Math.ceil(scale / 1000) * 1000;
                floorScale = Math.floor(scale / 1000) * 1000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else if (scale < 100000) {
                ceilScale = Math.ceil(scale / 10000) * 10000;
                floorScale = Math.floor(scale / 10000) * 10000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else if (scale < 100000) {
                ceilScale = Math.ceil(scale / 10000) * 10000;
                floorScale = Math.floor(scale / 10000) * 10000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else {
                ceilScale = Math.ceil(scale / 100000) * 100000;
                floorScale = Math.floor(scale / 100000) * 100000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            }
            $('#curScale').attr("placeholder", Math.round(scale));
        },
        zoomToScale: function (map, scale) {
            var units = map.getView().getProjection().getMetersPerUnit();
            var resolution = scale / (units / (1 / 96 * 0.0254));
            map.getView().setResolution(resolution);
        },
        fixedZoom: function (zoomstep) {
            $mymap = $('#mapid').data('map');
            $mymap.getView().setZoom($mymap.getView().getZoom() + (zoomstep));
        },
        zoomHome: function () {
            $mymap = $('#mapid').data('map');
            var extentarray = mapextent.split(',');
            var extent = [Number(extentarray[0]), Number(extentarray[1]), Number(extentarray[2]), Number(extentarray[3])];
            var newView = new ol.View({
                center: [parseFloat(mcenter.split(',')[0].replace(',', '.')), parseFloat(mcenter.split(',')[1].replace(',', '.'))],
                extent: extent,
                zoom: 6,
                projection: ol.proj.get(projcode)
            });
            $mymap.setView(newView);
        },
        pan: function () {
            mapUtils.resetMapInteractions(mymap);
            $('#btnPan').addClass('active');
        },
        toggleZoomInOutBox: function (btn, isout) {
            let $mymap = $('#mapid').data('map');
            mapUtils.resetMapInteractions($mymap);
            if ($(btn).hasClass('active')) {
                //Remove interaction and active class
                $(btn).removeClass('active');
                var ilist = []; // INteractions list. There may be two dragzoom interactions. One for zoomin and one for zoomout
                //var dzi;
                $mymap.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.DragZoom) {
                        ilist.push(interaction);
                        //dzi = interaction;
                        //return false;
                    }
                });
                ilist.forEach(function (intr) {
                    // In case no interaction found
                    if (intr instanceof ol.interaction.DragZoom) {
                        $mymap.removeInteraction(intr);
                    }
                });
            } else {
                if ($(btn).attr('id') === 'btnZoomInBox') {
                    $('#btnZoomOutBox').removeClass('active');
                } else {
                    $('#btnZoomInBox').removeClass('active');
                }
                //Add interaction and active class
                $(btn).addClass('active');
                var dpi;
                //remove the dragpan interaction
                var dzi;
                $mymap.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.DragPan) {
                        dpi = interaction;
                        return false;
                    }
                });
                // In case no interaction found
                if (dpi instanceof ol.interaction.DragZoom) {
                    $mymap.removeInteraction(dpi);
                }
                dzi = new ol.interaction.DragZoom({
                    condition: ol.events.condition.always,
                    out: isout
                });

                $mymap.addInteraction(dzi);
            }
        },
        removeDragZoomInteractions: function (map) {
            var ilist = [];
            $('#btnZoomOutBox').removeClass('active');
            $('#btnZoomInBox').removeClass('active');
            map.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.DragZoom) {
                    ilist.push(interaction);
                }
            });
            ilist.forEach(function (intr) {
                // In case no interaction found
                if (intr instanceof ol.interaction.DragZoom) {
                    map.removeInteraction(intr);
                }
            });
        },
        setLyrVisibility: function (map) {
            if (typeof map === "undefined") {
                map = $('#mapid').data('map');
            }
            map.getLayers().forEach(function (layer, i) {
                var lyrName = layer.get('name');
                if (layer instanceof ol.layer.Vector) {
                    var vectorSource = layer.getSource();
                    var listenerKey = vectorSource.on('change', function (e) {
                        if (vectorSource.getState() === 'ready') {
                            var featureCount = vectorSource.getFeatures().length;
                            if (featureCount === 0) {
                                $("#btn" + lyrName).removeClass("active");
                                $("#btn" + lyrName).prop("disabled", true);
                            } else {
                                $("#btn" + lyrName).addClass("active");
                                $("#btn" + lyrName).prop("disabled", true);
                            }

                            ol.Observable.unByKey(listenerKey);
                            // use vectorSource.unByKey(listenerKey) instead
                            // if you do use the "master" branch of ol3
                        }
                    });
                } else {
                    if (!layer.getVisible()) {
                        $("#btn" + lyrName).removeClass("active");
                    } else {
                        $("#btn" + lyrName).addClass("active");
                    }
                }
            });
        },
        toggleLyrVisibility: function (btn, lyrName, map) {
            if (typeof map === "undefined") {
                map = $('#mapid').data('map');
            }
            map.getLayers().forEach(function (layer, i) {
                //bindInputs('#layer' + i, layer);
                if (lyrName === layer.get('name')) {
                    //alert(layer.get('name'));

                    if (layer.getVisible()) {
                        layer.setVisible(false);
                        $("#" + btn).removeClass("active");
                    } else {
                        layer.setVisible(true);
                        $("#" + btn).addClass("active");
                    }
                    if (layer instanceof ol.layer.Group) {
                        layer.getLayers().forEach(function (sublayer, j) {
                            if (sublayer.getVisible()) {
                                sublayer.setVisible(false);
                            } else {
                                sublayer.setVisible(true);
                            }
                        });
                    }
                }
            });
        },
        toggleInfoControl: function (rb) {
            var $map = $('#mapid').data('map');
            mapUtils.resetMapInteractions($map);
            if ($(rb).hasClass("active")) {
                $(rb).removeClass("active");
            } else {
                $(rb).addClass("active");
                mapUtils.setIdentifySelectInteraction();
                $map.on('singleclick', mapUtils.mapClickEvent);
            }
        },
        resetMapInteractions: function (map) {
            measureUtilities.clearMeasuresFromInfo();
            // If we are editing then ignore info button
            if ($('#editTools').is(':visible')) {
                if ($('#btnSplit').hasClass('active') || $('#btnEdit').hasClass('active') || $('#btnCreate').hasClass('active')) {
                    featureEdit.unselectEditTools();
                    featureEdit.resetInteraction();
                    //featureEdit.resetInteraction("MODIFY");
                }
            }
            //Remove DragZoom interaction (used in the ZoomIn/Out tools)
            mapUtils.removeDragZoomInteractions(map);
            // Make pan button inactive
            $('#btnPan').removeClass('active');

            //Remove DragBox interaction (used in the select by rectangle tool)
            map.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.DragBox) {
                    interaction.un('boxend');
                    map.removeInteraction(interaction);
                    $("#btnSelByRect").removeClass("active");
                }
                if (interaction instanceof ol.interaction.Select) {
                    map.removeInteraction(interaction);
                    interaction.un('click');
                }
            });
            // Check if we are in the urban page and if so
            // unregister the click event
            if ($('#urbaninfo').length > 0) {
                // Unregister click event for urban
                $map.un('click', urbanDocsUtils.getUrbanDetsClick);
                if ($("#urbaninfo").hasClass("active")) {
                    $("#urbaninfo").removeClass("active");
                }
            }
            // Reset the identify and  select by rectangle interactions
            $("#info1").removeClass("active");
            $("#btnSelByRect").removeClass("active");
            map.un('singleclick', mapUtils.mapClickEvent);
        },
        createAndAddInteractions: function (infoOptions, infoTitle, map, searchFieldsList, identifyFields) {
            var $mymapFI = $('#mapid').data('map');

            window.appInfo = {};
            var appInfo = window.appInfo;
            appInfo.infoButtonControl = function (opt_options) {
                var options = opt_options || {};
                var infoElement = document.createElement('button');
                infoElement.innerHTML = '<img src="css/images/icons8-info-26.png" style="width: 20px;filter: invert(100%);" />';
                infoElement.className = 'btn btn-primary infoButton bottomtb';
                infoElement.setAttribute('id', 'info1');
                infoElement.onclick = function () {
                    mapUtils.toggleInfoControl(this);
                };
                //var idtt=
                infoElement.setAttribute('title', $.i18n._('_IDENTIFYTT'));
                ol.control.Control.call(this, {
                    element: infoElement,
                    target: options.target
                });
            };
            ol.inherits(appInfo.infoButtonControl, ol.control.Control);
            $mymapFI.getControls().push(new appInfo.infoButtonControl({
                'target': 'bottomToolbar'
            }));

            $mymapFI.on('singleclick', mapUtils.mapClickEvent);
            //Set select interaction for identify
            mapUtils.setIdentifySelectInteraction();
            //Create the select by rectangle tool
            mapUtils.selByRectangleTool();
        },
        selByRectangleTool: function () {
            var s = '<button class="btn btn-primary bottomtb" id = "btnSelByRect" >' +
                '       <img src="css/images/icons8-rectangle-50.png" style="width: 20px;filter: invert(100%);-webkit-filter: invert(100%);" />' +
                '    </button >';
            $('#bottomToolbar').append(s);
            $('#btnSelByRect').on('click', mapUtils.setSelByRectIntr);
            $('#btnSelByRect').prop("title", $.i18n._('_SELECTBYRECT'));
        },
        setSelByRectIntr: function () {
            var $map = $('#mapid').data('map');
            mapUtils.resetMapInteractions($map);
            dbi = new ol.interaction.DragBox({});
            $map.addInteraction(dbi);
            // Remove and add Select interaction. Applies to vector layers only. Will be used for the select by rectangle tool
            $map.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.Select) {
                    $map.removeInteraction(interaction);
                }
            });
            var selectIntr = new ol.interaction.Select({
                //condition: ol.events.condition.click, -- no condition for dragbox
                style: mapUtils.setSelectedStyle,
                filter: function (feat, layer) {
                    if ($("#btnSelByRect").hasClass("active")) {
                        return true;
                    } else {
                        return false;
                    }
                }
            });
            $map.addInteraction(selectIntr);

            $('#btnSelByRect').removeClass("active").addClass("active");
            dbi.on('boxend', function () {
                var extent = dbi.getGeometry().getExtent();
                var sel;
                $map.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.Select) {
                        sel = interaction;
                    }
                });
                // Clear any vector selections
                var selFeatures = sel.getFeatures();
                selFeatures.clear();
                var selFeaturesArray = selFeatures.getArray();
                // Clear the selection layer used on Image/WMS layers
                var selLyr = searchUtilities.getSelectionLayer($map);
                // Start looping through the layers
                $map.getLayers().forEach(function (layer) {
                    var searchFields = layer.get("search_fields");
                    var identifyFields = layer.get("search_fields");
                    if (layer instanceof ol.layer.Vector && layer.get('name') !== 'OSM' && layer.get('name') !== 'selection' && layer.get("queryable") &&
                        layer.get('name') !== 'pinlayer' && layer.getVisible() && $('#btnSelByRect').hasClass('active') && layer.get('name') !== 'measure_layer') {
                        var fGeoJSON = new ol.format.GeoJSON();

                        if ($('#btnSelByRect').hasClass('active')) {
                            selFeaturesArray = [];
                            layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
                                if (mapUtils.featuresExistsInList(selFeatures, feature) === false) {
                                    selFeatures.push(feature);
                                    selFeaturesArray.push(feature);
                                }
                            });
                        }
                        if (selFeatures && selFeatures.getLength() > 0) {
                            //Vector layer- not the pin layer
                            //featItem.setStyle(mapUtils.setSelectedStyle(featItem));

                            if (typeof searchFields !== "undefined") {
                                //console.log("selected features from select by rect: " + typeof selFeatures);
                                if (searchFields.length > 0 && identifyFields.length > 0) {
                                    searchUtilities.renderQueryResultsAsTable(fGeoJSON.writeFeaturesObject(selFeaturesArray),
                                        layer.get('label'), layer.get('name'), searchFields.split(','), identifyFields.split(','));
                                } else {
                                    searchUtilities.renderQueryResultsAsTable(fGeoJSON.writeFeaturesObject(selFeaturesArray),
                                        layer.get('label'), layer.get('name'), [], []);
                                }
                                $('#searchResultsUl a').first().tab('show');
                            }
                        }
                    } else { // Not vector layer
                        if ($('#btnSelByRect').hasClass('active') && layer.getVisible() && layer.get('name') !== 'measure_layer' && layer.get("queryable")) {
                            if (layer instanceof ol.layer.Group) {
                                layer.getLayers().forEach(function (sublayer, j) {
                                    if (sublayer.getVisible()) {
                                        var url = sublayer.getSource().getGetFeatureInfoUrl(
                                            evt.coordinate, $map.getView().getResolution(), projcode, {
                                                'INFO_FORMAT': layer.get("feature_info_format")
                                            });
                                        if (url) {
                                            //console.log(url);
                                            $.ajax({
                                                url: url,
                                                async: true,
                                                dataType: 'json',
                                                success: function (data) {
                                                    if (searchFields.length > 0 && identifyFields.length > 0) {
                                                        searchUtilities.renderQueryResultsAsTable(data, sublayer.get('label'), sublayer.get('name'),
                                                            searchFields[sublayer.get('name')].split(','), identifyFields[sublayer.get('name')].split(','));
                                                    } else {
                                                        searchUtilities.renderQueryResultsAsTable(data, sublayer.get('label'), sublayer.get('name'),
                                                            [], []);
                                                    }
                                                    //Always show the first tab as active
                                                    $('#searchResultsUl a').first().tab('show');
                                                },
                                                error: function (jqXHR, textStatus, errorThrown) {
                                                    //console.log("request failed " + textStatus);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else if (layer instanceof ol.layer.Tile || layer instanceof ol.layer.Image) {
                                if ((layer.getSource() instanceof ol.source.ImageWMS) || (layer.getSource() instanceof ol.source.TileWMS)) {
                                    //WMS only supports point queries, so check if we can do a wfs request instead
                                    var supportsWFS = false;
                                    var capabilitiesUrl;
                                    if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                        capabilitiesUrl = layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities";
                                    } else {
                                        capabilitiesUrl = proxyUrl + layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities";
                                    }
                                    //console.log(url);
                                    //$.ajax({
                                    //    url: capabilitiesUrl,
                                    //    async: false,
                                    //    dataType: 'xml',
                                    //    success: function (data) {
                                    //        supportsWFS = true;
                                    //    },
                                    //    error: function (jqXHR, textStatus, errorThrown) {
                                    //        console.log("WMS capabilities request error: " + capabilitiesUrl + "\n" + jqXHR.responseText);
                                    //        //console.log(mapUtils.xmlToJson(jqXHR.responseText));
                                    //    },
                                    //    failure: function (jqXHR, textStatus, errorThrown) {
                                    //        console.log("WMS capabilities request failure: " + capabilitiesUrl + "\n" + jqXHR.responseText);
                                    //    }
                                    //});
                                    //TODO: Extent should be in the layer srid and not the map's. Otherwise it won't return any records

                                    var intersectsUrl;
                                    if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                        intersectsUrl = layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0& &REQUEST=GetFeature&TYPENAME=" +
                                            layer.get("name") + "&BBOX=" + extent[0] + "," + extent[1] + ", " + extent[2] + "," + extent[3] + "&OUTPUTFORMAT=" + layer.get("feature_info_format");

                                    } else {
                                        intersectsUrl = window.location.protocol + "//" + window.location.host + "/proxy/" + layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0& &REQUEST=GetFeature&TYPENAME=" +
                                            layer.get("name") + "&BBOX=" + extent[0] + "," + extent[1] + ", " + extent[2] + "," + extent[3] + "&OUTPUTFORMAT=" + layer.get("feature_info_format");
                                    }
                                    //"<Intersects><PropertyName>Geometry</PropertyName>" +
                                    //"<gml:Polygon><gml: outerBoundaryIs><gml:LinearRing>" +
                                    //"<gml:coordinates>" +
                                    //extent[0] + "," + extent[1] + "," + extent[2] + "," + extent[3] + "," +
                                    //"</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon></Intersects></Filter>";
                                    //console.log(intersectsUrl);
                                    $.ajax({
                                        url: intersectsUrl,
                                        async: true,
                                        dataType: 'json',
                                        beforeSend: function () {
                                            $(".wait").show();
                                        },
                                        success: function (data) {
                                            if (data.features.length === 0) {
                                                return null;
                                            }
                                            var selLyr = legendUtilities.getLayerByName("selection");
                                            if (searchFields.length > 0 && identifyFields.length > 0) {
                                                searchUtilities.renderQueryResultsAsTable(data, layer.get('label'), layer.get('name'), searchFields.split(','), identifyFields.split(','));
                                            } else {
                                                searchUtilities.renderQueryResultsAsTable(data, layer.get('label'), layer.get('name'), [], []);
                                            }
                                            //Always show the first tab as active
                                            $('#searchResultsUl a').first().tab('show');
                                            // Populate the selection layer
                                            var geojson = new ol.format.GeoJSON();

                                            selLyr.getSource().addFeatures(geojson.readFeatures(data));
                                        },
                                        complete: function (response) {
                                            $(".wait").hide();
                                        },
                                        error: function (jqXHR, textStatus, errorThrown) {
                                            console.log("WMS BBOX request error: " + capabilitiesUrl + "\n" + jqXHR.responseText);
                                            //console.log(mapUtils.xmlToJson(jqXHR.responseText));
                                        },
                                        failure: function (jqXHR, _textStatus, errorThrown) {
                                            console.log("WMS BBOX request failure: " + capabilitiesUrl + "\n" + jqXHR.responseText);
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            });
        },
        featuresExistsInList: function (featurelist, feature) {
            exists = true;
            if (featurelist.getLength() === 0) {
                return false;
            }
            featurelist.forEach(function (feat) {
                var existingProps = feat.getProperties();
                for (var existingProp in existingProps) {
                    if (existingProp !== "geometry") { //No need to compare geometries
                        if (feat.getProperties()[existingProp] !== feature.getProperties()[existingProp]) {
                            exists = false;
                            return false; //Exits loop
                        }
                    }
                }
                //console.log(feat);
            });
            return exists;
        },
        setIdentifySelectInteraction: function () {
            var $mymap = $('#mapid').data('map');
            //First, remove any select interactions if they exist
            $mymap.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.Select) {
                    $mymap.removeInteraction(interaction);
                }
            });
            // Select interaction. Applies to vector layers only. Will be used for the identify and edit tools
            var selectIntrAct = new ol.interaction.Select({
                //layers: [layer],
                condition: ol.events.condition.singleclick,
                style: mapUtils.setSelectedStyle,
                filter: function (feat, layer) {
                    if ($("#info1").hasClass("active")) {
                        return true;
                    } else {
                        return false;
                    }
                }
            });
            $mymap.addInteraction(selectIntrAct);
        },
        mapClickEvent: function (evt) {
            var $map = $('#mapid').data('map');
            var coordinate;
            var element;
            var cpElement;
            var layerName;
            var featList = [];
            var wmsFeatList = [];
            var featItem;
            var popup = new ol.Overlay({
                element: document.getElementById('popup'),
                positioning: 'center-center',
                autopan: true,
                stopEvent: true,
                offset: [0, -23]
            });

            var cppopup = new ol.Overlay({
                element: document.getElementById('cpPopup'),
                positioning: 'center-center',
                autopan: true,
                stopEvent: true
            });

            // Clear any selections
            var selLyr = searchUtilities.getSelectionLayer($map);
            $map.addOverlay(popup);
            $map.addOverlay(cppopup);
            $(element).popover('destroy');
            $(cpElement).popover('destroy');
            coordinate = evt.coordinate;
            popup.setPosition(coordinate);
            var fGeoJSON = new ol.format.GeoJSON();
            var popTemplate = '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>';

            //Loop once through layers without the need for the active identify tool
            var pinItem = null;
            $map.getLayers().forEach(function (layer) {
                if (layer.get('name') === 'pinLayer' && layer.getSource().getFeatures().length > 0) {
                    pinItem = mapUtils.getClickResults($map, layer, evt);
                }
                if (pinItem !== null && pinItem.length > 0) {
                    $(element).popover('destroy');
                    element = popup.getElement();

                    var coordinates = pinItem[0].getGeometry().getCoordinates();
                    popup.setPosition(coordinates);
                    setTimeout(function () {
                        $(element).popover({
                            placement: 'top',
                            html: true,
                            template: popTemplate,
                            content: '<div class="row"><div class="col-lg-12">' +
                                '<label id="popuplabel">Χ: ' + pinItem[0].get('xcoor') + '&nbsp;Υ: ' + pinItem[0].get('ycoor') + '</label>' +
                                '<input type="hidden" id="popupx" value="' + pinItem[0].get('xcoor') + '"/>' +
                                '<input type="hidden" id="popupy" value="' + pinItem[0].get('ycoor') + '"/>' +
                                '</div></div>' +
                                '<div class="row"><div class="col-lg-12">' +
                                '<button class="btn btn-sm pull-right" onclick="zoom2XY.deleteCertainPinPoint();">Διαγραφή Σημείου</button>' +
                                '</div></div>',
                            title: (function () {
                                if (pinItem[0].get('name') === "" || typeof pinItem[0].get('name') === "undefined") {
                                    return 'Εστίαση σε Συν/νες';
                                } else {
                                    return pinItem[0].get('name');
                                }
                            })
                        });
                        $(element).popover('show');
                    }, 200);
                    return false;
                }
            });
            if (pinItem !== null) {
                return;
            }
            $map.getLayers().forEach(function (layer) {
                if ((layer instanceof ol.layer.Vector) && layer.get('name') !== 'OSM' && layer.get('name') !== 'selection' && layer.get('name') !== 'pinlayer' && layer.getVisible() && layer.get("queryable") && $('#info1').hasClass('active') && layer.get('name') !== 'measure_layer') {
                    if ($('#info1').hasClass('active')) {
                        //console.log(layer.get('name'));
                        featItem = mapUtils.getClickResults($map, layer, evt);
                    }
                    if (featItem) {
                        //Vector layer- not the pin layer
                        var arrSearch_fields = [];
                        var arrIdentify_fields = [];
                        if (typeof layer.get('search_fields') === "string" && typeof layer.get('search_fields') !== "undefined" && layer.get('search_fields') !== "") {
                            arrSearch_fields = layer.get('search_fields').split(',');
                        }
                        if (typeof layer.get('identify_fields') === "string" && typeof layer.get('identify_fields') !== "undefined" && layer.get('identify_fields') !== "") {
                            arrIdentify_fields = layer.get('identify_fields').split(',');
                        }
                        searchUtilities.renderQueryResultsAsTable(fGeoJSON.writeFeaturesObject(featItem), layer.get('label'), layer.get('name'), arrSearch_fields, arrIdentify_fields);
                        $('#searchResultsUl a').first().tab('show');
                    }
                } else { // Not vector layer
                    if ($('#info1').hasClass('active') && layer.getVisible() && $('#info1').hasClass('active') && layer.get('name') !== 'measure_layer') {
                        //console.log("Name: " + layer.get('name') + " isselectable: " + layer.get("queryable"));
                        if (layer instanceof ol.layer.Group) {
                            console.log("its group");
                            console.log("Group Name: " + layer.get('name'));
                            layer.getLayers().forEach(function (sublayer, j) {
                                if (sublayer.getVisible() && sublayer.get("queryable")) {
                                    var url = sublayer.getSource().getGetFeatureInfoUrl(
                                        evt.coordinate, $map.getView().getResolution(), projcode, {
                                            'INFO_FORMAT': 'geojson'
                                        });
                                    if (url) {
                                        //console.log(url);
                                        $.ajax({
                                            url: url,
                                            async: false,
                                            dataType: 'json',
                                            success: function (data) {
                                                var selLyr = legendUtilities.getLayerByName("selection");
                                                var arrSearch_fields = [];
                                                var arrIdentify_fields = [];
                                                if (typeof sublayer.get('search_fields') === "string" && typeof sublayer.get('search_fields') !== "undefined" && sublayer.get('search_fields') !== "") {
                                                    arrSearch_fields = layer.get('search_fields').split(',');
                                                }
                                                if (typeof sublayer.get('identify_fields') === "string" && typeof sublayer.get('identify_fields') !== "undefined" && sublayer.get('identify_fields') !== "") {
                                                    arrIdentify_fields = sublayer.get('identify_fields').split(',');
                                                }
                                                searchUtilities.renderQueryResultsAsTable(data, sublayer.get('label'), sublayer.get('name'), arrSearch_fields, arrIdentify_fields);
                                                //Always show the first tab as active
                                                $('#searchResultsUl a').first().tab('show');
                                            },
                                            error: function (jqXHR, textStatus, errorThrown) {
                                                //console.log("request failed " + textStatus);
                                            }
                                        });
                                    }
                                }
                            });
                        } else if (layer instanceof ol.layer.Tile || layer instanceof ol.layer.Image && layer.getVisible() && layer.get("queryable")) {
                            if ((layer.getSource() instanceof ol.source.ImageWMS) || (layer.getSource() instanceof ol.source.TileWMS)) {
                                var url = layer.getSource().getGetFeatureInfoUrl(
                                    evt.coordinate, $map.getView().getResolution(), projcode, {
                                        'INFO_FORMAT': layer.get('feature_info_format'),
                                        'FEATURE_COUNT': '100'
                                    });
                                if (url) {
                                    $.ajax({
                                        url: url,
                                        async: false,
                                        dataType: 'json',
                                        success: function (data) {
                                            if (data.features.length === 0) {
                                                return null;
                                            }
                                            var selLyr = legendUtilities.getLayerByName("selection");
                                            var arrSearch_fields = [];
                                            var arrIdentify_fields = [];
                                            if (typeof layer.get('search_fields') === "string" && typeof layer.get('search_fields') !== "undefined" && layer.get('search_fields') !== "") {
                                                arrSearch_fields = layer.get('search_fields').split(',');
                                            }
                                            if (typeof layer.get('identify_fields') === "string" && typeof layer.get('identify_fields') !== "undefined" && layer.get('identify_fields') !== "") {
                                                arrIdentify_fields = layer.get('identify_fields').split(',');
                                            }
                                            searchUtilities.renderQueryResultsAsTable(data, layer.get('label'), layer.get('name'), arrSearch_fields, arrIdentify_fields);
                                            if (data.features.length > 0) {
                                                let geom = JSON.stringify(data.features[0].geometry.coordinates);
                                                let geomtype = data.features[0].geometry.type;
                                                window.parent.postMessage(geom, "*");
                                            }

                                            //Always show the first tab as active
                                            $('#searchResultsUl a').first().tab('show');
                                            // Populate the selection layer
                                            var geojson = new ol.format.GeoJSON();

                                            selLyr.getSource().addFeatures(geojson.readFeatures(data));
                                        },
                                        error: function (jqXHR, textStatus, errorThrown) {
                                            console.log("request failed " + textStatus);
                                        },
                                        failure: function (jqXHR, textStatus, errorThrown) {
                                            console.log("request failed " + textStatus);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });
        },
        setSelectedStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#2EFEF7',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#2EFEF7'
                    })
                })
            });
            return style;
        },
        getPopupContent: function (feature) {
            var ret = '&nbsp;';
            if (typeof feature.content === "undefined") {
                ret = '<div class="row"><div class="col-lg-6">' +
                    '<label id="popupx">' + feature.get('xcoor') + '</label>' +
                    '</div>' +
                    '<div class="col-lg-6">' +
                    '<label id="popupy">' + feature.get('ycoor') + '</label>' +
                    '</div></div><div class="row"></div>' +
                    '<div class="col-lg-12">' +
                    '<button class="btn btn-sm btn-warning pull-right" onclick="deleteCertainPinPoint();">Διαγραφή Σημείου</button>' +
                    '</div>';
            } else {
                ret = '<div class="col-lg-12">' +
                    '<small>' + content_str + '</small>' +
                    '</div>';
            }
            return ret;
        },
        getClickResults: function (mymapFI, layer, evt) {
            var featItems = [];
            var feature = mymapFI.forEachFeatureAtPixel(evt.pixel,
                function (feature, lyr) {
                    if (lyr.get("name") === layer.get("name")) {
                        featItems.push(feature);
                    }
                });
            return featItems;
        },
        // Changes XML to JSON
        xmlToJson: function (xml) {
            // Create the return object
            var obj = {};

            if (xml.nodeType === 1) { // element
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["@attributes"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                    }
                }
            } else if (xml.nodeType === 3) { // text
                obj = xml.nodeValue;
            }

            // do children
            if (xml.hasChildNodes()) {
                for (var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (typeof (obj[nodeName]) === "undefined") {
                        obj[nodeName] = mapUtils.xmlToJson(item);
                    } else {
                        if (typeof (obj[nodeName].push) === "undefined") {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(mapUtils.xmlToJson(item));
                    }
                }
            }
            return obj;
        },
        showMessage: function (msgtype, msg, title) {
            $('#divMsg').removeClass("panel-info");
            $('#divMsg').removeClass("panel-warning");
            $('#divMsg').removeClass("panel-danger");
            $('#divMsg').removeClass("panel-success");
            $('#divMsg').addClass("panel-" + msgtype);
            $('#pnlMsgTitle').html(title);
            $('#pnlMsg').html(msg);
            $('#divMsg').show();
            $('#divMsg').delay(2500).fadeOut(2000);
        }
    };
})();