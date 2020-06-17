/**
 * Methods for general editing functionality
 * @namespace featureEdit
 */
var editLayer;
var layer2split;
var originalEditLayer = null;

var featureEdit = (function () {
    $(document).ready(function () {
        $('#lnkLogin').show();
        $('#lnkLogin').html("<span class='glyphicon glyphicon-log-in' aria-hidden='true'></span>&nbsp;&nbsp;" + $.i18n._('_LOGINBUTTON'));
        $('#btnLogin').val($.i18n._('_LOGINBUTTON'));
        $('#btnCloseLogin').html($.i18n._('_CLOSE'));
        $("#lblLoginTitle").html($.i18n._('_LOGINTITLE'));
        $("#lblUsername").html($.i18n._('_USERNAME'));
        $("#lblPassword").html($.i18n._('_PASSWORD'));
        $("#txbUsername").prop("placeholder", $.i18n._('_USERNAME'));
        $("#txbPassword").prop("placeholder", $.i18n._('_PASSWORD'));
        $('#lnkLogin').off('click').on('click', function () {
            $('#modLogin').modal({
                keyboard: false
            });
            // Close all open dialogs
            $(".ui-dialog-content").dialog("close");
            // Open login dialog
            $('#modLogin').modal('show');
        });
        featureEdit.renderEditTools();
        try {
            featureEdit.checkCookie(); //withing a try/catch in case the cookie is invalid
        } catch (error) {
            console.log ('evrymap cookie is invalid. Removing.')
            //remove cookie
            document.cookie = 'evrymap=; Max-Age=-99999999;'; 
        }
        
        $("#btnLogin").click(function(){
            user=$("#txbUsername").val();
            pass=$("#txbPassword").val();
            $.post(window.location.origin+window.location.pathname + "login",{user: user,password: pass}, function(data){
                if (typeof data.originalError !== "undefined") { // For MSSQL
                    // Error occured 
                    $('#hidEnc').val('');
                    mapUtils.showMessage('danger',data.originalError.message, $.i18n._('_ERROROCCUREDTITLE'));
                    return false;
                } else if (data.startsWith("error")) { // For postgres
                    $('#hidEnc').val('');
                    mapUtils.showMessage('danger',data, $.i18n._('_ERROROCCUREDTITLE'));
                    return false;
                } else {
                    $('#modLogin').modal('hide');
                    featureEdit.showConnected(user, data);
                }
            });
        });
    });
    return {
        /**
         * Checks whether the edit cookie exists and the user is already
         * 'logged in'
         * @function checkCookie
         * @memberof featureEdit
         */
        checkCookie: function () {
            if (document.cookie.split(';').filter(function (item) {
                return item.trim().indexOf('evrymap=') === 0;
            }).length) {
                let decCookie=JSON.parse(decodeURIComponent(document.cookie).slice(8));
                let enc = decCookie.id;
                let user = decCookie.user;
                featureEdit.showConnected(user, enc);
            }
        },
        /**
         * Displays info for the connected user
         * @function showConnected
         * @memberof featureEdit
         */
        showConnected: function (uname, enc) {
            $('#hidEnc').val(enc);
            mapUtils.showMessage('success', $.i18n._('_LOGINSUCCESS'), $.i18n._('_LOGINSUCCESS'));
            $('#lnkLogin').html("<span class='glyphicon glyphicon-log-out' aria-hidden='true'></span>&nbsp;" + $.i18n._('_LOGOUT'));
            $('#editTools').show();
            $('#usermenu').prepend('<li id="userinfo"><p style="position:relative;top:15px;color:white">' + $.i18n._('_USERNAME') + ": " + uname + '</p></li>');
            $('#lnkLogin').off('click').on('click', function () {
                featureEdit.stopEditing();
                //remove cookie
                document.cookie = 'evrymap=; Max-Age=-99999999;';  
                $('#editTools').hide();
                $('#hidEnc').val('');
                $('#userinfo').remove();
                $('#lnkLogin').html("<span class='glyphicon glyphicon-log-in' aria-hidden='true'></span>&nbsp;" + $.i18n._('_LOGINBUTTON'));
                $('#lnkLogin').off('click').on('click', function () {
                    $('#modLogin').modal({
                        keyboard: false
                    });
                });
            });
        },
        renderEditTools: function () {
            var str = ' <div id="editTools" style="display:none" class="righttb btn-group-vertical">' +
                '           <button class="btn btn-primary" id = "btnStartEdit" title = "Έναρξη επεξεργασίας" onclick = "featureEdit.showStartEditForm();" >' +
                '               <img src="css/images/icons8-edit-26.png" class="editbtnImg" />' +
                '           </button >' +
                '           <button class="btn btn-primary" id="btnEmpty" title="Νο γεομετρυ" style="display: none">' +
                '               <img src="css/images/empty-box.png" class="editbtnImg" />' +
                '           </button>' +
                '           <button class="btn btn-primary" id="btnCreate" title="Δημιουργία" style="display: none">' +
                '               <img src="css/images/icons8-sign-up-26.png" class="editbtnImg" />' +
                '           </button>' +
                '           <button class="btn btn-primary" id="btnEdit" title="Επεξεργασία" style="display: none">' +
                '               <img src="css/images/icons8-map-editing-26.png" class="editbtnImg" />' +
                '           </button>' +
                '           <button class="btn btn-primary" id="btnAddHole" disabled title="Επεξεργασία" style="display: none">' +
                '               <img src="css/images/cd-rom.png" class="editbtnImg" />' +
                '           </button>' +
                '           <button class="btn btn-primary" id="btnAddPart" disabled title="Επεξεργασία" style="display: none">' +
                '               <img src="css/images/add_part.png" class="editbtnImg" />' +
                '           </button>' +
                '           <button class="btn btn-primary" id="btnSplit" title="Διαίρεση γραμμής (split)" style="display: none">' +
                '               <img src="css/images/icons8-split-vertical-26.png" class="editbtnImg" />' +
                '           </button>' +
                '           <button class="btn btn-primary" id="btnMerge" title="Ενωση γραμμών (merge)" disabled style="display: none">' +
                '               <img src="css/images/icons8-merge-vertical-50.png" class="editbtnImg" />' +
                '           </button>' +
                '               <button class="btn btn-primary" id="btnHump" title="Κλικ πάνω στον αγωγό για τη δημιουργία καμπύλης στο σημείο" style="display: none">' +
                '               <img src="css/images/icons8-leaving-geo-fence-26.png" class="editbtnImg" />' +
                '           </button>' +
                //'           <button class="btn btn-primary" id="btnStopEdits" onclick="featureEdit.stopEditing();" disabled title="Ολοκλήρωση επεξεργασίας">' +
                //'               <img src="css/images/icons8-no-edit-26.png" style="width: 32px;filter: invert(100%);" />' +
               // '           </button>' +
                '               <br>' +
                '               <br>' +
                '           <button class="btn btn-primary" id = "btnLrmSearch" title = "Αναζήτηση Ακινήτου" onclick="featureEdit.showLrmDlg();" >' +
                '               <img src="css/images/icons8-pastel-glyph-64.png" class="editbtnImg" />' +
                '           </button >' +
                '       </div >';
            $('#mainparent').prepend(str);
            $('#btnStartEdit').prop("title", $.i18n._('_EDITSTART'));
            $('#btnEmpty').prop("title", $.i18n._('_CREATENOGEOM'));
            $('#btnCreate').prop("title", $.i18n._('_EDITCREATE'));
            $('#btnEdit').prop("title", $.i18n._('_EDIT'));
            $('#btnAddHole').prop("title", $.i18n._('_EDITADDHOLE'));
            $('#btnAddPart').prop("title", $.i18n._('_EDITADDPART'));
            $('#btnSplit').prop("title", $.i18n._('_EDITSPLIT'));
            $('#btnMerge').prop("title", $.i18n._('_EDITMERGE'));
            $('#btnHump').prop("title", $.i18n._('_EDITHUMP'));
            $('#btnStopEdits').prop("title", $.i18n._('_EDITSTOP'));
        },
        showEditingPanel: function(layerlabel) {
            $('#lblCurrentlyEditing').html($.i18n._('_EDITCURRENTEDIT') +": " + layerlabel);
            $('#btnStopEdits').text($.i18n._('_EDITSTOPBTN'));
            $('#divEditPanel').show();
        },
        initAddHole: function () {
            $('#mapid').css('cursor', 'crosshair');
            var currentEditLayerName = $('#hidEditLayer').val().trim();
            if (currentEditLayerName === "") {
                alert("Could not find edit layer for create");
                return;
            }
            var currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName);
            if (currentEditLayer instanceof ol.layer.Vector) {
                editLayer = currentEditLayer;
            } else {
                currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName + "_EDIT");
                if (typeof currentEditLayer !== "undefined") {
                    editLayer = currentEditLayer;
                } else {
                    alert("Could not find edit layer for create: " + currentEditLayerName + " or " + currentEditLayerName + "_EDIT");
                    return;
                }
            }
            featureEdit.unselectEditTools();
            $('#mapid').css('cursor', 'crosshair');
            $('#btnAddHole').addClass("active");
            $mymap = $('#mapid').data('map');
            mapUtils.resetMapInteractions($mymap);
            //Clear edit and map interactions
            mapUtils.removeDragZoomInteractions($mymap);
            featureEdit.resetInteraction("DRAW");
            featureEdit.resetInteraction("MODIFY");
            featureEdit.resetInteraction("ADDHOLE");
            featureEdit.resetInteraction("ADDPART");
            //Enable the stop editing button
            $('#btnStopEdits').prop('disabled', false);

            this.addHoleIntrAct = new ol.interaction.DrawHole({
                source: editLayer.getSource(),
                type: editLayer.get("edit_geomtype"),
                style: new ol.style.Style({
                    image:
                        new ol.style.RegularShape({
                            points: 4,
                            radius1: 10,
                            radius2: 1,
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 255, 0.2)'
                            }),
                        }),
                    stroke: new ol.style.Stroke({
                        color: 'blue',
                        width: 3
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                })
            });

            $mymap.addInteraction(this.addHoleIntrAct);
            
            this.addHoleIntrAct.on('drawend', featureEditForms.onModifyGeometry); //{
                //    let poly_hole = his.addHoleIntrAct.getPolygon();
                //    //featureEditForms.onModifyGeometry
                //});
            //if (typeof editLayer.get("edit_snapping_layers") !== "undefined") {
            //    $.each(editLayer.get("edit_snapping_layers"), function (i, snap_layer) {
            //        featureEdit.initSnapping(snap_layer);
            //    });
            //}
        },
        initAddPart: function (in_geom ) {
            $('#mapid').css('cursor', 'crosshair');
            var currentEditLayerName = $('#hidEditLayer').val().trim();
            if (currentEditLayerName === "") {
                alert("Could not find edit layer for create");
                return;
            }
            var currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName);
            if (currentEditLayer instanceof ol.layer.Vector) {
                editLayer = currentEditLayer;
            } else {
                currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName + "_EDIT");
                if (typeof currentEditLayer !== "undefined") {
                    editLayer = currentEditLayer;
                } else {
                    alert("Could not find edit layer for create: " + currentEditLayerName + " or " + currentEditLayerName + "_EDIT");
                    return;
                }
            }
            featureEdit.unselectEditTools();
            $('#mapid').css('cursor', 'crosshair');
            $('#btnCreate').removeClass("active");
            $('#btnEmpty').removeClass("active");
            $('#btnAddPart').addClass("active");
            $mymap = $('#mapid').data('map');
            mapUtils.resetMapInteractions($mymap);
            //Clear edit and map interactions
            mapUtils.removeDragZoomInteractions($mymap);
            featureEdit.resetInteraction("DRAW");
            featureEdit.resetInteraction("MODIFY");
            featureEdit.resetInteraction("ADDHOLE");
            featureEdit.resetInteraction("ADDPART");
            //Enable the stop editing button
            $('#btnStopEdits').prop('disabled', false);

            this.drawIntrAct = new ol.interaction.Draw({
                source: editLayer.getSource(),
                type: editLayer.get("edit_geomtype"),
                style: new ol.style.Style({
                    image:
                        //Start of the circle style
                        //new ol.style.Circle({
                        //    fill: new ol.style.Fill({
                        //        color: 'green'
                        //    }),
                        //    stroke: new ol.style.Stroke({
                        //        width: 3,
                        //        color: 'red'
                        //    }),
                        //    radius: 8
                        //}),
                        //Start of the star style
                        new ol.style.RegularShape({
                            fill: new ol.style.Fill({
                                color: 'blue'
                            }),
                            points: 4,
                            radius1: 10,
                            radius2: 1
                        }),
                    stroke: new ol.style.Stroke({
                        color: 'blue',
                        width: 3
                    })
                    //,fill: new ol.style.Fill({
                    //    color: 'blue',
                    //    opacity:
                    //})
                })
            });

            $mymap.addInteraction(this.drawIntrAct);
            this.drawIntrAct.on('drawend', function (e) {
                var f = new ol.format.WKT();
                var wkt_string = $('#hidGeom').val();
                var in_geom = f.readGeometry(wkt_string);
                var feature = e.feature,
                    part = feature.getGeometry();
                var multiGeom;
                if (editLayer.get("edit_geomtype") === "MultiPolygon") {
                    if (in_geom.getType() === "Polygon" || in_geom.getType() === "MultiPolygon") {

                        if (in_geom.getType() === "Polygon") {
                            multiGeom = new ol.geom.Polygon();
                            $.each(in_geom.getLinearRings(), function (i, ring) {
                                multiGeom.appendLinearRing(ring);
                            });
                            if (part.getType() === "MultiPolygon") {
                                multiGeom.appendLinearRing(part.getPolygons()[0]);
                            } else {
                                multiGeom.appendLinearRing(poly);
                            }
                        }

                    }
                }
                if (typeof multiGeom === "undefined") {
                    mapUtils.showMessage('danger', 'Layers with geometry type of [' + editLayer.get("edit_geomtype") + '] are not supported' , 'Invalid geometry type');
                    return;
                }
                //let cloned = in_geom.clone();
                var format = new ol.format.WKT();
                var wktGeom = format.writeGeometry(multiGeom);
                $('#hidGeom').val(wktGeom);
                //console.log('after: \n' + wktGeom);
            });
            if (typeof editLayer.get("edit_snapping_layers") !== "undefined") {
                $.each(editLayer.get("edit_snapping_layers"), function (i, snap_layer) {
                    featureEdit.initSnapping(snap_layer);
                });
            }
        },
        showLrmDlg: function () {
            $('#dlgLrmSearch').dialog('open');
            $('#btnLrmSearch').addClass("active");
        },
        initDrawing: function () {
            
            var currentEditLayerName = $('#hidEditLayer').val().trim();
            if (currentEditLayerName === "") {
                alert("Could not find edit layer for create");
                return;
            }
            var currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName);
            if (currentEditLayer instanceof ol.layer.Vector) {
                editLayer = currentEditLayer;
            } else {
                currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName + "_EDIT");
                if (typeof currentEditLayer !== "undefined") {
                    editLayer = currentEditLayer;
                } else {
                    alert("Could not find edit layer for create: " + currentEditLayerName + " or " + currentEditLayerName + "_EDIT");
                    return;
                }
            }
            featureEdit.unselectEditTools();
            $('#mapid').css('cursor', 'crosshair');
            $('#btnCreate').addClass("active");
            $('#btnEmpty').removeClass("active");
            $mymap = $('#mapid').data('map');
            mapUtils.resetMapInteractions($mymap);
            //Clear edit and map interactions
            mapUtils.removeDragZoomInteractions($mymap);
            featureEdit.resetInteraction("DRAW");
            featureEdit.resetInteraction("MODIFY");
            featureEdit.resetInteraction("ADDHOLE");
            featureEdit.resetInteraction("ADDPART");
            //Enable the stop editing button
            $('#btnStopEdits').prop('disabled', false);

            this.drawIntrAct = new ol.interaction.Draw({
                source: editLayer.getSource(),
                type: editLayer.get("edit_geomtype"),
                style: new ol.style.Style({
                    image:
                       //Start of the star style
                        new ol.style.RegularShape({
                            fill: new ol.style.Fill({
                                color: 'blue'
                            }),
                            points: 4,
                            radius1: 10,
                            radius2: 1
                        }),
                    stroke: new ol.style.Stroke({
                        color: 'blue',
                        width: 3
                    })
                })
            });

            $mymap.addInteraction(this.drawIntrAct);
            // Undo last point by pressing <esc>
            var di=this.drawIntrAct;
            document.addEventListener('keydown', function(e) {
                if (e.which == 27)
                    di.removeLastPoint();
            });
            this.drawIntrAct.on('drawend', featureEditForms.prepareNewEditForm);
            if (typeof editLayer.get("edit_snapping_layers") !== "undefined") {
                $.each(editLayer.get("edit_snapping_layers"), function (i, snap_layer) {
                    featureEdit.initSnapping(snap_layer);
                });
            }
        },
        initMerge: function () {
            $('#mapid').css('cursor', 'pointer');
            var isComplete = false;
            var currentEditLayerName = $('#hidEditLayer').val().trim();
            if (currentEditLayerName === "") {
                alert("Could not find edit layer for merge");
                return;
            }
            var currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName);
            if (currentEditLayer instanceof ol.layer.Vector) {
                editLayer = currentEditLayer;
            } else {
                currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName + "_EDIT");
                if (typeof currentEditLayer !== "undefined") {
                    editLayer = currentEditLayer;
                } else {
                    alert("Could not find edit layer for merge: " + currentEditLayerName + " or " + currentEditLayerName + "_EDIT");
                    return;
                }
            }
            $mymap.getInteractions().forEach(function (interaction) {
                if (isComplete) {
                    return;
                }
                if (interaction instanceof ol.interaction.Select) {
                    var sel = interaction;
                    if (typeof editLayer.get('edit_merge_url') === "undefined") {
                        mapUtils.showMessage('warning', $.i18n._('_NOMERGESERVICE'), $.i18n._('_ERRORWARNING'));
                        //alert($.i18n._('_NOSPLITSERVICE'));
                        isComplete = true;
                        return false;
                    }
                    var selectedFeatures = sel.getFeatures();
                    if (selectedFeatures.getLength() !== 2) {
                        mapUtils.showMessage('warning', $.i18n._('_MERGEERROR'), $.i18n._('_ERRORWARNING'));
                        isComplete = true;
                        return false;
                    }

                    var merge_url = editLayer.get('edit_merge_url');
                    var pkField = editLayer.get("edit_pk");
                    var pk1 = selectedFeatures.item(0).getProperties()[pkField];
                    var pk2 = selectedFeatures.item(1).getProperties()[pkField];
                    //alert("Selected features: " + selectedFeatures.getLength());
                    enc = $('#hidEnc').val();
                    if (enc.trim() === '') {
                        mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONDESCR'), $.i18n._('_NOCONNECTIONTITLE'));
                        return false;
                    }
                    var params = {};
                    params["wmp_gid1"] = pk1;
                    params["wmp_gid2"] = pk2;
                    params["enc"] = enc;
                    params = JSON.stringify(params);
                    $.ajax({
                        url: merge_url,
                        data: params,
                        dataType: "json",
                        type: "POST",
                        contentType: "application/json; charset=utf-8",
                        beforeSend: function () {
                            $(".wait").show();
                        },
                        success: function (data) {
                            featureEdit.refreshVectorLayer(editLayer.get("name"));
                            featureEdit.removeSelection();
                            mapUtils.showMessage('success', $.i18n._('_SUCCESSMSGMERGE'), $.i18n._('_SUCCESSTITLE'));
                            isComplete = true;
                        },
                        error: function (response) {
                            console.log(response.responseText);
                            //var msg = response.responseJSON.Message;
                            mapUtils.showMessage('danger', $.i18n._('_CHECKLOGERROR'), $.i18n._('_MERGEDBERROR') + editLayer.get("label"));
                        },
                        failure: function (response) {
                            mapUtils.showMessage('danger', $.i18n._('_CHECKLOGERROR'), $.i18n._('_MERGEDBERROR') + editLayer.get("label"));
                        },
                        complete: function (response) {
                            $(".wait").hide();
                            isComplete = true;
                            featureEdit.setEditTools();
                            $('#btnMerge').removeClass("active").addClass("active");
                        },
                        async: false
                    });
                }
            });
        },
        initSplit: function () {
            featureEdit.unselectEditTools();
            $('#mapid').css('cursor', 'crosshair');
            $('#btnSplit').addClass("active");
            var currentEditLayerName = $('#hidEditLayer').val().trim();
            if (currentEditLayerName === "") {
                alert("Could not find edit layer for split");
                return;
            }
            var currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName);
            if (currentEditLayer instanceof ol.layer.Vector) {
                layer2split = currentEditLayer;
            } else {
                currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName + "_EDIT");
                if (typeof currentEditLayer !== "undefined") {
                    layer2split = currentEditLayer;
                } else {
                    alert("Could not find edit layer for split: " + currentEditLayerName + " or " + currentEditLayerName + "_EDIT");
                    return;
                }
            }
            if (typeof layer2split.get("edit_split_layer") !== "undefined" && layer2split.get("edit_split_layer").trim() !== "") {
                $mymap = $('#mapid').data('map');
                //Clear edit interactions
                featureEdit.resetInteraction("DRAW");
                featureEdit.resetInteraction("MODIFY");
                featureEdit.resetInteraction("ADDHOLE");
                featureEdit.resetInteraction("ADDPART");
                //Enable the stop editing button
                $('#btnStopEdits').prop('disabled', false);
                //Set global editlayer var
                editLayer = legendUtilities.getLayerByName(layer2split.get("edit_split_layer"));
                this.drawIntrAct = new ol.interaction.Draw({
                    source: editLayer.getSource(),
                    type: "Point"
                });

                $mymap.addInteraction(this.drawIntrAct);
                this.drawIntrAct.on('drawend', featureEdit.doSplit);
                if (typeof layer2split.get("edit_snapping_layers") !== "undefined") {
                    $.each(layer2split.get("edit_snapping_layers"), function (i, snap_layer) {
                        featureEdit.initSnapping(snap_layer);
                    });
                }
            }
        },
        initModify: function () {
            var currentEditLayerName = $('#hidEditLayer').val().trim();
            if (currentEditLayerName === "") {
                alert("Could not find edit layer for create");
                return;
            }
            var currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName);
            if (currentEditLayer instanceof ol.layer.Vector) {
                editLayer = currentEditLayer;
            } else {
                currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName + "_EDIT");
                if (typeof currentEditLayer !== "undefined") {
                    editLayer = currentEditLayer;
                } else {
                    alert("Could not find edit layer for create: " + currentEditLayerName + " or " + currentEditLayerName + "_EDIT");
                    return;
                }
            }
            featureEdit.unselectEditTools();
            $('#mapid').css('cursor', 'crosshair');
            $mymap = $('#mapid').data('map');
            mapUtils.resetMapInteractions($mymap);
            $('#btnEdit').addClass("active");
            //Clear edit and map interactions
            mapUtils.removeDragZoomInteractions($mymap);
            featureEdit.resetInteraction("DRAW");
            featureEdit.resetInteraction("MODIFY");
            featureEdit.resetInteraction("ADDHOLE");
            featureEdit.resetInteraction("ADDPART");
            $('#btnStopEdits').prop('disabled', false);
            if ($('#info1').hasClass("active")) {
                return false;
            }
            var selectIntrAct = featureEdit.setEditSelectInteraction(editLayer);
            if (typeof editLayer.get("allow_edit_geom") === "undefined" || editLayer.get("allow_edit_geom")=== true) {
                this.modifyIntrAct = new ol.interaction.Modify({
                    features: selectIntrAct.getFeatures(),
                    style: featureEdit.setEditStyle() 
                });
                this.modifyIntrAct.on("modifyend", featureEditForms.onModifyGeometry);
                $mymap.addInteraction(this.modifyIntrAct);
            }
            //console.log("added modify interaction for " + layername);
            if (typeof editLayer.get("edit_snapping_layers") !== "undefined") {
                $.each(editLayer.get("edit_snapping_layers"), function (i, snap_layer) {
                    featureEdit.initSnapping(snap_layer);
                });
            }
        },
        initSnapping: function (snap_layer_name) {
            $mymap = $('#mapid').data('map');
            // Always use the water pipe network as the snaping layer
            var snaplayer = legendUtilities.getLayerByName(snap_layer_name);
            if (snaplayer instanceof ol.layer.Tile) {
                snaplayer = featureEdit.convertTileToVector(snaplayer, true);
            }
            var snap = new ol.interaction.Snap({
                source: snaplayer.getSource()
            });
            $mymap.addInteraction(snap);
        },
        cancelFeatureNew: function (layername) {
            var editLayer = legendUtilities.getLayerByName(layername);
            var features = editLayer.getSource().getFeatures();
            featureEdit.refreshVectorLayer(layername);
        },
        removeSelection: function () {
            $mymap = $('#mapid').data('map');
            $mymap.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.Select) {
                    //console.log("has select interaction");
                    interaction.getFeatures().clear();
                }
            });
        },
        resetInteraction: function (type) {
            var sel;
            var draw;
            var mod;
            var snap;
            var addhole;
            var addpart;
            $mymap = $('#mapid').data('map');
            measureUtilities.clearMeasures();
            $mymap.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.Snap) {
                    //console.log("has select interaction");
                    interaction.setActive(false);
                    snap = interaction;
                }
            });
            if (type === "MODIFY") {
                //$mymap.getInteractions().forEach(function (interaction) {
                //    if (interaction instanceof ol.interaction.Select) {
                //        //console.log("has select interaction");
                //        interaction.setActive(false);
                //        sel = interaction;
                //    }
                //});
                $mymap.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.Modify) {
                        //console.log("has modify interaction");
                        interaction.setActive(false);
                        interaction.un('select');
                        interaction.un('modifyend');
                        mod = interaction;
                    }
                });
            } else if (type === "ADDHOLE") {
                $mymap.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.DrawHole) {
                        //console.log("has draw interaction");
                        interaction.setActive(false);
                        interaction.un('drawend');
                        addhole = interaction;
                    }
                });
            } else if (type === "DRAW") {
                $mymap.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.Draw) {
                        //console.log("has draw interaction");
                        interaction.setActive(false);
                        interaction.un('drawend');
                        draw = interaction;
                    }
                });
            } else if (type === "ADDPART") {
                $mymap.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.Draw) {
                        //console.log("has draw interaction");
                        interaction.setActive(false);
                        interaction.un('drawend');
                        addpart = interaction;
                    }
                });
            } else {
                $mymap.getInteractions().forEach(function (interaction) {
                    if (interaction instanceof ol.interaction.Draw) {
                        interaction.setActive(false);
                        interaction.un('drawend');
                        draw = interaction;
                    } else if (interaction instanceof ol.interaction.Modify) {
                        interaction.setActive(false);
                        interaction.un('select');
                        interaction.un('modifyend');
                        mod = interaction;
                        //} else if (interaction instanceof ol.interaction.Select) {
                        //    interaction.setActive(false);
                        //    sel = interaction;
                    } else if (interaction instanceof ol.interaction.Snap) {
                        interaction.setActive(false);
                        snap = interaction;
                    } else if (interaction instanceof ol.interaction.DrawHole) {
                        interaction.setActive(false);
                        addhole = interaction;
                    }
                });
            }
            if (typeof snap !== "undefined") {
                $mymap.removeInteraction(snap);
                //console.log("removed snap interaction");
            }
            //if (typeof sel !== "undefined") {
            //    $mymap.removeInteraction(sel);
            //    //console.log("removed select interaction");
            //}
            if (typeof mod !== "undefined") {
                $mymap.removeInteraction(mod);
                //console.log("removed modify interaction");
            }
            if (typeof draw !== "undefined") {
                $mymap.removeInteraction(draw);
                //console.log("removed draw interaction");
            }
            if (typeof addhole !== "undefined") {
                $mymap.removeInteraction(addhole);
                //console.log("removed add hole interaction");
            }
            if (typeof addpart !== "undefined") {
                $mymap.removeInteraction(addpart);
                //console.log("removed addpart interaction");
            }
        },
        showStartEditForm: function () {
            var html = '';
            var c = 1;
            $mymap = $('#mapid').data('map');
            $mymap.getLayers().forEach(function (layer, i) {
                if (typeof layer.get('name') !== undefined) {
                    var curName = layer.get('name');
                    var curLabel = layer.get('label');
                    //console.log("editpk: " + layer.get('edit_pk'));
                    if (layer.get('editable') !== undefined && layer.get('editable') === true && layer.get('edit_pk') !== undefined && layer.get('edit_fields') !== undefined) {
                        html = html + '<div class="radio"><label><input type="radio" name="editlayer" id="Radios' + c + '" value="' + curName + '">';
                        html = html + '<span class="cr"><i class="cr-icon fa fa-circle"></i></span>' + curLabel + '</label></div>';
                    }
                }
            });
            $('#editLyrList').empty();
            $('#editLyrList').html(html);
            //console.log(curName);
            $('#divStartEditForm').dialog({
                autoOpen: false,
                maxHeight: 500,
                width: 400,
                maxWidth: 550,
                buttons: [
                    {
                        text: $.i18n._('_SELECT'),
                        click: function () {
                            var sel = $('input[name=editlayer]:checked').val();
                            if (typeof sel !== "undefined") {
                                $(this).dialog("close");
                                featureEdit.startEditing(sel);
                            }
                        }
                    },
                    {
                        text: $.i18n._('_CLOSE'),
                        click: function () {
                            $(this).dialog("close");
                        }
                    }
                ],
                close: function () {
                    $('#divStartEditForm').dialog("close");
                },
                modal: true,
                draggable:true,
                resizable:true,
                title: $.i18n._('_EDITSTARTTITLE'),
                closeOnEscape: false
            });
            $('#divStartEditForm').dialog('open');
        },
        /**
         * Converts an Image/Tile layer to vector for editing
         * @param {Layer object} lyr The layer to convert 
         * @param {Boolean} isSnappingLayer Whether its a snapping layer
         * TODO: Change the mapfile variable to detect if we hide the mapfile path
         */
        convertTileToVector: function (lyr, isSnappingLayer) {
            if (!isSnappingLayer) {
                originalEditLayer = lyr;
            }
            var mapfile = lyr.get("tag")[1].split('?')[1].split('=')[1];
            var vLayer;
            if (isSnappingLayer) {
                // If we convert to vector just for use in snapping, just set the name property
                vLayer = mapUtils.createVectorJsonLayer(mapfile, lyr.get("name"), "#ccff33", "2");
                vLayer.set('name', lyr.get("name") + "_SNAPPING_EDIT");
            } else {
                // If it's the actual layer we want to edit copy the properties from the original Tile/Image (WMS) layer
                vLayer = mapUtils.createVectorJsonLayer(mapfile, lyr.get("name"), "#5168b8", "3");
                vLayer.set('name', lyr.get("name") + "_EDIT");
                vLayer.set('label', lyr.get("label"));
                vLayer.set("tag", ["GeoJSON", lyr.get("tag")[1]]);
                vLayer.set("table_name", lyr.get("table_name"));
                vLayer.set('identify_fields', "");
                vLayer.set('search_fields', "");
                vLayer.setVisible(true);
                vLayer.set('exportable', false);
                if (typeof lyr.get("has_relation") !== "undefined" && lyr.get("has_relation") === true) {
                    vLayer.set('has_relation', lyr.get("has_relation"));
                    vLayer.set('relation_details', lyr.get("relation_details"));
                } else {
                    vLayer.set('has_relation', false);
                }
                vLayer.set('edit_pk', lyr.get("edit_pk"));
                vLayer.set('edit_geomcol', lyr.get("edit_geomcol"));
                vLayer.set('edit_geomtype', lyr.get("edit_geomtype"));
                vLayer.set('allow_edit_geom', lyr.get("allow_edit_geom"));
                vLayer.set('edit_snapping_layers', lyr.get("edit_snapping_layers"));
                vLayer.set('edit_fields', lyr.get("edit_fields"));
                vLayer.set('edit_service_url', lyr.get("edit_service_url"));
                if (typeof lyr.get("edit_allow_split") !== "undefined" && lyr.get("edit_allow_split") === true) {
                    vLayer.set('edit_split_layer', lyr.get("edit_split_layer"));
                    vLayer.set('edit_split_url', lyr.get("edit_split_url"));
                }
                if (typeof lyr.get("edit_hump_url") !== "undefined") {
                    vLayer.set('edit_hump_url', lyr.get("edit_hump_url"));
                }
                if (typeof lyr.get("edit_merge_url") !== "undefined") {
                    vLayer.set('edit_merge_url', lyr.get("edit_merge_url"));
                }
                // Get the snapping layers
                var newSnapLayers = [];
                lyr.get("edit_snapping_layers").forEach(function (snaplayer) {
                    if (snaplayer === lyr.get("name")) {
                        newSnapLayers.push(vLayer.get("name"));
                        vLayer.set("edit_snapping_layers", newSnapLayers);
                    } else {
                        snapLayerObj = legendUtilities.getLayerByName(snaplayer);
                        if (snapLayerObj instanceof ol.layer.Tile || snapLayerObj instanceof ol.layer.Image) {
                            newSnapLayers.push(snaplayer + "_SNAPPING_EDIT");
                            vLayer.set("edit_snapping_layers", newSnapLayers);
                            featureEdit.convertTileToVector(snapLayerObj, true);
                        }
                    }
                });
                editLayer = vLayer;
            }
            $mymap = $('#mapid').data('map');
            // Hide the original Tile/Image (WMS) layer
            lyr.setVisible(false);
            // Add new vector layer to the map
            $mymap.addLayer(vLayer);
            // Return the layer instance to the calling function
            return vLayer;
        },
        startEditing: function (editLayerName) {
            $("#hidEditLayer").val(editLayerName);
            editLayer = legendUtilities.getLayerByName(editLayerName);
            // Convert to vector layer if required
            if (editLayer instanceof ol.layer.Tile || editLayer instanceof ol.layer.Image) {
                editLayer = featureEdit.convertTileToVector(editLayer, false);
            }
            featureEdit.showEditingPanel(editLayer.get("label"));
            // Set Edit style
            editLayer.setStyle(featureEdit.setEditStyle());
            // Display Edit tools
            featureEdit.setEditTools();
            //Set Edit tool as default
            $('#btnEdit').removeClass("active").addClass("active");
            featureEdit.initModify();
        },
        /**
         * 
         * @param {object} feature 
         */
        setEditStyle: function (feature) {
            var styles = [
                /* We are using two different styles for the polygons:
                 *  - The first style is for the polygons themselves.
                 *  - The second style is to draw the vertices of the polygons.
                 *    In a custom `geometry` function the vertices of a polygon are
                 *    returned as `MultiPoint` geometry, which will be used to render
                 *    the style.
                 */
                new  ol.style.Style({
                  stroke: new ol.style.Stroke({
                    color: preferences.getEditStrokeColor(),
                  }),
                  fill: new  ol.style.Fill({
                    color: preferences.getEditFillColor()
                  }),
                }),
                new  ol.style.Style({
                  image: new  ol.style.Circle({
                    radius: preferences.getEditStrokeWidth(),
                    stroke: new ol.style.Stroke({
                        color: preferences.getEditVertexColor(),
                        width: preferences.getEditVertexWidth()
                      }),
                    fill: new  ol.style.Fill({
                      color: preferences.getEditVertexFillColor()
                    })
                  }),
                  geometry: function(feature) {
                      if (feature.getGeometry().getType()=== "Polygon") {
                        // return the coordinates of the first ring of the polygon
                        var coordinates = feature.getGeometry().getCoordinates()[0];
                        return new ol.geom.MultiPoint(coordinates);
                      } else if (feature.getGeometry().getType()=== "LineString") {
                        return new ol.geom.MultiPoint(feature.getGeometry().getCoordinates()[0]);
                      } else {
                          return feature.getGeometry();
                      }//else if (feature.getGeometry().getType()=== "Point") {
                        //return new ol.geom.MultiPoint(feature.getGeometry().getCoordinates());
                      //}
                    
                  }
                })
              ];
            return styles;
        },
        setEditTools: function () {
            featureEdit.unselectEditTools();
            var lyrNameToEdit = $("#hidEditLayer").val().trim();
            if (lyrNameToEdit !== "") {
                $('#btnCreate').unbind('click').bind('click', function () { featureEdit.initDrawing(); });
                $('#btnCreate').show();
                $('#btnEdit').unbind('click').bind('click', function () { featureEdit.initModify(); });
                $('#btnEdit').show();
                $('#btnStartEdit').hide();
                var tmpLyr2Edit = legendUtilities.getLayerByName(lyrNameToEdit);
                if (tmpLyr2Edit.get("allowNoGeometry") === true) {
                    $('#btnEmpty').show();
                    $('#btnEmpty').unbind('click').bind('click', function () { featureEditForms.prepareNewEditForm(); });
                } else {
                    $('#btnEmpty').hide();
                }
                if (typeof tmpLyr2Edit.get("edit_geomtype") !== "undefined" && (tmpLyr2Edit.get("edit_geomtype") === "LineString" || tmpLyr2Edit.get("edit_geomtype") === "MultiLineString")
                    && typeof tmpLyr2Edit.get("edit_split_layer") !== "undefined" && tmpLyr2Edit.get("edit_split_layer").trim() !== "") {
                    $('#btnSplit').show();
                    $('#btnSplit').unbind('click').bind('click', function () { featureEdit.initSplit(); });
                    if (typeof tmpLyr2Edit.get("edit_hump_url") !== "undefined") {
                        $('#btnHump').show();
                        $('#btnHump').unbind('click').bind('click', function () { featureEditAdvanced.initHump(); });
                    }
                } else {
                    $('#btnSplit').hide();
                    $('#btnHump').hide();
                }
                if (typeof tmpLyr2Edit.get("edit_geomtype") !== "undefined" && (tmpLyr2Edit.get("edit_geomtype") === "LineString" || tmpLyr2Edit.get("edit_geomtype") === "MultiLineString") && typeof tmpLyr2Edit.get("edit_merge_url") !== "undefined") {
                    $('#btnMerge').show();
                    $('#btnMerge').unbind('click').bind('click', function () { featureEdit.initMerge(lyrNameToEdit); });
                }
                if (typeof tmpLyr2Edit.get("edit_geomtype") !== "undefined" && (tmpLyr2Edit.get("edit_geomtype") === "Polygon" || tmpLyr2Edit.get("edit_geomtype") === "MultiPolygon")) {
                    $('#btnAddHole').show();
                    $('#btnAddHole').unbind('click').bind('click', function () { featureEdit.initAddHole(); });
                }
                if (typeof tmpLyr2Edit.get("edit_geomtype") !== "undefined" && (tmpLyr2Edit.get("edit_geomtype") === "MultiPolygon" || tmpLyr2Edit.get("edit_geomtype") === "MultiLineString")) {
                    $('#btnAddPart').show();
                    //$('#btnAddHole').unbind('click').bind('click', function () { featureEdit.initAddHole(); });
                }
            }
        },
        setEditSelectInteraction: function (editLayer) {
            $mymap = $('#mapid').data('map');
            //First, remove any select interactions if they exist
            $mymap.getInteractions().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.Select) {
                    $mymap.removeInteraction(interaction);
                    interaction.un("select");
                }
            });
            // Select interaction. Will be used for edit tools
            var selectIntrAct = new ol.interaction.Select({
                layers: [editLayer],
                condition: ol.events.condition.click,
                multi: true, //select all overlapping features at the clicked map position
                style: featureEdit.setEditStyle, //selection style should be the same as edit style
                filter: function (feat, layer) {
                    if ($("#btnEdit").is(":visible")) {
                        return true;
                    } else { return false; }
                }
            });
            $mymap.addInteraction(selectIntrAct);
            selectIntrAct.on("select", function (e) {
                var selFets = selectIntrAct.getFeatures().getLength();
                if ($("#editTools").is(":visible") && $("#btnMerge").is(":visible")) {
                    if (selFets === 2) {
                        $("#btnMerge").prop('disabled', false);
                    } else {
                        $("#btnMerge").prop('disabled', true);
                    }
                }
                if ($("#btnEdit").hasClass("active")) {
                    // Clear any selected features that may have come from a previous selection
                    // If not, you may end up with duplicate features in the Select Features dialog
                    // Also, if you have selected a feature before, then edit this feature and reshape
                    // it, it will show the old selected feature from the selection layer which will
                    // be confusing to the user.
                    legendUtilities.getLayerByName("selection").getSource().clear();
                    if (selFets > 1) {
                        console.log("Number of selected features: " + selFets);
                        // More that 1 feature selected. Prompt user to select one.
                        featureEditForms.selectFeatureToEdit(selectIntrAct.getFeatures());
                    } else {
                        if (e.selected.length === 0) {
                            return;
                        }
                        
                        var f = e.selected[0]; // Get the feature
                        featureEditForms.prepareEditForm(f);
                    }
                }
            });
            return selectIntrAct;
        },
        unselectEditTools: function () {
            $('#btnStartEdit').removeClass("active");
            $('#btnCreate').removeClass("active");
            $('#btnEmpty').removeClass("active");
            $('#btnEdit').removeClass("active");
            $('#btnSplit').removeClass("active");
            $('#btnMerge').removeClass("active");
            $('#btnHump').removeClass("active");
            $('#btnAddHole').removeClass("active");
            $('#btnAddPart').removeClass("active");
            $('#info1').removeClass("active");
        },
        stopEditing: function () {
            var $map = $('#mapid').data('map');
            var snap_layers;
            if (typeof originalEditLayer !== "undefined" && originalEditLayer !== null) {
                originalEditLayer.getSource().changed(); //Update the WMS layer. This DOESN'T work
                originalEditLayer.getSource().updateParams({ "time": Date.now() }); //Update the WMS layer. This works
                originalEditLayer.setVisible(true);
                snap_layers = originalEditLayer.get("edit_snapping_layers");
            } else {
                if (typeof editLayer !== "undefined") {
                    snap_layers = editLayer.get("edit_snapping_layers");
                }
                
            }
            if (typeof snap_layers !== "undefined") {
                snap_layers.forEach(function (snaplayername) {
                    var snaplayer = legendUtilities.getLayerByName(snaplayername);
                    if (typeof snaplayer !== "undefined" && snaplayer.get("tag")[0] ==="WMS") {
                        snaplayer.getSource().updateParams({ "time": Date.now() }); //Update the WMS layer. This works
                        snaplayer.setVisible(true);
                    }
                });
            }
            
            // Remove edit interactions
            featureEdit.resetInteraction();
            // Close edit attribute form
            if ($('#divAttrsForm').is(':visible') === true) {
                $('#divAttrsForm').dialog('close');
            }
            // Hide edit tools
            $('#btnStartEdit').show();
            // TODO: Remove dependency on Landify
            if (typeof lrmForm !== "undefined") {
                $('#btnLrmSearch').show();
            }
            $('#divEditPanel').hide();
            $('#btnCreate').hide();
            $('#btnEmpty').hide();
            $('#btnEdit').hide();
            $('#btnSplit').hide();
            $('#btnMerge').hide();
            $('#btnHump').hide();
            $('#btnAddHole').hide();
            $('#btnAddPart').hide();
            // Remove any edit layers
            var layersToRemove = [];
            $map.getLayers().forEach(function (layer, i) {
                console.log('Name: ' + layer.get('name'));
                if (layer.get('name').endsWith("_EDIT")) {
                    layersToRemove.push(layer);
                }
            });
            var len = layersToRemove.length;
            for (var i = 0; i < len; i++) {
                $map.removeLayer(layersToRemove[i]);
            }
            //Go back to the default select interaction
            mapUtils.setIdentifySelectInteraction();
            // Reset editlayer variable
            originalEditLayer = null;
            $("#hidEditLayer").val("");
            $('#mapid').css('cursor', 'default');
        },
        refreshVectorLayer: function (layername) {
            var lyr = legendUtilities.getLayerByName(layername);
            lyr.setSource(new ol.source.Vector({
                format: lyr.getSource().getFormat(),
                url: lyr.getSource().getUrl(),
                strategy: ol.loadingstrategy.bbox,
                crossOrigin: 'anonymous'
            }));
        },
        doSplit: function (e) {
            if (typeof layer2split.get('edit_split_url') === "undefined") {
                alert($.i18n._('_NOSPLITSERVICE'));
                return false;
            }
            var split_url = layer2split.get('edit_split_url');
            var format = new ol.format.WKT();
            var wktGeom = format.writeGeometry(e.feature.getGeometry());
            enc = $('#hidEnc').val();
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONDESCR'), $.i18n._('_NOCONNECTIONTITLE'));
                return false;
            }
            var params = {};
            var params1 = "";
            params["wkt_geometry"] = wktGeom;
            params["enc"] = enc;
            params = JSON.stringify(params);
            $.ajax({
                url: split_url,
                data: params,
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                beforeSend: function () {
                    $(".wait").show();
                },
                success: function (data) {
                    featureEdit.refreshVectorLayer(layer2split.get("name"));
                    featureEdit.removeSelection();
                    mapUtils.showMessage('success', $.i18n._('_SUCCESSMSGSPLIT'), $.i18n._('_SUCCESSTITLE'));
                },
                error: function (response) {
                    console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
                    var msg = response.responseJSON.Message;
                    mapUtils.showMessage('danger', msg, $.i18n._('_SPLITERROR') + editLayer.get("label"));
                },
                failure: function (response) {
                    mapUtils.showMessage('danger', msg, $.i18n._('_SPLITERROR') + editLayer.get("label"));
                },
                complete: function (response) {
                    $(".wait").hide();
                    featureEdit.setEditTools();
                    $('#btnSplit').removeClass("active").addClass("active");
                    featureEdit.initSplit();
                },
                async: true
            });
        }
    };
})();