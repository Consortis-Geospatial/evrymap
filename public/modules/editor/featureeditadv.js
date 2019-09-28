var editLayer;
var layer2hump;
var featureEditAdvanced = (function () {
    return {
        initHump: function () {
            featureEdit.unselectEditTools();
            $('#btnHump').addClass("active");
            var currentEditLayerName = $('#hidEditLayer').val().trim();
            if (currentEditLayerName === "") {
                alert("Could not find edit layer for creating hump");
                return;
            }
            var currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName);
            if (currentEditLayer instanceof ol.layer.Vector) {
                layer2hump = currentEditLayer;
            } else {
                currentEditLayer = legendUtilities.getLayerByName(currentEditLayerName + "_EDIT");
                if (typeof currentEditLayer !== "undefined") {
                    layer2hump = currentEditLayer;
                } else {
                    alert("Could not find edit layer for hump: " + currentEditLayerName + " or " + currentEditLayerName + "_EDIT");
                    return;
                }
            }
            if (typeof layer2hump.get("edit_split_layer") !== "undefined" && layer2hump.get("edit_split_layer").trim() !== "") {
                $mymap = $('#mapid').data('map');
                //Clear edit interactions
                featureEdit.resetInteraction("DRAW");
                featureEdit.resetInteraction("MODIFY");
                //Enable the stop editing button
                $('#btnStopEdits').prop('disabled', false);
                //Set global editlayer var
                editLayer = legendUtilities.getLayerByName(layer2hump.get("edit_split_layer"));
                this.drawIntrAct = new ol.interaction.Draw({
                    source: editLayer.getSource(),
                    type: "Point"
                });

                $mymap.addInteraction(this.drawIntrAct);
                this.drawIntrAct.on('drawend', featureEditAdvanced.doHump);
                if (typeof layer2hump.get("edit_snapping_layers") !== "undefined") {
                    $.each(layer2hump.get("edit_snapping_layers"), function (i, snap_layer) {
                        featureEdit.initSnapping(snap_layer);
                    });
                }
            }
        },
        doHump: function (e) {
            if (typeof layer2hump.get('edit_hump_url') === "undefined") {
                alert($.i18n._('_NOSPLITSERVICE'));
                return false;
            }
            var split_url = layer2hump.get('edit_hump_url');
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
                    featureEdit.refreshVectorLayer(layer2hump.get("name"));
                },
                error: function (response) {
                    mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
                    console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
                },
                failure: function (response) {
                    mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
                    console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
                },
                complete: function (response) {
                    $(".wait").hide();
                },
                async: false
            });
        }
    }
})();