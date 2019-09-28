var urbanPlanning = (function (mymap) {
    return {
        createUI: function () {
            var upbtn = '<button class="btn btn-primary bottomtb" id = "btnUrbanPlanning" title="Πολεοδομικά δεδομένα">' +
                '       <img src="css/images/icons8-city-filled-50.png" style="width: 20px;filter: invert(100%);" />' +
                '    </button >';
            $('#bottomToolbar').append(upbtn);
            var updDlg = '' +
                '<div id="urbanDocsModal" class="modal" role="dialog" data-backdrop="static"> ' +
                '   <div class="modal-dialog">' +
                '       <div class="modal-content">' +
                '           <div class="modal-header modal-header-primary">' +
                '               <button type="button" class="close" data-dismiss="modal">×</button>' +
                '               <h3 class="modal-title">Πολεοδομικά δεδομένα</h3>' +
                '               <h5 class="card-subtitle" id="subTileOnInfo" style="font-size: 12px;"></h5>' +
                '           </div>' +
                '           <div class="modal-body">' +
                '               <div class="panel-group" id="accordion-rt">' +
                '                            <div class="panel panel-default">' +
                '                               <div id="rt_div" class="panel-heading accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion-rt" href="#collapse1">' +
                '                                   <h4 class="panel-title">' +
                '                                       <a id="acc_rd" href="#">Ρυμοτομικά διατάγματα&nbsp;<span id="badge_rd" class="badge">1</span></a>' +
                '                                       <input type="hidden" id="rd_hid" value="1">' +
                '                                   </h4>' +
                '                               </div>' +
                '                               <div id="collapse1" class="panel-collapse collapse">' +
                '                                   <div class="panel-body">' +
                '                                       <div class="container-fluid" style="max-height: 155px; overflow-y: auto;">' +
                '                                           <div id="docsTable" class="col-lg-4">' +
                '                                               <ul id="infoDocsRD" class="list-group"></ul>' +
                '                                           </div>' +
                '                                           <div id="restInfoRD" class="col-lg-8"></div>' +
                '                                       </div>' +
                '                                   </div>' +
                '                               </div>' +
                '                            </div>' +
                '                            <div id="panelPT" class="panel panel-default">' +
                '                               <div id="pt_div" class="panel-heading accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion-rt" href="#collapse2">' +
                '                                   <h4 class="panel-title">' +
                '                                       <a id="acc_pt">Πράξεις τακτοποίησης&nbsp;<span id="badge_pt" class="badge">0</span></a>' +
                '                                       <input type="hidden" id="pt_hid" value="0">' +
                '                                   </h4>' +
                '                               </div>' +
                '                               <div id="collapse2" class="panel-collapse collapse">' +
                '                                   <div class="panel-body">' +
                '                                       <div class="container-fluid" style="max-height: 155px; overflow-y: auto;">' +
                '                                           <div id="docsTablePT" class="col-lg-4">' +
                '                                               <ul id="infoDocsPT" class="list-group"></ul>' +
                '                                           </div>' +
                '                                           <div id="restInfoPT" class="col-lg-8"></div>' +
                '                                       </div>' +
                '                                   </div>' +
                '                               </div>' +
                '                            </div>' +
                '                            <div id="panelXG" class="panel panel-default">' +
                '                                <div id="xg_div" class="panel-heading accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion-rt" href="#collapse3">' +
                '                                    <h4 class="panel-title">' +
                '                                        <a id="acc_xg">Χρήσεις Γης/Όροι Δόμησης&nbsp;<span id="badge_xg" class="badge">0</span></a>' +
                '                                        <input type="hidden" id="xg_hid" value="0">' +
                '                                    </h4>' +
                '                               </div>' +
                '                               <div id="collapse3" class="panel-collapse collapse">' +
                '                                   <div class="panel-body">' +
                '                                       <div class="container-fluid" style="max-height: 155px; overflow-y: auto;">' +
                '                                           <div id="docsTableXG" class="col-lg-4">' +
                '                                               <ul id="infoDocsXG" class="list-group"></ul>' +
                '                                            </div>' +
                '                                            <div id="restInfoXG" class="col-lg-8"></div>' +
                '                                       </div>' +
                '                                   </div>' +
                '                               </div>' +
                '                            </div>' +
                '                            <div id="panelBLT" class="panel panel-default">' +
                '                               <div id="blt_div" class="panel-heading accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion-rt" href="#collapse4">' +
                '                                   <h4 class="panel-title">' +
                '                                       <a id="acc_blt" href="#">Κτίρια&nbsp;<span id="badge_bld" class="alert-success badge">0</span></a>' +
                '                                       <input type="hidden" id="blt_hid" value="0">' +
                '                                   </h4>' +
                '                               </div>' +
                '                               <div id="collapse4" class="panel-collapse collapse">' +
                '                                   <div class="panel-body">' +
                '                                       <div class="container-fluid" style="max-height: 155px; overflow-y: auto;">' +
                '                                           <div id="docsTableBLT" class="col-lg-4">' +
                '                                               <ul id="infoDocsBLT" class="list-group"></ul>' +
                '                                           </div>' +
                '                                           <div id="restInfoBLT" class="col-lg-8"></div>' +
                '                                      </div>' +
                '                                   </div>' +
                '                               </div>' +
                '               </div> <!-- Close panel group -->' +
                '               <div class="modal-footer">' +
                '                   <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                '               </div>' +
                '           </div> <!-- Close modal body -->' +
                '       </div> <!-- Close modal content -->' +
                '   </div> <!-- Close modal dialog -->' +
                '</div> <!-- Close urbanDocsModal -->';
            $('body').append(updDlg);
            $('#urbanDocsModal').draggable({ handle: ".modal-header" });

            $('#btnUrbanPlanning').on('click', urbanPlanning.onclick);
            //// Create popup
            //var urbanPopup = '<div id="urbanPopup" class="ol-popup">' +
            //    '               <a href = "#" id="popup-closer" class="ol-popup-closer"></a>'+
            //    '               <div id="urban-popup-content"></div>'
            //'           </div>';
            //$('#mainparent').append(urbanPopup);
            //$('#urban-popup-content').append(updDlg);
        },
        onclick: function () {
            if ($('#btnUrbanPlanning').hasClass("active")) {
                $('#btnUrbanPlanning').removeClass("active");
                return;
            }
            $('#btnUrbanPlanning').addClass("active");
            var $mymap = $('#mapid').data('map');
            mapUtils.resetMapInteractions($mymap);
            //// Remove the Urban Overlay
            //var urbanOverlay = $mymap.getOverlayById("urbanOverlay");
            //$mymap.removeOverlay(urbanOverlay);
            ////Add overlay
            //var overlay = new ol.Overlay({
            //    element: document.getElementById('urbanPopup'),
            //    autoPan: true,
            //    id: "urbanOverlay",
            //    autoPanAnimation: {
            //        duration: 250
            //    }
            //});
            //$mymap.addOverlay(overlay);
            $mymap.on('singleclick', function (evt) {
                var foundUrban = false;
                $('#badge_rd').text("0");
                $('#badge_pt').text("0");
                $('#badge_xg').text("0");
                $('#badge_bld').text("0");
                $mymap.getLayers().forEach(function (layer) {
                    //console.log(layer.get('name'));
                    if ((layer.get('name') === 'buildings' ||
                        layer.get('name') === 'prakseis_taktopoiisis' ||
                        layer.get('name') === 'rimotomika_diatagmata' ||
                        layer.get('name') === 'xrisis_gis_oroi_domisis')
                        && $('#btnUrbanPlanning').hasClass("active")) {
                        urbanFeat = urbanPlanning.getClickResults($mymap, layer, evt);
                        if (typeof urbanFeat !== "undefined") {
                            foundUrban = true;
                            urbanPlanning.initPanels(urbanFeat, layer.get('name'));
                            //$('#subTileOnInfo').text("(Συν/νες: " + evt.coordinate[0] + " " + evt.coordinate[1] + ")");
                            $('#subTileOnInfo').html("<strong>Συν/νες:</strong> " + evt.coordinate[0].toFixed(2).replace(".", ",") + " " + evt.coordinate[1].toFixed(2).replace(".", ","));
                            var latlon = new ol.geom.Point(ol.proj.transform([evt.coordinate[0], evt.coordinate[1]], 'EPSG:2100', 'EPSG:4326'));
                            var lon = latlon.getCoordinates()[0];
                            var lat = latlon.getCoordinates()[1];
                            var addr = geocodeUtilities.reverse(lon, lat);
                            $('#subTileOnInfo').html($('#subTileOnInfo').html() + "<br/><strong>Πλησιέστερη δ/νση:</strong> " + addr);
                            $('#urbanDocsModal').modal('show');
                            //overlay.setPosition(evt.coordinate)
                        }
                    }
                })
                if (!foundUrban) {
                    mapUtils.showMessage("warning", "Δε βρέθηκαν πολεοδομικά δεδομένα στο σημείο με συν/νες: " + evt.coordinate[0] + " " + evt.coordinate[1], "ΠΡΟΣΟΧΗ")
                }
            })
            //$('#urbanDocsModal').modal('show');
        },
        getClickResults: function (mymapFI, layer, evt) {
            var featList;
            if ((layer.getSource() instanceof ol.source.ImageWMS) || (layer.getSource() instanceof ol.source.TileWMS)) {
                var url = layer.getSource().getGetFeatureInfoUrl(
                    evt.coordinate, mymapFI.getView().getResolution(), projcode,
                    {
                        'INFO_FORMAT': 'geojson',
                        'FEATURE_COUNT': '100'
                    });
                if (url) {
                    $.ajax({
                        url: url,
                        async: false,
                        dataType: 'json',
                        success: function (data) {
                            featList = data;
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
            return featList;
        },
        initPanels: function (urbanFeats, layerName) {
            if (layerName === 'buildings') {
                urbanPlanning.populatePanel($("#infoDocsBLT"), $("#restInfoBLT"), urbanFeats, layerName);
            } else if (layerName === 'prakseis_taktopoiisis') {
                urbanPlanning.populatePanel($("#infoDocsPT"), $("#restInfoPT"), urbanFeats, layerName);
            } else if (layerName === 'rimotomika_diatagmata') {
                urbanPlanning.populatePanel($("#infoDocsRD"), $("#restInfoRD"), urbanFeats, layerName);
            } else if (layerName === 'xrisis_gis_oroi_domisis') {
                urbanPlanning.populatePanel($("#infoDocsXG"), $("#restInfoXG"), urbanFeats, layerName);
            };
        },
        populatePanel: function (divID, divTarget, urbanfeats, layerName) {
            var pkName = '';
            if (layerName === 'buildings') {
                pkName = 'b_id';
                $('#badge_bld').text(urbanfeats.features.length);
                $("#restInfoBLT").empty();
                $("#infoDocsBLT").empty();
                $.each(urbanfeats.features, function (index, feat) {
                    divID.append("<a href='#' id='bld_" + feat.properties.b_id + "' class='list-group-item list-group-item-info' onClick=\"urbanPlanning.docClick('" + layerName + "\',\'" +
                        feat.properties.b_id + "','" + divTarget.selector + "')\">" + feat.properties.b_id + "</a><input type='hidden' id='hidBld" + feat.properties.b_id + "' value='" + JSON.stringify(feat.properties) + "'></input>");
                });
            } else if (layerName === 'prakseis_taktopoiisis') {
                pkName = 'pt_id';
                $('#badge_pt').text(urbanfeats.features.length);
                $("#restInfoPT").empty();
                $("#infoDocsPT").empty();
                $.each(urbanfeats.features, function (index, feat) {
                    divID.append("<a href='#' id='pt_" + feat.properties.pt_id + "' class='list-group-item list-group-item-info' onClick=\"urbanPlanning.docClick('" + layerName + "\',\'" +
                        feat.properties.pt_id + "','" + divTarget.selector + "')\">" + feat.properties.praksi_code + "</a><input type='hidden' id='hidPt" + feat.properties.pt_id + "' value='" + JSON.stringify(feat.properties) + "'></input>");
                });
            } else if (layerName === 'rimotomika_diatagmata') {
                pkName = 'rd_id';
                divID.empty();
                $('#badge_rd').text(urbanfeats.features.length);
                $("#restInfoRD").empty();
                $("#infoDocsRD").empty();
                $.each(urbanfeats.features, function (index, feat) {
                    var f_doc_date = "ΧΩΡΙΣ ΗΜ/ΝΙΑ";
                    if (typeof feat.properties.diatagma_date !== "undefined" && feat.properties.diatagma_date !== null) {
                        f_doc_date = feat.properties.diatagma_date.split(" ")[0].split("-")[2] + "/" +
                            feat.properties.diatagma_date.split(" ")[0].split("-")[1] + "/" +
                            feat.properties.diatagma_date.split(" ")[0].split("-")[0];
                    }
                    divID.append("<a href='#' id='rd_" + feat.properties.rd_id + "' class='list-group-item list-group-item-info' onClick=\"urbanPlanning.docClick('" + layerName + "\',\'" +
                        feat.properties.rd_id + "','" + divTarget.selector + "')\">" + f_doc_date + "</a><input type='hidden' id='hidRd" + feat.properties.rd_id + "' value='" + JSON.stringify(feat.properties) + "'></input>");
                });
            } else if (layerName === 'xrisis_gis_oroi_domisis') {
                pkName = 'xg_id';
                $('#badge_xg').text(urbanfeats.features.length);
                $("#restInfoXG").empty();
                $("#infoDocsXG").empty();
                $.each(urbanfeats.features, function (index, feat) {
                    divID.append("<a href='#' id='xg_" + feat.properties.xg_id + "' class='list-group-item list-group-item-info' onClick=\"urbanPlanning.docClick('" + layerName + "\',\'" +
                        feat.properties.xg_id + "','" + divTarget.selector + "')\">" + feat.properties.xrisi + "</a><input type='hidden' id='hidXg" + feat.properties.xg_id + "' value='" + JSON.stringify(feat.properties) + "'></input>");
                });
            }
        },
        docClick: function (lyrname, pk_val, targetDiv) {
            $(targetDiv).empty();

            if (lyrname === "rimotomika_diatagmata") {
                model = JSON.parse($('#hidRd' + pk_val).val());
                var f_doc_date = "ΧΩΡΙΣ ΗΜ/ΝΙΑ";
                if (model.diatagma_date !== 'undefined' && model.diatagma_date !== null && model.diatagma_date !== "") {
                    f_doc_date = model.diatagma_date.split(" ")[0].split("-")[2] + "/" +
                        model.diatagma_date.split(" ")[0].split("-")[1] + "/" +
                        model.diatagma_date.split(" ")[0].split("-")[0];
                }
                $(targetDiv).append('<div><label> Διάταγμα:&nbsp;</label><label style="font-weight: normal !important;"> ' + f_doc_date + '</label></div>');
                $(targetDiv).append('<div><label> Α/Α:&nbsp </label><label style="font-weight: normal !important;"> ' + model.rd_id + '</label></div>');
                $(targetDiv).append('<div><label> ΦΕΚ:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.fek + '</label></div>');
                if (model.path.startsWith("http")) {
                    $(targetDiv).append('<div><a href="' + model.path + '" target="_blank">Διάγραμμα</a></div>');
                }
                $(targetDiv).append('<div><label> Παρατηρήσεις:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.comments + '</label></div>');
            }
            else if (lyrname === "prakseis_taktopoiisis") {
                model = JSON.parse($('#hidPt' + pk_val).val());
                $(targetDiv).append('<div><label> Κωδικός Πράξης:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.praksi_code + '</label></div>');
                if (model.path_lektiko.startsWith("http")) {
                    $(targetDiv).append('<div><a href="' + model.path_lektiko + '" target="_blank">Αρχείο Λεκτικού</a></div>');
                }
                if (model.path_apofasis.startsWith("http")) {
                    $(targetDiv).append('<div><a href="' + model.path_apofasis + '" target="_blank">Αρχείο Απόφασης</a></div>');
                }
                if (model.path_diagrammatos.startsWith("http")) {
                    (targetDiv).append('<div><a href="' + model.path_diagrammatos + '" target="_blank">Αρχείο Διαγράμματος</a></div>');
                }
            }
            else if (lyrname === "xrisis_gis_oroi_domisis") {
                model = JSON.parse($('#hidXg' + pk_val).val());
                $(targetDiv).append('<div><label> Χρήση:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.xrisi + '</label></div>');
                $(targetDiv).append('<div><label> Κωδικός:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.kodikos + '</label></div>');
                $(targetDiv).append('<div><label> Περιγραφή:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.perigrafi + '</label></div>');
            }
            else if (lyrname === "buildings") {
                model = JSON.parse($('#hidBld' + pk_val).val());
                if (model.adeia_date !== 'undefined' && model.adeia_date !== null && model.adeia_date !== "") {
                    var f_doc_date = model.adeia_date.split(" ")[0].split("-")[2] + "/" +
                        model.adeia_date.split(" ")[0].split("-")[1] + "/" +
                        model.adeia_date.split(" ")[0].split("-")[0];
                }
                $(targetDiv).append('<div><label> Είδος:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.b_type + '</label></div>');
                $(targetDiv).append('<div><label> Αριθμός Αδείας:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.ar_adeias + '</label></div>');
                $(targetDiv).append('<div><label> Χρονολογία Αδείας:&nbsp;</label><label style="font-weight: normal !important;"> ' + f_doc_date + '</label></div>');
                $(targetDiv).append('<div><label> Aριθμός ορόφων:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.ar_orofon + '</label></div>');
                $(targetDiv).append('<div><label> Ταχυδρομικός Κωδικός:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.tk + '</label></div>');
                $(targetDiv).append('<div><label> Κάλυψη:&nbsp;</label><label style="font-weight: normal !important;"> ' + model.kalupsi + '</label></div>');
            }
        }
    };
})(mymap);
$(document).ready(function () {
    urbanPlanning.createUI();
});