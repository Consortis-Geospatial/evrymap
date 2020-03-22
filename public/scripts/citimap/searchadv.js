/**
 * Includes functions to control the Advanced Search dialog
 * @namespace searchAdvanced
 */
var searchAdvanced = (function (mymap) {
    return {
         /**
         * Creates the HTML for the Advanced Search dialog
         * and appends it the #mainparent div
         * @function createDialog
         * @memberof searchAdvanced
         */
        createDialog: function () {
            $.i18n.load(uiStrings);
            var dlgSearchAdv = document.createElement('div');
            dlgSearchAdv.setAttribute('id', 'dlgSearchAdv');
            var divhtml = '<div class="container-fluid">' +
                '<div class="row">' +
                '    <div class="col-lg-9">' +
                '        <label for="selSearchLayer">' + $.i18n._("_SELECTLAYERADV") + '</label>' +
                '        <select class="form-control" id="selSearchLayer">' +
                '        </select>' +
                '    </div>' +
                '    <div class="col-lg-3">' +
                '        <label for="chkSS">' + $.i18n._("_SPATIALSELECT") + '</label>' +
                '        <input type="checkbox" data-toggle="toggle" id="chkSS" value="">' +
                '    </div>' +
                '</div>' +
                '<div class="row" id="divSearchFields">' +
                '</div>' +
                '</div>';
            $(dlgSearchAdv).append(divhtml);
            $(dlgSearchAdv).appendTo($("#mainparent"));

        },
        /**
         * Adds an additional search field row
         * in the dialog
         * @function addSearchField
         * @memberof searchAdvanced
         */
        addSearchField: function (srchFields) {
            var fldCount = $('.query_field').length;
            var curCount = fldCount + 1;
            var totalfldCount = srchFields.split(',').length;
            var str = '<div class="query_field" id="query_field' + curCount + '">';
            if (fldCount === 0) {
                str = str + '<div class="col-lg-12">';
                str = str + '       <select class="form-control" id="cboJoinType" disabled>';
                str = str + '<option value="AND">' + $.i18n._("_ANDOPERATOR") + '</option> ';
                str = str + '<option value="OR">' + $.i18n._("_OROPERATOR") + '</option> ';
                str = str + '  </select>';
                str = str + '</div>';
            } else {
                $("#cboJoinType").prop("disabled", false);
            }
            str = str + '<div class="col-lg-2">';
            str = str + '       <span class="btn-group" role="group">';
            if (totalfldCount !== fldCount + 1) {
                str = str + '           <button type="button" title="' + $.i18n._("_ADDSEARCHFIELD") + '" class="btn btn-success" onclick="searchAdvanced.addSearchField(\'' + srchFields + '\')"><span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span></button>';
            }
            if (fldCount > 0) {
                str = str + '           <button type = "button" title="' + $.i18n._("_REMOVESEARCHFIELD") + '"  class="btn btn-danger" onclick="searchAdvanced.removeSearchField(\'query_field' + curCount + '\')"><span class="glyphicon glyphicon-minus-sign" aria-hidden="true"></span></button>';
            }
            str = str + '       </span> ';
            str = str + '</div>';
            str = str + '   <div class="col-lg-3">';
            str = str + '       <select class="form-control fieldselect" id="fieldselect_' + curCount + '">';
            str = str + '<option value="#">' + $.i18n._("_SELECT") + '...</option> ';
            $.each(srchFields.split(','), function (i, fld) {
                str = str + '<option value="' + fld.split(':')[0] + '">' + fld.split(':')[1] + '</option> ';
            });
            str = str + '  </select>';
            str = str + '</div>';

            str = str + ' <div class="col-lg-3">';
            str = str + '       <select class="form-control fieldoperator">';
            str = str + '<option value="=">' + $.i18n._("_SEARCHOPEQUAL") + '</option> ';
            str = str + '<option value="<>">' + $.i18n._("_SEARCHOPNOTEQUAL") + '</option> ';
            str = str + '<option value=">">' + $.i18n._("_SEARCHOPGREATERTHAN") + '</option> ';
            str = str + '<option value="<">' + $.i18n._("_SEARCHOPLESSTHAN") + '</option> ';
            str = str + '<option value=">=">' + $.i18n._("_SEARCHOPGREATEROREQUAL") + '</option> ';
            str = str + '<option value="<=">' + $.i18n._("_SEARCHOPLESSOREQUAL") + '</option> ';
            str = str + '<option value="LIKE">' + $.i18n._("_SEARCHOPISLIKE") + '</option> ';
            str = str + '<option value="STARTSWITH">' + $.i18n._("_SEARCHOPSTARTSWITH") + '</option> ';
            str = str + '<option value="ENDSWITH">' + $.i18n._("_SEARCHOPENDSWITH") + '</option> ';
            str = str + '  </select>';
            str = str + '</div>';
            str = str + ' <div class="col-lg-4" id="valdiv_' + curCount + '">';

            str = str + '</div>';
            str = str + '</div>';
            $("#divSearchFields").append(str);

            $('#fieldselect_' + curCount).on('change', function () {
                searchAdvanced.selSearchField(this.id);
            });
        },
        /**
         * Change event when selecting a search field
         * If the field contains a definion in the "edit_fields" array
         * in the *layerconfig.json the value control will be rendered accordingly
         * as a text or dropdown
         * @function selSearchField
         * @memberof searchAdvanced
         */
        selSearchField: function (selid) {
            var str = '';
            //console.log(selid);
            var suffix = selid.split('_')[1];
            //console.log(suffix);
            var fldname = $('#' + selid).val();
            if (fldname === "#") {
                $('#valdiv_' + suffix).empty();
                return;
            }
            var searchLyr = legendUtilities.getLayerByName($("#selSearchLayer").val().split("|")[0]);
            if (typeof searchLyr.get("edit_fields") !== "undefined") {
                $.each(searchLyr.get("edit_fields"), function (i, editfld) {
                    if (editfld.name.split(':')[0] === fldname) {
                        if (editfld.control === "dropdown") {
                            var str = '   <select class="form-control fieldval" id="fieldval_' + suffix + '">';
                            if (typeof editfld.values !== "undefined") {
                                $.each(editfld.values, function (i, fldval) {
                                    str = str + '<option value="' + fldval + '">' + fldval + '</option> ';
                                });
                            } else if (typeof editfld.service_url !== "undefined") {
                                var vals = searchAdvanced.popSearchValList(editfld.service_url);
                                if (vals !== null && vals !== false && typeof vals !== "undefined") {
                                    str = str + '<option value="#">' + $.i18n._('_SELECT') + '...</option>';
                                    $.each(vals, function (key, valueObj) {
                                        str = str + "<option value='" + key + "'>" + valueObj + "</option>";
                                    });
                                } else {
                                    $('#valdiv_' + suffix).empty();
                                    $('#valdiv_' + suffix).append('<input type="text" class="form-control fieldval">');
                                    return false;
                                }
                            }
                            str = str + '</select>';
                            $('#valdiv_' + suffix).empty();
                            $('#valdiv_' + suffix).append(str);
                        } else {
                            $('#valdiv_' + suffix).empty();
                            $('#valdiv_' + suffix).append('<input type="text" class="form-control fieldval">');
                        }
                        return false;
                    }
                });
            } else {
                $('#valdiv_' + suffix).append('<input type="text" class="form-control fieldval">');
            }
        },
        /**
         * Populates the value dropdown for a search field
         * This will only occur if the field contains a definion in the "edit_fields" array
         * in the *layerconfig.json 
         * @function popSearchValList
         * @memberof searchAdvanced
         */
        popSearchValList: function (url) {
            var retVal;
            var enc = $('#hidEnc').val();
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONDESCR'), $.i18n._('_NOCONNECTIONTITLE'));
                return false;
            }
            var params = {
                "enc": enc
            };
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
        /**
         * Formulates the WFS GetFeature request string
         * based on the search criteria
         * @function doAdvancedSearch
         * @memberof searchAdvanced
         */
        doAdvancedSearch: function () {
            var qryString = '';
            var c = 0;
            $('.query_field').each(function (i, divqryrow) {
                var fldname = $('#' + divqryrow.id).find('.fieldselect:first').val();
                var op = $('#' + divqryrow.id).find('.fieldoperator:first').val();
                var v = $('#' + divqryrow.id).find('.fieldval:first').val();
                if (typeof v === "undefined") {
                    return false;
                }
                if (op === "=") {
                    qryString = qryString + "<PropertyIsEqualTo matchCase=false>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>" + v + "</Literal></PropertyIsEqualTo>";
                } else if (op === "<>") {
                    qryString = qryString + "<PropertyIsNotEqualTo matchCase=false>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>" + v + "</Literal></PropertyIsNotEqualTo>";
                } else if (op === ">") {
                    qryString = qryString + "<PropertyIsGreaterThan>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>" + v + "</Literal></PropertyIsGreaterThan>";
                } else if (op === "<") {
                    qryString = qryString + "<PropertyIsLessThan>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>" + v + "</Literal></PropertyIsLessThan>";
                } else if (op === ">=") {
                    qryString = qryString + "<PropertyIsGreaterOrEqualTo>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>" + v + "</Literal></PropertyIsGreaterOrEqualTo>";
                } else if (op === "<=") {
                    qryString = qryString + "<PropertyIsLessOrEqualTo>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>" + v + "</Literal></PropertyIsLessOrEqualTo>";
                } else if (op === "LIKE") {
                    qryString = qryString + "<PropertyIsLike wildcard='*' singleChar='.' escape='!' matchCase=false>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>*" + v + "*</Literal></PropertyIsLike>";
                } else if (op === "STARTSWITH") {
                    qryString = qryString + "<PropertyIsLike wildcard='*' singleChar='.' escape='!' matchCase=false>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>" + v + "*</Literal></PropertyIsLike>";
                } else if (op === "ENDSWITH") {
                    qryString = qryString + "<PropertyIsLike wildcard='*' singleChar='.' escape='!' matchCase=false>";
                    qryString = qryString + "<PropertyName>" + fldname + "</PropertyName><Literal>*" + v + "</Literal></PropertyIsLike>";
                }

                c++;
            });

            //console.log(qryString);
            if (qryString === "") {
                // No attribute criteria. Check spatial criteria
                if ($('#chkSS').length > 0) {
                    if (!$('#chkSS').prop("checked") || $("#selSelectedFeatures").val() === "-1" || $("#selSpatialOps").val() === "-1") {
                        mapUtils.showMessage('warning', $.i18n._('_NOSEARCHFIELDS'), $.i18n._('_ERRORWARNING'));
                    } else {
                        var sQueryString = '';
                        var slname = $("#selSelectedFeatures").val().split(':')[0];
                        var fcount = parseInt($("#selSelectedFeatures").val().split(':')[2]);
                        if (fcount > 1) {
                            sQueryString = +sQueryString + '<AND>';
                        }
                        sQueryString = sQueryString + '<' + $("#selSpatialOps").val() + '>';
                        // TODO: We only use the default msGeometry as the spatial column
                        // TODO: which means this will only work for layer from mapserver
                        // TODO: We should issue a DescribeFeatureType request first to be
                        // TODO: safe
                        sQueryString = sQueryString + '<PropertyName>msGeometry</PropertyName>';
                        var squery = spatialSearch.getSelectedGeomAsGML(slname);
                        sQueryString = sQueryString + squery;
                        if ($("#selSpatialOps").val() === "DWITHIN") { // Within Distance operator so need to add the distance and units
                            if ($("#txbDWithin").val().trim() === "") {
                                // TODO: Display correct warning
                                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHFIELDS'), $.i18n._('_ERRORWARNING'));
                                return false;
                            } else {
                                sQueryString = sQueryString + '<Distance units=\'' + $('#txbDWithinUnits').text() + '\'>' + $("#txbDWithin").val() + '</Distance></' + $("#selSpatialOps").val() + '>';
                            }
                        } else {
                            sQueryString = sQueryString + '</' + $("#selSpatialOps").val() + '>';
                        }
                        if (fcount > 1) {
                            sQueryString = +sQueryString + '</AND>';
                        }
                        //console.log(sQueryString);
                        // generate a GetFeature request
                        var searchLyr = legendUtilities.getLayerByName($("#selSearchLayer").val().split("|")[0]);
                        var searchUrl;
                        if (window.location.host === $('#hidMS').val().split('/')[0]) {
                            searchUrl = searchLyr.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + searchLyr.get("name") + "&Filter=<Filter>" + sQueryString + "</Filter>&OUTPUTFORMAT=GEOJSON";

                        } else {
                            searchUrl = searchLyr.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + searchLyr.get("name") + "&Filter=<Filter>" + sQueryString + "</Filter>&OUTPUTFORMAT=GEOJSON";
                        }
                        //console.log(searchUrl);
                        searchAdvanced.getWFSFeatureResults(searchUrl, searchLyr);
                    }
                } else {
                    mapUtils.showMessage('warning', $.i18n._('_NOSEARCHFIELDS'), $.i18n._('_ERRORWARNING'));
                }
            } else { // Attribute criteria set
                hasSpatialCriteria=false;
                if ($('#chkSS').length > 0 && $('#chkSS').prop("checked") && $("#selSelectedFeatures").val() !== "-1" || $("#selSpatialOps").val() !== "-1") {
                    qryString = qryString + '<' + $("#selSpatialOps").val() + '>';
                    qryString = qryString + '<PropertyName>msGeometry</PropertyName>';
                    var slname1 = $("#selSelectedFeatures").val().split(':')[0];
                    var squery1 = spatialSearch.getSelectedGeomAsGML(slname1);
                    qryString = qryString + squery1;
                    hasSpatialCriteria=true;
                }
                if (c > 1 || hasSpatialCriteria) { // More than one attribute criteria  or spatial criteria set. Add <AND> or <OR> operator to the query
                    if (hasSpatialCriteria) {
                        if ($("#selSpatialOps").val() === "DWITHIN") { // Within Distance operator so need to add the distance and units
                            if ($("#txbDWithin").val().trim() === "") {
                                // TODO: Display correct warning
                                mapUtils.showMessage('warning', $.i18n._('_NOSEARCHFIELDS'), $.i18n._('_ERRORWARNING'));
                                return false;
                            } else {
                                qryString = "<" + $("#cboJoinType").val() + ">" + qryString + '<Distance units=\'' + $('#txbDWithinUnits').text() + '\'>' + $("#txbDWithin").val() + '</Distance></' + $("#selSpatialOps").val() + '></' + $("#cboJoinType").val() + '>';
                            }
                        } else {
                            qryString = "<" + $("#cboJoinType").val() + ">" + qryString + "</" + $("#selSpatialOps").val() + "></" + $("#cboJoinType").val() + ">";
                        }
                    } else {
                        qryString = "<" + $("#cboJoinType").val() + ">" + qryString + "</" + $("#cboJoinType").val() + ">";
                    }
                }
                // generate a GetFeature request
                var searchLyr = legendUtilities.getLayerByName($("#selSearchLayer").val().split("|")[0]);
                var searchUrl;
                if (window.location.host === $('#hidMS').val().split('/')[0]) {
                    searchUrl = searchLyr.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + searchLyr.get("name") + "&Filter=<Filter>" + qryString + "</Filter>&OUTPUTFORMAT=GEOJSON";

                } else {
                    searchUrl = proxyUrl + searchLyr.get("tag")[1] + "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=" + searchLyr.get("name") + "&Filter=<Filter>" + qryString + "</Filter>&OUTPUTFORMAT=GEOJSON";
                }
                //console.log(searchUrl);
                searchAdvanced.getWFSFeatureResults(searchUrl, searchLyr);

            }
        },
        /**
         * Executes the WFS GetFeature request
         * @param {string} url The GetFeature url
         * @param {object} searchLyr The layer object
         * @function doAdvancedSearch
         * @memberof searchAdvanced
         */
        getWFSFeatureResults: function (url, searchLyr) {
            var found = false;
            $.ajax({
                url: url,
                dataType: 'json',
                beforeSend: function () {
                    $(".wait").show();
                },
                success: function (data) {
                    if (data.features.length > 0) {
                        found = true;
                        searchUtilities.renderQueryResultsAsTable(data, searchLyr.get("label"), searchLyr.get("name"), searchLyr.get("search_fields").split(','), searchLyr.get("identify_fields").split(','));
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

        },
        /**
         * Removes a search field
         * @param {string} fldid The control id to remove
         * @function removeSearchField
         * @memberof searchAdvanced
         */
        removeSearchField: function (fldid) {
            $('#' + fldid).remove();
            var fldCount = $('.query_field').length;
            if (fldCount === 1) {
                $("#cboJoinType").prop("disabled", true);
            }
        },
        /**
         * Activates the Advanced Search dialog as a jQueryUI dialog
         * @param {object} map The map object
         * @function setSearchAdvDialog
         * @memberof searchAdvanced
         */
        setSearchAdvDialog: function (map) {
            $("#dlgSearchAdv").dialog({
                title: $.i18n._("_ADVANCEDSEARCH"),
                autoOpen: false,
                height: 423,
                width: 700,
                //position: { my: "right-5 top+60", at: "right-5 top+60" },
                buttons: [{
                        id: "btnSearchAdvanced",
                        text: $.i18n._("_SEARCH"),
                        class: "btn btn-primary",
                        disabled: true,
                        click: function () {
                            $("#btnSearchAdvanced").on("click", searchAdvanced.doAdvancedSearch());
                        }
                    },
                    {
                        id: "btnCloseSearchAdvanced",
                        text: $.i18n._("_CLOSE"),
                        class: "btn btn-default",
                        click: function () {

                            $("#dlgSearchAdv").dialog("close");
                        }
                    }
                ],
                open: function (event) { // Add classes manually because of jqueryui classes overlapping
                    $('#dlgSearchAdv').parent().addClass("cg_dialog_class");
                    document.getElementById("btnSearchAdvanced").removeAttribute("class");
                    $('#btnSearchAdvanced').addClass("btn btn-primary");
                    document.getElementById("btnCloseSearchAdvanced").removeAttribute("class");
                    $('#btnCloseSearchAdvanced').addClass("btn btn-default");
                    $('.glyphicon-resize-full').removeClass('ui-icon');
                    $('.glyphicon-resize-small').removeClass('ui-icon');
                },
                close: function (event) {
                    //Check if spatial search controls are present
                    // and reset them
                    if ($('#chkSS').length > 0) {
                        $('#chkSS').bootstrapToggle('off');
                        $("#selSelectedFeatures").empty();
                    }
                }

            });
            $("#selSearchLayer").change(function () {
                if ($("#selSearchLayer").val() === "#") {
                    $("#btnSearchAdvanced").prop('disabled', true);
                    $("#btnSearchAdvanced").button("disable");
                } else {
                    $("#btnSearchAdvanced").prop('disabled', false);
                    $("#btnSearchAdvanced").button("enable");
                }
            });
            searchAdvanced.populateSearchLayerList(map);
        },
        /**
         * Populates the #selSearchLayer dropdown
         * and binds its onchange event
         * @param {object} map The map object
         * @function populateSearchLayerList
         * @memberof searchAdvanced
         */
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
            $("#selSearchLayer").empty();
            htmlOpt = '<option value="#">' + $.i18n._("_SELECT") + '...</option>' + htmlOpt;
            $("#selSearchLayer").html(htmlOpt);
            $("#selSearchLayer").on('change', function (e) {
                $("#divSearchFields").empty();
                var val = $("#selSearchLayer").val();
                if (val === "#") {
                    return false;
                }
                var srchFields = val.split('|')[1];
                //console.log(srchFields);
                searchAdvanced.addSearchField(srchFields);
            });
        },
        /**
         * Adds the Advanced search option in the main
         * search dropdown and creates the Advanced Search dialog
         * @param {object} mymap The map object
         * @function addSearchOption
         * @memberof searchAdvanced
         */
        addSearchOption: function (mymap) {
            searchAdvanced.createDialog();
            searchAdvanced.setSearchAdvDialog(mymap);
            var str = '<li><a id="btnWMSearch" href="#" onclick=" $(\'#dlgSearchAdv\').dialog(\'open\');">' + $.i18n._("_ADVANCEDSEARCH") + '</a></li>';
            $('#searchOpt').append(str);
        }
    };
})(mymap);
$(document).ready(function () {
    searchAdvanced.addSearchOption(mymap);
});