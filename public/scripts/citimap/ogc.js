var WxSUtils = (function () {
    return {
        createWxSDialog: function () {
            $.i18n.load(uiStrings);
            var dlgAddWMS = document.createElement('div');
            dlgAddWMS.setAttribute('id', 'dlgAddWMS');
            var divhtml = '<div class="container-fluid">' +
                '<div class="row">' +
                '    <div class="col-lg-9">' +
                '        <label for="txbWMSUrl">' + $.i18n._("_WXSURL") + '</label>' +
                '        <input type="url" class="form-control" id="txbWMSUrl" placeholder="' + $.i18n._("_WXSURLTT") + '" value="http://gis.thessaloniki.gr/geoserver/wms?">' +
                '        <input type="hidden" id="hidFInfoFormat">' +
                '    </div>' +
                '    <div class="col-lg-3">' +
                '        <label for="cboWXSType">' + $.i18n._("_WXSTYPE") + '</label>' +
                '        <select class="form-control" id="cboWXSType">' +
                '           <option value="WMS">WMS</option>' +
                '           <option value="WFS">WFS</option>' +
                '        </select>' +
                '    </div>' +
                '</div>' +
                '<div class="row">' +
                '    <div class="col-lg-12">' +
                '        <label for="txbWMSUrl">' + $.i18n._("_SEARCH") + '</label>' +
                '        <input type="text" class="form-control" id="txbSearchLyr" onkeypress="WxSUtils.searchOgcList();" placeholder="' + $.i18n._("_SEARCH") + '" value="">' +
                '   </div>' +
                '</div>' +

                '<div class="row" id="divWMSLayerList">' +
                '    <div class="col-lg-12">' +
                '       <label for="lsWMSLayerList">' + $.i18n._("_WXSAVAILABLELYRS") + '</label>' +
                '       <div class="list-group ogc-layer-list" id="lsWMSLayerList">' +
                '           <div class="list-group-item list-group-item-warning">' + $.i18n._("_WXSNOLYRS") + '</div>' +
                '       </div>' +
                '    </div>' +
                '</div>' +
                '<div class="row" id="divSridList">' +
                '    <div class="col-lg-12">' +
                '        <label for="lsSrid">' + $.i18n._("_CS") + '</label>' +
                '        <select class="form-control" id="lsSrid">' +
                '        </select>' +
                '    </div>' +
                '</div>' +
                '<div class="row" id="divWMSLayerList">' +
                '    <div class="col-lg-12">' +
                '        <label for="txbWMSUrl">' + $.i18n._("_WXSABSTRACT") + '</label>' +
                '        <textarea type="text" class="form-control" id="txbWMSAbstract" readonly></textarea>' +
                '    </div>' +
                '</div>' +

                '</div>';
            $(dlgAddWMS).append(divhtml);
            $(dlgAddWMS).appendTo($("#mainparent"));
            WxSUtils.setWxSDialog();
        },
        searchOgcList: function () {
            var s= $("#txbSearchLyr").val();
            if (s === '') {
                $("#lsWMSLayerList").children("a").show();
            } else {
                $("#lsWMSLayerList").children("a").not(":contains(" + s + ")").hide();
            }
        },
        setWxSDialog: function () {
            $("#dlgAddWMS").dialog({
                title: $.i18n._("_ADDWXSTITLE"),
                autoOpen: false,
                height: 600,
                width: 700,
                minheight: 300,
                minwidth: 300,
                //position: { my: "right-5 top+60", at: "right-5 top+60" },
                buttons: [
                    {
                        id: "btnAddWxS",
                        text: $.i18n._("_WXSADD"),
                        disabled: true,
                        class: "btn btn-primary",
                        click: function () {
                            var ctrlid = '';
                            $('#lsWMSLayerList').children('a').each(function () {
                                if (this.classList.contains('active')) {
                                    ctrlid = this.id;
                                    return false;
                                }
                            });
                            if (ctrlid === '') {
                                return;
                            }
                            var lyrname = document.getElementById("hid_" + ctrlid.substring(ctrlid.indexOf('_') + 1)).value.split('|')[0];
                            var lyrtitle = document.getElementById("hid_" + ctrlid.substring(ctrlid.indexOf('_') + 1)).value.split('|')[1];
                            var lyrurl = document.getElementById("hid_" + ctrlid.substring(ctrlid.indexOf('_') + 1)).value.split('|')[3];
                            var lyrinfo_format = document.getElementById("hid_" + ctrlid.substring(ctrlid.indexOf('_') + 1)).value.split('|')[4];
                            var lyrqueryable = document.getElementById("hid_" + ctrlid.substring(ctrlid.indexOf('_') + 1)).value.split('|')[5];
                            var wxsType = $("#cboWXSType").val();
                            var srid = $('#lsSrid').val();
                            if (wxsType === "WMS") {
                                WxSUtils.addWMSLayer(lyrname, lyrtitle, lyrurl, srid, lyrinfo_format, lyrqueryable, true);
                            } else if (wxsType === "WFS") {
                                WxSUtils.addWFSLayer(lyrname, lyrtitle, lyrurl, srid, lyrinfo_format, lyrqueryable);
                            }
                        }
                    },
                    {
                        id: "btnConnectToUrl",
                        text: $.i18n._("_WXSCONNECT"),
                        class: "btn btn-primary",
                        click: function () {
                            WxSUtils.getWxSCapabilities($("#cboWXSType").val());
                        }
                    },
                    {
                        id: "btnCloseAddWMS",
                        text: $.i18n._("_CLOSE"),
                        class: "btn btn-default",
                        click: function () {
                            $("#dlgAddWMS").dialog("close");
                        }
                    }
                ],
                open: function (event) { // Add classes manually because of jqueryui classes overlapping
                    $('#dlgAddWMS').parent().addClass("cg_dialog_class");
                    document.getElementById("btnAddWxS").removeAttribute("class");
                    $('#btnAddWxS').addClass("btn btn-primary");
                    document.getElementById("btnConnectToUrl").removeAttribute("class");
                    $('#btnConnectToUrl').addClass("btn btn-primary");
                    document.getElementById("btnCloseAddWMS").removeAttribute("class");
                    $('#btnCloseAddWMS').addClass("btn btn-default");
                    $('#btnAddWxS').prop("disabled", true);
                    $('#lsSrid').prop("disabled", false);
                    $('#lsSrid').empty();
                    $('.glyphicon-resize-full').removeClass('ui-icon');
                    $('.glyphicon-resize-small').removeClass('ui-icon');
                }
            });
        },
        getWxSCapabilities: function (type) {
            $('#lsWMSLayerList').empty();

            var url = $('#txbWMSUrl').val();
            if (!url.endsWith("?")) {
                url = url + "?";
            }
            var parser;
            if (type === "WMS") {
                parser = new ol.format.WMSCapabilities();
            }

            var gcUrl = proxyUrl + url + "SERVICE=" + type + "&REQUEST=GetCapabilities";
            $.ajax({
                type: "GET",
                url: gcUrl,
                dataType: "xml",
                success: function (xml) {
                    $('#lsWMSLayerList').empty();

                    var info_format = "";
                    if (type === "WMS") {
                        var wmsCapabilitiesObj = parser.read(xml);
                        try {
                            $.each(wmsCapabilitiesObj.Capability.Request.GetFeatureInfo.Format, function (key, frmt) {
                                if (frmt.includes("json")) {
                                    $('#hidFInfoFormat').val(frmt);
                                    info_format = frmt;
                                    return false;
                                }
                            });
                        }
                        catch (e) {
                            console.log("WMS service is not queryable");
                        }
                        $.each(wmsCapabilitiesObj.Capability.Layer.Layer, function (key, lyr) {
                            var lyrname = lyr.Name;
                            var isqueryable = lyr.queryable;
                            if (typeof isqueryable === "undefined") {
                                isqueryable = false;
                            } else {
                                if (isqueryable === "1" || isqueryable) {
                                    isqueryable = true;
                                } else {
                                    isqueryable = false;
                                }
                            }
                            if (lyrname.includes(":")) {
                                lyrname = lyrname.split(":")[1];
                            }
                            $('#lsWMSLayerList').append('<a id="wmsLyr_' + lyrname + '" href="#" class="list-group-item" onclick="WxSUtils.selectWxSLayer(this);">' + lyr.Title +
                                '</a><input id="hid_' + lyrname + '" type="hidden" value="' + lyrname + '|' + lyr.Title + '|' + lyr.Abstract + '|' + url + '|' + info_format + '|' + isqueryable + '" />');
                            $('#lsSrid').empty();
                            if (typeof lyr.CRS !== "undefined") {
                                $.each(lyr.CRS, function (key, srid) {
                                    $('#lsSrid').append('<option value="' + srid + '">' + srid + '</option> ');
                                });
                            } else if (typeof lyr.SRS !== "undefined") {
                                $.each(lyr.SRS, function (key, srid) {
                                    $('#lsSrid').append('<option value="' + srid + '">' + srid + '</option> ');
                                });
                            }
                            // Make the current SRID selected
                            $('#lsSrid option[value="' + projcode + '"]').prop('selected', 'selected');
                        });
                    } else if (type === "WFS") {
                        var wfsCapabilitiesObj = JSON.parse(xml2json(xml, " "));
                        //$.each(wfsCapabilitiesObj["wfs:WFS_Capabilities"].FeatureTypeList.FeatureType, function (key, frmt) {
                        $.each(wfsCapabilitiesObj["wfs:WFS_Capabilities"]["ows:OperationsMetadata"]["ows:Operation"], function (key, op) { //[0]["@name"]
                            if (op["@name"] === "GetFeature") {
                                $.each(op["ows:Parameter"], function (key, param) {
                                    if (param["@name"] === "outputFormat") {
                                        $.each(param["ows:AllowedValues"]["ows:Value"], function (key, val) {
                                            if (val.includes("json")) {
                                                info_format = val;
                                                return false;
                                            }
                                        });
                                    }
                                });
                            }
                        }); //else if (frmt.includes("xml")) {
                        if (info_format === "") {
                            alert("does not support JSON requests");
                            return false;
                        }
                        $.each(wfsCapabilitiesObj["wfs:WFS_Capabilities"].FeatureTypeList.FeatureType, function (key, lyr) {
                            var lyrname = lyr.Name;
                            var isqueryable = lyr.queryable;
                            isqueryable = true;

                            if (lyrname.includes(":")) {
                                lyrname = lyrname.split(":")[1];
                            }
                            $('#lsWMSLayerList').append('<a id="wmsLyr_' + lyrname + '" href="#" class="list-group-item" onclick="WxSUtils.selectWxSLayer(this);">' + lyr.Title +
                                '</a><input id="hid_' + lyrname + '" type="hidden" value="' + lyrname + '|' + lyr.Title + '|' + lyr.Abstract + '|' + url + '|' + info_format + '|' + isqueryable + '" />');
                            $('#lsSrid').empty();
                            if (typeof lyr.CRS !== "undefined") {
                                $.each(lyr.CRS, function (key, srid) {
                                    $('#lsSrid').append('<option value="' + srid + '">' + srid + '</option> ');
                                });
                            } else if (typeof lyr.SRS !== "undefined") {
                                $.each(lyr.SRS, function (key, srid) {
                                    $('#lsSrid').append('<option value="' + srid + '">' + srid + '</option> ');
                                });
                            }
                            // Make the current SRID selected
                            $('#lsSrid option[value="' + projcode + '"]').prop('selected', 'selected');
                        });
                    }
                },
                complete: function (response) {
                    $(".wait").hide();
                },
                error: function (err) {
                    mapUtils.showMessage('danger', err.responseText, $.i18n._('_ERROROCCUREDTITLE'));
                }
            });
        },
        selectWxSLayer: function (ctrl) {
            $('#txbWMSAbstract').empty();
            $('#lsWMSLayerList').children('a').each(function () {
                this.classList.remove('active');
            });
            document.getElementById(ctrl.id).classList.add('active');
            var abstr = document.getElementById("hid_" + ctrl.id.substring(ctrl.id.indexOf('_') + 1)).value.split('|')[2];
            $('#txbWMSAbstract').val(abstr);
            $('#btnAddWxS').prop("disabled", false);
            $('#lsSrid').prop("disabled", false);
        },
        addWMSLayer: function (lyrname, lyrtitle, lyrurl, srid, info_format, isqueryable, candelete) {
            //console.log(lyrname);
            //console.log(lyrtitle);
            //console.log(lyrurl);
            if (typeof srid === "undefined" || srid === "" || srid === null) {
                srid = projcode;
            }
            var tmplyr =
                new ol.layer.Image({
                    source: new ol.source.ImageWMS({
                        url: proxyUrl + lyrurl + "?",
                        params: {
                            'LAYERS': lyrname,
                            'CRS': srid,
                            'INFO_FORMAT': $('#hidFInfoFormat').val()
                        },
                        crossOrigin: 'anonymous'
                    })
                });
            tmplyr.set('name', lyrname);
            tmplyr.set('label', lyrtitle);
            tmplyr.set("tag", ["WMS", lyrurl]);
            tmplyr.set('identify_fields', []);
            tmplyr.set('search_fields', []);
            if (typeof info_format === "undefined" || info_format === "undefined" || info_format === "" || isqueryable === false) {
                tmplyr.set('queryable', false);
            } else {
                tmplyr.set('queryable', true);
            }

            tmplyr.set('exportable', false);
            tmplyr.set('editable', false);
            tmplyr.set('srid', srid);
            tmplyr.set('feature_info_format', info_format);
            tmplyr.set('candelete', candelete);
            mymap.addLayer(tmplyr);
            legendUtilities.addLayerToLegend(mymap, tmplyr, true);
            mapUtils.showMessage('success', $.i18n._('_LAYERADDED'), $.i18n._('_LAYERADDTITLE'));
            return tmplyr;
        },
        addWFSLayer: function (lyrname, lyrtitle, lyrurl, srid, info_format, isqueryable) {
            if (!isqueryable) { return null; }
            var tmpvector = new ol.layer.Vector({
                source: new ol.source.Vector({
                    format: new ol.format.GeoJSON({ defaultDataProjection: projcode, featureProjection: projcode }),
                    url: function (extent) {
                        //console.log(extent);
                        return proxyUrl + lyrurl + '&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=' + lyrname + '&outputFormat=' + info_format + '&'
                            + 'bbox=' + extent.join(',');
                    },
                    strategy: ol.loadingstrategy.bbox,
                    crossOrigin: 'anonymous'
                }),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#0080ff96',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#0080ff96'
                        })
                    }),
                }),
                //defaultDataProjection: projection
                maxResolution: 50
            });
            tmpvector.set('name', lyrname);
            tmpvector.set('label', lyrtitle);
            tmpvector.set("tag", ["GeoJSON", lyrurl]);
            tmpvector.set('identify_fields', []);
            tmpvector.set('search_fields', []);
            if (typeof info_format === "undefined" || info_format === "undefined" || info_format === "" || isqueryable === false) {
                tmpvector.set('queryable', false);
            } else {
                tmpvector.set('queryable', true);
            }

            tmpvector.set('exportable', false);
            tmpvector.set('editable', false);
            tmpvector.set('srid', srid);
            tmpvector.set('feature_info_format', info_format);
            tmpvector.set('candelete', true);
            mymap.addLayer(tmpvector);
            legendUtilities.addLayerToLegend(mymap, tmpvector, true);
            mapUtils.showMessage('success', $.i18n._('_LAYERADDED'), $.i18n._('_LAYERADDTITLE'));
            return tmpvector;
        }
    };
})();
$(document).ready(function () {
    WxSUtils.createWxSDialog();
});