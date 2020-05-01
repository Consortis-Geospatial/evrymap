/**
 * Controls the Preferences dialog
 * @namespace preferences
 */
var preferences = (function () {
    return {
        /** 
         * Create the Preferences dialog and adds it to the DOM
         * @function createDialog
         * @memberof preferences
         */
        createDialog: function () {
            $.i18n.load(uiStrings);
            var divhtml = '<div class="modal fade" tabindex="-1" role="dialog" id="modPrefsDialog" data-backdrop="static">' +
                '<div class="modal-dialog" role="document">' +
                '  <div class="modal-content">' +
                '     <div class="modal-header">' +
                '      <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                '      <h4 class="modal-title">' + $.i18n._("_PREFERENCES") + '</h4>' +
                '    </div>' +
                '    <div class="modal-body">' +
                '      <ul class="nav nav-tabs" id="prefsTabMenu">' +
                '           <li class="active"><a href="#basicPrefs" data-toggle="tab">' + $.i18n._("_GENERALPREFS") + '</a></li>' +
                '           <li><a href="#editorPrefs" data-toggle="tab">' + $.i18n._("_EDITPREFS") + '</a></li>' +
                '       </ul>' +
                '       <div class="tab-content" id="prefsTabContent">' +
                '           <div id="basicPrefs" class="tab-pane fade in active"><br/>' +
                '               <div class="row">' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divSelColor">' + $.i18n._("_PREFSSELCOLOR") + '</label>' +
                '                       <div id="divSelColor" class="input-group colorpicker-component">' +
                '                           <input type="text" id="txbSelColor" value="#2EFEF7" class="form-control" />' +
                '                               <span class="input-group-addon"><i></i></span>' +
                '                       </div>' +
                '                   </div>' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divSelWidth">' + $.i18n._("_PREFSSELWIDTH") + '</label>' +
                '                       <div id="divSelWidth" class="input-group">' +
                '                           <input type="number" id="txbSelWidth" name="txbSelWidth" min="1" value="1"  class="form-control">' +
                '                               <span class="input-group-addon">px</span>' +
                '                       </div>' +
                '                   </div>' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divSelFillColor">' + $.i18n._("_PREFSSELFILLCOLOR") + '</label>' +
                '                       <div id="divSelFillColor" class="input-group colorpicker-component">' +
                '                           <input type="text" id="txbSelFillColor" value="" class="form-control" />' +
                '                               <span class="input-group-addon"><i></i></span>' +
                '                       </div>' +
                '                   </div>' +
                '               </div>' +
                '               <div class="row">' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divPointZoom">' + $.i18n._("_PREFSPOINTZOOM") + '</label>' +
                '                       <div id="divPointZoom" class="input-group colorpicker-component">' +
                '                           <input type="number" id="txbPointZoom" min="1" max="28" value="13" class="form-control" />' +
                '                       </div>' +
                '                   </div>' +
                '               </div>' +
                '           </div>' +
                '           <div id="editorPrefs" class="tab-pane fade in"><br/>' +
                '               <div class="row">' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divEditColor">' + $.i18n._("_PREFSEDITCOLOR") + '</label>' +
                '                       <div id="divEditColor" class="input-group colorpicker-component">' +
                '                           <input type="text" id="txbEditColor" value="#2EFEF7" class="form-control" />' +
                '                               <span class="input-group-addon"><i></i></span>' +
                '                       </div>' +
                '                   </div>' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divEditWidth">' + $.i18n._("_PREFSEDITWIDTH") + '</label>' +
                '                       <div id="divEditWidth" class="input-group">' +
                '                           <input type="number" id="txbEditWidth" name="quantity" min="1" value="1"  class="form-control">' +
                '                               <span class="input-group-addon">px</span>' +
                '                       </div>' +
                '                   </div>' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divEdiFillColor">' + $.i18n._("_PREFSEDITFILLCOLOR") + '</label>' +
                '                       <div id="divEdiFillColor" class="input-group colorpicker-component">' +
                '                           <input type="text" id="txbEditFillColor" value="" class="form-control" />' +
                '                               <span class="input-group-addon"><i></i></span>' +
                '                       </div>' +
                '                   </div>' +
                '               </div>' +
                '               <div class="row">' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divEditVrtxColor">' + $.i18n._("_PREFSEDITVRTXCOLOR") + '</label>' +
                '                       <div id="divEditVrtxColor" class="input-group colorpicker-component">' +
                '                           <input type="text" id="txbEditVrtxColor" value="#2EFEF7" class="form-control" />' +
                '                               <span class="input-group-addon"><i></i></span>' +
                '                       </div>' +
                '                   </div>' +
                '                   <div class="col-lg-4"' +
                '                       <label for="divEditVrtxWidth">' + $.i18n._("_PREFSEDITVRTXWIDTH") + '</label>' +
                '                       <div id="divEditVrtxWidth" class="input-group">' +
                '                           <input type="number" id="txbEditVrtxWidth" name="quantity" min="1" value="7" class="form-control">' +
                '                               <span class="input-group-addon">px</span>' +
                '                       </div>' +
                '                   </div>' +
                '                   <div class="col-lg-4" style="display:none"' +
                '                       <label for="divEditVrtxFillColor">' + $.i18n._("_PREFSEDITVRTXFILLCOLOR") + '</label>' +
                '                       <div id="divEditVrtxFillColor" class="input-group colorpicker-component">' +
                '                           <input type="text" id="txbEditVrtxFillColor" value="" class="form-control" />' +
                '                               <span class="input-group-addon"><i></i></span>' +
                '                       </div>' +
                '                   </div>' +
                '               </div>' +
                '           </div>' +
                '       </div>' +
                '    </div>' +
                '    <div class="modal-footer">' +
                '      <button type="button" class="btn btn-default" data-dismiss="modal">' + $.i18n._("_CANCEL") + '</button>' +
                '      <button type="button" class="btn btn-primary" onclick="preferences.savePrefs();">' + $.i18n._("_SAVE") + '</button>' +
                '    </div>' +
                '  </div><!-- /.modal-content -->' +
                '</div><!-- /.modal-dialog -->' +
                '</div><!-- /.modal -->';
            $("body").prepend(divhtml);
            //$(prefdiv).append(divhtml);
            //$(prefdiv).appendTo($("#mainparent"));
            $('#lnkOptions').click(function () {
                $('#modPrefsDialog').modal('show');
                $('#divSelColor').colorpicker();
                $('#divSelFillColor').colorpicker();
                $('#divEditColor').colorpicker();
                $('#divEdiFillColor').colorpicker();
                $('#divEditVrtxColor').colorpicker();
                $('#divEditVrtxFillColor').colorpicker();

            });
            preferences.readPrefs();
        },
        /**
         * Returns the stroke color used for selected features
         * @function getSelectedStrokeColor
         * @memberof preferences
         */
        getSelectedStrokeColor: function () {
            if ($('#txbSelColor').val().trim() === "") {
                return "#2EFEF7";
            } else {
                return $('#txbSelColor').val();
            }
        },
        /**
         * Returns the fill color used for selected features
         * @function getSelectedFillColor
         * @memberof preferences
         */
        getSelectedFillColor: function () {
            if ($('#txbSelFillColor').val().trim() === "") {
                return "rgba(255, 255, 255, 0)";
            } else {
                return $('#txbSelFillColor').val();
            }
        },
        /**
         * Returns the stroke width used for selected features
         * @function getEditStrokeColor
         * @memberof preferences
         */
        getSelectedStrokeWidth: function () {
            if ($('#txbSelWidth').val().trim() === "") {
                return 1;
            } else {
                return Number($('#txbSelWidth').val());
            }
        },
        /**
         * Returns the stroke color used for edited features
         * @function getEditStrokeColor
         * @memberof preferences
         */
        getEditStrokeColor: function () {
            if ($('#txbEditColor').val().trim() === "") {
                return "#ccff33";
            } else {
                return $('#txbEditColor').val();
            }
        },
        /**
         * Returns the stroke color used for edited features
         * @function getEditStrokeColor
         * @memberof preferences
         */
        getEditFillColor: function () {
            if ($('#txbEditFillColor').val().trim() === "") {
                return "rgba(255, 255, 255, 0)";
            } else {
                return $('#txbEditFillColor').val();
            }
        },
        /**
         * Returns the stroke width used for edited features
         * @function getEditStrokeWidth
         * @memberof preferences
         */
        getEditStrokeWidth: function () {
            if ($('#txbEditWidth').val().trim() === "") {
                return 1;
            } else {
                return Number($('#txbEditWidth').val());
            }
        },
        /**
         * Returns the stroke color used for edited features vertices
         * @function getEditVertexColor
         * @memberof preferences
         */
        getEditVertexColor: function () {
            if ($('#txbEditVrtxColor').val().trim() === "") {
                return "#ccff33";
            } else {
                return $('#txbEditVrtxColor').val();
            }
        },
        /**
         * Returns the fill color used for edited features vertices
         * @function getEditVertexFillColor
         * @memberof preferences
         */
        getEditVertexFillColor: function () {
            if ($('#txbEditVrtxFillColor').val().trim() === "") {
                return "rgba(255, 255, 255, 0)";
            } else {
                return $('#txbEditVrtxFillColor').val();
            }
        },
        /**
         * Returns the diameter used for edited features vertices
         * @function getEditVertexWidth
         * @memberof preferences
         */
        getEditVertexWidth: function () {
            if ($('#txbEditVrtxWidth').val().trim() === "") {
                return 7;
            } else {
                return Number($('#txbEditVrtxWidth').val());
            }
        },
        /**
         * Returns the point zoom level when zooming to point features
         * @function getPointZoom
         * @memberof preferences
         */
        getPointZoom: function () {
            if ($('#txbPointZoom').val().trim() === "") {
                return 13;
            } else {
                return Number($('#txbPointZoom').val());
            }
        },
        /**
         * Read preferences from Local Storage
         * @function readPrefs
         * @memberof preferences
         */
        readPrefs: function () {
            var mapKey = userUtils.getCurrentMapKey();
            if (localStorage.getItem("citiPortal") !== null && typeof localStorage.getItem("citiPortal") !== "undefined" || localStorage.getItem("citiPortal") !== null) {
                var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
                if (typeof citiPortalObj[mapKey] !== "undefined" && typeof citiPortalObj[mapKey].preferences !== "undefined" ) {
                    $('#txbSelColor').val(citiPortalObj[mapKey].preferences.selectedStrokeColor);
                    $('#txbSelWidth').val(citiPortalObj[mapKey].preferences.selectedStrokeWidth);
                    $('#txbSelFillColor').val(citiPortalObj[mapKey].preferences.selectedFillColor);
                    $('#txbPointZoom').val(citiPortalObj[mapKey].preferences.pointZoom);
                    $('#txbEditColor').val(citiPortalObj[mapKey].preferences.editStrokeColor);
                    $('#txbEditWidth').val(citiPortalObj[mapKey].preferences.editStrokeWidth);
                    $('#txbEditFillColor').val(citiPortalObj[mapKey].preferences.editFillColor);
                    $('#txbEditVrtxColor').val(citiPortalObj[mapKey].preferences.editVertexColor);
                    $('#txbEditVrtxWidth').val(citiPortalObj[mapKey].preferences.editVertexWidth);
                    $('#txbEditVrtxFillColor').val(citiPortalObj[mapKey].preferences.editVertexFillColor);

                }
            }
        },
        /**
         * Save preferences to Local Storage
         * @function savePrefs
         * @memberof preferences
         */
        savePrefs: function () {
            var slyr = legendUtilities.getLayerByName("selection");
            slyr.setStyle(mapUtils.setSelectedStyle());
            var mapKey = userUtils.getCurrentMapKey(); // This will be used as the id for the current view
            if (typeof localStorage.getItem("citiPortal") === "undefined" || localStorage.getItem("citiPortal") === null) {
                localStorage.setItem('citiPortal', '{"' + mapKey + '": {"saved_views":[]}}');
            }
            var citiPortalObj = JSON.parse(localStorage.getItem("citiPortal"));
            // If the current saved view list does not exist, create it
            if (typeof citiPortalObj[mapKey] === "undefined") {
                citiPortalObj[mapKey] = JSON.parse("{\"saved_views\":[]}");
            }
            // Get Preferences
            prefs = preferences.getPrefsObject();
            citiPortalObj[mapKey].preferences = prefs;

            //Convert the JSON object back to string and add it to local storage
            localStorage.setItem('citiPortal', JSON.stringify(citiPortalObj));

            // Close the dialog
            $('#modPrefsDialog').modal('hide');
            mapUtils.showMessage('success', $.i18n._('_PREFSSAVESUCCESS'), "");
        },
        /**
         * Read the preferences dialog and return its values as an object
         * @function getPrefsObject
         * @memberof preferences
         */
        getPrefsObject: function () {
            var prefs = '{';
            prefs = prefs + '"selectedStrokeColor" : "' + preferences.getSelectedStrokeColor() + '",';
            prefs = prefs + '"selectedFillColor" : "' + preferences.getSelectedFillColor() + '",';
            prefs = prefs + '"selectedStrokeWidth" : ' + preferences.getSelectedStrokeWidth() + ',';
            prefs = prefs + '"editStrokeColor" : "' + preferences.getEditStrokeColor() + '",';
            prefs = prefs + '"editFillColor" : "' + preferences.getEditFillColor() + '",';
            prefs = prefs + '"editStrokeWidth" : ' + preferences.getEditStrokeWidth() + ',';
            prefs = prefs + '"editVertexColor" : "' + preferences.getEditVertexColor() + '",';
            prefs = prefs + '"editVertexFillColor" : "' + preferences.getEditVertexFillColor() + '",';
            prefs = prefs + '"editVertexWidth" : ' + preferences.getEditVertexWidth() + ',';
            prefs = prefs + '"pointZoom" : "' + preferences.getPointZoom() + '"';
            prefs = prefs + '}';
            return JSON.parse(prefs);
        }
    };
})();
