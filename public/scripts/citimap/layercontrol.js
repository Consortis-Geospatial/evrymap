var legendUtilities = (function () {
    $.extend($.expr[":"], {
        "containsIN": function (elem, i, match, array) {
            return (elem.textContent || elem.innerText || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
        }
    });
    return {
        initLegend: function (map) {
            // Create the Layer Control dialog
            legendUtilities.createLegendDialogUI();
            // Render each layer in the legend dialog
            legendUtilities.renderLegendContent(map);
            // Set the sorting event
            $('#layerList').sortable().on('sortupdate', function (e, ui) {
                legendUtilities.reorderLegend(map);
            });
            //Create and Add Saved views dialog
            legendUtilities.createSaveViewsDlg();
            // Graphic Legend
            $('#lblGLegend').html($.i18n._('_LEGEND'));
            $('#legendButton').prop('title', $.i18n._('_LEGEND'));
            $('#legendButton').on('click', function () {
                $('#graphicLegend').toggle();
            });
        },
        /**
         * Creates the html for the Legend control
         */
        createLegendDialogUI: function () {
            $.i18n.load(uiStrings);
            var modLyrDialog = document.createElement('div');
            modLyrDialog.setAttribute('id', 'modLyrDialog');
            var divhtml = '<div class="container-fluid">' +
                '<div class="row">' +
                '    <div class="form-horizontal">' +
                '       <div class="form-group pull-left">' +
                '           <label for="txbSearchLegend" class="col-sm-3 control-label">' + $.i18n._("_SEARCH") + '</label>' +
                '           <div class="col-sm-9">' +
                '               <input type="text" class="form-control" id="txbSearchLegend" onkeyup="legendUtilities.searchLayerControlList();" placeholder="' + $.i18n._("_SEARCH") + '..." value="">' +
                '           </div>' +
                '       </div>' +
                '   </div>' +
                '</div>' +
                '<div class="row">' +
                '    <div class="col-lg-12">' +
                '        <div class="list-group" id="layerList"></div>' +
                '    </div>' +
                '</div>' +
                '</div>';
            $(modLyrDialog).append(divhtml);
            $(modLyrDialog).appendTo($("#mainparent"));
            $("#modLyrDialog").dialog({
                title: $.i18n._('_LAYERS'),
                autoOpen: false,
                height: 600,
                width: 400,
                buttons: [
                    {
                        id: "btnCloseLyrDialog",
                        text: $.i18n._("_CLOSE"),
                        class: "btn btn-default",
                        click: function () {
                            $("#modLyrDialog").dialog("close");
                        }
                    }
                ],
                open: function (event) { // Add classes manually because of jqueryui classes overlapping
                    $('#modLyrDialog').parent().addClass("cg_dialog_class");
                    document.getElementById("btnCloseLyrDialog").removeAttribute("class");
                    $('#btnCloseLyrDialog').addClass("btn btn-default");
                    $('.glyphicon-resize-full').removeClass('ui-icon');
                    $('.glyphicon-resize-small').removeClass('ui-icon');
                    // Create the Actions button
                    if ($('#btnLegendActions').length === 0) {
                        var actionshtml = '<div id="btnLegendActions" class="btn-group dropup" role="group" aria-label="...">' +
                            '<button type="button" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                            $.i18n._('_ACTIONS') +
                            '<span class="caret"></span>' +
                            '</button>' +
                            '<ul class="dropdown-menu">' +
                            '    <li><a href="#" onclick="$(\'#modLyrDialog\').dialog(\'close\');$(\'#dlgAddWMS\').dialog(\'open\');">' + $.i18n._('_WXSADD') + '...</a></li>' +
                            '    <li><a href="#" onclick="legendUtilities.saveHomeView();">' + $.i18n._('_SAVEVIEW') + '</a></li>' +
                            '    <li><a href="#" onclick="legendUtilities.showSaveViewAs();">' + $.i18n._('_SAVEVIEWAS') + '...</a></li>' +
                            '    <li><a href="#" onclick="legendUtilities.openSavedViewsDialog();">' + $.i18n._('_RESTOREVIEW') + '...</a></li>' +
                            '    <li><a href="#" onclick="legendUtilities.clearSavedViews();">' + $.i18n._('_CLEARSAVEDVIEWS') + '...</a></li>' +
                            '</ul>' +
                            '</div >';
                        $('#btnCloseLyrDialog').parent().parent().prepend(actionshtml);
                    }
                }
            });
        },
        /**
         * Filters the legend control
         */
        searchLayerControlList: function () {
            var s= $("#txbSearchLegend").val();
            if (s === '') {
                $("#layerList").children(".list-item-legend").show();
            } else {
                $("#layerList").children(".list-item-legend").not(":containsIN(" + s + ")").hide();
            }
        },
        createSaveViewsDlg: function (map) {
            if ($('#modSavedViews').length === 0) {
                var htmlStr = '<div class="modal" tabindex="-1" role="dialog" id="modSavedViews" data-backdrop="static">' +
                    '               <div class="modal-dialog" id="savedViewDlg" role="document">' +
                    '                   <div class="modal-content">' +
                    '                       <div class="modal-header" style="cursor:move">' +
                    '                           <button type="button" class="close btn-lg" data-dismiss="modal" aria-label="Close">' +
                    '                               <span aria-hidden="true" class="glyphicon glyphicon-remove-circle"></i></span>' +
                    '                           </button>' +
                    '                           <div id="div1"  runat="server" clientidmode="Static">' +
                    '                               <h3 id="svTitle" class="modal-title">' + $.i18n._('_SAVEDVIEWSLIST') + '</h3>' +
                    '                           </div>' +
                    '                       </div>' + // End modal-header
                    '                       <div class="modal-body" id="svBody">' +
                    '                           <div class="container-fluid">' +
                    '                               <div class="row">' +
                    '                                   <div id="svContainer" class=col-lg-12 form-group>' +
                    '                                       <div class="list-group" id="svList"></div>' +
                    '                                   </div>' + //End col-lg-12
                    '                              </div>' + //End row
                    '                           </div>' + //End container-fluid
                    '                       </div>' +
                    '                       <div class="modal-footer">' +
                    '                           <div class="btn-group" role="group">' +
                    '                               <button id="btnSaveView" type="button" class="btn btn-primary">' + $.i18n._('_CREATE') + '</button>' +
                    '                               <button id="btnSavedViewsClose" type="button" class="btn btn-secondary"  data-dismiss="modal">' + $.i18n._('_CLOSE') + '</button>' +
                    '                           </div>' +
                    '                       </div>' +
                    '               </div>' + //End modal-content
                    '             </div>' + //End modal-dialog
                    '         </div>';
                $('body').prepend(htmlStr);
                $('.modal-dialog').draggable({ handle: ".modal-header" });
            }
        },
        /** 
         * Reorders the legend when user changes layer order
        */
        reorderLegend: function (map) {
            var legendLayerList = [];
            $('#layerList').children('div').each(function () {
                var ctrlid = this.id;
                var layername = '';
                //console.log(ctrlid);
                if (ctrlid.includes('legendLayer_')) {
                    layername = ctrlid.split('legendLayer_')[1];
                    console.log(layername);
                    legendLayerList.push(legendUtilities.getLayerByName(layername));
                } else if (ctrlid.includes('legendGroup_')) {
                    var grouplayername = this.id.split('legendGroup_')[1];
                    $('#lgCollapse_' + grouplayername).children('div').each(function () {
                        layername = this.id.split('legendLayer_')[1];
                        console.log(layername);
                        legendLayerList.push(legendUtilities.getLayerByName(layername));
                    });
                }
            });
            //Empty the layer collection
            var layersToRemove = [];
            map.getLayers().forEach(function (layer2remove, i) {
                //console.log('Name: ' + layer.get('name'));
                layersToRemove.push(layer2remove);
            });
            var len = layersToRemove.length;
            for (var i = 0; i < len; i++) {
                map.removeLayer(layersToRemove[i]);
            }

            for (var j = legendLayerList.length - 1; j >= 0; --j) {
                //for (var j = 0; j <= legendLayerList.length - 1; j++) {
                var layer = legendLayerList[j];
                if (typeof layer !== "undefined") {
                    map.addLayer(layer);
                }
                //layers.setAt(i, layer);
            }
        },
        renderLegendContent: function (map) {
            var layers = map.getLayers().getArray();
            for (var i = layers.length - 1; i >= 0; --i) {
                var layer = layers[i];
                legendUtilities.addLayerToLegend(map, layer);
            }
        },
        /**
         * Completely removes layer from map and legends
         * @param {*} ctrl The delete control id so we can find the layer object
         */
        removeLayer: function (ctrl) {
            var layername = ctrl.id.split("iconDeleteLyr_")[1];
            $map = $('#mapid').data('map');
            var layersToRemove = [];
            $map.getLayers().forEach(function (layer) {
                if (layer.get('name') !== undefined && layer.get('name') === layername) {
                    layersToRemove.push(layer);
                }
            });

            var len = layersToRemove.length;
            for (var i = 0; i < len; i++) {
                $map.removeLayer(layersToRemove[i]);
            }
            // Remove layer from layer control
            $('#layerList').find("#legendLayer_" + layername).remove();
            // Remove layer from left legend control
            legendUtilities.removeItemFromLegend(layername);
        },
        addLayerToLegend: function (map, layer, totop) {
            var htmlLegendContent = '';
            var name = layer.get('name');
            var tag = layer.get('tag');
            var label = layer.get('label');
            var metadata = layer.get('metadata');
            var exportable = layer.get('exportable');
            var queryable = layer.get('queryable');
            var classString = '';
            var classStringSel = '';
            var classIdent = '';
            // Set visibility toggle icon
            if (layer.getVisible()) {
                classString = "glyphicon glyphicon-eye-open text-success";
            } else {
                classString = "glyphicon glyphicon-eye-close text-danger";
            }
            if (queryable) {
                classStringSel = '<span id="spanSelect' + name + '" style="color:orange;padding-right:2px" title="' + $.i18n._("_TOGGLESELECTABLE") + '"><i id="chkSelect' + name + '" class="glyphicon glyphicon-flash" style="cursor: pointer" onclick="legendUtilities.setSelected(this)";></i></span>';
            } else {
                classStringSel = '<span id="spanSelect' + name + '" style="color:grey;padding-right:2px" title="' + $.i18n._("_TOGGLESELECTABLE") + '"><i id="chkSelect' + name + '" class="glyphicon glyphicon-flash" style="cursor: pointer" onclick="legendUtilities.setSelected(this)";></i></span>';
            }

            if (typeof layer.get("group") !== "undefined" && layer.get("group") !== "") {
                classIdent = 'padding-left:30px;';
            }
            if (typeof tag !== "undefined") {
                htmlLegendContent = htmlLegendContent + '<div id="legendLayer_' + name + '" href="#" class="list-group-item list-item-legend" data-toggle="collapse" style="' + classIdent + '">';
                // Allow reordering only in top level layers
                if (typeof layer.get("group") === "undefined" && layer.get("group") !== "") {
                    htmlLegendContent = htmlLegendContent + '<span title="' + $.i18n._("_REORDERLAYER") + '"><img class="reorder" src="css/images/icons8-drag-reorder-filled-50.png" style="width:20px;height:20px;cursor:move;padding-right:5px"></span>';
                }
                if (tag[0] === "WMS" || tag[0] === "GeoJson" || tag[0] === "GeoJSON" || tag[0] === "KML" || tag[0] === "XML") {
                    htmlLegendContent = htmlLegendContent + '<span title="' + $.i18n._("_ZOOMTOLYREXTENT") + '"><i class="glyphicon glyphicon-zoom-in" style="cursor:pointer" onclick="legendUtilities.zoomToLayerExtent(\'' + name.trim() + '\')";></i></span>' +
                        '<i id="icon' + name + '" class="' + classString + '" aria-hidden="true" style="cursor:pointer" title="' + $.i18n._("_TOGGLEVISIBLE") + '" onclick="legendUtilities.toggleLayerVisibility(this.id,\'' + name + '\')"></i>';
                } else {
                    htmlLegendContent = htmlLegendContent + '<i class="glyphicon glyphicon-none"></i>' +
                        '<i id="icon' + name + '" class="' + classString + '" aria-hidden="true" style="cursor:pointer" title="' + $.i18n._("_TOGGLEVISIBLE") + '" onclick="legendUtilities.toggleLayerVisibility(this.id,\'' + name + '\')"></i>';
                }
                if (layer.get("candelete") === true) {
                    htmlLegendContent = htmlLegendContent + '<i id="iconDeleteLyr_' + name + '" class="glyphicon glyphicon-trash text-danger" style="cursor:pointer" onclick="legendUtilities.removeLayer(this);"></i>';
                }
                if (tag[0] === "GeoJson" || tag[0] === "GeoJSON" || tag[0] === "KML" || tag[0] === "XML") {
                    htmlLegendContent = htmlLegendContent + classStringSel + '<span id="lbl' + name + '">' + label + '</span> <input type="hidden" id="hid' + name + '" value="' + name + '" />';
                    if (typeof exportable !== "undefined" && exportable === true) {
                        htmlLegendContent = htmlLegendContent + legendUtilities.generateExportButton(name);
                    }
                } else if (tag[0] === "WMS") {
                    htmlLegendContent = htmlLegendContent + classStringSel + '<span id="lbl' + name + '">' + label + '</span> <input type="hidden" id="hid' + name + '" value="' + name + '" />';
                    if (typeof exportable !== "undefined" && exportable === true) {
                        htmlLegendContent = htmlLegendContent + legendUtilities.generateExportButton(name);
                    }
                } else if (tag[0] === "ESRIRESTTILE") {
                    htmlLegendContent = htmlLegendContent + classStringSel + '<span id="lbl' + name + '">' + label + '</span> <input type="hidden" id="hid' + name + '" value="' + name + '" />';
                    if (typeof exportable !== "undefined" && exportable === true) {
                        htmlLegendContent = htmlLegendContent + legendUtilities.generateExportButton(name);
                    }
                } else {
                    htmlLegendContent = htmlLegendContent + '<span style="padding-right:2px"><i class="glyphicon glyphicon-none"></i></span><span id="lbl' + name + '">' + label + '</span> <input type="hidden" id="hid' + name + '" value="' + name + '" />';
                }
                htmlLegendContent = htmlLegendContent + '';
            }
            // Create legend
            if (typeof tag !== "undefined") {
                htmlLegendContent = htmlLegendContent + '<p style="padding-left:2.00em;" class="text-muted">';
                htmlLegendContent = htmlLegendContent + '<span style="padding-right:15px;"><small>' + $.i18n._('_TRANSPARENCY') + '</small></br></span>';
                htmlLegendContent = htmlLegendContent + '<input id="slider' + name + '" type="text" data-slider-min="0" data-slider-max="1" data-slider-step="0.1" data-slider-ticks="[0, 1]"><span style="font-size:9px"><label id="' + name +'-opacity">&nbsp;0%</label></span></p>';
                //console.log("tag: " + tag);
                // Create the legend icon for WMS layers from the GetLegendGraphic request UNLESS we have set a group icon OR a custom legend icon 
                if (tag[0] !== "" && tag[0] === "WMS" && (typeof layer.get('groupLegendImg') === "undefined" || layer.get('groupLegendImg').trim() === "")) {
                    if (typeof layer.get('legendImg') === "undefined" || layer.get('legendImg').trim() === "") {
                        var lyrUrl = tag[1] + "&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + name + "&FORMAT=image/png&SLD_VERSION=1.1.0";
                        htmlLegendContent = htmlLegendContent + '<p style="margin-left:20px;margin-top:20px"><span><img src="' + lyrUrl + '" /></span></p>';
                        layer.set("legendImg", lyrUrl);
                        $('#legendImgList').append('<li id="img_' + layer.get('name') + '" class="list-group-item"><h5>' + label + '</h5><img src="' + lyrUrl + '" /></li>');
                    } else {
                        $('#legendImgList').append('<li id="img_' + layer.get('name') + '" class="list-group-item"><h5>' + label + '</h5><img src="' + layer.get('legendImg') + '" style="width:20px; height:20px" /></li>');
                        layer.set("legendImg", layer.get('legendImg'));
                    }
                } else if (tag[0] !== "" && tag[0] === "GeoJSON") {
                    // Create a legend image for vector layes if one is set in configuration
                    if (typeof layer.get('legendImg') !== "undefined" && layer.get('legendImg').trim() !== "") {
                        var legimgstring = layer.get('legendImg');
                        var imgW = "20px";
                        var imgH = "20px";
                        if (typeof layer.get('legend_wh') !== "undefined") {
                            imgW = layer.get('legend_wh').split(":")[0];
                            imgH = layer.get('legend_wh').split(":")[1];
                        }
                        $.each(legimgstring.split(','), function (index, item) {
                            htmlLegendContent = htmlLegendContent + '<p style="margin-left:20px;margin-top:20px"><span><img style="width:' + imgW + '; height:' + imgH + '; margin-right:3px" src="' + item.split(':')[0] + '" />' + item.split(':')[1] + '<span></p>';
                            $('#legendImgList').append('<li id="img_' + layer.get('name') + '" class="list-group-item"><h5>' + label + '</h5><img style="width:' + imgW + '; height:' + imgH + '; margin-right:3px" src="' + item.split(':')[0] + '" /></li>');
                        });
                    }
                } else if (tag[0] !== "" && tag[0] === "ESRIRESTTILE") {
                    esriUtils.drawEsriRestLegend(tag[1], name, layer.get('label'));
                }
            }
            // Create metadata link
            if (typeof metadata !== "undefined") {
                htmlLegendContent = htmlLegendContent + '<p style="padding-left:2.00em;">';

                htmlLegendContent = htmlLegendContent + '</p>';
            }
            htmlLegendContent = htmlLegendContent + '</div>';

            if (layer instanceof ol.layer.Group) {
                htmlLegendContent = htmlLegendContent + '<div class="list-group">';
                layer.getLayers().forEach(function (sublayer, j) {
                    var subname = sublayer.get('name');
                    var subtag = sublayer.get('tag');
                    var sublabel = sublayer.get('label');
                    htmlLegendContent = htmlLegendContent + '<a href="#" class="list-group-item list-item-legend" data-toggle="collapse">';
                    htmlLegendContent = htmlLegendContent + '<span id="lbl' + sublabel + '">' + sublabel + '</span>';
                    // Make sure we have a 'tag' property on the layer
                    if (typeof subtag !== "undefined") {
                        if (subtag[0] !== "" && subtag[0] === "WMS") {
                            var lyrUrl = subtag[1] + "&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + subname + "&FORMAT=image/png&SLD_VERSION=1.1.0";
                            htmlLegendContent = htmlLegendContent + '<p><img src="' + lyrUrl + '" /></p>';
                            $('#legendImgList').append('<li id="img_' + sublayer.get('name') + '"class="list-group-item">' + sublabel + '<img src="' + lyrUrl + '" /></li>');
                        }
                    }
                    htmlLegendContent = htmlLegendContent + '</a>';
                });
                htmlLegendContent = htmlLegendContent + '</div>';
            }
            //console.log(layer.get("name"));
            if (typeof layer.get("group") !== "undefined" && layer.get("group") !== "") {
                var grpName = layer.get("group").replace(' ', '_'); //Replace spaces with underscores so to create a valid id for jquery
                if (!legendUtilities.legendGroupExists(grpName)) {
                    legendUtilities.createLegendGroup(grpName, layer.get("groupLegendImg"));
                }
                $('#lgCollapse_' + grpName).append(htmlLegendContent);
                if (tag[0] === "OSM" || tag[0] === "Bing" || tag[0] === "Google") {
                    $('#chkSelect' + grpName).hide();
                }
                if (!layer.getVisible()) {
                    $('#icon' + grpName).removeClass('glyphicon glyphicon-eye-open text-success').removeClass('glyphicon glyphicon-eye-close text-danger').addClass('glyphicon glyphicon-eye-close text-muted');
                }
            } else {
                if (totop) {
                    $('#layerList').prepend(htmlLegendContent);
                } else {
                    $('#layerList').append(htmlLegendContent);
                }
            }
            $('#layerList').sortable({
                placeholderClass: 'reorder'
            });
            //Set the sliders
            legendUtilities.setOpacitySliders();
        },
        setSelected: function (cbox) {
            var lyrname = cbox.id.split('chkSelect')[1];
            //console.log(lyrname);
            var lyr = legendUtilities.getLayerByName(lyrname);
            var isQueryable = lyr.get("queryable");
            if (isQueryable) {
                lyr.set("queryable", false);
                $(cbox).parent().css('color', 'grey');
            } else {
                lyr.set("queryable", true);
                $(cbox).parent().css('color', 'orange');
            }
            // Update the Advanced Search dialog
            searchAdvanced.populateSearchLayerList(mymap);
            if (legendUtilities.hasParent($('#' + cbox.id)) !== false) {
                var parentElement = legendUtilities.hasParent($('#' + cbox.id));
                if (parentElement.parent().prop('id').includes("lgCollapse")) {
                    // Its id should be lgCollapse_{group_name}. Check if all the child nodes have the icon (either the 'eye' or the 'flash')
                    var itemsMatch = (legendUtilities.allChildIconsMatch(parentElement.parent(), "SELECTABLE"));
                    var grpName = parentElement.parent().prop("id").split("lgCollapse_")[1];
                    if (itemsMatch !== null) {
                        if (itemsMatch) { //Switch group icon to visible
                            $('#spanGroupSelect' + grpName).css('color', $(cbox).parent().css('color'));
                        } else {
                            $('#spanGroupSelect' + grpName).css('color', 'grey');
                        }
                    } else {
                        $('#spanGroupSelect' + grpName).css('color', 'grey');
                    }
                }
            }
        },
        createLegendGroupImage: function(grpName, img) {
            return '</br><img id="imgGroup_' + grpName +'" src="css/images/' + img +'" style="padding-left:35px">';
        },
        legendGroupImageExists: function(group_name){
            var grpImageExists=false;
            if ($('#imgGroup_' + group_name).length===1) {
                grpImageExists=true;
                console.log('group image exists');
            }
            return grpImageExists;
        },
        createLegendGroup: function (grpName, grpImg) {
            var grphtml = '';
            grphtml = grphtml + '<div id="legendGroup_' + grpName + '" class="list-group-item list-item-legend" data-toggle="collapse"><strong>' +
                '<span title="' + $.i18n._("_REORDERLAYER") + '"><img class="reorder" src="css/images/icons8-drag-reorder-filled-50.png" style="width:20px;height:20px;cursor:move;padding-right:5px"></span>' +
                '<a href="#lgCollapse_' + grpName + '" data-toggle="collapse" onclick="legendUtilities.toggleChevron(this);"><i class="glyphicon glyphicon-chevron-right"></i></a>' +
                '<i id="icon' + grpName + '" class="glyphicon glyphicon-eye-open text-success" aria-hidden="true" style="cursor:pointer" title="' + $.i18n._("_TOGGLEVISIBLE") + '" onclick="legendUtilities.toggleGroupLayerVisibility(this.id)"></i>' +
                '<span id="spanGroupSelect' + grpName + '" style="color:orange;padding-right:2px" title="' + $.i18n._("_TOGGLESELECTABLE") + '"><i id="chkSelect' + grpName + '" class="glyphicon glyphicon-flash" style="cursor: pointer" onclick="legendUtilities.toggleGroupLayerSelect(this.id)";></i></span>' +
                '</strong > ' +
                '<span id="lbl' + grpName + '">' + grpName + '</span></strong>';
            if (typeof grpImg !== "undefined" && grpImg.trim() !== "" && !legendUtilities.legendGroupImageExists(grpName)){
                grphtml= grphtml + legendUtilities.createLegendGroupImage(grpName, grpImg);
            }
            grphtml= grphtml +  '<div class="list-group collapse" id="lgCollapse_' + grpName + '"></div></div>';
            $('#layerList').append(grphtml);
            // Make the legend list sortable
            $('#lgCollapse_' + grpName).sortable({
                placeholderClass: 'reorder'
            });
            $('#lgCollapse_' + grpName).sortable().on('sortup', function (e, ui) {
                legendUtilities.reorderLegend(map);
            });
        },
        toggleChevron: function (lgi) {
            $(lgi).find(">:first-child").toggleClass('glyphicon-chevron-right').toggleClass('glyphicon-chevron-down');
        },
        legendGroupExists: function (group_name) {
            var grpExists = false;
            $('#layerList').children('div').each(function () {
                if (this.id === "legendGroup_" + group_name) {
                    grpExists = true;
                    return false;
                }
            });
            return grpExists;
        },
        generateExportButton: function (lyrname) {
            var genStr = '<span class="pull-right" title="' + $.i18n._('_EXPORTTOTITLE') + '">' +
                '<div class="dropdown">' +
                '<button class="btn btn-success dropdown-toggle" type="button" id="menu1" data-toggle="dropdown">' +
                '<span id="curExport" class="glyphicon glyphicon-globe"></span>' +
                '<span class="caret"></span>' +
                '</button>' +
                '<ul class="dropdown-menu" role="menu" style="min-width:100px" aria-labelledby="menu1">' +
                '<li role="presentation" style="cursor:pointer" title="' + $.i18n._('_EXPORTTOSHP') + '" onclick="legendUtilities.exportTo(\'' + lyrname.trim() + '\', \'SHAPEZIP\');">&nbsp;<i class="glyphicon glyphicon-globe"></i>Shapefile</li>' +
                '<li role="presentation" style="cursor:pointer" title="' + $.i18n._('_EXPORTTOCSV') + '" onclick="legendUtilities.exportTo(\'' + lyrname.trim() + '\', \'CSV\');">&nbsp;<i class="glyphicon glyphicon-list-alt"></i>CSV</li>' +
                '</ul>' +
                '</div>' +
                '</span>';
            return genStr;
        },
        getLayerOpacity: function (map, lyrName) {
            var o;
            map.getLayers().forEach(function (layer, i) {
                if (layer.get('name') === lyrName) {
                    o = Number(layer.getOpacity());
                    return false;
                }
            });
            return o;
        },
        /**
         * Remove layer entry from the left legend dialog
         * @param {string} layer_name The layer name to remove
         */
        removeItemFromLegend: function(layer_name) {
            $('#legendImgList').find('#img_'+ layer_name).remove();
        },
        /**
         * 
         * @param {string} iId The 'eye' control id for the specified layer
         * @param {string} lyrName Layer name
         */
        toggleLayerVisibility: function (iId, lyrName) {
            map = $('#mapid').data('map');
            map.getLayers().forEach(function (layer, i) {
                if (lyrName === layer.get('name')) {
                    if (layer.getVisible()) {
                        layer.setVisible(false);
                        $('#' + iId).removeClass("glyphicon glyphicon-eye-open text-success").addClass("glyphicon glyphicon-eye-close text-danger");
                        legendUtilities.removeItemFromLegend(lyrName);
                    } else {
                        layer.setVisible(true);
                        $('#' + iId).removeClass("glyphicon glyphicon-eye-close text-danger").addClass("glyphicon glyphicon-eye-open text-success");
                        legendUtilities.removeItemFromLegend(lyrName);
                        if (typeof layer.get('legendImg') !== "undefined") {
                            if (typeof layer.get('tag') !== "undefined") {
                                if (layer.get('tag')[0] === "WMS") {
                                    $('#legendImgList').append('<li id="img_' + layer.get('name') + '" class="list-group-item"><h5>' + layer.get('label') + '</h5><img src="' + layer.get('legendImg') + '" style="width:20px; height:20px; margin-right:3px" /></li>');
                                } else if (layer.get('tag')[0] === "GeoJSON" || layer.get('tag')[0] === "KML" || layer.get('tag')[0] === "XML") {
                                    $('#legendImgList').append('<li id="img_' + layer.get('name') + '" class="list-group-item"><h5>' + layer.get('label') + '</h5><img style="width:20px; height:20px; margin-right:3px" src="' + layer.get('legendImg') + '" /></li>');
                                } else if (layer.get('tag')[0] === "ESRIRESTTILE") {
                                    esriUtils.drawEsriRestLegend(layer.get('tag')[1], lyrName, layer.get('label'));
                                }
                            }
                        }
                    }
                    if (layer instanceof ol.layer.Group) {
                        layer.getLayers().forEach(function (sublayer, j) {
                            if (sublayer.getVisible()) {
                                sublayer.setVisible(false);
                                $('#' + iId).removeClass("glyphicon glyphicon-eye-open").addClass("glyphicon glyphicon-eye-close");
                                legendUtilities.removeItemFromLegend(sublayer.get("name"));
                            } else {
                                sublayer.setVisible(true);
                                $('#' + iId).removeClass("glyphicon glyphicon-eye-close").addClass("glyphicon glyphicon-eye-open");
                                legendUtilities.removeItemFromLegend(sublayer.get("name"));
                                if (typeof sublayer.get('tag') !== "undefined") {
                                    if (sublayer.get('tag')[0] === "WMS") {
                                        $('#legendImgList').append('<li id="img_' + sublayer.get('name') + '"class="list-group-item">' + sublayer.get('label') + '<img src="' + sublayer.get('legendImg') + '" /></li>');
                                    } else if (sublayer.get('tag')[0] === "GeoJSON" || sublayer.get('tag')[0] === "KML" || sublayer.get('tag')[0] === "XML") {
                                        $('#legendImgList').append('<li id="img_' + sublayer.get('name') + '" class="list-group-item"><h5>' + sublayer.get('label') + '</h5><img style="width:20px; height:20px; margin-right:3px" src="' + sublayer.get('legendImg') + '" /></li>');
                                    }
                                }
                            }
                        });
                    }
                    if (legendUtilities.hasParent($('#' + iId)) !== false) {
                        var parentElement = legendUtilities.hasParent($('#' + iId));
                        // Its id should be lgCollapse_{group_name}. Check if all the child nodes have the icon (either the 'eye' or the 'flash')
                        var itemsMatch = (legendUtilities.allChildIconsMatch(parentElement, "VISIBLE"));
                        var grpName = parentElement.prop("id").split("lgCollapse_")[1];
                        if (itemsMatch !== null) {
                            if (itemsMatch) { //Switch group icon to visible
                                $('#icon' + grpName).removeClass("text-muted").removeClass("glyphicon glyphicon-eye-close text-danger").removeClass("glyphicon glyphicon-eye-open text-success").addClass("glyphicon glyphicon-eye-open text-success");
                            } else {
                                $('#icon' + grpName).removeClass("text-muted").removeClass("glyphicon glyphicon-eye-open text-success").removeClass("glyphicon glyphicon-eye-close text-danger").addClass("glyphicon glyphicon-eye-close text-danger");
                            }
                        } else {
                            $('#icon' + grpName).removeClass("text-muted").removeClass("glyphicon glyphicon-eye-open text-success").removeClass("glyphicon glyphicon-eye-close text-danger").addClass("glyphicon glyphicon-eye-close text-muted");
                        }
                    }
                }
            });
        },
        /**
         * Helper function for finding if all child 'eye' icons in the Layer control
         * are on the same state (visible|hidden)
         * Returns boolean
         * @param {*} parent 
         * @param {*} type 
         */
        allChildIconsMatch: function (parent, type) {
            var isMatch = null;
            $('#' + parent.prop('id')).children('div').each(function () {
                var lyrname = this.id.split("legendLayer_")[1];
                if (type === "VISIBLE") {
                    if ($('#icon' + lyrname).hasClass('glyphicon-eye-close')) {
                        if (isMatch === null) {
                            isMatch = false;
                        } else if (isMatch === false) {
                            isMatch = false;
                        } else {
                            isMatch = null;
                            //Exit loop
                            return false;
                        }
                    } else if ($('#icon' + lyrname).hasClass('glyphicon-eye-open')) {
                        if (isMatch === null) {
                            isMatch = true;
                        } else if (isMatch === true) {
                            isMatch = true;
                        } else {
                            isMatch = null;
                            //Exit loop
                            return false;
                        }
                    }
                } else if (type === "SELECTABLE") {
                    if ($('#spanSelect' + lyrname).css('color').includes('128')) { //Its grey
                        if (isMatch === null) {
                            isMatch = false;
                        } else if (isMatch === false) {
                            isMatch = false;
                        } else {
                            isMatch = null;
                            //Exit loop
                            return false;
                        }
                    } else {
                        if (isMatch === null) {
                            isMatch = true;
                        } else if (isMatch === true) {
                            isMatch = true;
                        } else {
                            isMatch = null;
                            //Exit loop
                            return false;
                        }
                    }
                }
            });
            return isMatch;
        },
        /**
         * Helper function. Returns boolean depending if the item in the legend control
         * is a child of a parent item
         * @param {*} elem 
         */
        hasParent: function (elem) {
            if ($('#' + elem.prop('id')).parent().parent().parent().length !== 0) {
                // layer is part of a collapsible group
                return elem.parent().parent().parent();
            } else {
                return false;
            }
        },
        toggleGroupLayerVisibility: function (ctrlid) {
            var grpName = ctrlid.split('icon')[1];
            if ($('#' + ctrlid).hasClass('glyphicon-eye-open')) {
                $('#' + ctrlid).removeClass('glyphicon glyphicon-eye-open text-success').addClass('glyphicon glyphicon-eye-close text-danger');
                $('#lgCollapse_' + grpName).children('div').each(function () {
                    var lyrname = this.id.split("legendLayer_")[1];
                    $('#icon' + lyrname).removeClass('glyphicon glyphicon-eye-open text-success').addClass('glyphicon glyphicon-eye-close text-danger');
                    legendUtilities.getLayerByName(lyrname).setVisible(false);
                });
            } else if ($('#' + ctrlid).hasClass('glyphicon-eye-close')) {
                $('#' + ctrlid).removeClass('glyphicon glyphicon-eye-close text-danger').addClass('glyphicon glyphicon-eye-open text-success');
                $('#lgCollapse_' + grpName).children('div').each(function () {
                    var lyrname = this.id.split("legendLayer_")[1];
                    $('#icon' + lyrname).removeClass('glyphicon glyphicon-eye-close text-danger').addClass('glyphicon glyphicon-eye-open text-success');
                    legendUtilities.getLayerByName(lyrname).setVisible(true);
                });
            }
        },
        toggleGroupLayerSelect: function (ctrlid) {
            var grpName = ctrlid.split('chkSelect')[1];
            if ($('#spanGroupSelect' + grpName).css('color').includes('128')) { //Its grey
                $('#spanGroupSelect' + grpName).css('color', 'orange');
                $('#lgCollapse_' + grpName).children('div').each(function () {
                    var lyrname = this.id.split("legendLayer_")[1];
                    $('#spanSelect' + lyrname).css('color', 'orange');
                    legendUtilities.getLayerByName(lyrname).set("queryable", true);
                });
            } else {
                $('#spanGroupSelect' + grpName).css('color', 'grey');
                $('#lgCollapse_' + grpName).children('div').each(function () {
                    var lyrname = this.id.split("legendLayer_")[1];
                    $('#spanSelect' + lyrname).css('color', 'grey');
                    legendUtilities.getLayerByName(lyrname).set("queryable", false);
                });
            }
        },
        toggleLegendSize: function () {
            if ($('#iconCollapse').attr("class") === "glyphicon glyphicon-resize-small") {
                $('#iconCollapse').removeClass().addClass("glyphicon glyphicon-resize-full");
            } else if ($('#iconCollapse').attr("class") === "glyphicon glyphicon-resize-full") {
                $('#iconCollapse').removeClass().addClass("glyphicon glyphicon-resize-small");
            }
        },
        getLayerByName: function (lyrname) {
            var lyrObj;
            var map = $('#mapid').data('map');
            map.getLayers().forEach(function (layer, i) {
                //console.log('Name: ' + layer.get('name'));
                if (lyrname === layer.get('name')) {
                    lyrObj = layer;
                    return false;
                }
            });
            return lyrObj;
        },
        zoomToLayerExtent: function (lyrName) {
            var lyr = legendUtilities.getLayerByName(lyrName.trim());
            var map = $('#mapid').data('map');
            var tag = lyr.get("tag");
            if (typeof tag !== "undefined") {
                if (tag[0] === "GeoJson" || tag[0] === "GeoJSON" || tag[0] === "KML" || tag[0] === "XML") {
                    map.getView().fit(lyr.getSource().getExtent());
                } else if (tag[0] === "WMS") {
                    var parser = new ol.format.WMSCapabilities();
                    var gcUrl = proxyUrl + tag[1] + "&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities";
                    $.ajax({
                        type: "GET",
                        url: gcUrl,
                        dataType: "xml",
                        success: function (xml) {
                            var wmsCapabilitiesObj = parser.read(xml);
                            $.each(wmsCapabilitiesObj.Capability.Layer.Layer, function (key, value) {
                                if (value.Name === lyrName || value.Name.includes(":" + lyrName)) {
                                    var ex = ol.extent.boundingExtent([[value.EX_GeographicBoundingBox[0], value.EX_GeographicBoundingBox[1]], [value.EX_GeographicBoundingBox[2], value.EX_GeographicBoundingBox[3]]]);
                                    var areaExtent = ol.extent.applyTransform(ex, ol.proj.getTransform('EPSG:4326', map.getView().getProjection().getCode()));
                                    map.getView().fit(areaExtent);
                                    return false;
                                }
                            });
                        },
                        error: function (err) {
                            console.log(err);
                        }
                    });
                } else if (tag[0] === "Group" && lyr instanceof ol.layer.Group) {
                    var fullextent = ol.extent.createEmpty();
                    lyr.getLayers().forEach(function (sublyr, j) {
                        var subtag = sublyr.get("tag");
                        var subname = sublyr.get("name");
                        if (typeof subtag !== "undefined") {
                            if (subtag[0] === "GeoJson" || subtag[0] === "GeoJSON" || subtag[0] === "KML" || subtag[0] === "XML") {
                                ol.extent.extend(fullextent, sublyr.getSource().getExtent());
                            } else if (subtag[0] === "WMS") {
                                var parser1 = new ol.format.WMSCapabilities();
                                var gcUrl1;
                                if (window.location.host === $('#hidMS').val().split('/')[0]) {
                                    gcUrl1 = proxyUrl + subtag[1] + "&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities";
                                } else {
                                    gcUrl1 = proxyUrl + subtag[1] + "&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities";
                                }
                                $.ajax({
                                    type: "GET",
                                    url: gcUrl1,
                                    dataType: "xml",
                                    success: function (xml) {
                                        var wmsCapabilitiesObj = parser1.read(xml);
                                        $.each(wmsCapabilitiesObj.Capability.Layer.Layer, function (key, value) {
                                            if (value.Name === subname) {
                                                var ex = ol.extent.boundingExtent([[value.EX_GeographicBoundingBox[0], value.EX_GeographicBoundingBox[1]], [value.EX_GeographicBoundingBox[2], value.EX_GeographicBoundingBox[3]]]);
                                                var areaExtent = ol.extent.applyTransform(ex, ol.proj.getTransform('EPSG:4326', map.getView().getProjection().getCode()));
                                                ol.extent.extend(fullextent, areaExtent);
                                                return false;
                                            }
                                        });
                                    },
                                    async: false,
                                    error: function (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        }
                    });
                    map.getView().fit(fullextent);
                }
            }
        },
        exportTo: function (lyrName, type) {
            var lyr = legendUtilities.getLayerByName(lyrName.trim());
            var map = $('#mapid').data('map');
            var tag = lyr.get("tag");
            var frmt = lyr.get("feature_info_format");
            if (typeof tag !== "undefined") {
                if (tag[0] === "GeoJson" || tag[0] === "GeoJSON" || tag[0] === "KML" || tag[0] === "XML") {
                    var gcUrl;
                    if (window.location.host === $('#hidMS').val().split('/')[0]) {
                        gcUrl = tag[1] + "&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=" + lyrName + "&outputFormat=" + frmt + "&outfile=nf.zip&SRS=" + map.getView().getProjection().getCode();
                    } else {
                        gcUrl = proxyUrl + tag[1] + "&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=" + lyrName + "&outputFormat=" + frmt + "&outfile=nf.zip&SRS=" + map.getView().getProjection().getCode();
                    }
                    window.location = gcUrl;
                }
            }
        },
        setOpacitySliders: function () {
            //Loop through slider objects
            $("input[id^='slider']").each(function (i, obj) {
                //Get layer opacity value
                var curOpacity = legendUtilities.getLayerOpacity(mymap, obj.id.substr(6, obj.id.length - 1));
                //Initialize sliders
                $("#" + obj.id).bootstrapSlider({
                    formatter: function (value) {
                        return $.i18n._('_TRANSPARENCY') + ': ' + parseFloat((1 - value) * 100).toFixed(0) + '%';
                    },
                    value: curOpacity,
                    reversed: true,
                    tooltip: 'hide',
                    tooltip_position: 'bottom',
                    ticks: [0, 1],
                    ticks_positions: [0, 100],
                    tick_labels: ['0%', '100%']
                });
                //Attach the slide event
                $("#" + obj.id).on("slide", function (slideEvt) {
                    var selLyr;
                    mymap.getLayers().forEach(function (layer, i) {
                        if (layer.get('name') === obj.id.substr(6, obj.id.length - 1)) {
                            layer.setProperties({ opacity: Number(slideEvt.value) });
                            $("#" + layer.get('name') +"-opacity").html("&nbsp;" + (100 - (Number(slideEvt.value)*100)) + "%");
                        }
                    });
                });
                //Attach the click event
                $("#" + obj.id).on("change", function (slideEvt) {
                    var selLyr;
                    mymap.getLayers().forEach(function (layer, i) {
                        if (layer.get('name') === obj.id.substr(6, obj.id.length - 1)) {
                            layer.setProperties({ opacity: Number(slideEvt.value.newValue) });
                            $("#" + layer.get('name') +"-opacity").html("&nbsp;" + (100 - (Number(slideEvt.value.newValue)*100)) + "%");
                        }
                    });
                });
            });
        },
        openSavedViewsDialog: function () {
            var svList = userUtils.getSavedMaps();
            if (svList.length === 0) {
                mapUtils.showMessage('warning', $.i18n._('_NOSAVEDVIEWSFOUND'), $.i18n._('_SAVEDVIEWSLIST'));
                return;
            }
            legendUtilities.listSavedViews(svList);
            $('#modSavedViews').modal();
            $('#modSavedViews').modal('show');
        },
        listSavedViews: function (svList) {
            $('#svList').empty();
            $('#svList').show();
            $('#btnSaveView').hide();
            $('#lblNewViewName').remove();
            $('#txbNewViewName').remove();
            $('#svTitle').html($.i18n._('_SAVEDVIEWSLIST'));

            svList.forEach(function (item) {
                var svHtml = '<div href="#" class="list-group-item list-item-legend">' +
                    '<i class="glyphicon glyphicon-zoom-in text-success" id="iActivate_' + item + '" aria-hidden="true" style="cursor:pointer" title="' + $.i18n._("_ZOOMTOSAVEDVIEW") + '" onclick="legendUtilities.activateSavedView(this.id,\'' + name + '\')"></i>' +
                    '<i class="glyphicon glyphicon-trash text-danger" id="iDelete_' + item + '" aria-hidden="true" style="cursor:pointer" title="' + $.i18n._("_DELETESAVEDVIEW") + '" onclick="legendUtilities.deleteSavedView(this.id,\'' + name + '\')"></i>' +
                    '<span id="lblSV_' + item + '">' + item + '</span>';
                $('#svList').append(svHtml);
            });
        },
        showSaveViewAs: function () {
            $('#svList').empty();
            $('#svList').hide();
            $('#btnSaveView').show();
            $('#btnSaveView').off('click').on('click', function () {
                legendUtilities.saveViewAs();
            });
            $('#svTitle').html($.i18n._('_SAVEVIEWASTITLE'));
            $('#lblNewViewName').remove();
            $('#txbNewViewName').remove();
            var svHtml = '<label for="lblNewViewName"  id="lblNewViewName" class="control-label">' + $.i18n._("_VIEWNAME") + '*</label><input type="text" id="txbNewViewName" href="#" class="form-control">';
            $('#svContainer').append(svHtml);

            $('#modSavedViews').modal();
            $('#modSavedViews').modal('show');
        },
        saveHomeView: function () {
            userUtils.writeSettings("Home");
            mapUtils.showMessage('success', $.i18n._('_HOMEVIEWSAVED'), $.i18n._('_SAVEDVIEWSLIST'));
        },
        saveViewAs: function () {
            var viewName = $('#txbNewViewName').val();
            if (viewName.trim() !== "") {
                userUtils.writeSettings(viewName);
                $('#modSavedViews').modal('hide');
                mapUtils.showMessage('success', viewName + ": " + $.i18n._('_VIEWSAVED'), $.i18n._('_SAVEDVIEWSLIST'));
            }
        },
        clearSavedViews: function () {
            userUtils.clearSettings();
            mapUtils.showMessage('success', $.i18n._('_SAVEDVIEWSCLEARED'), $.i18n._('_SAVEDVIEWSLIST'));
        },
        activateSavedView: function (ctrlid) {
            var suffix = ctrlid.split('iActivate_')[1];
            var id1 = "lblSV_" + suffix;
            var viewname = $('[id=\'' + id1 + '\']').text();
            var $map = $('#mapid').data('map');
            userUtils.setMapView($map, viewname);
            $('#modSavedViews').modal('hide');
        },
        deleteSavedView: function (ctrlid) {
            var viewname = $('#lblSV_' + ctrlid.split('_')[1]).text();
            userUtils.deleteMapSet(viewname);
            var svList = userUtils.getSavedMaps();
            if (svList.length === 0) {
                $('#modSavedViews').modal('hide');
                mapUtils.showMessage('warning', $.i18n._('_NOSAVEDVIEWSFOUND'), $.i18n._('_SAVEDVIEWSLIST'));
                $('#modSavedViews').modal('hide');
                return;
            }
            legendUtilities.listSavedViews(svList);
        },
        velocityDisableBtns: function(disable) {
            if (disable) {
                $("#bottomToolbar button").each(function() {
                    if ($(this).attr("id") !== "btnVelocity") {
                        $(this).prop("disabled", true);
                    } else {
                        $(this).prop("disabled", false);
                    }
                });
                $(".searchpanel").css("display", "none");
            } else {
                $("#bottomToolbar button").each(function() {
                    $(this).prop("disabled", false);
                });
                $(".searchpanel").css("display", "initial");
            }
        }
    };
})();

window.app = {};
var app = window.app;
app.LayerControl = function (opt_options) {
    var options = opt_options || {};
    var element = document.createElement('button');
    element.innerHTML = '<img src="css/images/layers-white.png" style="width: 20px;" />';
    element.className = 'btn btn-primary bottomtb';
    element.setAttribute('title', $.i18n._('_LAYERS'));
    element.addEventListener('click', function () {
        $('#modLyrDialog').dialog('open');
    }, false);
    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};

app.SaveViewControl = function (opt_options) {
    var options = opt_options || {};
    var element = document.createElement('button');
    element.innerHTML = '<img src="css/images/save-close-white.png" style="width: 20px;" />';
    element.className = 'btn btn-primary bottomtb';
    element.setAttribute('title', $.i18n._('_SAVEVIEW'));
    element.addEventListener('click', function () {
        legendUtilities.saveHomeView();
    }, false);
    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};

app.VelocityViewControl = function (opt_options) {
    var clickStatus = false;
    var options = opt_options || {};
    var element = document.createElement('button');
    element.innerHTML = '<img src="css/images/windsock-white.png" style="width: 20px;" />';
    element.className = 'btn btn-primary bottomtb';
    // element.setAttribute('title', $.i18n._('_LAYERS'));
    element.setAttribute('title', $.i18n._('_VELOCITY'));
    element.setAttribute('id', 'btnVelocity');
    element.setAttribute('data-clicked', false);
    element.addEventListener('click', function () {
        if (!clickStatus) {
            mapUtils.addWind(new Date().toISOString());
            $('#mapid').css('position', 'absolute');
            clickStatus = true;
            $("#btnVelocity").attr("data-clicked", true);
        } else {
            $("#velocitySelId select").hide();
            $("#velocityColorScaleId").hide();
            mapUtils.removeWind();
            $('#mapid').css('position', 'relative');
            clickStatus = false;
            $("#btnVelocity").attr("data-clicked", false);
        }

        legendUtilities.velocityDisableBtns(clickStatus);
    }, false);
    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};

ol.inherits(app.LayerControl, ol.control.Control);
ol.inherits(app.SaveViewControl, ol.control.Control);
ol.inherits(app.VelocityViewControl, ol.control.Control);

$(document).ready(function () {
    //Get the map reference
    var $map = $('#mapid').data('map');
    //Remove the Legend dialog from DOM
    $("modLyrDialog").remove();
    //Initialize legend dialog
    legendUtilities.initLegend($map);
    //Add legend control button
    $map.getControls().push(new app.LayerControl({ 'target': 'bottomToolbar' }));
    $map.getControls().push(new app.SaveViewControl({ 'target': 'bottomToolbar' }));
    if (velocityControls.getVelocitySettings().mapId && velocityControls.velocityLayerIsLoaded()) {
        $map.getControls().push(new app.VelocityViewControl({ 'target': 'bottomToolbar' }));
    }

    if (velocityControls.getVelocitySettings().mapId && velocityControls.velocityLayerIsLoaded()) {
        // add event listener to velocity view to change resolution and center to evrymap
        velocityMap.getView().on('propertychange', function(e) {
            var isVelocityMap = $("#btnVelocity").attr("data-clicked");
            if (isVelocityMap === "true") {
                switch (e.key) {
                    case 'resolution':
                        mymap.getView().setZoom(this.getZoom());
                        break;
                    case 'center':
                        mymap.getView().setCenter(this.getCenter());
                        break;
                }
            }
        });

        // add event listener to everymap view to change resolution and center to velocity map
        mymap.getView().on('propertychange', function (e) {
            var isVelocityMap = $("#btnVelocity").attr("data-clicked");
            if (isVelocityMap === "false") {
                switch (e.key) {
                    case 'resolution':
                        velocityMap.getView().setZoom(this.getZoom());
                        break;
                    case 'center':
                        velocityMap.getView().setCenter(this.getCenter());
                        break;
                }
            }
        });
    }

});