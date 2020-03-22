/**
 *  Add spatial search functionality to the Advanced Search dialog
 *  @namespace spatialSearch
 */
var spatialSearch = (function () {
    return {
        /** 
         * Initializes the dialogs, controls and events 
         * for spatial search
         * @function init
         * @memberof spatialSearch
         */
        init: function () {
            spatialSearch.createControls();
        },
        /**
         * Creates the HTML for the spatial search controls and events
         * and appends it in the advanced search dialog
         * @function createControls
         * @memberof spatialSearch
         */
        createControls: function () {
            $.i18n.load(uiStrings);
            let str = '<div class="row" id="rowSpatialOps1" style="display:none">' +
                '    <div class="col-lg-9">' +
                '        <label for="selSpatialOps">' + $.i18n._("_SPATIALSELDESCR1") + '</label>' +
                '        <select class="form-control" id="selSpatialOps">' +
                '           <option value="-1">' + $.i18n._("_SELECT") + '...</option> ' +
                '           <option value="INTERSECTS">' + $.i18n._("_INTERSECTS") + '</option> ' +
                '           <option value="CONTAINS">' + $.i18n._("_CONTAINS") + '</option> ' +
                '           <option value="WITHIN">' + $.i18n._("_WITHIN") + '</option> ' +
                '           <option value="DWITHIN">' + $.i18n._("_DWITHIN") + '</option> ' +
                '           <option value="CROSSES">' + $.i18n._("_CROSSES") + '</option> ' +
                '           <option value="OVERLAPS">' + $.i18n._("_OVERLAPS") + '</option> ' +
                '           <option value="TOUCHES">' + $.i18n._("_TOUCHES") + '</option> ' +
                '        </select>' +
                '    </div>' +
                '    <div class="col-lg-3" id="rowDWithin" style="display:none">' +
                '       <label for="txbDWithin">&nbsp;</label>' +
                '        <div class="input-group">' +
                '           <input type="number" id="txbDWithin" class="form-control" placeholder="" aria-label="" aria-describedby="txbDWithinUnits"> ' +
                '           <span class="input-group-addon" id="txbDWithinUnits"></span>' +
                '       </div>' +
                '    </div>' +
                '</div>' +
                '<div class="row" id="rowSpatialOps2" style="display:none">' +
                '    <div class="col-lg-12">' +
                '        <label for="selSelectedFeatures">' + $.i18n._("_SPATIALSELDESCR2") + '</label>' +
                '        <select class="form-control" id="selSelectedFeatures">' +
                '        </select>' +
                '    </div>' +
                '</div>';
            $("#divSearchFields").after(str);

            //Render checkbox as a switch
            $("#chkSS").bootstrapToggle({
                on: $.i18n._('_YES'),
                off: $.i18n._('_NO')
            });
            // If the spatial search checkbox is unchecked hide the
            // spatial search controls
            $("#chkSS").change(function () {
                if ($("#chkSS").is(':checked')) {
                    $("#rowSpatialOps1").show();
                    $("#rowSpatialOps2").show();
                    spatialSearch.popSddl();
                } else {
                    $("#rowSpatialOps1").hide();
                    $("#rowSpatialOps2").hide();
                    $("#selSelectedFeatures").empty();
                }
            });
            // If user selected the within distance, show the distance textbox and map units
            $("#selSpatialOps").change(function () {
                if ($("#selSpatialOps").val() === 'DWITHIN') {
                    $("#txbDWithinUnits").html(mymap.getView().getProjection().getUnits());
                    $("#rowDWithin").show();
                } else {
                    $("#rowDWithin").hide();
                }
            });
        },
        getUniqueLayersFromSelection: function (selectionLyr) {
            var dupArray = []; // This would be the initial array that may contain duplicate layer names (one for each feature)
            // First loop through the selected features to get the unique layer names
            selectionLyr.getSource().getFeatures().forEach(function (f) {
                var lname = f.get('_layername'); // The _layername propery has been defined on selection
                dupArray.push(lname);
            });
            // Get each distint value and populate the dropdown
            var uniqArr = dupArray.filter(function (itm, i, dupArray) {
                return i == dupArray.indexOf(itm);
            });
            return uniqArr;
        },
        /**
         * Populates the dropdown with layers that have selected features
         * @function popSddl
         * @memberof spatialSearch
         */
        popSddl: function () {

            $("#selSelectedFeatures").empty();
            $("#selSelectedFeatures").append('<option value="-1">' + $.i18n._("_SELECT") + '...</option> ');
            var selectionLyr = legendUtilities.getLayerByName("selection");
            if (selectionLyr) {
                if (selectionLyr.getSource().getFeatures().length > 0) {

                    uniqArr = spatialSearch.getUniqueLayersFromSelection(selectionLyr);
                    // Second loop to get the geometries of selected features
                    var selFeaturesArray = [];

                    uniqArr.forEach(function (l) {
                        var selCount = 0;
                        var selLayerFeature = {};
                        //$("#selSelectedFeatures").append('<option>' + l + '</option> ');
                        selectionLyr.getSource().getFeatures().forEach(function (f) {
                            var sstring = '';
                            let lname = f.get('_layername');
                            if (lname === l) {
                                selCount++;
                                let llayer = legendUtilities.getLayerByName(l); // Get the layer object
                                let llabel = llayer.get("label");
                                let lsrid = llayer.get("srid");

                                if (typeof selLayerFeature[llabel] === "undefined") {
                                    selLayerFeature[llabel] = {
                                        "name": lname,
                                        "geometryType": f.getGeometry().getType(),
                                        "count": selCount
                                    };

                                } else {
                                    selLayerFeature[llabel] = {
                                        "name": lname,
                                        "geometryType": f.getGeometry().getType(),
                                        "count": selCount
                                    };
                                }

                            }

                        });
                        selFeaturesArray.push(selLayerFeature);
                        //console.log("selectected features for layer " + l + ":" + selCount);

                    });
                    //console.log(selFeaturesArray);
                    // Now populate the dropdown
                    selFeaturesArray.forEach(function (sfl) {
                        $("#selSelectedFeatures").append('<option value="' + Object.values(sfl)[0].name + ':' + Object.values(sfl)[0].geometryType + ':' + Object.values(sfl)[0].count + '">' + Object.keys(sfl)[0] + ' (' + Object.values(sfl)[0].count + ')...</option> ');
                    });
                }
            }
        },
        /**
         * Get the selected features from the input layer as GML
         * @param {string} layername Layername
         * @param {integer} feat_count Number of selected features in layername
         * @returns {string}
         * @function getSelectedGeomAsGML
         * @memberof spatialSearch
         */
        getSelectedGeomAsGML: function (layername, feat_count) {
            var selectionLyr = legendUtilities.getLayerByName("selection");
            if (selectionLyr) {
                if (selectionLyr.getSource().getFeatures().length > 0) {
                    uniqArr = spatialSearch.getUniqueLayersFromSelection(selectionLyr);
                    // Second loop to get the geometries of selected features
                    var selFeaturesArray = [];
                    var sstring = '';
                    //uniqArr.forEach(function (l) {
                        var selCount = 0;
                        var selLayerFeature = {};
                        
                        //$("#selSelectedFeatures").append('<option>' + l + '</option> ');
                        selectionLyr.getSource().getFeatures().forEach(function (f) {
                            let lname = f.get('_layername');
                            if (lname === layername) {
                                selCount++;
                                let llayer = legendUtilities.getLayerByName(layername); // Get the layer object
                                let lsrid = llayer.get("srid");

                                // Create a GML format object
                                var gmlf = new ol.format.GML({
                                    "featureNS": "http://consortis.gr",
                                    "featureType": f.getGeometry().getType(),
                                    "srsName": lsrid
                                });
                                // Convert the feature to GML
                                var origGML = gmlf.writeFeatures([f]);
                                // The GML returned is not in the format required by mapserver 
                                // so we need to do some 'massaging' to just get the geometry node
                                var xmlDoc = $.parseXML(origGML);
                                $xml = $(xmlDoc);
                                var xmlString = (new XMLSerializer()).serializeToString($xml.find("geometry").children(0)[0]);
                                sstring = sstring + xmlString;
                            }                           
                        });
                    return sstring;
                }
            }
        }

    };
})();
$(document).ready(function () {
    spatialSearch.init();
});