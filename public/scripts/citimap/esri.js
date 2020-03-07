var esriUtils = (function () {
    return {
        /*Converts ESRI Rest Featureset, Feature, or Geometry
          to GeoJSON FeatureCollection, Feature, or Geometry */
          esriFeaturesToGeoJson: function(esriObject) {
            var outObj, i, esriFeats, gcFeat;
            if (esriObject){
                if (esriObject.features){
                    outObj = {
                        type: "FeatureCollection",
                        features: []
                    };
                    esriFeats = esriObject.features;
                    for (i = 0; i < esriFeats.length; i++) {
                        gcFeat = esriUtils.esriFeatureToGcFeature(esriFeats[i]);
                        if (gcFeat) {
                            outObj.features.push(gcFeat);
                        }
                    }
                } else if (esriObject.results){
                    outObj = {
                        type: "FeatureCollection",
                        features: []
                    };
                    esriFeats = esriObject.results;
                    for (i = 0; i < esriFeats.length; i++) {
                        gcFeat = esriUtils.esriFeatureToGcFeature(esriFeats[i]);
                        if (gcFeat) {
                            outObj.features.push(gcFeat);
                        }
                    }
                } else if (esriObject.geometry){
                    outObj = esriUtils.esriFeatureToGcFeature(esriObject);
                }
                else{
                    outObj = esriUtils.esriGeometryToGcGeometry(esriObject);
                }
            }
            return outObj;
        },
        /* determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
          or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
          points-are-in-clockwise-order
        */
        ringIsClockwise: function(ringToTest) {
            var total = 0,i = 0,
                rLength = ringToTest.length,
                pt1 = ringToTest[i],
                pt2;
            for (i; i < rLength - 1; i++) {
                pt2 = ringToTest[i + 1];
                total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
                pt1 = pt2;
            }
            return (total >= 0);
        },
        /* 
          * Converts GeoJSON feature to ESRI REST Feature.
          * Input parameter is an ESRI Rest Feature object
        */
        esriFeatureToGcFeature: function (esriFeature) {
            var gcFeat = null,
                prop,
                gcProps,
                i,
                p;
            if (esriFeature) {
                gcFeat = {
                    type: "Feature"
                };
                if (esriFeature.geometry) {
                    gcFeat.geometry = esriUtils.esriGeometryToGcGeometry(esriFeature.geometry);
                }
                if (esriFeature.attributes) {
                    gcProps = {};
                    p = esriFeature.attributes;
                    for (prop in esriFeature.attributes) {
                        gcProps[prop.replace(/\./g,"_")] = esriFeature.attributes[prop]; //replace all '.' with underscores
                    }
                    gcFeat.properties = gcProps;
                }
            }
            return gcFeat;
        },
        /* Converts ESRI Rest Geometry to GeoJSON Geometry
           Input is ESRI Rest Geometry Object
        */
        esriGeometryToGcGeometry: function(esriGeom){
            var gcGeom,
                i,
                g,
                coordinates,
                geomType,
                geomParts,
                polyArray,
                ringArray,
                ring;

            //check for x, points, paths, or rings to determine geometry type.
            if (esriGeom) {
                //gcGeom = {};
                if (((esriGeom.x && esriGeom.x !== "NaN") || esriGeom.x === 0) &&
                  ((esriGeom.y && esriGeom.y !== "NaN") || esriGeom.y === 0)) {
                    geomType = "Point";
                    coordinates = [esriGeom.x, esriGeom.y];
                } else if (esriGeom.points && esriGeom.points.length) {
                    geomType = "MultiPoint";
                    coordinates = esriGeom.points;
                } else if (esriGeom.paths && esriGeom.paths.length) {
                    geomParts = esriGeom.paths;
                    if (geomParts.length === 1) {
                        geomType = "LineString";
                        coordinates = geomParts[0];
                    } else {
                        geomType = "MultiLineString";
                        coordinates = geomParts;
                    }
                } else if (esriGeom.rings && esriGeom.rings.length) {
                    //array to hold the individual polygons. A polygon is an outer ring with one or more inner rings
                    //the conversion logic assumes that the Esri json is in the format of an outer ring (clockwise)
                    //followed by inner rings (counter-clockwise) with a clockwise ring signalling the start of a new polygon
                    polyArray = [];
                    geomParts = esriGeom.rings;
                    for (i = 0; i < geomParts.length; i++) {
                        ring = geomParts[i];
                        if (esriUtils.ringIsClockwise(ring)) {
                            //outer ring so new polygon. Add to poly array
                            polyArray.push([ring]);
                        } else if (polyArray.length > 0){
                            //inner ring. Add as part of last polygon in poly array
                            polyArray[polyArray.length - 1].push(ring);
                        }
                    }
                    if (polyArray.length > 1) {
                        //MultiPolygon. Leave coordinates wrapped in outer array
                        coordinates = polyArray;
                        geomType = "MultiPolygon";
                    } else {
                        //Polygon. Remove outer array wrapper.
                        coordinates = polyArray.pop();
                        geomType = "Polygon";
                    }
                }
                gcGeom = (coordinates && geomType) ? {type: geomType, coordinates: coordinates} : null;
                return gcGeom;
                //gcGeom.coordinates = coordinates;
            }
            return gcGeom;
        },
        createEsriRestTile: function (name, url, label, srid, group, queryable) {
            var arcgislayer = new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: url
                })
            });
            if (typeof name === "undefined" || name === "") {
                name = label.replace(" ", "");
            }
            if (typeof srid === "undefined" || srid === "") {
                srid = projcode;
            }
            arcgislayer.set('name', name);
            arcgislayer.set('label', label);
            arcgislayer.set("tag", ["ESRIRESTTILE", url]);
            arcgislayer.set("srid", srid);
            arcgislayer.set('feature_info_format', "GEOJSON");
            arcgislayer.set('identify_fields', "");
            arcgislayer.set('search_fields', "");
            if (typeof group !== "undefined" && group !== "") {
                arcgislayer.set('group', group);
            }
            arcgislayer.set('queryable', queryable);
            return arcgislayer;
        },
        drawEsriRestLegend: function (layerurl, name) {
            $.ajax({
                url: layerurl + '/Legend?f=pjson',
                async: true,
                dataType: 'json',
                success: function (esriLyrs) {
                    var injectString = '';
                    $.each(esriLyrs.layers, function (index, item) {
                        var lname = item.layerName;
                        var imgtype = item.legend[0].contentType;
                        var imgdata = item.legend[0].imageData;
                        injectString = injectString + '<p style="margin-left:20px;margin-top:20px"><span><img src="data:' + imgtype + ';base64,' + imgdata + '" />' + lname + '</span></p>';
                    });
                    $("#legendLayer_" + name).append(injectString);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //console.log("request failed " + textStatus);
                }
            });
        }
    };
})();