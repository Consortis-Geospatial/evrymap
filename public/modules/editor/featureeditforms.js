var area_control = '';
var length_control = '';
var featureEditForms = (function () {
    return {
        prepareNewEditForm: function (e) {
            e.feature.setProperties({
                'tmp_id': -1
            });

            featureEditForms.generateEditForm(editLayer);
            if (editLayer instanceof ol.layer.Vector && (editLayer.get('edit_pk') !== undefined && editLayer.get('edit_fields') !== undefined)) {
                var editFlds = editLayer.get('edit_fields');
                $.each(editFlds, function (i, fldConfig) {
                    var ctrl_id = fldConfig.name.split(':')[0];
                    if (fldConfig.required) {
                        //bootstrapValidate('#' + ctrl_id, 'required:' + $.i18n._('_REQUIREDFIELD'));
                    }
                    if (fldConfig.control === "dropdown") {
                        if (typeof fldConfig.service_url !== "undefined") {
                            if (typeof fldConfig.parent_field === "undefined") {
                                featureEditForms.popAttrList(ctrl_id, fldConfig.service_url, fldConfig.control);
                                $('#' + ctrl_id).on('change', function () {
                                    featureEditForms.validateEditForm();
                                });
                            }
                            if (typeof fldConfig.child_fields !== "undefined") {
                                $.each(fldConfig.child_fields, function (key, val) {
                                    var childField = val.split(':')[0];
                                    var childUrl = val.split(':')[1] + ':' + val.split(':')[2];
                                    $('#' + childField).prop("disabled", true);
                                    $('#' + ctrl_id).on('change', function () {
                                        $('#' + childField).prop("disabled", false);
                                        if (typeof fldConfig.parent_field === "undefined") {
                                            featureEditForms.popChildAttrList(childField, childUrl, $('#' + ctrl_id).val());
                                        } else {
                                            var grandparentvalue;
                                            if (featureEditForms.isFieldTypeAhead(editLayer, fldConfig.parent_field)) {
                                                grandparentvalue = $('#hidVal_' + fldConfig.parent_field).val();
                                            } else {
                                                grandparentvalue = $('#' + fldConfig.parent_field).val();
                                            }
                                            featureEditForms.popGrandChildAttrList(childField, childUrl, $('#' + ctrl_id).val(), grandparentvalue);
                                        }
                                        featureEditForms.validateEditForm();
                                    });
                                });
                            }
                        } else if (typeof fldConfig.values !== "undefined") {
                            var htmlOpt = '';
                            $.each(fldConfig.values, function (i, val) {
                                htmlOpt = htmlOpt + '<option value="' + val + '">' + val + '</option> ';
                                //$('#' + ctrl_id + ' option[value="' + f.get(ctrl_id) + '"]').prop('selected', 'selected');
                            });
                            htmlOpt = '<option value="#">' + $.i18n._('_SELECT') + '...</option>' + htmlOpt;

                            $('#' + ctrl_id).empty();
                            $('#' + ctrl_id).html(htmlOpt);
                            $('#' + ctrl_id).on('change', function () {
                                featureEditForms.validateEditForm();
                            });
                        } else {
                            $('#' + ctrl_id).on('change', function () {
                                featureEditForms.validateEditForm();
                            });
                        }
                    } else if (fldConfig.control === "typeahead") {
                        if (typeof fldConfig.child_fields !== "undefined") {
                            $.each(fldConfig.child_fields, function (key, val) {
                                var childField = val.split(':')[0];
                                var childUrl = val.split(':')[1] + ':' + val.split(':')[2];
                                $('#' + childField).prop("disabled", true);
                                $('#hidVal_' + ctrl_id).on('change', function () {
                                    $('#' + childField).prop("disabled", false);
                                    if (typeof fldConfig.parent_field === "undefined") {
                                        featureEditForms.popChildAttrList(childField, childUrl, $('#hidVal_' + ctrl_id).val());
                                    } else {
                                        var grandparentvalue;
                                        if (featureEditForms.isFieldTypeAhead(editLayer, fldConfig.parent_field)) {
                                            grandparentvalue = $('#hidVal_' + fldConfig.parent_field).val();
                                        } else {
                                            grandparentvalue = $('#' + fldConfig.parent_field).val();
                                        }
                                        featureEditForms.popGrandChildAttrList(childField, childUrl, $('#hidVal_' + ctrl_id).val(), grandparentvalue);
                                    }
                                    featureEditForms.validateEditForm();
                                });
                            });
                        }
                    }
                    if (fldConfig.control === "text") {
                        if (fldConfig.type.split(':')[0] === "integer") {
                            //bootstrapValidate('#' + ctrl_id, 'integer:' + $.i18n._('_INTEGERONLY'));
                        }
                        if (fldConfig.type.split(':')[0] === "number") {
                            //Get the decimal separator in case of numbers
                            var dp = $.i18n._('_DECIMALSEPARATOR');
                            // Assuming that if its a number the value will have a . as the decimal separator,
                            // we only need to do a regex validation if the dp variable value is a comma
                            if (dp === ",") {
                                //$('#' + ctrl_id).val(e.feature.get(ctrl_id).replace('.', ','));
                                // Its a comma so do a regex validation to allow numeric values with commas
                                // bootstrapValidate('#' + ctrl_id, 'regex:^\d+(,\d+)*$:' + $.i18n._('_INVALIDNUMBER'));
                            } else { //Do a standard numeric validation
                                //bootstrapValidate('#' + ctrl_id, 'numeric:' + $.i18n._('_INVALIDNUMBER'));
                            }
                        }
                        if (typeof fldConfig.calc !== "undefined") {
                            if (fldConfig.calc === "AREA") {
                                area_control = ctrl_id;
                                $('#' + ctrl_id).val((measureUtilities.formatAreaInM(e.feature.getGeometry())).toString().replace('.', $.i18n._('_DECIMALSEPARATOR')));
                            } else if (fldConfig.calc === "LENGTH") {
                                length_control = ctrl_id;
                                $('#' + ctrl_id).val((measureUtilities.formatLengthInM(e.feature.getGeometry())).toString().replace('.', $.i18n._('_DECIMALSEPARATOR')));
                            }
                        }
                    }
                });
            } else {
                mapUtils.showMessage('danger', $.i18n._('_CANNOTEDIT'), $.i18n._('_ERROROCCUREDTITLE'));
                return false;
            }
            var format = new ol.format.WKT();
            var wktGeom = format.writeGeometry(e.feature.getGeometry());
            $('#hidGeom').val(wktGeom);
            featureEditForms.openEditForm("NEW", editLayer.get("name"), editLayer.get("label"));
            // Add modify interaction
            var modifyNewIntrAct = new ol.interaction.Modify({
                features: new ol.Collection([e.feature]),
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
                        width: 5
                    }),
                    fill: new ol.style.Fill({
                        color: 'green'
                    })
                })
            });
            modifyNewIntrAct.on("modifyend", featureEditForms.onModifyGeometry);
            mymap.addInteraction(modifyNewIntrAct);
            // Disable edit button so user won't try to edit an un-committed feature
            $('#btnEdit').prop('disabled', true);
            // If its a polygon layer enable the Add Hole button
            if (typeof editLayer.get("edit_geomtype") !== "undefined" && editLayer.get("edit_geomtype") === "Polygon") {
                $('#btnAddHole').prop('disabled', false);
                $('#btnAddHole').unbind('click').bind('click', function () {
                    featureEdit.initAddHole();
                });
            }
            if (typeof editLayer.get("edit_geomtype") !== "undefined" && editLayer.get("edit_geomtype") === "MultiPolygon") {
                $('#btnAddPart').prop('disabled', false);
                $('#btnAddPart').unbind('click').bind('click', function () {
                    featureEdit.initAddPart(e.feature);
                });
            }
        },
        isFieldTypeAhead: function(lyr, fieldName) {
            var isTypeAhead=false;
            var editFlds = lyr.get('edit_fields');
                $.each(editFlds, function (i, fldConfig) {
                    var fldName = fldConfig.name.split(':')[0];
                    if (fldName === fieldName) {
                        if (fldConfig.control === "typeahead") {
                            isTypeAhead=true;
                        }
                        return false;
                    }
                });
            return isTypeAhead;
        },
        prepareEditForm: function (e) {
            if (e.selected.length === 0) {
                return;
            }
            var f = e.selected[0];
            // Change selected style
            //f.setStyle(mapUtils.setSelectedStyle(f));
            if (editLayer instanceof ol.layer.Vector && (editLayer.get('edit_pk') !== undefined && editLayer.get('edit_fields') !== undefined)) {
                featureEditForms.generateEditForm(editLayer);
                var editFlds = editLayer.get('edit_fields');
                var pkVal = f.get(editLayer.get('edit_pk'));
                $('#hidPk').val(pkVal);
                // Check if the layer has related data
                if (editLayer.get("has_relation")) {
                    if (typeof editLayer.get("relation_details") === "undefined") {
                        alert("No relation information found - please check config files for layer " + editLayer.get("name"));
                        return false;
                    }
                    var relationDetails = editLayer.get("relation_details");
                    var service_url = relationDetails.service_url;
                    var childFnName = relationDetails.edit_related_fn;
                    var local_field_value = f.get(relationDetails.local_field);
                    if (typeof service_url !== "undefined" && typeof childFnName !== "undefined" && typeof local_field_value === "undefined") {
                        $('#attrContent').append(window[childFnName](local_field_value, service_url));
                    }
                }
                $.each(editFlds, function (i, fldConfig) {
                    var ctrl_id = fldConfig.name.split(':')[0];
                    if (fldConfig.required) {
                        //bootstrapValidate('#' + ctrl_id, 'required:' + $.i18n._('_REQUIREDFIELD'));
                    }
                    if (fldConfig.control === "dropdown" || fldConfig.control === "text" || fldConfig.control === "typeahead") {
                        if (fldConfig.control === "dropdown") {
                            if (typeof fldConfig.service_url !== "undefined") {
                                if (typeof fldConfig.parent_field === "undefined") {
                                    featureEditForms.popAttrList(ctrl_id, fldConfig.service_url, fldConfig.control);
                                    $('#' + ctrl_id + ' option[value="' + f.get(ctrl_id) + '"]').prop('selected', 'selected');
                                }
                                if (typeof fldConfig.child_fields !== "undefined") {
                                    $.each(fldConfig.child_fields, function (key, val) {
                                        var childField = val.split(':')[0];
                                        var childUrl = val.split(':')[1] + ':' + val.split(':')[2];
                                        $('#' + childField).prop("disabled", true);
                                        if (typeof fldConfig.parent_field === "undefined") {
                                            featureEditForms.popChildAttrList(childField, childUrl, f.get(ctrl_id));
                                            $('#' + childField + ' option[value="' + f.get(childField) + '"]').prop('selected', 'selected');
                                        } else {
                                            //let grandparentvalue = $('#' + fldConfig.parent_field).val();
                                            let grandparentvalue = f.get(fldConfig.parent_field);
                                            featureEditForms.popGrandChildAttrList(childField, childUrl, f.get(ctrl_id), grandparentvalue);
                                        }
                                        $('#' + ctrl_id).on('change', function () {
                                            $('#' + childField).prop("disabled", false);
                                            if (typeof fldConfig.parent_field === "undefined") {
                                                featureEditForms.popChildAttrList(childField, childUrl, $('#' + ctrl_id).val());
                                                $('#' + childField + ' option[value="' + f.get(childField) + '"]').prop('selected', 'selected');
                                            } else {
                                                let grandparentvalue = $('#' + fldConfig.parent_field).val();
                                                featureEditForms.popGrandChildAttrList(childField, childUrl, $('#' + ctrl_id).val(), grandparentvalue);
                                            }
                                        });
                                    });
                                }
                            } else if (typeof fldConfig.values !== "undefined") {
                                var htmlOpt = '';
                                $.each(fldConfig.values, function (i, val) {
                                    htmlOpt = htmlOpt + '<option value="' + val + '">' + val + '</option> ';
                                    //$('#' + ctrl_id + ' option[value="' + f.get(ctrl_id) + '"]').prop('selected', 'selected');
                                });
                                if (typeof fldConfig.required !== "undefined" && fldConfig.required === false) {
                                    htmlOpt = '<option value="#">' + $.i18n._('_SELECT') + '...</option>' + htmlOpt;
                                }
                                $('#' + ctrl_id).empty();
                                $('#' + ctrl_id).html(htmlOpt);
                                $('#' + ctrl_id).on('change', function () {
                                    featureEditForms.validateEditForm();
                                });
                            }
                        } else if (fldConfig.control === "typeahead") {
                            if (typeof fldConfig.child_fields !== "undefined") {
                                $.each(fldConfig.child_fields, function (key, val) {
                                    var childField = val.split(':')[0];
                                    var childUrl = val.split(':')[1] + ':' + val.split(':')[2];
                                    $('#' + childField).prop("disabled", true);
                                    // Populate child field
                                    featureEditForms.popChildAttrList(childField, childUrl, f.get(ctrl_id));
                                    // Bind the onchange() event
                                    $('#hidVal_' + ctrl_id).on('change', function () {
                                        $('#' + childField).prop("disabled", false);
                                        if (typeof fldConfig.parent_field === "undefined") {
                                            featureEditForms.popChildAttrList(childField, childUrl, $('#hidVal_' + ctrl_id).val());
                                        } else {
                                            var grandparentvalue;
                                            if (featureEditForms.isFieldTypeAhead(editLayer, fldConfig.parent_field)) {
                                                grandparentvalue = $('#hidVal_' + fldConfig.parent_field).val();
                                            } else {
                                                grandparentvalue = $('#' + fldConfig.parent_field).val();
                                            }
                                            featureEditForms.popGrandChildAttrList(childField, childUrl, $('#hidVal_' + ctrl_id).val(), grandparentvalue);
                                        }
                                        featureEditForms.validateEditForm();
                                    });
                                });
                            }
                        }
                        if (typeof fldConfig.readonlyonedit !== "undefined" && fldConfig.readonlyonedit === true) {
                            if (fldConfig.control === "dropdown") {
                                $('#' + ctrl_id).prop("disabled", true);
                            } else if (fldConfig.control === "text" || fldConfig.control === "typeahead") {
                                $('#' + ctrl_id).prop("readonly", "readonly");
                            }
                        }
                        // Set values in controls
                        if (fldConfig.control === "dropdown") {
                            $('#' + ctrl_id + ' option[value="' + f.get(ctrl_id) + '"]').prop('selected', 'selected');
                        } else if (fldConfig.control === "text" || fldConfig.control === "typeahead") {
                            $('#' + ctrl_id).val(f.get(ctrl_id));
                            // If its typeahead add the value in the hidden field. We will get the label to display in the box when the dialog is opened
                            $('#hidVal_' + ctrl_id).val(f.get(ctrl_id));
                            if (fldConfig.type.split(':')[0] === "integer") {
                                //bootstrapValidate('#' + ctrl_id, 'integer:' + $.i18n._('_INTEGERONLY'));
                            }
                            if (fldConfig.type.split(':')[0] === "number") {
                                //Get the decimal separator in case of numbers
                                var dp = $.i18n._('_DECIMALSEPARATOR');
                                // If it is a comma replace any dots with commas
                                if (dp === ",") {
                                    $('#' + ctrl_id).val(f.get(ctrl_id).replace('.', ','));
                                }
                            }
                        }
                    } else {
                        if (fldConfig.type.split(':')[0] === "boolean") {
                            f.get(ctrl_id) === "f" ? $('#' + ctrl_id).attr('checked', false) : $('#' + ctrl_id).attr('checked', true);
                            if (typeof fldConfig.readonlyonedit !== "undefined") {
                                $('#' + ctrl_id).prop("disabled", true);
                            }
                        }
                    }
                    if (typeof fldConfig.calc !== "undefined") {
                        if (fldConfig.calc === "AREA") {
                            area_control = ctrl_id;
                        } else if (fldConfig.calc === "LENGTH") {
                            length_control = ctrl_id;
                        }
                    }
                });
                var format = new ol.format.WKT();
                var wktGeom = format.writeGeometry(f.getGeometry());
                $('#hidGeom').val(wktGeom);
                featureEditForms.openEditForm("UPDATE", editLayer.get('name'), editLayer.get('label'));
                if (typeof editLayer.get("edit_geomtype") !== "undefined" && (editLayer.get("edit_geomtype") === "Polygon" || editLayer.get("edit_geomtype") === "MultiPolygon")) {
                    $('#btnAddHole').show();
                    $("#btnAddHole").prop('disabled', false);
                    $('#btnAddHole').unbind('click').bind('click', function () {
                        featureEdit.initAddHole();
                    });
                    if (editLayer.get("edit_geomtype") === "MultiPolygon") {
                        $('#btnAddPart').show();
                        $("#btnAddPart").prop('disabled', false);
                        $('#btnAddPart').unbind('click').bind('click', function () {
                            featureEdit.initAddPart(f);
                        });
                    }
                }
            }
        },
        generateEditForm: function (lyr) {
            if (lyr instanceof ol.layer.Vector && (lyr.get('edit_pk') !== undefined && lyr.get('edit_fields') !== undefined)) {
                var pk = lyr.get('edit_pk');
                var editFlds = lyr.get('edit_fields');
                $('#attrContent').empty();
                var html = '<form role="form" id="editForm" method="post" action="">';
                html = html + '     <input id="hidPk" type="hidden" value="" />';
                html = html + '     <input id="hidGeom" type="hidden" value="" />';
                var c = 0;
                $.each(editFlds, function (i, fldConfig) {
                    if (c === 0) {
                        html = html + '<div class="row">';
                    }
                    var fldName = fldConfig.name.split(':')[0];
                    var fldlabel = fldConfig.name.split(':')[1];
                    var fldtype = fldConfig.type.split(':')[0];
                    var fldlength = fldConfig.type.split(':')[1];
                    var fldctrl = fldConfig.control;
                    var fldreq = fldConfig.required;
                    var fldro = fldConfig.readonly;

                    var is_required = '';
                    var is_readonly = '';
                    var field_type = "string";
                    if (typeof fldlength === "undefined" || isNaN(fldlength)) {
                        fldlength = "10";
                    }
                    if (typeof fldreq !== "undefined" && fldreq === true) {
                        is_required = " required ";
                    }
                    if (typeof fldro !== "undefined" && fldro === true) {
                        is_readonly = " readonly ";
                    }
                    if (typeof fldtype !== "undefined") {
                        field_type = fldtype;
                    }
                    // Set columns based on control type
                    if (parseInt(fldlength) > 150 && fldctrl === "text") {
                        html = html + '<div class="form-group col-md-12" id="fg_' + fldName + '">';
                    } else {
                        html = html + '<div class="form-group col-md-6" id="fg_' + fldName + '">';
                    }
                    //Set control label based on whether it is required or not
                    //var reqLabel = '<b style="color:red">*</b>';
                    if (is_required === " required ") {
                        html = html + '<label for="' + fldName + '" class="control-label">' + fldlabel + '*</label ><div class="input-group" style="width:100%"> ';
                    } else {
                        html = html + '<label for="' + fldName + '" class="control-label">' + fldlabel + '</label > <div class="input-group" style="width:100%">';
                    }
                    if (field_type === "boolean") {
                        html = html + '<input type="checkbox" data-toggle="toggle" id="' + fldName + '" value=""></div>';
                    } else {
                        if (fldctrl === "dropdown") {
                            html = html + '<select class="form-control" id="' + fldName + '" data-live-search="true"></select></div>';
                        } else if (fldctrl === "typeahead") {
                            html = html + '<input type="text" class="form-control input typeahead" maxlength=' + fldlength + is_readonly + ' id="' + fldName + '" ' + is_required + ' onblur="featureEditForms.validateFldOnBlur(this.id)">';
                            html = html + '<span id="fdb_' + fldName + '"></span>';
                            html = html + '<input type="hidden" id="hidVal_' + fldName + '"></div>';
                        } else if (fldctrl === "text") {
                            if (parseInt(fldlength) > 150) {
                                html = html + '<textarea class="form-control input" maxlength=' + fldlength + is_readonly + ' id="' + fldName + '" ' + is_required + ' onblur="featureEditForms.validateFldOnBlur(this.id)"></textarea>';
                                html = html + '<span id="fdb_' + fldName + '"></span></div>';
                            } else {
                                if (field_type === "string") {
                                    html = html + '<input type="text" class="form-control input" maxlength=' + fldlength + is_readonly + ' id="' + fldName + '" ' + is_required + ' onblur="featureEditForms.validateFldOnBlur(this.id)">';
                                    html = html + '<span id="fdb_' + fldName + '"></span></div>';
                                } else if (field_type === "integer") {
                                    html = html + '<input type="number" class="form-control input"' + is_readonly + ' id="' + fldName + '" ' + is_required + ' onblur="featureEditForms.validateFldOnBlur(this.id)">';
                                    html = html + '<span id="fdb_' + fldName + '"></span></div>';
                                } else if (field_type === "number") {
                                    html = html + '<input type="text" class="form-control input"' + is_readonly + ' id="' + fldName + '" ' + is_required +
                                        'pattern="^\d+(,\d+)*$" onblur="featureEditForms.validateFldOnBlur(this.id)">';
                                    html = html + '<span id="fdb_' + fldName + '"></span></div>';
                                }
                            }
                        }
                    }
                    html = html + '</div>';
                    c = c + 1;
                    if (c === 2) {
                        //Close row tag
                        html = html + '</div>';
                        c = 0;
                    }
                });
                html = html + '</form>';
                $('#attrContent').html(html);
               
            }
        },
        setAutocompleteControls: function(lyr, mode) {
            var editFlds = lyr.get('edit_fields');
             // Now loop through the edit fields once more to find and set autocompletes
             $.each(editFlds, function (i, fldConfig) {
                var fldName = fldConfig.name.split(':')[0];
                var fldctrl = fldConfig.control;
                if (fldctrl === "typeahead") {
                    var acData = featureEditForms.popTypeAheadList(fldConfig.service_url);
                    $('#' + fldName).autocomplete({
                        source:acData,
                        // Autocomplete will by default, display the value and not the label when selecting
                        // a value. We don't want this, so bind select, focus and change event to store the value in the hidden field
                        // of the autocomplete input control
                        select: function( event, ui ) {
                            
                            $('#' + fldName).val(ui.item.label);
                            $('#hidVal_' + fldName).val(ui.item.value).trigger('change');
                        },
                        focus:  function( event, ui ) {
                          $('#' + fldName).val(ui.item.label);
                        },
                        change: function( event, ui ) {
                           $('#' + fldName).val(ui.item.label);
                           $('#hidVal_' + fldName).val(ui.item.value).trigger('change');

                        }
                    });
                    if (mode==="UPDATE"){
                        // Get the label for the hidden value field
                        let lbl = acData.find(x => x.value === $('#hidVal_' + fldName).val()).label;
                        $('#' + fldName).val(lbl);
                    }
                }
                
            });
        },
        openEditForm: function (mode, lyrname, lyrlabel) {
            $('#divAttrsForm').dialog({
                autoOpen: false,
                width: 500,
                height: 500,
                maxHeight: 700,
                maxWidth: 641,
                open: function() {
                   featureEditForms.setAutocompleteControls( legendUtilities.getLayerByName(lyrname), mode);
                },
                buttons: [{
                        id: "btnEditFormSave",
                        text: function () {
                            if (mode === "NEW") {
                                return $.i18n._('_CREATE');
                            } else {
                                return $.i18n._('_SAVE');
                            }
                        },
                        click: function () {
                            if (mode === "NEW") {
                                featureEditForms.saveEditForm('NEW');
                            } else {
                                featureEditForms.saveEditForm('UPDATE');
                            }
                        },
                        disabled: function () {
                            return !featureEditForms.validateEditForm();
                        }
                    },
                    {
                        text: $.i18n._('_DELETE'),
                        class: "cancelButton",
                        disabled: function () {
                            if (mode === "NEW") {
                                return true;
                            } else {
                                return false;
                            }
                        },
                        click: function () {
                            featureEditForms.saveEditForm("DELETE");
                        }
                    },
                    {
                        text: $.i18n._('_CLOSE'),
                        class: "cancelButton",
                        click: function () {
                            $(this).dialog("close");
                            // Disable add hole and add part buttons and remove click events
                            $('#btnAddHole').prop('disabled', true);
                            $('#btnAddHole').unbind('click');
                            $('#btnAddPart').prop('disabled', true);
                            $('#btnAddPart').unbind('click');
                            // Enable edit button in case it was disabled
                            $('#btnEdit').prop('disabled', false);
                            if (mode === "NEW") {
                                featureEdit.initDrawing();
                            }
                        }
                    }
                ],
                close: function () {
                    area_control = '';
                    length_control = '';
                    featureEdit.cancelFeatureNew(lyrname);
                    featureEdit.removeSelection();
                },
                title: lyrlabel,
                closeOnEscape: false
            });

            $('#divAttrsForm').dialog('open');
            $("#divAttrsForm").dialog("option", "maxHeight", 700);
            //Convert checkboxes to switches
            var cb = $('#divAttrsForm').find('input[type="checkbox"]');
            cb.each(function () {
                $(this).bootstrapToggle({
                    on: $.i18n._('_YES'),
                    off: $.i18n._('_NO')
                });
            });
            // Initialize validator
            //$('#editForm').validator('update');
        },
        popTypeAheadList: function (url) {
            var enc = $('#hidEnc').val();
            var acArray = [];
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONTITLE'), $.i18n._('_NOCONNECTIONDESCR'));
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
                    if (data !== null && data !== "") {
                        var vals = data.d.replace('{', '').replace('}', '').split(',');
                        $.each(vals, function (i, valueObj) {
                            item={};
                            let kv = valueObj.split(':');
                            let k = (typeof kv[0] === "undefined") ? "undefined" : kv[0].replace(/\"/g, "");
                            let v = (typeof kv[1] === "undefined") ? "undefined" : kv[1].replace(/\"/g, "");
                            if (typeof kv[0] === "undefined" || typeof kv[1] === "undefined") {
                                console.log(valueObj);
                            }
                            item.label=v;
                            item.value=k;
                            acArray.push(item);
                        });                      
                    }
                },
                error: function (response) {
                    alert(response.responseText);
                },
                async: false
            });
            //featureEditForms.validateEditForm();
            return acArray;
        },
        popAttrList: function (ctrl, url, type) {
            var enc = $('#hidEnc').val();
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONTITLE'), $.i18n._('_NOCONNECTIONDESCR'));
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
                beforeSend: function () {
                    $(".wait").show();
                },
                success: function (data) {
                    //var vals = JSON.parse(data.d);

                    if (vals !== null && vals !== "") {
                        var vals = data.d.replace('{', '').replace('}', '').split(',');
                        if (type === "dropdown") {
                            var ddl = $("#" + ctrl);
                            ddl.empty().append('<option value="#">' + $.i18n._('_SELECT') + '...</option>');
                            //$.each(vals, function (key, valueObj) {
                            //    ddl.append($("<option></option>").val(key).html(valueObj));
                            //});
                            $.each(vals, function (i, valueObj) {
                                let kv = valueObj.split(':');
                                let k = (typeof kv[0] === "undefined") ? "undefined" : kv[0].replace(/\"/g, "");
                                let v = (typeof kv[1] === "undefined") ? "undefined" : kv[1].replace(/\"/g, "");
                                if (typeof kv[0] === "undefined" || typeof kv[1] === "undefined") {
                                    console.log(valueObj);
                                }
                                ddl.append($("<option></option>").val(k).html(v));
                                //console.log(valueObj.split(':')[0] + ' - ' + valueObj.split(':')[1]);
                            });
                            //ddl.val(selval);
                        } else if (type === "typeahead") {
                            //TODO
                        }
                    }
                },
                error: function (response) {
                    alert(response.responseText);
                },
                failure: function (response) {
                    alert(response.responseText);
                },
                complete: function (response) {
                    $(".wait").hide();
                },
                async: false
            });
            featureEditForms.validateEditForm();
        },
        popChildAttrList: function (ctrl, url, parentval) {
            var enc = $('#hidEnc').val();
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONDESCR'), $.i18n._('_NOCONNECTIONTITLE'));
                return false;
            }
            var params = {
                "enc": enc,
                "parentval": parentval
            };
            params = JSON.stringify(params);
            $.ajax({
                url: url,
                data: params,
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                beforeSend: function () {
                    $(".wait").show();
                },
                success: function (data) {
                    var vals = JSON.parse(data.d);
                    if (vals !== null) {
                        var ddl = $("#" + ctrl);
                        ddl.empty().append('<option value="#">' + $.i18n._('_SELECT') + '...</option>');
                        $.each(vals, function (key, valueObj) {
                            ddl.append($("<option></option>").val(key).html(valueObj));
                        });
                        //ddl.val(selval);
                    }
                },
                error: function (response) {
                    alert(response.responseText);
                },
                failure: function (response) {
                    alert(response.responseText);
                },
                complete: function (response) {
                    $(".wait").hide();
                },
                async: false
            });
            featureEditForms.validateEditForm();
        },
        popGrandChildAttrList: function (ctrl, url, parentval, grandparentval) {
            var enc = $('#hidEnc').val();
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONDESCR'), $.i18n._('_NOCONNECTIONTITLE'));
                return false;
            }
            var params = {
                "enc": enc,
                "parentval": parentval,
                "grandparentval": grandparentval
            };
            params = JSON.stringify(params);
            $.ajax({
                url: url,
                data: params,
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                beforeSend: function () {
                    $(".wait").show();
                },
                success: function (data) {
                    var vals = JSON.parse(data.d);
                    if (vals !== null) {
                        var ddl = $("#" + ctrl);
                        ddl.empty().append('<option value="#">' + $.i18n._('_SELECT') + '...</option>');
                        $.each(vals, function (key, valueObj) {
                            ddl.append($("<option></option>").val(key).html(valueObj));
                        });
                        //ddl.val(selval);
                    }
                },
                error: function (response) {
                    alert(response.responseText);
                },
                failure: function (response) {
                    alert(response.responseText);
                },
                complete: function (response) {
                    $(".wait").hide();
                },
                async: false
            });
            featureEditForms.validateEditForm();
        },
        saveEditForm: function (mode) {
            if (typeof editLayer.get('edit_service_url') === "undefined") {
                alert($.i18n._('_NOSEDITSERVICE'));
                return false;
            }
            var edit_url = editLayer.get('edit_service_url');
            enc = $('#hidEnc').val();
            if (enc.trim() === '') {
                mapUtils.showMessage('danger', $.i18n._('_NOCONNECTIONDESCR'), $.i18n._('_NOCONNECTIONTITLE'));
                return false;
            }
            var params = {};
            var params1 = "";
            if (editLayer instanceof ol.layer.Vector && (editLayer.get('edit_pk') !== undefined && editLayer.get('edit_fields') !== undefined)) {
                params["table_name"] = editLayer.get('table_name');
                params["pk_fieldval"] = editLayer.get('edit_pk') + ":" + $("#hidPk").val();
                var editFlds = editLayer.get('edit_fields');
                var isvalid = true;
                $.each(editFlds, function (i, fldConfig) {
                    isvalid = featureEditForms.validateField(fldConfig);
                    if (!isvalid) {
                        return false;
                    }
                    if (fldConfig.control === "dropdown" || fldConfig.control === "text") {
                        var fldval = $("#" + fldConfig.name.split(':')[0]).val().replace(",", ".");
                        params1 = params1 + fldConfig.name.split(':')[0] + ":" + fldval + ":" + fldConfig.type + "|";
                    } else if (fldConfig.control === "typeahead") { // Get the value from the hidden field
                        var fldHidval = $("#hidVal_" + fldConfig.name.split(':')[0]).val().replace(",", ".");
                        params1 = params1 + fldConfig.name.split(':')[0] + ":" + fldHidval + ":" + fldConfig.type + "|";
                    } else {
                        if (fldConfig.type === "boolean") {
                            params1 = params1 + fldConfig.name.split(':')[0] + ":" + $("#" + fldConfig.name.split(':')[0]).prop('checked') + ":" + fldConfig.type + "|";
                        }
                    }
                });
                if (!isvalid) {
                    return false;
                }
                params["field_params"] = params1.slice(0, -1);
                params["geom_fieldval"] = editLayer.get('edit_geomcol') + ":" + $("#hidGeom").val();
                params["projcode"] = projcode.split(':')[1];
                params["mode"] = mode;
                params["enc"] = enc;
                params = JSON.stringify(params);
                //console.log(params);
                $.ajax({
                    url: edit_url,
                    data: params,
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    beforeSend: function () {
                        $(".wait").show();
                    },
                    success: function (data) {
                        var s = data.d;
                        featureEdit.refreshVectorLayer(editLayer.get("name"));
                        area_control = '';
                        length_control = '';
                        $('#divAttrsForm').dialog("close");
                        if (mode === "UPDATE") {
                            featureEdit.removeSelection();
                            mapUtils.showMessage('success', $.i18n._('_SUCCESSMSGEDIT'), $.i18n._('_SUCCESSTITLE'));
                        } else if (mode === "NEW") {
                            mapUtils.showMessage('success', $.i18n._('_SUCCESSMSGCREATE'), $.i18n._('_SUCCESSTITLE'));
                        } else {
                            mapUtils.showMessage('success', $.i18n._('_SUCCESSMSGDELETE'), $.i18n._('_SUCCESSTITLE'));
                        }
                        // Disable add hole and add part buttons and remove click events
                        $('#btnAddHole').prop('disabled', true);
                        $('#btnAddHole').unbind('click');
                        $('#btnAddPart').prop('disabled', true);
                        $('#btnAddPart').unbind('click');
                        // Enable edit button in case it was disabled
                        $('#btnEdit').prop('disabled', false);
                    },
                    error: function (response) {
                        $('#divAttrsForm').dialog("close");
                        console.log(response.responseText + ":\n");
                        var msg = response.statusText;
                        mapUtils.showMessage('danger', msg, $.i18n._('_SAVEERROR') + editLayer.get("name"));
                    },
                    failure: function (response) {
                        $('#divAttrsForm').dialog("close");
                        mapUtils.showMessage('danger', msg, $.i18n._('_SAVEERROR') + editLayer.get("name"));
                    },
                    complete: function (response) {
                        $(".wait").hide();
                        featureEdit.setEditTools();
                        if (mode === "NEW") {
                            $('#btnCreate').removeClass("active").addClass("active");
                            featureEdit.initDrawing();
                        } else if (mode === "UPDATE") {
                            $('#btnEdit').removeClass("active").addClass("active");
                            featureEdit.initModify();
                        }
                    },
                    async: true
                });
            }
        },
        onModifyGeometry: function (e) {
            var format = new ol.format.WKT();
            var wktGeom;
            var geom;
            if (typeof e.features !== "undefined") {
                geom = e.features.getArray()[0].getGeometry();
                wktGeom = format.writeGeometry(geom);
                $('#btnAddPart').unbind('click').bind('click', function () {
                    featureEdit.initAddPart(e.features.getArray()[0]);
                });
            } else {
                geom = e.feature.getGeometry();
                wktGeom = format.writeGeometry(geom);
                $('#btnAddPart').unbind('click').bind('click', function () {
                    featureEdit.initAddPart(e.feature);
                });
            }

            $('#hidGeom').val(wktGeom);
            if (area_control !== '') {
                $('#' + area_control).val((measureUtilities.formatAreaInM(geom)).toString().replace('.', $.i18n._('_DECIMALSEPARATOR')));
            }
            if (length_control !== '') {
                $('#' + length_control).val((measureUtilities.formatLengthInM(geom)).toString().replace('.', $.i18n._('_DECIMALSEPARATOR')));
            }

        },
        validateFldOnBlur: function (fldname) {
            var isFormValid = featureEditForms.validateEditForm();
            if (isFormValid) {
                $('#btnEditFormSave').button("enable");
            } else {
                $('#btnEditFormSave').button("disable");
            }
            return isFormValid;
        },
        validateEditForm: function () {
            if (editLayer instanceof ol.layer.Vector && (editLayer.get('edit_pk') !== undefined && editLayer.get('edit_fields') !== undefined)) {
                var editFlds = editLayer.get('edit_fields');
                $.each(editFlds, function (i, fldConfig) {
                    isvalid = featureEditForms.validateField(fldConfig);
                    if (!isvalid) {
                        return false;
                    }
                });
                if (!isvalid) {
                    $('#btnEditFormSave').button("disable");
                    return false;
                } else {
                    $('#btnEditFormSave').button("enable");
                    return true;
                }
            } else {
                $('#btnEditFormSave').button("disable");
                return false;
            }
        },
        validateField: function (fldConfig) {
            var isValid = true;
            var fldval = $("#" + fldConfig.name.split(':')[0]).val();
            if (fldConfig.control === "dropdown" || fldConfig.control === "text" || fldConfig.control === "typeahead") {
                if (fldConfig.required === true) {
                    if (fldval === "#" || fldval === null || fldval.trim() === "") {
                        isValid = false;
                    } else {
                        if (fldConfig.type.split(':')[0] === "integer") {
                            var nInt = parseInt(fldval);
                            if (isNaN(nInt)) {
                                isValid = false;
                            }
                        } else if (fldConfig.type.split(':')[0] === "number") {
                            var dp = $.i18n._('_DECIMALSEPARATOR');
                            if (dp === ",") {
                                isValid = /^\d+(,\d+)*$/.test(fldval);
                            } else {
                                isValid = /^\d+(.\d+)*$/.test(fldval);
                            }
                            //var nFloat = parseFloat(fldval.replace(dp, '.'));
                            //if (isNaN(nFloat)) {
                            //    isValid = false;
                            //}
                        }
                    }
                } else {
                    if (fldConfig.control === "text" && fldConfig.readonly !== true && fldval.trim() !== "") {
                        if (fldConfig.type.split(':')[0] === "integer") {
                            let nInt = parseInt(fldval);
                            if (isNaN(nInt)) {
                                isValid = false;
                            }
                        } else if (fldConfig.type.split(':')[0] === "number") {
                            let dp = $.i18n._('_DECIMALSEPARATOR');

                            if (dp === ",") {
                                isValid = /^\d+(,\d+)*$/.test(fldval);
                            } else {
                                isValid = /^\d+(.\d+)*$/.test(fldval);
                            }
                        }
                    }
                }
            }
            if (fldConfig.required === true) {
                if (isValid) {
                    $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-feedback");
                    $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-error");
                    $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-success");
                    $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-feedback");
                    $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-success");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-remove");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-ok");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("form-control-feedback");
                    $("#fdb_" + fldConfig.name.split(':')[0]).addClass("glyphicon glyphicon-ok form-control-feedback");
                } else {
                    $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-feedback");
                    $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-error");
                    $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-success");
                    $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-feedback");
                    $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-error");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-remove");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-ok");
                    $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("form-control-feedback");
                    $("#fdb_" + fldConfig.name.split(':')[0]).addClass("glyphicon glyphicon-remove form-control-feedback");
                }
            } else {
                if (fldConfig.control === "text" && fldConfig.readonly !== true && fldval.trim() !== "") {
                    if (isValid) {
                        $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-feedback");
                        $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-error");
                        $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-success");
                        $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-feedback");
                        $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-success");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-remove");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-ok");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("form-control-feedback");
                        $("#fdb_" + fldConfig.name.split(':')[0]).addClass("glyphicon glyphicon-ok form-control-feedback");
                    } else {
                        $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-feedback");
                        $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-error");
                        $("#fg_" + fldConfig.name.split(':')[0]).removeClass("has-success");
                        $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-feedback");
                        $("#fg_" + fldConfig.name.split(':')[0]).addClass("has-error");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-remove");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("glyphicon-ok");
                        $("#fdb_" + fldConfig.name.split(':')[0]).removeClass("form-control-feedback");
                        $("#fdb_" + fldConfig.name.split(':')[0]).addClass("glyphicon glyphicon-remove form-control-feedback");
                    }
                }
            }
            return isValid;
        }
    };
})();
$(document).ready(function () {

});