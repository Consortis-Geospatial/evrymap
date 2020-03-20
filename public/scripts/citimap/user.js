var userUtils = (function (mymap) {
    return {
        hasSettings: function () {
            if (typeof Storage !== "undefined") {
                return true;
            } else {
                return false;
            }
        },
        getSavedMaps: function () {
            var viewList = [];
            if (typeof localStorage.getItem("citiPortal") !== "undefined" && localStorage.getItem("citiPortal") !== null) {
                var mapKey = userUtils.getCurrentMapKey();
                var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
                citiPortalObj[mapKey].saved_views.forEach(function (sv, i) {
                   // if (sv.name !== 'Home') {
                        viewList.push(sv.name);
                    //}
                });
            }
            return viewList;
        },
        clearSettings: function () {
            mapKey = userUtils.getCurrentMapKey();
            if (userUtils.hasSettings) {
                if (typeof localStorage.getItem("citiPortal") !== "undefined" && localStorage.getItem("citiPortal") !== null) {
                    var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
                    if (typeof citiPortalObj[mapKey] !== "undefined") {
                        delete citiPortalObj[mapKey];
                        //Convert the JSON object back to string and add it to local storage
                        localStorage.setItem('citiPortal', JSON.stringify(citiPortalObj));
                    }
                }
            }
        },
        getCurrentMapKey: function () {
            var mapKey = window.location.toString();
            //Replace all instances of ':', '.' and '/' with underscores
            mapKey = mapKey.replace(/:/g, "_").replace(/\//g, "_").replace(/\./g, "_");
            // Remove hashes from the end of the url if they exist
            if (mapKey.endsWith('#')) {
                mapKey = mapKey.slice(0, -1);
            }
            return mapKey;
        },
        writeSettings: function (savename) {
            if (!userUtils.hasSettings()) {
                return false;
            }
            $map = $('#mapid').data('map');
            if (typeof savename === "undefined" || savename.trim() === "") {
                savename = "Home";
            }
            var mapKey = userUtils.getCurrentMapKey(); // This will be used as the id for the current view
            if (typeof localStorage.getItem("citiPortal") === "undefined" || localStorage.getItem("citiPortal") === null) {
                localStorage.setItem('citiPortal', '{"' + mapKey + '": {"saved_views":[]}}');
            }
            var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
            // If the current saved view list does not exist, create it
            if (typeof citiPortalObj[mapKey] === "undefined") {
                citiPortalObj[mapKey] = JSON.parse("{\"saved_views\":[]}}");
            }
            //Create mapset
            var mapSetObject = userUtils.createMapSet($map, savename);
            //Check if the saved view already exists
            var iRemove = -1;
            citiPortalObj[mapKey].saved_views.forEach(function (ms2Remove, i) {
                if (ms2Remove.name === savename) {
                    iRemove = i;
                    return false;
                }
            });
            if (iRemove !== -1) {
                citiPortalObj[mapKey].saved_views.splice(iRemove, 1);
            }
            //Add mapset to saved_views array
            citiPortalObj[mapKey].saved_views.push(mapSetObject);

            // Get Preferences
            prefs = preferences.getPrefsObject();
            citiPortalObj[mapKey].saved_views = prefs;

            //Convert the JSON object back to string and add it to local storage
            localStorage.setItem('citiPortal', JSON.stringify(citiPortalObj));
        },
        deleteMapSet: function (viewname) {
            var mapKey = userUtils.getCurrentMapKey(); 
            var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
            var iRemove = -1;
            if (typeof citiPortalObj[mapKey] === "undefined") {
                return;
            }
            citiPortalObj[mapKey].saved_views.forEach(function (ms2Remove, i) {
                if (ms2Remove.name === viewname) {
                    iRemove = i;
                    return false;
                }
            });
            if (iRemove !== -1) {
                citiPortalObj[mapKey].saved_views.splice(iRemove, 1);
            }
            //Convert the JSON object back to string and add it to local storage
            localStorage.setItem('citiPortal', JSON.stringify(citiPortalObj));
        },
        getLayerMapset: function (layer) {
            var mapsetString = '{"name": "' + layer.get("name") + '", "visible": ' + layer.getVisible() + ', "opacity": "' + layer.getOpacity() + '", "label": "' + layer.get("label") + '"';

            if (typeof layer.get("tag") !== "undefined") {
                mapsetString = mapsetString + ',"type": "' + layer.get("tag")[0] + '"';
                mapsetString = mapsetString + ',"mapfile": "' + encodeURI(layer.get("tag")[1]) + '"';
                mapsetString = mapsetString + ',"tag": ' + JSON.stringify(layer.get("tag")) + '';
            }
            if (typeof layer.get("srid") !== "undefined") {
                mapsetString = mapsetString + ',"srid": "' + layer.get("srid") + '"';
            } else {
                mapsetString = mapsetString + ',"srid": "' + projcode + '"';
            }
            if (typeof layer.get("identify_fields") !== "undefined") {
                mapsetString = mapsetString + ',"identify_fields": "' + layer.get("identify_fields") + '"';
            }
            if (typeof layer.get("search_fields") !== "undefined") {
                mapsetString = mapsetString + ',"search_fields": "' + layer.get("search_fields") + '"';
            }
            if (typeof layer.get("feature_info_format") !== "undefined") {
                mapsetString = mapsetString + ',"feature_info_format": "' + layer.get("feature_info_format") + '"';
            }
            if (typeof layer.get("table_name") !== "undefined") {
                mapsetString = mapsetString + ',"table_name": "' + layer.get("table_name") + '"';
            }
            if (typeof layer.get("queryable") !== "undefined") {
                mapsetString = mapsetString + ',"queryable": ' + layer.get("queryable") + '';
            } else {
                mapsetString = mapsetString + ',"queryable": false';
            }
            if (typeof layer.get("group") !== "undefined") {
                mapsetString = mapsetString + ',"group": "' + layer.get("group") + '"';
            }
            if (typeof layer.get("exportable") !== "undefined") {
                mapsetString = mapsetString + ',"exportable": ' + layer.get("queryable");
            } else {
                mapsetString = mapsetString + ',"exportable": false';
            }
            if (typeof layer.get("legendImg") !== "undefined") {
                mapsetString = mapsetString + ',"legendImg": "' + layer.get("legendImg") + '"';
            }
            if (typeof layer.get("legend_wh") !== "undefined") {
                mapsetString = mapsetString + ',"legend_wh": "' + layer.get("legend_wh") + '"';
            }
            if (typeof layer.get("has_relation") !== "undefined" && layer.get("has_relation") === true) {
                mapsetString = mapsetString + ',"has_relation": ' + layer.get("has_relation") + ',';
                if (typeof layer.get("relation_details") !== "undefined") {
                    mapsetString = mapsetString + '"relation_details": "' + layer.get("relation_details") + '"';
                }
            } else {
                mapsetString = mapsetString + ',"has_relation": false';
            }
            if (typeof layer.get("editable") !== "undefined") {
                if (layer.get("editable") === true && typeof layer.get("edit_pk") !== "undefined" && typeof layer.get("edit_fields") !== "undefined") {
                    mapsetString = mapsetString + ',"editable": true,';
                    mapsetString = mapsetString + '"edit_pk": "' + layer.get("edit_pk") + '",';
                    mapsetString = mapsetString + '"edit_geomcol":"' + layer.get("edit_geomcol") + '",';
                    mapsetString = mapsetString + '"edit_geomtype": "' + layer.get("edit_geomtype") + '",';
                    mapsetString = mapsetString + '"edit_snapping_layers": ' + userUtils.array2JsonString(layer.get("edit_snapping_layers")) + ',';
                    mapsetString = mapsetString + '"edit_service_url": "' + layer.get("edit_service_url") + '"';
                    if (typeof layer.get("edit_allow_split") !== "undefined" && layer.get("edit_allow_split") === true) {
                        mapsetString = mapsetString + ',"edit_allow_split": true,';
                        mapsetString = mapsetString + '"edit_split_layer": "' + layer.get("edit_split_layer") + '",';
                        mapsetString = mapsetString + '"edit_split_url": "' + layer.get("edit_split_layer") + '"';
                    } else {
                        mapsetString = mapsetString + ',"edit_allow_split": false';
                    }
                    if (typeof layer.get("edit_hump_url") !== "undefined") {
                        mapsetString = mapsetString + ',"edit_hump_url": "' + layer.get("edit_hump_url") + '"';
                    }
                    if (typeof layer.get("edit_merge_url") !== "undefined") {
                        mapsetString = mapsetString + ',"edit_merge_url": "' + layer.get("edit_merge_url") + '"';
                    }
                    mapsetString = mapsetString + ',"edit_fields": ' + JSON.stringify(layer.get("edit_fields"));
                } else {
                    mapsetString = mapsetString + ',"editable": false';
                }
            } else {
                mapsetString = mapsetString + ',"editable": false';
            }

            mapsetString = mapsetString + '},';
            return mapsetString;
        },
        createMapSet: function (mymap, mapsetname) {
            var mapsetString = '';
            //mapsetString = mapsetString + '"saved_views": [';
            if (typeof mapsetname === "undefined" || mapsetname === "" || mapsetname === null || mapsetname === "Home") {
                mapsetString = mapsetString + '{"name": "Home",';
            } else {
                mapsetString = mapsetString + '{"name": "' + mapsetname + '",';
            }
            mapsetString = mapsetString + '"zoomlevel": "' + mymap.getView().getZoom() + '", "center": "' + mymap.getView().getCenter() + '",';
            mapsetString = mapsetString + '"layers": [';
            mymap.getLayers().forEach(function (layer, i) {
                if (layer instanceof ol.layer.Group) {
                    layer.getLayers().forEach(function (sublayer, j) {
                        mapsetString = mapsetString + userUtils.getLayerMapset(sublayer);
                    });
                } else {
                    mapsetString = mapsetString + userUtils.getLayerMapset(layer);
                }
            });
            mapsetString = mapsetString.slice(0, -1);
            mapsetString = mapsetString + ']';
            mapsetString = mapsetString + '}'; //End named view
            //console.log('write settings: ' + mapsetString);
            mapset = JSON.parse(mapsetString);
            return mapset;
            //console.log('mapset object: ' + mapset);
        },
        // Return a valid JSON array string from an array object
        array2JsonString: function (inarray) {
            str = '[';
            inarray.forEach(function (item) {
                str = str + '"' + item + '",';
            });
            // Remove the last comma
            str = str.slice(0, -1);
            str = str = str + ']';
            return str;
        },
        getMapSet: function (mapsetname) {
            var mapset;
            var mapKey = userUtils.getCurrentMapKey();
            if (typeof localStorage.getItem("citiPortal") === "undefined" || localStorage.getItem("citiPortal") === null ) {
                return null;
            }
            var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
            if (typeof citiPortalObj[mapKey] === "undefined") { return null;}
            citiPortalObj[mapKey].saved_views.forEach(function (ms, i) {
                if (ms.name === mapsetname) {
                    mapset = ms;
                    return false;
                }
            });
            if (typeof mapset === "undefined") {
                return null;
            } else {
                return mapset;
            }
        },
        setMapView: function (mymap, mapsetname) {
            var mapset;
            var mapKey = userUtils.getCurrentMapKey();
            if (typeof localStorage.getItem("citiPortal") === "undefined") {
                return;
            }
            var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
            if (typeof citiPortalObj[mapKey] === "undefined") {
                return;
            }
            citiPortalObj[mapKey].saved_views.forEach(function (ms, i) {
                if (ms.name === mapsetname) {
                    mapset = ms;
                    return false;
                }
            });
            if (typeof mapset === "undefined") {
                return;
            }
            mymap.getView().setZoom(parseInt(mapset.zoomlevel));
            mymap.getView().setCenter(mapset.center.split(',').map(Number));
            //mymap.getLayers().forEach(function (layer, i) {
            mapset.layers.forEach(function (lyrobj, i) {
                var lyrname = lyrobj.name;
                layer = legendUtilities.getLayerByName(lyrname);
                if (typeof layer === "undefined") {
                    // Layer exists in the saved view but not present in the current map so add it
                    if (lyrobj.type === "WMS") {
                        var lyrurl = lyrobj.tag[1];
                        //console.log(lyrurl);
                        var newlyr = WxSUtils.addWMSLayer(lyrname, lyrobj.label, lyrurl, lyrobj.srid, lyrobj.feature_info_format, lyrobj.queryable, true);
                        if (typeof newlyr !== "undefined") {
                            newlyr.setVisible(lyrobj.visible);
                            newlyr.setOpacity(parseFloat(lyrobj.opacity));
                        }
                    } else if (lyrobj.type === "GeoJSON" || lyrobj.type === "GEOJSON" || lyrobj.type === "geojson") {
                        var lyrurl1 = lyrobj.tag[1];
                        //console.log(lyrurl);
                        var newlyr1 = WxSUtils.addWFSLayer(lyrname, lyrobj.label, lyrurl1, lyrobj.srid, lyrobj.feature_info_format, lyrobj.queryable);
                        if (typeof newlyr1 !== "undefined") {
                            newlyr1.setVisible(lyrobj.visible);
                            newlyr1.setOpacity(parseFloat(lyrobj.opacity));
                        }
                    } 
                } else {
                    if (layer instanceof ol.layer.Group) {
                        layer.getLayers().forEach(function (sublayer, j) {
                            lyrname = sublayer.get("name");
                            $.each(mapset.layers, function (index, item) {
                                if (item.name === lyrname) {
                                    sublayer.setVisible(item.visible);
                                    sublayer.setOpacity(parseFloat(item.opacity));
                                    //return false;
                                }
                            });
                        });
                    } else {
                        layer.setVisible(lyrobj.visible);
                        layer.setOpacity(parseFloat(lyrobj.opacity));
                    }
                }
            });
        },
        readPins: function (mymap) {
            if (localStorage.pins) {
                var pinlist = JSON.parse(localStorage.pins);
                $.each(pinlist, function (index, item) {
                    var coords = [parseFloat(item.X), parseFloat(item.Y)];
                    var pinFt = zoom2XY.createPinFeature(coords, item.name);
                    zoom2XY.addPin(pinFt);
                });
            }
        },
        addNamedPin: function (mymap, pinname, coords) {
            if (userUtils.hasSettings(mymap)) {
                var pinlist = [];
                if (localStorage.pins) {
                    pinlist = JSON.parse(localStorage.pins);
                }
                pinlist.push({ "name": pinname, "X": coords[0].toString(), "Y": coords[1].toString() });
                localStorage.removeItem("pins");
                localStorage.setItem("pins", JSON.stringify(pinlist));
                //mymap.getLayers().forEach(function (layer, i) {
                //    if (layer.get('name') === 'pinLayer') {
                //        var featList = layer.getSource().getFeatures();
                //        for (var i = 0; i < featList.length; i++) {
                //            pinlist.push({ "X": featList[i].getGeometry().coordinates[0].toString(), "Y": featList[i].getGeometry().coordinates[1].toString() });
                //            console.log(pinlist);

                //        }
                //        return false;
                //    }
                //});
            }
        },
        removeNamedPin: function (name) {
            if (localStorage.pins) {
                pinlist = JSON.parse(localStorage.pins);
                var rmvIdx = -99;
                $.each(pinlist, function (i, item) {
                    //debugger
                    if (item.name === name) {
                        rmvIdx = i;
                        return false; // this stops the each
                    }
                });
                pinlist.splice(rmvIdx, 1);
                if (pinlist.length === 0) {
                    userUtils.clearPins();
                } else {
                    userUtils.clearPins();
                    localStorage.setItem("pins", JSON.stringify(pinlist));
                }
            }
        },
        clearPins: function () {
            localStorage.removeItem("pins");
        },
        saveExtent: function (mymap) {
            var exIdx = null;
            if (userUtils.hasSettings) {
                var viewList;
                if (sessionStorage.Extents) {
                    exIdx = JSON.parse(sessionStorage.Extents).length;
                    if (exIdx > 10) {
                        viewList = [];
                        viewList.push({ "index": "1", "center": mymap.getView().getCenter(), "zoom": parseInt(mymap.getView().getZoom()).toString() });
                        sessionStorage.Extents = JSON.stringify(viewList);
                        console.log(sessionStorage.Extents);
                        exIdx = 1;
                    }
                    //var x = new { String(exIdx): {mymap.getView().getExtent() } }
                    viewList = JSON.parse(sessionStorage.Extents);
                    var curView = viewList[(exIdx - 1).toString()];
                    prevZoom = parseInt(curView.zoom);
                    prevX = curView.center[0];
                    prevY = curView.center[1];
                    if (prevZoom !== parseInt(mymap.getView().getZoom()) || prevX !== mymap.getView().getCenter()[0] || prevY !== mymap.getView().getCenter()[1]) {
                        viewList.push({ "index": String(exIdx + 1), "center": mymap.getView().getCenter(), "zoom": parseInt(mymap.getView().getZoom()).toString() });
                        sessionStorage.Extents = JSON.stringify(viewList);
                        console.log(sessionStorage.Extents);
                    }
                } else {
                    viewList = [];
                    viewList.push({ "index": "1", "center": mymap.getView().getCenter(), "zoom": mymap.getView().getZoom().toString() });
                    sessionStorage.Extents = JSON.stringify(viewList);
                    console.log(sessionStorage.Extents);
                }
            }
            return JSON.parse(sessionStorage.Extents).length;
        }
    };
})(mymap);