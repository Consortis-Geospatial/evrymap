var searchUtilities = (function () {
    return {
        getSelectionLayer: function (map) {
            var selLyr;
            var foundsel = false;
            map.getLayers().forEach(function (layer, i) {
                if (layer.get('name') === 'selection') {
                    selLyr = layer;
                    foundsel = true;
                    return false;
                }
            });

            if (!foundsel) {
                var selSource = new ol.source.Vector({});
                selLyr = new ol.layer.Vector({
                    name: 'selection',
                    source: selSource
                });
                map.addLayer(selLyr);
            }
            selLyr.getSource().clear();
            return selLyr;
        },
        performSearch: function (searchVal, searchFieldsList, layersList, identifyFields) {
            if (searchVal === "") {
                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHSTRING'), $.i18n._('_ERRORWARNING'));
                return;
            }
            //searchVal=escape(searchVal);
            $map = $('#mapid').data('map');
            var selLyr = searchUtilities.getSelectionLayer($map);
            var found = false;
            $(".wait").show();
            setTimeout(function () {
                $.each(layersList, function (i, val) {
                    var vectorSource = new ol.source.Vector();
                    var vector = new ol.layer.Vector({
                        source: vectorSource,
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: 'rgba(0, 0, 255, 1.0)',
                                width: 2
                            })
                        })
                    });
                    if (typeof val.queryable !== "undefined" && val.queryable === true) {
                        var lyrname = val.name;
                        var tableName = val.table_name;
                        var lyrSearchFields = searchFieldsList[lyrname];
                        var lyrIdentifyFields = identifyFields[lyrname];
                        if (typeof lyrSearchFields !== "undefined") {
                            var paramString = searchUtilities.formGlobalQueryString(lyrSearchFields.split(','), searchVal);

                            if (paramString === "") {
                                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHFIELDS'), $.i18n._('_ERRORWARNING'));
                            } else {
                                let mapSettings = mapPortal.readConfig("map");
                                let mappath = '';
                                if (mapSettings.useWrappedMS !== "undefined" && mapSettings.useWrappedMS === true) {
                                    mappath = '/' + val.mapfile.split('\\')[val.mapfile.split('\\').length - 1].split('.')[0] + '/';
                                } else {
                                    mappath = '?map=' + val.mapfile + '&';
                                }
                                // generate a GetFeature request
                                var searchUrl;
                                if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                    searchUrl = window.location.protocol + "//" + $('#hidMS').val() + mappath + "SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + tableName + "&Filter=<Filter>" + paramString + "</Filter>&OUTPUTFORMAT=GEOJSON";
                                } else {
                                    searchUrl = proxyUrl + window.location.protocol + "//" + $('#hidMS').val() + mappath + "SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + tableName + "&Filter=<Filter>" + paramString + "</Filter>&OUTPUTFORMAT=GEOJSON";
                                }
                                $.ajax({
                                    url: searchUrl,
                                    dataType: 'json',
                                    success: function (data) {
                                        if (data.features.length > 0) {
                                            found = true;
                                            searchUtilities.renderQueryResultsAsTable(data, val.label, lyrname, lyrSearchFields.split(','), lyrIdentifyFields.split(','));
                                            //Always show the first tab as active
                                            $('#searchResultsUl a').first().tab('show');
                                        }
                                    },
                                    async: false // Non-asynchronous since we are in a loop
                                });
                            }
                        }
                    }
                });
                $(".wait").hide();
                if (!found) {
                    try {
                        $('#modSearchResults').dialog('close');
                    } catch (e) {
                        return;
                    }

                    mapUtils.showMessage('warning', $.i18n._('_NOSEARCHRESULTS'), $.i18n._('_ERRORWARNING'));
                }
            }, 1000);
        },
        performSearchById: function (searchVal, searchLyrName, searchFld, zoomto) {
            if (searchVal === "") {
                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHSTRING'), $.i18n._('_ERRORWARNING'));
                return;
            }
            $map = $('#mapid').data('map');
            var selLyr = searchUtilities.getSelectionLayer($map);
            var found = false;
            var searchLyr = legendUtilities.getLayerByName(searchLyrName);
            var vectorSource = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: vectorSource,
                style: mapUtils.setSelectedStyle
            });

            var tableName = '';
            var lyrType = searchLyr.get("tag")[0];
            if (lyrType === "WMS") {
                tableName = searchLyr.get("name");
            } else if (lyrType === "GeoJSON") {
                tableName = searchLyr.get("table_name");
            }
            var paramString = searchUtilities.formQueryByIdString(searchFld, searchVal);
            var identify_fields = searchLyr.get('identify_fields');
            var search_fields = searchLyr.get('search_fields');

            if (paramString === "") {
                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHFIELDS'), $.i18n._('_ERRORWARNING'));
            } else {
                // generate a GetFeature request
                var searchUrl;
                if (window.location.host === $('#hidMS').val().split('/')[0]) {
                    searchUrl = searchLyr.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + tableName + "&Filter=<Filter>" + paramString + "</Filter>&OUTPUTFORMAT=GEOJSON";
                } else {
                    searchUrl = proxyUrl + searchLyr.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + tableName + "&Filter=<Filter>" + paramString + "</Filter>&OUTPUTFORMAT=GEOJSON";
                }
                setTimeout(function () {
                    $.ajax({
                        beforeSend: function () {
                            $(".wait").show();
                        },
                        url: searchUrl,
                        dataType: 'json',
                        success: function (data) {
                            if (data.features.length > 0) {
                                found = true;
                                if (typeof zoomto === "undefined") {
                                    searchUtilities.renderQueryResultsAsTable(data, searchLyr.get('label'), searchLyr.get('name'), search_fields.split(','), identify_fields.split(','));
                                    //Always show the first tab as active
                                    $('#searchResultsUl a').first().tab('show');
                                } else {
                                    if (data.features.length > 0) {
                                        let geom = JSON.stringify(data.features[0].geometry.coordinates);
                                        let geomtype = data.features[0].geometry.type;
                                        searchUtilities.zoomToFeature(geomtype, geom, searchLyrName);
                                    }
                                }
                            }
                        },
                        complete: function (response) {
                            $(".wait").hide();
                        },
                        async: true // Non-asynchronous since we are in a loop
                    });
                }, 5000);
            }

            //});
            $(".wait").hide();
            if (!found) {
                try {
                    $('#modSearchResults').dialog('close');
                } catch (e) {
                    return;
                }

                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHRESULTS'), $.i18n._('_ERRORWARNING'));
            }
        },
        renderQueryResultsAsTable: function (jsonObj, lyrlabel, lyrname, arrSearchFields, identifyFields) {
            var tblid = lyrname;
            if (lyrname.includes(":")) {
                tblid = lyrname.split(":")[1]; //Coz jquery cannot handle ':' for element ids
            }
            if (jsonObj.features.length > 0) {
                if (!$('#modSearchResults').is(':data(dialog)')) {
                    $('#modSearchResults').dialog({
                        autoOpen: false,
                        height: 544,
                        width: 641,
                        title: $.i18n._('_SEARCHRESULTS'),
                        dialogClass: "modSearchResults",
                        buttons: [{
                            id: "btnCloseSearchResults",
                            text: function () {
                                return $.i18n._('_CLOSE');
                            },
                            click: function () {
                                $(this).dialog("close");
                                searchUtilities.clearSearchTabs();
                            }
                        }],
                        close: function () {
                            searchUtilities.clearSearchTabs();
                        },
                        closeOnEscape: false,
                        open: function (event) { // Add classes manually because of jqueryui classes overlapping
                            document.getElementById("btnCloseSearchResults").removeAttribute("class");
                            $('#btnCloseSearchResults').addClass("btn btn-default");
                            $('.glyphicon-resize-full').removeClass('ui-icon');
                            $('.glyphicon-resize-small').removeClass('ui-icon');
                        }
                    });
                    $('#modSearchResults').dialog('open');
                } else {
                    $('#modSearchResults').dialog('open');
                    if ($('#tbl' + tblid).length > 0) { //Check if table exists so we don't recreate it
                        return;
                    }
                }

                $('#searchResultsUl').append('<li class="nav-item"><a class="nav-link" href="#tabS' + tblid + '" data-toggle="tab">' + lyrlabel + '</a>');
                $('#tabContentSearchResults').append('<div role="tabpanel" class="tab-pane" id="tabS' + tblid + '"></div>');

                var theader = '<br /><table class="table table-striped table-bordered" style="width:100%;" id="tbl' + tblid + '"><thead style="width:100%"><tr>'; //
                //Get the field names from the first feature
                var fRec = jsonObj.features[0];
                var cols = [];
                theader = theader + '<th>&nbsp;</th>';
                cols.push({
                    data: "geometry",
                    width: "20px",
                    render: function (data, type, row, meta) {
                        var str = '';
                        if (data !== null) {
                            str = "<a href='#' title='" + $.i18n._('_ZOOMTO') + "' onclick=\"searchUtilities.zoomToFeature('" + data.type + "','" + JSON.stringify(data.coordinates) + "','" + lyrname + "')\"><i class=\"glyphicon glyphicon-globe text-success\"></i></a>";
                            if (typeof searchLayer.get("custom_record_action") !== "undefined") {
                                var tt = searchLayer.get("custom_record_action").tooltip;
                                var action = searchLayer.get("custom_record_action").action;
                                var glyph = searchLayer.get("custom_record_action").glyphicon;
                                //str = str + "&nbsp;<a href='#' title='" + tt + "' onclick=\"" + action + "('" + JSON.stringify(data) + "')" + "><i class='glyphicon " + glyph + "'></i></a>";
                                var oc = " onclick=\"" + action + "('hid" + tblid + "Custom" + meta.row + "');\"";
                                //Escape special characters and replace single quotes with a space
                                let objval = JSON.stringify(row).replace(/\\n/g, "\\n")
                                    .replace(/\\'/g, "\\'")
                                    .replace(/\\"/g, '\\"')
                                    .replace(/\\&/g, "\\&")
                                    .replace(/\\r/g, "\\r")
                                    .replace(/\\t/g, "\\t")
                                    .replace(/\\b/g, "\\b")
                                    .replace(/\\f/g, "\\f")
                                    .replace(/'/g, ' ');
                                //console.log(objval);
                                str = str + '&nbsp;<a href="#" id="lnk' + tblid + 'Custom' + meta.row + '" title="' + tt + '" ' + oc + '><i class="glyphicon ' + glyph + '"></i></a>';
                                str = str + '<input type="hidden" id="hid' + tblid + 'Custom' + meta.row + '" value=\'' + objval + '\'>';
                            }
                        }
                        return str;
                    },
                    orderable: false,
                    sorting: false
                });

                var j;
                var visFieldIdx;
                var searchLayer = legendUtilities.getLayerByName(lyrname);
                if (searchLayer.get("has_relation")) {
                    theader = theader + '<th>&nbsp;</th>';
                    cols.push({
                        data: null,
                        width: "10px",
                        orderable: false,
                        sorting: false,
                        className: 'details-control',
                        defaultContent: ""
                    });
                    j = 2;
                    visFieldIdx = [0, 1];
                } else {
                    j = 1;
                    visFieldIdx = [0];
                }

                // Get visible fields. If none defined, show all

                $.each(fRec.properties, function (key, val) {
                    if (identifyFields.length > 0 && identifyFields[0] !== "") {
                        for (var i = 0; i < identifyFields.length; i++) {
                            if (identifyFields[i].split(':')[0].toUpperCase() === key.toUpperCase()) {
                                visFieldIdx.push(j);
                                break;
                            }
                        }
                    } else {
                        visFieldIdx.push(j);
                    }
                    j++;
                });

                $.each(fRec.properties, function (key, val) {
                    var tmp = {
                        data: 'properties.' + key,
                        name: key
                    };
                    //console.log('val: ' + val);
                    cols.push(tmp);
                    var lbl = key;
                    $.each(identifyFields, function (index, item) {
                        if (item.split(':')[0] === key) {
                            lbl = item.split(':')[1];
                        }
                    });
                    theader = theader + '<th>' + lbl + '</th>';
                });

                theader = theader + '</tr></thead></table>';
                $('#tabS' + tblid).append(theader);
                var langDt = '';
                if (typeof lang !== "undefined") {
                    langDt = lang.split('.')[0] + '-datatables.json'; // lang variable must be already defined
                }
                var feat = jsonObj.features;
                $.each(feat, function (key, afeature) {
                    $.each(afeature.properties, function (key, val) {
                        //Deal with boolean t/f values
                        if (val === "f" || val === "false" || val === false) {
                            afeature.properties[key] = $.i18n._('_NO');
                        } else if (val === "t" || val === "true" || val === true) {
                            afeature.properties[key] = $.i18n._('_YES');
                        }
                    });
                });
                var dt = $('#tbl' + tblid)
                    .on('init.dt', function () {
                        //Add event when tab is shown to always adjust the table columns
                        $("a[href='#tabS" + tblid + "']").on('shown.bs.tab', function (e) {
                            $('#tbl' + tblid).DataTable().columns.adjust();
                        });
                    })
                    .DataTable({
                        dom: 'Bfrtip',
                        buttons: [{
                            extend: 'collection',
                            text: $.i18n._('_ACTIONS') + '&nbsp;<span class="caret"></span>',
                            className: 'btn-success',
                            buttons: [{
                                    id: 'btnExport2Shp',
                                    text: $.i18n._('_EXPORTTOSHP'),
                                    action: function (e, dt, node, config) {
                                        searchUtilities.export2ShpFromResults(dt);
                                    },
                                    title: lyrlabel,
                                    available: function (dt, config) {
                                        //console.log(searchLayer.get("queryable"));
                                        return searchLayer.get("exportable");
                                    }
                                },
                                {
                                    extend: 'copyHtml5',
                                    text: $.i18n._('_COPY'),
                                    header: false,
                                    title: lyrlabel,
                                    exportOptions: {
                                        columns: ':visible'
                                    }
                                },
                                {
                                    extend: 'excel',
                                    text: $.i18n._('_EXPORTTOXL'),
                                    header: false,
                                    title: lyrlabel,
                                    exportOptions: {
                                        columns: ':visible'
                                    }
                                },
                                {
                                    extend: 'pdf',
                                    text: $.i18n._('_EXPORTTOPDF'),
                                    title: lyrlabel,
                                    messageBottom: 'Powered by citiMap - Consortis',
                                    orientation: 'landscape',
                                    pageSize: 'A4',
                                    exportOptions: {
                                        columns: ':visible'
                                    }
                                }
                            ],
                            language: {
                                "copySuccess": {
                                    "1": "Copied one row to clipboard",
                                    "_": "Copied %d rows to clipboard"
                                },
                                "copyTitle": "Copy to clipboard",
                                "copyKeys": "Press <i>ctrl</i> or <i>⌘</i> + <i>C</i> to copy the table data<br>to your system clipboard.<br><br>To cancel, click this message or press escape."
                            }
                        }],
                        "columnDefs": [{
                                sorting: false,
                                orderable: false,
                                targets: [0],
                                order: [
                                    [0, 'asc']
                                ]
                            },
                            {
                                "className": "dt-center",
                                "targets": [0]
                            },
                            {
                                "width": "20px",
                                "targets": 0
                            },
                            {
                                "targets": visFieldIdx,
                                "visible": true,
                                "searchable": true
                            },
                            {
                                "targets": '_all',
                                "visible": false,
                                "searchable": false
                            }
                        ],
                        "data": feat,
                        "columns": cols,
                        "scrollY": "200px",
                        "scrollCollapse": true,
                        "scrollX": "50%",
                        language: {
                            url: 'i18n/' + langDt
                        }
                    });
                dt.order([0, 'asc']).draw();
                //Trying to fix columns styling when there are more than one tabs
                //  $("a[href='#tabS" +tblid +"']").on('hide.bs.tab', function(e){
                //     $('#tbl' + tblid).DataTable().columns.adjust().draw();
                // });


                // Add event listener for opening and closing details
                if (searchLayer.get("has_relation")) {
                    $('#tbl' + tblid + ' tbody').on('click', 'td.details-control', function () {
                        var tr = $(this).closest('tr');
                        var row = dt.row(tr);

                        if (row.child.isShown()) {
                            // This row is already open - close it
                            row.child.hide();
                            tr.removeClass('shown');
                        } else {
                            if (typeof searchLayer.get("relation_details") === "undefined") {
                                alert("No relation information found - please check config files for layer " + lyrname);
                                return false;
                            }
                            var relationDetails = searchLayer.get("relation_details");
                            //console.log(relationDetails);
                            //console.log('local field: ' + relationDetails.local_field);
                            var local_field_value = row.data().properties[relationDetails.local_field];
                            var childFnName = relationDetails.get_related_fn;
                            var service_url = relationDetails.service_url;
                            //console.log('function: ' + childFnName);
                            //console.log('params: ' + local_field_value);
                            // Open this row
                            //row.child(searchUtilities.getRelatedData(row.data())).show();
                            row.child(window[childFnName](local_field_value, service_url)).show();
                            tr.addClass('shown');
                            if (typeof relationDetails.postread_fn !== "undefined") {
                                window[relationDetails.postread_fn](local_field_value, service_url);
                            }
                        }
                    });
                }
            }
        },
        export2ShpFromResults: function (dtab) {
            var jsonstring = '{"type" : "FeatureCollection",' +
                '"features" : [';
            dtab.rows().every(function (rowIdx, tableLoop, rowLoop) {
                var dataRow = JSON.stringify(this.data());
                jsonstring = jsonstring + dataRow + ',';
                console.log(dataRow);
                // ... do something with data(), or this.node(), etc
            });
            jsonstring = jsonstring.slice(0, -1);
            jsonstring = jsonstring + ']}';
            console.log(jsonstring);
            shpwrite.download(JSON.parse(jsonstring));
        },
        zoomToFeature: function (geomtype, coordstring, lyrName) {
            var featurething;
            var selLyr = searchUtilities.getSelectionLayer(mymap);
            if (geomtype === "Polygon" || geomtype === "Point" || geomtype === "LineString") {
                var points = JSON.parse(coordstring);
                if (geomtype === "Point") {
                    var point = new ol.geom.Point(points);
                    featurething = new ol.Feature({
                        geometry: point
                    });
                } else if (geomtype === "Polygon") {
                    var poly = new ol.geom.Polygon(points);
                    featurething = new ol.Feature({
                        geometry: poly
                    });
                } else if (geomtype === "LineString") {
                    var poly2 = new ol.geom.LineString(points);
                    featurething = new ol.Feature({
                        geometry: poly2
                    });
                }

                var geojson = new ol.format.GeoJSON();

                // Set the default layer projection to the map projection
                var lyrProj = mymap.getView().getProjection().getCode();
                if (typeof lyrName !== "undefined") {
                    // Get the layer object of the layer we are searching on
                    var searchLyr = legendUtilities.getLayerByName(lyrName);
                    // Check if a projection code is defined in the config file.
                    if (typeof searchLyr.get("projection") !== "undefined") {
                        lyrProj = searchLyr.get("projection");
                    }
                }
                as_geojson = geojson.writeFeatures([featurething], {
                    featureProjection: mymap.getView().getProjection().getCode(),
                    dataProjection: lyrProj
                });
                selLyr.getSource().clear();
                selLyr.getSource().addFeatures([featurething]);
                if (geomtype === "Polygon" || geomtype === "LineString") {
                    mymap.getView().fit(selLyr.getSource().getExtent(), mymap.getSize());
                } else { //Its a point. Zoom to a fixed extent
                    mymap.getView().setCenter(featurething.getGeometry().getCoordinates());
                    if (typeof xyzoomlevel === "undefined" || isNaN(Number(xyzoomlevel))) {
                        mymap.getView().setZoom(13);
                    } else {
                        mymap.getView().setZoom(xyzoomlevel);
                    }
                }
            }
        },
        // 
        // Zooms to the input WKT feature
        // Required for the OTS integration
        //
        zoomToWKTFeature: function (wktval) {       
            var format = new ol.format.WKT();
            //Create the feature
            var feature = format.readFeature(wktval.trim(), {
                dataProjection: 'EPSG:4326', // ALWAYS assume that the WKT is in WGS84
                featureProjection: mymap.getView().getProjection().getCode()
            });
            // Initialise the selection layer
            var selLyr = searchUtilities.getSelectionLayer(mymap);

            selLyr.getSource().addFeature(feature);
            if (wktval.trim().toUpperCase().startsWith("POLYGON") || wktval.trim().toUpperCase().startsWith("LINESTRING")) {
                mymap.getView().fit(selLyr.getSource().getExtent(), mymap.getSize());
            } else { //Its a point. Zoom to a fixed extent
                mymap.getView().setCenter(feature.getGeometry().getCoordinates());
                if (typeof xyzoomlevel === "undefined" || isNaN(Number(xyzoomlevel))) {
                    mymap.getView().setZoom(13);
                } else {
                    mymap.getView().setZoom(xyzoomlevel);
                }
            }
        },
        clearSearchTabs: function () {
            $('#searchResultsUl').html("");
            $('#tabContentSearchResults').html("");
            $('#modSearchResults').dialog('close');
        },
        formGlobalQueryString: function (searchFields, searchValue) {
            qstringXML = "";
            if (searchFields.length > 1) {
                qstringXML = "<OR>";
                $.each(searchFields, function (index, item) {
                    qstringXML = qstringXML + "<PropertyIsLike wildcard='*' singleChar='.' escape='!' matchCase=false>";
                    qstringXML = qstringXML + "<PropertyName>" + item.split(':')[0] + "</PropertyName><Literal>*" + searchValue + "*</Literal></PropertyIsLike>";
                });
                qstringXML = qstringXML + "</OR>";
            } else if (searchFields.length === 1) {
                qstringXML = qstringXML + "<PropertyIsLike wildcard='*' singleChar='.' escape='!' matchCase=false>";
                qstringXML = qstringXML + "<PropertyName>" + searchFields[0].split(':')[0] + "</PropertyName><Literal>*" + searchValue + "*</Literal></PropertyIsLike>";
            }
            return qstringXML;
        },
        formQueryByIdString: function (pkField, searchValue) {
            qstringXML = "";
            qstringXML = qstringXML + "<PropertyIsEqualTo matchCase=false>";
            qstringXML = qstringXML + "<PropertyName>" + pkField + "</PropertyName><Literal>" + searchValue + "</Literal></PropertyIsEqualTo>";

            return qstringXML;
        },
        createSearchControl: function () {
            $.i18n.load(uiStrings);
            var str = '<div class="searchpanel"><div class="input-group input-group-lg">' +
                '    <div class="input-group-btn" id="grpBtnSearch">' +
                '        <div class="btn-group">' +
                '            <button class="btn btn-success btn-lg dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '                <i class="glyphicon glyphicon-search"></i><span class="caret"></span>' +
                '            </button>' +
                '            <ul id="searchOpt" class="dropdown-menu">' +
                '                <li><a id="searchbtn" href="#">' + $.i18n._("_SEARCHLAYERS") + '</a></li>' +
                '            </ul>' +
                '        </div>' +
                '    </div>' +
                '<input id="searchfield" class="form-control mr-sm-2" type="text" />' +
                '</div></div>';
            $('#mainparent').prepend(str);
        },
        createSearchResultsDlg: function () {
            var str1 = '<div id="modSearchResults">' +
                '<div class="row" style = "margin-left: 5px; margin-right: 5px; height: 0px;" >' +
                '    <div class="col-lg-12" style="margin-right: 0; padding-right: 0">' +
                '        <div id="searchResultsTabContainer" class="row" style="width: 100%">' +
                '            <ul class="nav nav-tabs" id="searchResultsUl"></ul>' +
                '            <div class="tab-content" id="tabContentSearchResults"></div>' +
                '        </div>' +
                '   </div>' +
                '</div>' +
                '</div >';
            $('#mainparent').prepend(str1);
        }
    };
})();
$(document).ready(function () {
    searchUtilities.createSearchControl();
    searchUtilities.createSearchResultsDlg();
    // Search on attributes by pressing <enter> in the search box
    $('#searchfield').bind('keyup', function (e) {
        if (e.keyCode === 13 && $('#searchfield').val().trim() !== "") { // 13 is enter key
            $('#searchbtn').click();
        }
    });
    $('#modSearchResults').on('hidden.bs.modal', function () {
        searchUtilities.clearSearchTabs();
    });
    var searchSettings = mapPortal.readConfig("search");
    if (typeof searchSettings !== "undefined") {
        var search_url = searchSettings.customSearchService;
        var search_fn = searchSettings.customInitSearchFn;
        eval(search_fn + "('" + search_url + "');");
        //window[search_fn](search_url);
    }
    $("#searchbtn").html($.i18n._('_SEARCHLAYERS'));
});