var ktimaSearchAdvanced = (function (mymap) {
    return {
        createDialog: function () {
            $.i18n.load(uiStrings);
            var dlgKtimaAdv = document.createElement('div');
            dlgKtimaAdv.setAttribute('id', 'dlgKtimaAdv');
            var divhtml = '<div class="container-fluid">' +
                '<div class="row">' +
                    '<div class="col-lg-12">' +
                        '<div class="form-group">' +
                            '<br>' +
                            '<label for="cboSelOta">' + $.i18n._("_SELECTOTA") + '</label>' +
                            '<select class="form-control" id="cboSelOta">' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="row">' +
                    '<div class="col-lg-12">' +
                        '<div class="form-group">' +
                            '<label for="txbArGeot">' + $.i18n._("_FILLARGEOT") + '</label>' +
                            '<input type="text" class="form-control ktima_query" id="txbArGeot" onkeyup="ktimaSearchAdvanced.onKeyPress();">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="row">' +
                    '<div class="col-lg-12">' +
                        '<div class="form-group">' +
                            '<label for="txbOt">' + $.i18n._("_FILLOT") + '</label>' +
                            '<input type="text" class="form-control ktima_query" id="txbOt" onkeyup="ktimaSearchAdvanced.onKeyPress();">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="row">' +
                    '<div class="col-lg-12">' +
                '       <p style="font-size:12px"><strong>' + $.i18n._("_NOTE") + '</strong></p>' +
                '       <p style="font-size:12px">' + $.i18n._("_NOTEDESCRIPTION2") + '</p>' +
                    '</div>' +
                '</div>' +
                '</div>';
            $(dlgKtimaAdv).append(divhtml);
            $(dlgKtimaAdv).appendTo($("#mainparent"));
        },
        onKeyPress: function (txb) {
            //alert("You pressed a key inside the input field");
            if ($('#txbArGeot').val().length > 0 || $('#txbOt').val().length > 0) {
                $("#btnSearchAdvanced1").prop('disabled', false);
            } else {
                $("#btnSearchAdvanced1").prop('disabled', true);

            }
        },        
        popSearchValList: function (url) {
            var retVal;
            var enc = $('#hidEnc').val();
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONDESCR'), $.i18n._('_NOCONNECTIONTITLE'));
                return false;
            }
            var params = { "enc": enc };
            params = JSON.stringify(params);
            $.ajax({
                url: url,
                data: params,
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    var vals = JSON.parse(data.d);
                    retVal = vals;
                },
                error: function (response) {
                    alert(response.responseText);
                },
                failure: function (response) {
                    alert(response.responseText);
                },
                async: false
            });
            return retVal;
        },
        doAdvancedSearch: function () {
            var qryString = '';
            
            var qryOta = $('#cboSelOta').val();
            var qryOtaString = "<PropertyIsEqualTo matchCase=false><PropertyName>onoma_ota</PropertyName><Literal>" + qryOta + "</Literal></PropertyIsEqualTo>";
            var qryAr_geot = $('#txbArGeot').val();
            var qryOt = $('#txbOt').val();
            if (qryAr_geot.trim() === "" && qryOt.trim() === "") {
                mapUtils.showMessage('error', "Πρέπει να συμπληρώσετε Αριθμό Γεωτεμαχίου ή Οικοδομικού τετραγώνου ", "Κενά πεδία αναζήτησης");
                return;
            }
            if (qryAr_geot.trim() !== "" && qryOt.trim() !== "") {
                qryString = qryString + "<AND>" + qryOtaString +"<PropertyIsEqualTo matchCase=false>";
                qryString = qryString + "<PropertyName>ar_geot</PropertyName><Literal>" + qryAr_geot.trim() + "</Literal></PropertyIsEqualTo>";
                qryString = qryString + "<PropertyIsEqualTo matchCase=false>";
                qryString = qryString + "<PropertyName>ot</PropertyName><Literal>" + qryOt.trim() + "</Literal></PropertyIsEqualTo>";
                qryString = qryString + "</AND>";
            } else {
                if (qryAr_geot.trim() !== "") {
                    qryString = qryString + "<AND>" + qryOtaString + "<PropertyIsEqualTo matchCase=false>";
                    qryString = qryString + "<PropertyName>ar_geot</PropertyName><Literal>" + qryAr_geot.trim() + "</Literal></PropertyIsEqualTo>";
                    qryString = qryString + "</AND>";
                } else {
                    qryString = qryString + "<AND>" + qryOtaString + "<PropertyIsEqualTo matchCase=false>";
                    qryString = qryString + "<PropertyName>ot</PropertyName><Literal>" + qryOt.trim() + "</Literal></PropertyIsEqualTo>";
                    qryString = qryString + "</AND>";
                }
            }
           
            if (qryString === "") {
                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHFIELDS'), $.i18n._('_ERRORWARNING'));
            } else {
                // generate a GetFeature request
                var searchLyr = legendUtilities.getLayerByName("pst_info_final");
                var searchUrl = proxyUrl + searchLyr.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + searchLyr.get("name") + "&Filter=<Filter>" + qryString + "</Filter>&OUTPUTFORMAT=GEOJSON";
                //console.log(searchUrl);
                var found = false;
                $.ajax({
                    url: searchUrl,
                    dataType: 'json',
                    beforeSend: function () {
                        $(".wait").show();
                    },
                    success: function (data) {
                        if (data.features.length > 0) {
                            found = true;
                            searchUtilities.renderQueryResultsAsTable(data, searchLyr.get("label"), searchLyr.get("name"), searchLyr.get("search_fields").split(','), searchLyr.get("identify_fields").split(','));
                            $('#modSearchResults').dialog({
                                position: { my: "right-70 top+50", at: "right top" }
                            });
                            //Always show the first tab as active
                            $('#searchResultsUl a').first().tab('show');
                        }
                    },
                    complete: function (response) {
                        $(".wait").hide();
                        if (!found) {
                            mapUtils.showMessage('warning', $.i18n._('_NOSEARCHRESULTS'), $.i18n._('_ERRORWARNING'));
                        }
                    },
                    async: true
                });
            }
        },
        setSearchAdvDialog: function (map) {
            $("#dlgKtimaAdv").dialog({
                title: $.i18n._("_KTIMAADVANCEDSEARCH"),
                autoOpen: false,
                height: 480,
                width: 320,
                position: { my: "right-70 top+50", at: "right top" },
                buttons: [
                    {
                        id: "btnSearchAdvanced1",
                        text: $.i18n._("_SEARCH"),
                        class: "btn btn-primary",
                        disabled: true,
                        click: function () {
                            $("#btnSearchAdvanced1").on("click", ktimaSearchAdvanced.doAdvancedSearch());
                            $("#txbArGeot").val("");
                            $("#txbOt").val("");
                            $("#btnSearchAdvanced1").prop('disabled', true);
                            $("#dlgKtimaAdv").dialog("close");
                        }
                    },
                    {
                        id: "btnCloseSearchAdvanced1",
                        text: $.i18n._("_CLOSE"),
                        class: "btn btn-default",
                        click: function () {
                            $("#dlgKtimaAdv").dialog("close");
                        }
                    }
                ],
                open: function (event) { // Add classes manually because of jqueryui classes overlapping
                    $('#dlgKtimaAdv').parent().addClass("cg_dialog_class");
                    document.getElementById("btnSearchAdvanced1").removeAttribute("class");
                    $('#btnSearchAdvanced1').addClass("btn btn-primary");
                    document.getElementById("btnCloseSearchAdvanced1").removeAttribute("class");
                    $('#btnCloseSearchAdvanced1').addClass("btn btn-default");
                    $('.glyphicon-resize-full').removeClass('ui-icon');
                    $('.glyphicon-resize-small').removeClass('ui-icon');
                }
            });
            ktimaSearchAdvanced.populateSearchLayerList(map);
        },
        populateSearchLayerList: function (map) {
            var htmlOpt = '';
            map.getLayers().forEach(function (layer, i) {
                var lyrName = layer.get('name');
                var lyrLabel = layer.get('label');
                var flds = layer.get("search_fields");
                if (typeof layer.get("queryable") !== "undefined" && layer.get("queryable") === true && typeof layer.get("search_fields") !== "undefined") {
                    htmlOpt = htmlOpt + '<option value="' + lyrName + "|" + flds + '">' + lyrLabel + '</option> ';
                }
            });
            $("#selSearchLayer1").empty();
            htmlOpt = '<option value="#">' + $.i18n._("_SELECT") + '...</option>' + htmlOpt;
            $("#selSearchLayer1").html(htmlOpt);
            $("#selSearchLayer1").on('change', function (e) {
                $("#divSearchFields1").empty();
                var val = $("#selSearchLayer1").val();
                if (val === "#") {
                    return false;
                }
                var srchFields1 = val.split('|')[1];
                ktimaSearchAdvanced.addSearchField(srchFields1);
            });
        },
        popOta: function () {
            var str = '';
            var searchLyr = legendUtilities.getLayerByName('pst_info_final');
            $.each(searchLyr.get("edit_fields"), function (i, editfld) {
                if (editfld.name.split(':')[0] === 'ONOMA_OTA') {
                    
                        if (typeof editfld.values !== "undefined") {
                            $.each(editfld.values, function (i, fldval) {
                                str = str + '<option value="' + fldval + '">' + fldval + '</option> ';
                            });
                        } 
                        
                    
                    return false;
                }
            });
            $('#cboSelOta').append(str);
        },
        addSearchOption: function (mymap) {
            ktimaSearchAdvanced.createDialog();
            ktimaSearchAdvanced.setSearchAdvDialog(mymap);
            ktimaSearchAdvanced.popOta();
        },
        printExistingParcel: function (ctrl) {
            var rawdata = $('#' + ctrl).val();
            // rawdata contains the full record for the row as string
            // so convert it to a js object
            var rowdata = JSON.parse(rawdata);
            // Get the geometry object and zoom to it
            searchUtilities.zoomToFeature(rowdata.geometry.type, JSON.stringify(rowdata.geometry.coordinates));
            // Remove the selection layer so we don't see the polygon highlighted
            var selLyr = searchUtilities.getSelectionLayer($map);
            selLyr.getSource().clear();
            // Create the poly layers
            ktimaUtils.initPolyLayers();
            // Add the current geometry in the polygon layer
            var lyrPoly = legendUtilities.getLayerByName("ktima_poly_layer");
            lyrPoly.getSource().clear();
            var vPolyFeat = new ol.Feature({
                geometry: new ol.geom.Polygon(rowdata.geometry.coordinates)
            });
            lyrPoly.getSource().addFeature(vPolyFeat);
            // Add the vertices layer
            var vCounter = 1;
            var lyrVertex = legendUtilities.getLayerByName("ktima_poly_vertex_layer");
            lyrVertex.getSource().clear();
            for (i = 0; i < rowdata.geometry.coordinates[0].length - 1; i++) {
                var coord = rowdata.geometry.coordinates[0][i];
                var vFeat = new ol.Feature({
                    geometry: new ol.geom.Point(coord),
                    labelPoint: new ol.geom.Point(coord),
                    vertex_id: vCounter
                });
                lyrVertex.getSource().addFeature(vFeat);
                vCounter++;
            }
            //Open print dialog
            ktimaUtils.openPrintDialog(vPolyFeat);
        }
    };
})(mymap);
$(document).ready(function () {
    ktimaSearchAdvanced.addSearchOption(mymap);
});