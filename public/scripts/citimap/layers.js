/**
 * Functions for controlling the layers and the map
 * 1. Adding the various layer types reading the *layerconfig.json
 * 2. Creating the map toolbars and tools
 * 3. Sets the initial map interactions
 * @namespace mapUtils
 */

var mapUtils = (function () {
    var infoOptions = [];
    var infoTitle = [];
    var searchFields = {};
    var identifyFields = {};
    var velocityLayer;

    var clusterLayer2;
    var styleCache = {};
    
    var openResults = true;
    var closeBbox = false;
    var element;
    return {
        clusterStyle: function (featureCl, resolution){
            

            let sizeCl = featureCl.get('features').length;
            
            let styleCl = styleCache[sizeCl];
    
            
            // console.log("styleCl ",sizeCl,styleCl , styleCache);
            
            // console.log("style",styleCache , styleCl);    
            if (!styleCl)
            {
                
                var color = sizeCl>25 ? "192,0,0" : sizeCl>8 ? "255,128,0" : "0,128,0";
                var radius = Math.max(8, Math.min(sizeCl*0.75, 20));
                var dash = 2*Math.PI*radius/6;
                dash = [ 0, dash, dash, dash, dash, dash, dash ];
                styleCl = styleCache[sizeCl] = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: radius,
                        stroke: new ol.style.Stroke({
                        color: "rgba("+color+",0.5)", 
                        width: 15 ,
                        lineDash: dash,
                        lineCap: "butt"
                        }),
                        fill: new ol.style.Fill({
                        color:"rgba("+color+",1)"
                        })
                    }),
                    text: new ol.style.Text({
                        text: sizeCl.toString(),
                        //font: 'bold 12px comic sans ms',
                        //textBaseline: 'top',
                        fill: new ol.style.Fill({
                        color: '#fff'
                        })
                    })
                });
               
            }
           
            return [styleCl];
        },
        /**
         * initlayers: Reads the config file and sets up map and layers
         * @param {string} projcode Project code e.g. EPSG:2100
         * @param {string} projdescr Project description
         * @param {string} mapextent Map extent. 4 numbers separated by comma
         * @function initlayers
         * @memberof mapUtils
         */
        initlayers: function (projcode, projdescr, mapextent , xyzoomlevel) {
            var layers;
            
            oslayers = [];
            groups = {};

            //layers = mapPortal.readConfig("layers");
            
            layers=cfg.layers;

            mymap = mapUtils.createMap(layers, oslayers, infoOptions, infoTitle, searchFields, projcode, projdescr, mapextent, identifyFields , xyzoomlevel);
            
            
            
            mapUtils.initContextMenu();

            
            // if velocity layer exists
            if (velocityControls.getVelocitySettings().mapId && velocityControls.velocityLayerIsLoaded()) {
                // create velocity map
                velocityMap = this.createVelocityMap();
            }
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
            $(document).ready(function(){
                $('#searchbtn').on('click', function () {
                
                    searchUtilities.performSearch($('#searchfield').val(), searchFields, layers, identifyFields);
                });
            });
                
           

            //Check if there is a Home view
            if (userUtils.getMapSet("Home") !== null) {
                userUtils.setMapView(mymap, "Home");
            }
        },
        /**
         * Converts a line or polygon geometry to the projection
         * defined in the destprojcode variable (set in the *layerconfig.json)
         * @param {string} type Geometry type
         * @param {object} geom Geometry object
         * @returns {object} Geometry object
         * @function convertGeometryToDestProjection
         * @memberof mapUtils
         */
        convertGeometryToDestProjection: function (type, geom) {
            var coordInDest;
            if (type === 'Polygon') {
                // A polygon is an array of rings, the first ring is
                // the exterior ring, any others are the interior rings
                var ringArray = [];
                for (i = 0; i < geom.getCoordinates().length; i++) {
                    var ring = [];
                    for (j = 0; j < geom.getCoordinates()[i].length; j++) {
                        //Transform each vertex in destination projection
                        coordInDest = ol.proj.transform(geom.getCoordinates()[i][j], mymap.getView().getProjection(), ol.proj.get(destprojcode));
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
        /**
         * Creates the main map
         * @param {array} layers        The layer list as read from the *-layerconfig.json
         * @param {array} oslayers      The array of layer objects that will be added to the map
         * @param {array} infoOptions   The array of objects that will hold the idenfify fields
         *                              for each layer as defined in the *-layerconfig.json 
         * @param {array} infoTitle     The array of objects that will hold the label
         *                              for each layer as defined in the *-layerconfig.json
         * @param {object} searchFields Object containing the array of the search fields
         *                              for each layer as defined in the *-layerconfig.json
         * @param {string} projcode     The EPSG code in the form 'EPSG:<code> as defined in the *-layerconfig.json
         * @param {string} projdescr    The proj4js description as defined in the *-layerconfig.json
         * @param {string} mapextent    The mapextent as defined in the *-layerconfig.json
         * @param {object} identifyFields Object containing the array of the idnetify fields
         *                              for each layer as defined in the *-layerconfig.json
         * @function createMap
         * @memberof mapUtils
         */
        createMap: function (layers, oslayers, infoOptions, infoTitle, searchFields, projcode, projdescr, mapextent, identifyFields , xyzoomlevel) {
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
                    if (key === projcode) {
                        proj4.defs(
                            destprojcode,
                            val
                        );
                    }
                });
                $.each(projDef, function (key, val) {
                    if (key === destprojcode) {
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
            // TODO: FIXED(?) 8-Dec 2019. Set the extent but be VERY careful of the the values. For 3857 the extent in the
            // TODO: config-*.json needs to be "-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244"
            // TODO: which is not the same as what epsg.io reports.
            // TODO: In general, when setting the extent it must be the 'full' projection extent
            projection.setExtent(extent);

            // Setting the 'invisible' selection layer. This is used to highlight features
            // when using the identify or select by rectangle buttons
            var vectorSourceSel = new ol.source.Vector();
            // Read the settings for the selected style from Preferences
            preferences.createDialog(xyzoomlevel);
            // Create the selection layer
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
                    osmLayer = mapUtils.createOSMLayer(val);
                    oslayers.push(osmLayer);
                // Bing Maps
                } else if (val.type === "Bing" && typeof useGMap === "undefined") {
                    bingLayer = mapUtils.createBingLayer(val);
                    oslayers.push(bingLayer);
                // WMS Layers
                } else if (val.type === "WMS") {
                    var wmsUrl = '';
                    //let mapSettings = mapPortal.readConfig("map");
                    let mapSettings = cfg.map;
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
                            return false;
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
                    tmplyr.set('legendImg', val.legendImg); // this may be undefined. Used for WMS layers that the GetLegend request does not return a valid graphic
                    tmplyr.set("tag", [val.type, wmsUrl]);
                    if (typeof val.srid === "undefined") {
                        tmplyr.set("srid", projcode);
                    } else {
                        tmplyr.set("srid", val.srid);
                    }
                    tmplyr.set('feature_info_format', "GEOJSON");
                    tmplyr.set('identify_fields', val.identify_fields);
                    tmplyr.set('group', val.group); // this may be undefined
                    tmplyr.set('groupLegendImg', val.groupLegendImg); // this may be undefined
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
                            tmplyr.set('allow_edit_geom', val.allow_edit_geom);
                            tmplyr.set('edit_geomtype', val.edit_geomtype);
                            tmplyr.set('allowNoGeometry', (typeof val.allowNoGeometry === "undefined" || val.allowNoGeometry=== false) ? false : true );
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
                    //let mapSettings = mapPortal.readConfig("map");
                    let mapSettings = cfg.map;
                    mapserver = mapSettings.mapserver;
                    if (mapSettings.useWrappedMS !== "undefined" && mapSettings.useWrappedMS === true) {
                        wfsUrl = window.location.protocol + '//' + mapservUrl + '/' + val.mapfile.split('\\')[val.mapfile.split('\\').length - 1].split('.')[0];
                    } else {
                        wfsUrl = window.location.protocol + '//' + mapservUrl + '?map=' + val.mapfile;
                    }
                   
                    
                    if(val.clusterOptions) {
                        if (typeof projDef[val.projection] !== "undefined" && val.projection != "EPSG:4326" && val.projection != "EPSG:3857") {
                            proj4.defs(val.projection,projDef[val.projection]);
                        }
                          tmpvector = mapUtils.createVectorClusterLayer(val.mapfile, val.table_name, val.color, val.linewidth, val.fill, val.fillcolor, mapSettings.useWrappedMS , val);
                        
                          tmpvector.set('linkField', val.clusterOptions.linkField);  
                          tmpvector.set('bottomLink', val.clusterOptions.bottomLink); 
                          tmpvector.set('firstFieldMessage', val.clusterOptions.firstFieldMessage);   
                          tmpvector.set('cluster', true); 
                          if(val.clusterOptions.hasOwnProperty('openResults')) {
                            tmpvector.set('openResults', val.clusterOptions.openResults);
                            openResults = val.clusterOptions.openResults;
                          }
                          else {
                            openResults = true;
                          }
                          if(val.clusterOptions.hasOwnProperty('closeBbox')) {
                            tmpvector.set('closeBbox', val.clusterOptions.closeBbox);
                            closeBbox = val.clusterOptions.closeBbox;
                          }
                          
                    }
                    else
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
                    if (typeof val.allowHover !== "undefined") {
                        tmpvector.set('allowHover', val.allowHover);
                    } 
                    // else {
                    //     tmpvector.set('allowHover', false);
                    // }
                    if (typeof val.contextMenu !== "undefined") {
                        tmpvector.set('contextMenu', val.contextMenu);
                    }
                    tmpvector.setVisible(val.display_on_startup);
                    if (typeof val.exportable !== "undefined") {
                        tmpvector.set('exportable', val.exportable);
                    } else {
                        tmpvector.set('exportable', false);
                    }
                    if (typeof val.legendImg !== "undefined") {
                        tmpvector.set('legendImg', val.legendImg);
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
                    if (typeof val.edit_pk !== "undefined") {
                        tmpvector.set('edit_pk', val.edit_pk);
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
                            // tmpvector.set('edit_pk', val.edit_pk);
                            tmpvector.set('edit_geomcol', val.edit_geomcol);
                            tmpvector.set('allow_edit_geom', val.allow_edit_geom);
                            tmpvector.set('edit_geomtype', val.edit_geomtype);
                            tmpvector.set('allowNoGeometry', (typeof val.allowNoGeometry === "undefined" || val.allowNoGeometry=== false) ? false : true );
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
                        groups[grp].push(tmpvector);
                    } else {
                        oslayers.push(tmpvector);
                    }
                } else if (val.type === "ESRIRESTTILE") {
                    var esriurl = val.url;
                    var esriname = val.name;
                    var lbl = val.label;
                    var srid = val.srid;
                    var group = val.group;
                    var queryable = val.queryable;
                    var arcgislayer = esriUtils.createEsriRestTile(esriname, esriurl, lbl, srid, group, queryable);
                    arcgislayer.setVisible(val.display_on_startup);
                    oslayers.push(arcgislayer);
                } else if (val.type === "GEOIMAGES") {

                    var marker = new ol.Feature({
                        geometry: new ol.geom.Point(
                            [2560701, 4955425]
                        )
                    });
                    var style = mapUtils.setDefaultFeatureStyle;
                    marker.setStyle(style);

                    var vectorSource = new ol.source.Vector({
                        features: [marker]
                    });

                    var markerVectorLayer = new ol.layer.Vector({
                        source: vectorSource
                    });

                    markerVectorLayer.set('label', val.label);
                    markerVectorLayer.set('name', val.name);
                    markerVectorLayer.set('url_folder', val.url_folder);

                    oslayers.push(markerVectorLayer);
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

            mapUtils.createNavToolbar();

            return mymap;
        },
        createOSMLayer: function (lyrConfig) {
            let url = "http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png";
            if (typeof lyrConfig.url !== "undefined" && lyrConfig.url.trim() !== "") {
                url = lyrConfig.url;
            }
            //if you could attributions attribute it adds automatically an osm attribution but it doesn't open in new page
            var osm =
                new ol.layer.Tile({
                    source: new ol.source.OSM({
                        attributions: ['<a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
                        'contributors.'],
                        crossOrigin: 'anonymous',
                        url: url
                    })
                });
            osm.set('name', lyrConfig.name);
            osm.set('label', lyrConfig.label);
            osm.set('tag', [lyrConfig.type, '']);
            osm.set('group', lyrConfig.group); // this maybe undefined
            osm.setVisible(lyrConfig.display_on_startup);
            return osm;
        },
        createBingLayer: function (lyrConfig) {
            var bing =
                new ol.layer.Tile({
                    visible: false,
                    preload: Infinity,
                    source: new ol.source.BingMaps({
                        key: lyrConfig.bing_key,
                        imagerySet: lyrConfig.bing_style,
                        // use maxZoom 19 to see stretched tiles instead of the BingMaps
                        // "no photos at this zoom level" tiles
                        maxZoom: 19
                    })
                });
            bing.set('name', lyrConfig.name);
            bing.set('label', lyrConfig.label);
            bing.set('tag', [lyrConfig.type, '']);
            bing.set('group', lyrConfig.group); // this maybe undefined
            bing.setVisible(lyrConfig.display_on_startup);
            return bing;
        },
        /**
         * Creates the HTML for navigation toolbar, appends it to the zoomTools div 
         * and set the titles for each button
         */
        createNavToolbar: function () {
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
        },
        initContextMenu: function () {
            mymap.getLayers().forEach(function (layer, i) {
                
                if (typeof layer.get("contextMenu") !== "undefined" && layer.get("visible")==true && !!layer.get("cluster") == false )  {
                    
                    var contextmenu = new ContextMenu({
                        width: 170,
                        defaultItems: false, // defaultItems are (for now) Zoom In/Zoom Out
                        items: []
                    });
                    contextmenu.on('beforeopen', function (evt) {
                        
                        contextmenu.close();
                        var feature = mymap.forEachFeatureAtPixel(evt.pixel, function (ft, l) {
                            return ft;
                        });

                        let found=false;
                        if (feature) { // open only on features
                            
                             layer.getSource().getFeatures().forEach(function(feat){ if(feat === feature) {

                                
                                    found=true;        
                             } } )
                            
                            if(found)
                            {
                                
                                contextmenu.enable();
                                contextmenu.clear();
                                contextmenu.extend(layer.get("contextMenu"));                             
                                mymap.addControl(contextmenu);
                            }
                            else {
                                contextmenu.disable();
                            }
                        } else {
                            contextmenu.disable();
                        }
                    });
                    mymap.addControl(contextmenu);
                }
            });
        },
        /**
         * Create a vector layer for clusters if clusterOptions is set
         * @function createVectorClusterLayer
         *  * @param {string} mapfile The mapfile to use in the WFS request
         * @param {string} table_name The table name in the WFS request
         * @param {string} color Color to draw the layer in
         * @param {integer} linewidth Line width to draw the layer in
         * @param {boolean} hasfill If the style will be filled. If false or undefined layer will be drawn with a transparent fill
         * @param {string} fillcolor Fill color
         * @param {boolean} iswrapped If the mapserver to use has been setup with a reverse proxy and does not include the path to the mapfile
         *                            i.e. instead of http://...?map=<path_to_mapfile> it is http://../<mapfile>
         * @param {string} layerConfig layerConfig
         * @memberof mapUtils 
         */
        createVectorClusterLayer:  function (mapfile, table_name, color, linewidth, hasfill, fillcolor, iswrapped, layerConfig) {
            let url_loader;

            var wfsurl = '';
            

            // Animated cluster layer
            clusterLayer2 = new ol.layer.AnimatedCluster({
                

                source: new ol.source.Cluster({
                    distance: 40,
                    // source: new ol.source.Vector()
                    source:  new ol.source.Vector({
                        
                        
                        url: function (x) {
                            let mappath = '';
                            
                            if( typeof layerConfig.clusterOptions.service_url == "undefined" )
                            {
                                if (iswrapped !== "undefined" && iswrapped === true) {
                                    mappath = '/' + mapfile.split('\\')[mapfile.split('\\').length - 1].split('.')[0];
                                } else {
                                    mappath = '?map=' + mapfile;
                                }
                                if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                    wfsurl = window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                    'bbox=' + x.join(',')  + mymap.getView().getProjection().getCode();
                                } else {
                                    wfsurl = window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                    'bbox=' + x.join(',')  + mymap.getView().getProjection().getCode();
                                }
                                //proxyUrl +
                                url_loader = wfsurl;
                                return url_loader;
                            }
                            else {
                                url_loader = layerConfig.clusterOptions.service_url;
                                return url_loader;
                            }
                        },
                        

                        // url: layerConfig.service_url,
                         // url: clusterLayer2.getSource().getSource().getUrl()(x),
                        
                        loader: function (x) {
                            
                            // if(clusterLayer2.getSource().getSource().getUrl()(x)) 
                            {
                                
                                $.ajax({
                                    url:  clusterLayer2.getSource().getSource().getUrl()(x),
                                    type: "get",
                                    async: typeof layerConfig.clusterOptions.async == "undefined" || layerConfig.clusterOptions.async == true ? true : false,
                                    
                                    // cache: true,
                                    dataType: 'json',
                                    contentType: "application/x-www-form-urlencoded; charset=utf-8",
                                   
                                    success: function (data) {
                                        if (data.features.length === 0) {
                                            return null;
                                        }
                                        // Add the layer name in the returned data so we know which layer
                                       
                                        // Populate the edit layer
                                       
                                        let geojson = new ol.format.GeoJSON({
                                            // defaultDataProjection: projcode,
                                            // featureProjection: destprojcode
                                            defaultDataProjection: typeof layerConfig.clusterOptions.service_url != "undefined" ? layerConfig.projection: destprojcode,//has to be EPSG:2100
                                            featureProjection: destprojcode
                                        });                                
                                        let feats =  geojson.readFeatures(data) ;
                                        
                                        feats.forEach(function (f) {
                                           //it checks if id is set in addFeature , if they exist they are not loaded again
    
                                        
                                            {
                                                //every other geojson layer
                                                if(legendUtilities.getLayerByName(layerConfig.name).get("edit_pk") !== undefined) {
                                                    f.setId( f.getProperties()[legendUtilities.getLayerByName(layerConfig.name).get("edit_pk")]);
                                                }
                                                clusterLayer2.getSource().getSource().addFeature(f);
                                            }
                                        });
                                        
                                    },
                                    complete: function (response) {
                                    },
                                    error: function (jqXHR, textStatus, errorThrown) {
                                        console.log("WFS BBOX Vector Layer request error: " + textStatus + "/ error "+errorThrown + "/ " );
                                    },
                                    failure: function (jqXHR, _textStatus, errorThrown) {
                                        console.log("WFS BBOX Vector Layer request failure: " + _textStatus );
                                    }
                                }); 
                            }
                        },
                        // strategy: typeof layerConfig.clusterOptions.async == "undefined" || layerConfig.clusterOptions.async == true ? ol.loadingstrategy.bbox : ol.loadingstrategy.all,
                        strategy: ol.loadingstrategy.all,
                                                
                        // strategy: function(x) {  
                           
                        //         var bbox = x.join(',');
                        //         if (bbox != this.get('bbox')) {
                        //             this.set('bbox', bbox);
                        //             clusterLayer2.getSource().refresh();   //reloads the features, Checks for ID in loader!! 
                        //         }
                        //         return [x];
                        // },
                        
                         crossOrigin: 'anonymous'
                    
                    
                    
                    })
                    
                }),
                
                animationDuration: 700,
                
                // animationMethod:  ol.easing.easeOut,
                
                // // Cluster style
                  style: mapUtils.clusterStyle
            
            });
            
            
            return clusterLayer2;
        }
        ,
        /**
         * Creates a vector layer in GeoJSON format and returns a ol.layer.Vector object
         * @param {string} mapfile The mapfile to use in the WFS request
         * @param {string} table_name The table name in the WFS request
         * @param {string} color Color to draw the layer in
         * @param {integer} linewidth Line width to draw the layer in
         * @param {boolean} hasfill If the style will be filled. If false or undefined layer will be drawn with a transparent fill
         * @param {string} fillcolor Fill color
         * @param {boolean} iswrapped If the mapserver to use has been setup with a reverse proxy and does not include the path to the mapfile
         *                            i.e. instead of http://...?map=<path_to_mapfile> it is http://../<mapfile>
         * @param {string} wfs_url If this is defined then it will be used for the WFS request ignoring the mapfile, table_name and iswrapped parameters
         */
        createVectorJsonLayer: function (mapfile, table_name, color, linewidth, hasfill, fillcolor, iswrapped, wfs_url) {
            var wfsurl = '';
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
                        if (typeof wfs_url === "undefined") {
                            let mappath = '';
                            if (iswrapped !== "undefined" && iswrapped === true) {
                                mappath = '/' + mapfile.split('\\')[mapfile.split('\\').length - 1].split('.')[0];
                            } else {
                                mappath = '?map=' + mapfile;
                            }
                            if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                wfsurl = window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                'bbox=' + x.join(',')  + mymap.getView().getProjection().getCode();
                            } else {
                                wfsurl = proxyUrl + window.location.protocol + '//' + $('#hidMS').val() + mappath + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:' + table_name + '&outputFormat=geojson&' +
                                'bbox=' + x.join(',')  + mymap.getView().getProjection().getCode();
                            }
                        } else {
                            wfs_url = wfsurl;
                        }
                        return wfsurl;
                    },
                    loader: function (x) {
                        console.log("loader",geoJsonLayer.getSource().getUrl()(x))
                        if(geoJsonLayer.getSource().getUrl()(x)) {

                            $.ajax({
                                url: geoJsonLayer.getSource().getUrl()(x),
                                async: true,
                                dataType: 'json',
                                
                                success: function (data) {
                                    if (data.features.length === 0) {
                                        return null;
                                    }
                                    // Add the layer name in the returned data so we know which layer
                                    
                                    // Populate the edit layer
                                    var geojson = new ol.format.GeoJSON();                                
                                    let feats =  geojson.readFeatures(data) ;
                                    
                                    feats.forEach(function (f) {
                                       //it checks if id is set in addFeature , if they exist they are not loaded again

                                        //editMode landify
                                        if( (typeof editLayer !=="undefined") && (legendUtilities.getLayerByName(data.name).get("editable")==true) )
                                        {
                                            if(data.name +"_EDIT" === editLayer.get("name"))
                                            {
                                                f.setId( f.getProperties()[editLayer.get("edit_pk")]);
                                                editLayer.getSource().addFeature(f);
                                            } 
                                            else {
                                                if(legendUtilities.getLayerByName(data.name).get("edit_pk") !== undefined) {
                                                    f.setId( f.getProperties()[legendUtilities.getLayerByName(data.name).get("edit_pk")]);
                                                }
                                                legendUtilities.getLayerByName(data.name + "_SNAPPING_EDIT").getSource().addFeature(f);
                                            }
                                        }
                                        else {
                                            //every other geojson layer
                                            if(data.hasOwnProperty('name')) {
                                                if(legendUtilities.getLayerByName(data.name).get("edit_pk") !== undefined) {
                                                    f.setId( f.getProperties()[legendUtilities.getLayerByName(data.name).get("edit_pk")]);
                                                }
                                                legendUtilities.getLayerByName(data.name).getSource().addFeature(f);
                                            }
                                            else {
                                                if(legendUtilities.getLayerByName(table_name).get("edit_pk") !== undefined) {
                                                    f.setId( f.getProperties()[legendUtilities.getLayerByName(table_name).get("edit_pk")]);
                                                }
                                                legendUtilities.getLayerByName(table_name).getSource().addFeature(f);
                                            }
                                        }
                                    });
                                    
                                },
                                complete: function (response) {
                                },
                                error: function (jqXHR, textStatus, errorThrown) {
                                    console.log("WFS BBOX Vector Layer request error: " + textStatus + "/ error "+errorThrown + "/ " );
                                },
                                failure: function (jqXHR, _textStatus, errorThrown) {
                                    console.log("WFS BBOX Vector Layer request failure: " + _textStatus );
                                }
                            }); 
                        }
                    },
                    strategy: function(x) {  
                        var bbox = x.join(',');
                        if (bbox != this.get('bbox')) {
                            this.set('bbox', bbox);
                            geoJsonLayer.getSource().refresh();   //reloads the features, Checks for ID in loader!! 
                        }
                        return [x];
                    },
                    crossOrigin: 'anonymous'
                }),
                minResolution: 0,
                maxResolution: 500, // 500 resolution will display vector layers at a scale of 1: 2,500,000
                style: new ol.style.Style({
                    fill: fill,
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
                //mapUtils.selectCluster();
                //  $map.on('singleclick', mapUtils.mapClickEvent);

                if(!openResults)
                    mapUtils.selectCluster();
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
                
                if (interaction instanceof ol.interaction.Select && (interaction instanceof ol.interaction.SelectCluster)) {    
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
            // map.un('singleclick', mapUtils.mapClickEvent);

            mapUtils.selectCluster();
            
        },
        createAndAddInteractions: function (infoOptions, infoTitle, map, searchFieldsList, identifyFields) {
            var $mymapFI = map;

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

            // interaction for Georeferenced Photos layer
            //$mymapFI.on('pointermove', mapUtils.mapMouseHoverEvent);
            mapUtils.mapMouseHoverEvent();
            $mymapFI.on('singleclick', mapUtils.mapClickEvent);
            //Set select interaction for identify
            mapUtils.setIdentifySelectInteraction();
            //Create the select by rectangle tool
            if(!closeBbox)
                mapUtils.selByRectangleTool();

            mapUtils.selectCluster();
        },
        /**
         * @function selectCluster
         * Select interaction for cluster layers
         * @memberof mapUtils 
         */
        selectCluster: function() {
            // Style for selection
            var img = new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                color:"rgba(0,255,255,1)", 
                width:1 
                }),
                fill: new ol.style.Fill({
                color:"rgba(0,255,255,0.3)"
                })
            });
            var style0 = new ol.style.Style({
                image: img
              });
            var style1 = new ol.style.Style({
            image: img,
            // Draw a link beetween points (or not)
            stroke: new ol.style.Stroke({
                color:"#fff", 
                width:1 
            }) 
            });
            // Select interaction to spread cluster out and select features
            
            var selectCluster = new ol.interaction.SelectCluster({
                // Point radius: to calculate distance between the features
                pointRadius:20,
                animate: true,
                // Feature style when it springs apart
                featureStyle: function(){
                return [ style1 ]
                },
                filter: function(feature, layer){
                   
                    if(layer!=null) {
                        if (layer.get('cluster') != undefined )
                      
                        return true;
                    }
                    else {
                        if( feature.getProperties()["features"]!=null)
                            return true;
                        else return false;
                    }
                    
                },
                // selectCluster: false,	// disable cluster selection
                // Style to draw cluster when selected
                style: function(f,res){
                    var cluster = f.get('features');
                    
                    if (cluster.length>1){
                        var s = mapUtils.clusterStyle(f,res) ;
                        return s;
                    } else if ( f.getProperties().selectclusterfeature == true ){
                        return [
                            new ol.style.Style({
                            image: new ol.style.Circle ({
                                stroke: new ol.style.Stroke({ color: "rgba(0,0,192,0.5)", width:2 }),
                                fill: new ol.style.Fill({ color: "rgba(0,0,192,0.3)" }),
                                radius:5
                            })
                            })
                        ];
                    }
                    else {
                        var s = mapUtils.clusterStyle(f,res) ;
                        return s;
                    }
                }
            });
            mymap.addInteraction(selectCluster);
            
            //context menu
            
            mymap.getLayers().forEach(function (layer, i) {
                
                if (layer.get("cluster") == true) {
                     var contextmenu = new ContextMenu({
                        width: 170,
                        defaultItems: false, // defaultItems are (for now) Zoom In/Zoom Out
                        items: [],
                        eventType: "click"

                    });

                    let linkField = layer.get('linkField');
                    let bottomLink = layer.get('bottomLink');
                    let firstFieldMessage = layer.get('firstFieldMessage');
                    // selectCluster.getFeatures().on(['remove'], function (e){});
                        
                    mymap.addControl(contextmenu);
                    contextmenu.disable();
                    //event for features in feature of cluster
                    // On selected => get feature in cluster and show info
                    // selectCluster.getFeatures().on(['add'], function (e){
                        
                        
                    //     var c = e.element.get('features');
                    //     var clusterFeatItems= [];
                    //     if (c.length==1){
                    //         var feature2 = c[c.length-1];
                    //     }
                    // });

                    //event for single clusters
                    contextmenu.on('beforeopen', function (evt) {
                        contextmenu.close();
                        var feature = mymap.forEachFeatureAtPixel(evt.pixel, function (ft, l) {
                            return ft;
                        });
                        let found=false;
                        

                        
                        if (feature) { // open only on features
                             layer.getSource().getFeatures().forEach(function(feat){ if(feat === feature) {
                                found=true; 
                              
                             } } )
                            
                            
                             //if is a main cluster(found) OR is a feature in a main cluster 
                            if(found || (!found && feature.getProperties().selectclusterfeature == true))
                            {
                                var clusterFeatItems= [];
                                if(feature.getProperties().features.length == 1)
                                {
                                    let featProps= feature.getProperties().features[0].getProperties();

                                    let identifyFldNames=[];
                                    let identifyFldLabels=[];
                                    if(layer.get("identify_fields") != undefined) {
                                        var identifyFlds = layer.get("identify_fields").split(',');
                                        identifyFlds.forEach( function (fld) {identifyFldNames.push(fld.split(':')[0]); identifyFldLabels.push(fld.split(':')[1]); });
                                    }
                                    let message = {
                                        Cmd:"selectId",
                                        value: {}
                                           
                                        
                                    };
                                    for (i=0;i<identifyFldNames.length;i++){

                                        message['value'][identifyFldNames[i]] = featProps[identifyFldNames[i]];
                                    }
                                    
                                    let fldNames=[];
                                    let fldLabels=[];
                                    if(layer.get("search_fields") != undefined) {
                                        var searchFlds = layer.get("search_fields").split(',');
                                        searchFlds.forEach( function (fld) {fldNames.push(fld.split(':')[0]); fldLabels.push(fld.split(':')[1]); });
                                        //console.log(searchFlds);
                                        //context menu
                                    }

                                    for (i=0;i<fldNames.length;i++)
                                    {
                                        
                                        // clusterFeatItems.push({text: fldLabels[i] + " : " + featProps[fldNames[i]]});

                                        if(i==0) {
                                    
                                            messageString = JSON.stringify(message);
                                            if(!!firstFieldMessage)
                                                clusterFeatItems.push({text: fldLabels[i] + " : " + "<a href='#'  onclick='mapUtils.selectClusterFromId("+messageString +");'</a> " +featProps[fldNames[i]]+"</a>" }); 
                                            else
                                                clusterFeatItems.push({text: fldLabels[i] + " : " + featProps[fldNames[i]]});
                                            // clusterFeatItems.push({text: fldLabels[i] + " : " + "<a href='#'  (click)="+window.parent.postMessage( JSON.stringify(message), "*") +">"+feature2.getProperties()[fldNames[i]]+"</a>"});
                                        }
                                        else
                                            clusterFeatItems.push({text: fldLabels[i] + " : " + featProps[fldNames[i]]});
                                    }
                                    
                                    
                                    if(featProps.hasOwnProperty(linkField) && featProps[linkField] != null && identifyFldNames.length >0) {
                                        for (i=0;i< featProps[linkField].length;i++)
                                        {
                                            let messageLink = {
                                                Cmd:"linkId",
                                                value: {}
                                            };
                                            messageLink['value']['file'] = featProps[linkField][i];

                                            for (j=0;j<identifyFldNames.length;j++){

                                                messageLink['value'][identifyFldNames[j]] = featProps[identifyFldNames[j]];
                                            }
                                            
                                            messageLinkString = JSON.stringify(messageLink);
                                            
                                            if(featProps[linkField] != null )
                                                clusterFeatItems.push({text:  "<a href='#'  onclick='mapUtils.selectClusterFromId("+messageLinkString  +");'</a> " +featProps[linkField][i]['text']+"</a>" });   

                                          
                                        }
                                    }
                                      
                                    let messageLink2 = {
                                        Cmd:"bottomLink",
                                        value: {}
                                    };
                                    
                                    if(identifyFldNames.length >0) {
                                        for (i=0;i<identifyFldNames.length;i++){

                                            messageLink2['value'][identifyFldNames[i]] = featProps[identifyFldNames[i]];
                                        }
                                    }
                                        
                                    messageLinkString2 = JSON.stringify(messageLink2);
                                    
                                    if(bottomLink != null  && identifyFldNames.length >0)
                                        clusterFeatItems.push({text:  "<a href='#'  onclick='mapUtils.selectClusterFromId("+messageLinkString2  +");'</a> " +bottomLink+"</a>" });   
                                    
                                        contextmenu.enable();
                                        contextmenu.clear();
                                        contextmenu.extend(clusterFeatItems);  
                                    //clusterFeatItems= [{text: feature.getProperties().features[0].getProperties().permit_no}];
                                }
                                else if(feature.getProperties().features.length > 1)
                                {
                                    contextmenu.disable();
                                    // clusterFeatItems= [{text: feature.getProperties().features.length + " features"}];
                                    // contextmenu.enable();
                                    // contextmenu.clear();
                                    // contextmenu.extend(clusterFeatItems);  
                                    
                                }
                                
                                 
                                     
                           
                            }
                            
                        } else {
                            contextmenu.disable();
                         
                        }
                    });
                   
                }
            });

        }
        ,
        /**
         * @function selectClusterFromId
         * Sends message of feature in parent. for use in iframe and clusters if firstfield is message
         * @memberof mapUtils 
         */
        selectClusterFromId: function(message) {
            
            window.parent.postMessage( JSON.stringify(message), "*") ;
        }
        ,
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
                                    // Add the layer name in the returned data so we know which layer
                                    // it came from. It will be used in the spatial query dialog
                                    //TODO: This doesnt work for vector layers and it goes into an endless loop for some reason
                                    try {
                                        feature.properties._layername = layer.get('name');
                                        selFeatures.push(feature);
                                        selFeaturesArray.push(feature);
                                    } catch (error) {
                                        
                                    }
                                    
                                }
                            });
                        }
                        if (selFeatures && selFeatures.getLength() > 0) {
                            //Vector layer- not the pin layer
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
                            } else if (layer instanceof ol.layer.Tile || layer instanceof ol.layer.Image || layer instanceof ol.layer.TileLayer) {
                                if ((layer.getSource() instanceof ol.source.ImageWMS) || (layer.getSource() instanceof ol.source.TileWMS)) {
                                    //WMS only supports point queries, so check if we can do a wfs request instead
                                    var supportsWFS = false;
                                    var capabilitiesUrl;
                                    if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                        capabilitiesUrl = layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities";
                                    } else {
                                        capabilitiesUrl = proxyUrl + layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities";
                                    }
                                    //TODO: Extent should be in the layer srid and not the map's. Otherwise it won't return any records

                                    var intersectsUrl;
                                    if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                        intersectsUrl = layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0& &REQUEST=GetFeature&TYPENAME=" +
                                            layer.get("name") + "&BBOX=" + extent[0] + "," + extent[1] + ", " + extent[2] + "," + extent[3] + "," + mymap.getView().getProjection().getCode() + "&OUTPUTFORMAT=" + layer.get("feature_info_format");

                                    } else {
                                        intersectsUrl = proxyUrl + layer.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0& &REQUEST=GetFeature&TYPENAME=" +
                                            layer.get("name") + "&BBOX=" + extent[0] + "," + extent[1] + ", " + extent[2] + "," + extent[3] + "," + mymap.getView().getProjection().getCode() + "&OUTPUTFORMAT=" + layer.get("feature_info_format");
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
                                            // Add the layer name in the returned data so we know which layer
                                            // it came from. It will be used in the spatial query dialog
                                            data.features.forEach(function (f) {
                                                f.properties._layername = layer.get('name');
                                            });
                                            var selLyr = legendUtilities.getLayerByName("selection");
                                            if (typeof searchFields !== "undefined" && typeof identifyFields !== "undefined" && searchFields.length > 0 && identifyFields.length > 0) {
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
                                } else if (layer.getSource() instanceof ol.source.TileArcGISRest) {
                                    var intersectsUrl;

                                    let esriUrl = layer.get("tag")[1] + '/identify?';
                                    esriUrl = esriUrl + '&geometryType=esriGeometryEnvelope&';
                                    esriUrl = esriUrl + 'geometry=' + extent[0] + "," + extent[1] + ", " + extent[2] + "," + extent[3]
                                    esriUrl = esriUrl + 'sr=&layers=&layerDefs=&time=&layerTimeOptions=&tolerance=10&';
                                    let viewExtent = mymap.getView().calculateExtent();
                                    esriUrl = esriUrl + 'mapExtent=' + viewExtent[0] + ',' + viewExtent[1] + ',' + viewExtent[2] + ',' + viewExtent[3] + '&';
                                    let mapSize = mymap.getSize();
                                    esriUrl = esriUrl + 'imageDisplay=' + mapSize[0] + ',' + mapSize[1] + ',' + mymap.getView().getResolution() + '&';
                                    esriUrl = esriUrl + 'returnGeometry=true&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson';
                                    console.log(esriUrl);
                                    $.ajax({
                                        url: esriUrl,
                                        async: true,
                                        dataType: 'json',
                                        beforeSend: function () {
                                            $(".wait").show();
                                        },
                                        success: function (data) {
                                            if (data.results.length === 0) {
                                                return null;
                                            }
                                            var selLyr = legendUtilities.getLayerByName("selection");
                                            var geoJsonFeatures = esriUtils.esriFeaturesToGeoJson(data);
                                            searchUtilities.renderQueryResultsAsTable(geoJsonFeatures, layer.get('label'), layer.get('name'), [], []);
                                            //Always show the first tab as active
                                            $('#searchResultsUl a').first().tab('show');
                                            // Populate the selection layer
                                            var geojson = new ol.format.GeoJSON();
                                            selLyr.getSource().addFeatures(geojson.readFeatures(geoJsonFeatures));
                                        },
                                        complete: function (response) {
                                            $(".wait").hide();
                                        },
                                        error: function (jqXHR, textStatus, errorThrown) {
                                            console.log("WMS BBOX request error: " + esriUrl + "\n" + jqXHR.responseText);
                                            //console.log(mapUtils.xmlToJson(jqXHR.responseText));
                                        },
                                        failure: function (jqXHR, _textStatus, errorThrown) {
                                            console.log("WMS BBOX request failure: " + esriUrl + "\n" + jqXHR.responseText);
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
                    if ($("#info1").hasClass("active") && !layer.get('cluster')) {
                     
                        return true;
                    } else {
                        return false;
                    }
                }
            });
            $mymap.addInteraction(selectIntrAct);
        },

        // The main map click event
        // If a pin is found, then it will display a window with the pin coordinates
        // Otherwise, it will do a WMS request to get the FeatureInfo for each visible and
        // selectable layer in the map
        mapClickEvent: function (evt) {
            var $map = $('#mapid').data('map');
            var coordinate;
            // var element;
            var cpElement;
            var featItem;
            

            var cppopup = new ol.Overlay({
                element: document.getElementById('cpPopup'),
                positioning: 'center-center',
                autopan: true,
                stopEvent: true
            });

            // Clear any selections
            var selLyr = searchUtilities.getSelectionLayer($map);
            
            $map.addOverlay(cppopup);
            
            $(element).popover('destroy');
            $(cpElement).popover('destroy');
            
            var fGeoJSON = new ol.format.GeoJSON();
            var popTemplate = '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>';

            //Loop once through layers without the need for the active identify tool
            var pinItem = null;
            var editPinItem = null;
            $map.getLayers().forEach(function (layer) {
                 
                if (layer.get('name') === 'pinLayer' && layer.getSource().getFeatures().length > 0) {
                    pinItem = mapUtils.getClickResults($map, layer, evt);
                }

            });
            if (pinItem !== null && pinItem.length > 0) {
                
                setTimeout(function () {
                    var popup = new ol.Overlay({
                        element: document.getElementById('popup'),
                        positioning: 'center-center',
                        autopan: true,
                        stopEvent: true,
                        offset: [0, -23]
                    });
                    $map.addOverlay(popup);
                    element = popup.getElement();
                    
                    
                    var coordinates = pinItem[0].getGeometry().getCoordinates();
                    popup.setPosition(coordinates);
                    coordinate = evt.coordinate;
                
                    popup.setPosition(coordinate);
                    $(element).popover({
                        placement: 'top',
                        html: true,
                        template: popTemplate,
                        content: '<div class="row"><div class="col-lg-12">' +
                            '<label id="popuplabel">Χ: ' + Number(pinItem[0].get('xcoor')).toFixed(3) + '&nbsp;Υ: ' + Number(pinItem[0].get('ycoor')).toFixed(3) + '</label>' +
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
            if (pinItem !== null ) {

                
                // $(element).popover('destroy');
                return;
            }
            
            
            $map.getLayers().forEach(function (layer) {
               
                if ( !(layer instanceof ol.layer.AnimatedCluster) && (layer instanceof ol.layer.Vector) && layer.get('name') !== 'OSM' && layer.get('name') !== 'selection' && layer.get('name') !== 'pinlayer' && layer.getVisible() && layer.get("queryable") && $('#info1').hasClass('active') && layer.get('name') !== 'measure_layer') {
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
                }
                else if((layer.get('cluster') == true )&& $('#info1').hasClass('active'))
                {
                    if(openResults) {
                            let featItems = [];
                            let feature = mymap.forEachFeatureAtPixel(evt.pixel,
                                function (feature, lyr) {
                                    if(lyr != null) { //hover for editpin doesn't have a layer
                                        if (lyr.get("name") === layer.get("name")) {
                                            let clusterElems = feature.getProperties()["features"];

                                            clusterElems.forEach(x =>  featItems.push(x));
                                        
                                        }
                                    }
                                }
                            );

                            if (featItems) {
                                
                                //Vector layer- not the pin layer
                                var arrSearch_fields = [];
                                var arrIdentify_fields = [];
                                if (typeof layer.get('search_fields') === "string" && typeof layer.get('search_fields') !== "undefined" && layer.get('search_fields') !== "") {
                                    arrSearch_fields = layer.get('search_fields').split(',');
                                }
                                if (typeof layer.get('identify_fields') === "string" && typeof layer.get('identify_fields') !== "undefined" && layer.get('identify_fields') !== "") {
                                    arrIdentify_fields = layer.get('identify_fields').split(',');
                                }
                                searchUtilities.renderQueryResultsAsTable(fGeoJSON.writeFeaturesObject(featItems), layer.get('label'), layer.get('name'), arrSearch_fields, arrIdentify_fields);
                                $('#searchResultsUl a').first().tab('show');
                            }
                    }
                }
                else { // Not vector layer
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
                                            // Add the layer name in the returned data so we know which layer
                                            // it came from. It will be used in the spatial query dialog
                                            data.features.forEach(function (f) {
                                                f.properties._layername = layer.get('name');
                                            });
                                            var selLyr = legendUtilities.getLayerByName("selection");
                                            var arrSearch_fields = [];
                                            var arrIdentify_fields = [];
                                            if (typeof layer.get('search_fields') === "string" && typeof layer.get('search_fields') !== "undefined" && layer.get('search_fields') !== "") {
                                                arrSearch_fields = layer.get('search_fields').split(',');
                                            }
                                            if (typeof layer.get('identify_fields') === "string" && typeof layer.get('identify_fields') !== "undefined" && layer.get('identify_fields') !== "") {
                                                arrIdentify_fields = layer.get('identify_fields').split(',');
                                            }
                                            var allFeatures = new ol.format.WMSGetFeatureInfo().readFeatures(data);
                                            searchUtilities.renderQueryResultsAsTable(data, layer.get('label'), layer.get('name'), arrSearch_fields, arrIdentify_fields);
                                            if (data.features.length > 0) {
                                                // TODO: Get all features not just the first
                                                let geom = JSON.stringify(data.features[0].geometry.coordinates);
                                                let geomtype = data.features[0].geometry.type;
                                                // In case we have a container app, post the geometry to the container
                                                // (used in the OTS interface)
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
                            } else if (layer.getSource() instanceof ol.source.TileArcGISRest) {
                                //http://gis.epoleodomia.gov.gr/arcgis/rest/services/Rimotomika_Sxedia_Poleod_Meletes/XriseisGis_Individual/MapServer/identify?
                                //geometry=407010%2C4502632&
                                //geometryType=esriGeometryPoint&sr=&layers=&layerDefs=&time=&layerTimeOptions=&tolerance=10&
                                //mapExtent=407244.7333778764%2C4502115.330202447%2C407985.33166683203%2C4502855.928491402&
                                //imageDisplay=600%2C550%2C96&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson
                                //console.log('ESRI tile');

                                let esriUrl = layer.get("tag")[1] + '/identify?geometry=';
                                esriUrl = esriUrl + evt.coordinate[0] + ',' + evt.coordinate[1] + '&geometryType=esriGeometryPoint&sr=&layers=&layerDefs=&time=&layerTimeOptions=&tolerance=10&';
                                let viewExtent = mymap.getView().calculateExtent();
                                esriUrl = esriUrl + 'mapExtent=' + viewExtent[0] + ',' + viewExtent[1] + ',' + viewExtent[2] + ',' + viewExtent[3] + '&';
                                let mapSize = mymap.getSize();
                                esriUrl = esriUrl + 'imageDisplay=' + mapSize[0] + ',' + mapSize[1] + ',' + mymap.getView().getResolution() + '&';
                                esriUrl = esriUrl + 'returnGeometry=true&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson';
                                console.log(esriUrl);
                                $.ajax({
                                    url: esriUrl,
                                    async: false,
                                    dataType: 'json',
                                    success: function (data) {
                                        console.log(data);
                                        if (data.results.length === 0) {
                                            return null;
                                        }
                                        // Add the layer name in the returned data so we know which layer
                                        // it came from. It will be used in the spatial query dialog
                                        // data.results.forEach(function (ef) {
                                        //     //ef._layername = layer.get('name');
                                        //     var esriGeom = ef.geometry;
                                        //     let geoJsonFeat = esriUtils.esriFeatureToGcFeature(ef);
                                        //     console.log(geoJsonFeat);
                                        // });
                                        var geoJsonFeatures = esriUtils.esriFeaturesToGeoJson(data);
                                        var selLyr = legendUtilities.getLayerByName("selection");
                                        var arrSearch_fields = [];
                                        var arrIdentify_fields = [];
                                        searchUtilities.renderQueryResultsAsTable(geoJsonFeatures, layer.get('label'), layer.get('name'), arrSearch_fields, arrIdentify_fields);
                                        //Always show the first tab as active
                                        $('#searchResultsUl a').first().tab('show');
                                        // Populate the selection layer
                                        var geojson = new ol.format.GeoJSON();

                                        selLyr.getSource().addFeatures(geojson.readFeatures(geoJsonFeatures));
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
            });
        },
        mapMouseHoverEvent: function () {
            var hasHover=false;
            mymap.getLayers().forEach(function (layer, i) {
                if (typeof layer.get("allowHover") !== "undefined") {
                    hasHover=true;
                }
            });
            if (!hasHover) {
                $('#divShowMaptips').hide();
                return false;
            } else {
                $('#divShowMaptips').show();
                // Create the hover switch
                $('#chkShowMaptips').bootstrapToggle({
                    on: $.i18n._('_YES'),
                    off: $.i18n._('_NO')
                });
                $('#lblShowMaptips').html($.i18n._('_SHOWMAPTIPS'));
            }
            var hover = new ol.interaction.Hover({
                cursor: "help",
                // layerFilter : function(filterlayer) {
                   
                //     if(filterlayer != null) {
                //         if(filterlayer.getProperties().name != "editPinLayer")
                //             return true
                //         else return false;
                //     }
                //     else return false;
                // }
            });
            mymap.addInteraction(hover);
            var style = mapUtils.setDefaultFeatureStyle;
            // var container = document.getElementById('popup1');
            // $('#popup1').popover('destroy');
            var content = document.getElementById('popup-content');
            var closer = document.getElementById('popup-closer');
            var popupOverlay;
            hover.on("enter", function (e) {
                // Show maptips only if the switch is set to On
                if (!$('#chkShowMaptips').prop('checked')) {
                    return false;
                }
                // $('#popup1').show();
                let l = e.layer;
                let f = e.feature;
                if (l !== null && typeof l.get("tag") !== "undefined" && l.get("tag")[0] === "GeoJSON" && l.get("allowHover")) {
                    popupOverlay = new ol.Overlay({
                        element: container,
                        autoPan: true,
                        autoPanAnimation: {
                            duration: 250
                        }
                    });

                    /**
                     * Add a click handler to hide the popup.
                     * @return {boolean} Don't follow the href.
                     */
                    closer.onclick = function () {
                        if (popupOverlay) {
                            popupOverlay.setPosition(undefined);
                            closer.blur();
                        }
                        return false;
                    };
                    var coordinate = e.coordinate;
                    if (l.get("name") === "Photos") {
                        content.innerHTML = '<p>You clicked here:</p>' +
                            '<img id="popupImage" alt="Image not found" width="42" height="42">';
                    } else if (l.get("allowHover") === true) {
                        let inHtml = '<table>';
                        f.getKeys().forEach(function (k) {
                            if (k !== "geometry") {
                                $.each(l.get("identify_fields").split(','), function (index, ifld) {
                                    if (ifld.split(':')[0] === k) {
                                        lbl = ifld.split(':')[1];
                                        inHtml = inHtml + '<tr><td style="border-right-width:1px;font-size:10px"><strong>' + lbl + '</strong></td><td style="font-size:10px">:&nbsp;' + f.getProperties()[k] + '</td></tr>';
                                    }
                                });

                            }
                        });
                        inHtml = inHtml + '</table>';
                        content.innerHTML = inHtml;

                    }

                    mymap.addOverlay(popupOverlay);
                    popupOverlay.setPosition(coordinate);
                    //console.log(coordinate);

                }
            });
            hover.on("leave", function (e) {
                if (popupOverlay) {
                    popupOverlay.setPosition(undefined);
                    closer.blur();
                }
            });

        },
        setSelectedStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: preferences.getSelectedFillColor(),
                }),
                stroke: new ol.style.Stroke({
                    color: preferences.getSelectedStrokeColor(),
                    width: preferences.getSelectedStrokeWidth(),
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
        setDefaultFeatureStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 7,
                    snapToPixel: false,
                    fill: new ol.style.Fill({
                        color: 'black'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 2
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
                    //modify pin in cluster gets recognised as a feature and doesn't have a layer
                    if(lyr == null)
                    return;

                    // console.log(feature, lyr, layer);
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
        },
        createVelocityMap() {
            // create velocity layer
            velocityLayer = new VelocityLayer({

                displayValues: true,
                displayOptions: {
                    velocityType: 'GBR Wind',
                    position: 'bottomleft',
                    emptyString: 'No velocity data',
                    angleConvention: 'bearingCW',
                    displayPosition: 'bottomleft',
                    displayEmptyString: 'No velocity data',
                    speedUnit: 'bft'
                },
                data: [], // velocityData, // see demo/*.json, or wind-js-server for example data service

                // OPTIONAL
                minVelocity: 5, // used to align color scale
                maxVelocity: 20, // used to align color scale
                velocityScale: 0.005, // modifier for particle animations, arbitrarily defaults to 0.005
                particleMultiplier: 1 / 100,
                particleAge: 64,
                lineWidth: 1,
                colorScale: velocityColorScaleArray
            });
            // initiate velocity map html attributes
            $("#mapid2 div").attr('id', velocityControls.getVelocitySettings().mapId);
            $("#mapid2 div").css('height', '100%');

            var velocityCenter = mymap.getView().getCenter();
            velocityMap = new Map({
                layers: [
                    new TileLayer({
                        source: new Stamen({
                            layer: 'toner'
                        })
                    }),
                    // new TileLayer({
                    //     title: 'Open Street Map',
                    //     source: new OSM(),
                    //     // type: 'base'
                    // }),
                ],
                target: velocityControls.getVelocitySettings().mapId,
                view: new View({
                    center: velocityCenter,
                    // projection: projectionCode,
                    extent: mymap.getView().getProjection().getExtent(),
                    zoom: mymap.getView().getZoom() //,
                    // maxZoom: 29
                })
            });
            velocityControls.renderTool();
            $("#velocitySelId select").hide();
            $("#velocityColorScaleId").hide();

            return velocityMap;
        },
        addWind(timeIso) {
            // var timeIso = new Date().toISOString();
            var searchLimit = velocityControls.getVelocitySettings().timeSettings.days;
            var velocityUrl = `${velocityControls.getVelocitySettings().serverLocation}`;

            $('#legendButton').hide();
            $('.wms-t-control').hide();

            $.ajax({
                url: `${velocityUrl}/nearest?timeIso=${timeIso}&searchLimit=${searchLimit}`,
                async: true,
                dataType: 'json',
                beforeSend: function () {
                    $(".wait").show();
                },
                success: function (windData) {
                    var refTime = windData[0].header.refTime;
                    $("#velocitySelId select").show();
                    $("#velocityColorScaleId").show();
                    velocityControls.renderSelectOptions(refTime);
                    velocityLayer.options.data = windData;
                    velocityLayer.addToMap(velocityMap);
                    // TODO: Figure out how to keep animation going without updating layer
                    setInterval(function () {
                        velocityLayer._canvasLayer.changed();
                    }, 50);
                },
                complete: function (response) {
                    $(".wait").hide();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    $(".wait").hide(400, function () {
                        console.log("Velocity data could not be loaded... Maybe the wind server is down");
                        alert("Velocity data could not loaded... Maybe the wind server is down");
                    });
                },
                failure: function (jqXHR, _textStatus, errorThrown) {
                    $(".wait").hide(400, function () {
                        console.log("Get velocity data error");
                    });
                }
            });
        },
        removeWind() {
            velocityLayer.removeFromMap();
            $('#legendButton').show();
            $('.wms-t-control').show();
            
        }
    };
})();