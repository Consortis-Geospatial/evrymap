var ktimaUtils = (function () {
    /**
    * Currently drawn feature.
           * @type { ol.Feature }
           */
    var sketchPoly;

    /**
     * The help tooltip element.
     * @type {Element}
     */
    var helpTooltipElement;

    /**
     * The measure tooltip element.
     * @type {Element}
     */
    var ktimaPolyTooltipElement;

    /**
    * Graticule grid
    */
    var grat;

    return {
        initPolyLayers: function () {
            //Create temp layer to use for drawing
            ktimaUtils.clearPolyLayer();
            var ktimaPolySource = new ol.source.Vector();

            ktimaPolyLyr = new ol.layer.Vector({
                source: ktimaPolySource,
                name: "ktima_poly_layer",
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'red',
                        width: 2
                    })
                })
            });
            //Create temp layer to show polygon vertices
            var ktimaPolyVertexSource = new ol.source.Vector();

            ktimaPolyVertexLyr = new ol.layer.Vector({
                source: ktimaPolyVertexSource,
                name: "ktima_poly_vertex_layer",
                style: ktimaUtils.vertexLayerStyle
            });
            //Add layers to map
            mymap.addLayer(ktimaPolyLyr);
            mymap.addLayer(ktimaPolyVertexLyr);
        },
        enableDrawKtimaPoly: function () {
            //Initialize layers (polygon and vertex)
            ktimaUtils.initPolyLayers();

            //Add events
            ktimaUtils.pm = mymap.on('pointermove', function (evt) {
                if (evt.dragging) {
                    return;
                }
                /** @type {string} */
                var helpMsg = $.i18n._('_MEASURESTARTPROMPT');

                if (sketchPoly) {
                    $.i18n.load(uiStrings);
                    var geom = sketchPoly.getGeometry();
                    if (geom instanceof ol.geom.Polygon) {
                        helpMsg = $.i18n._('_MEASURELENGTHPROMPT');
                    }
                }
                helpTooltipElement.innerHTML = helpMsg;
                helpTooltip.setPosition(evt.coordinate);

                helpTooltipElement.classList.remove('hidden');
            });
            mymap.getViewport().addEventListener('mouseout', function () {
                helpTooltipElement.classList.add('hidden');
            });
            //Add measure interaction
            mymap.removeInteraction(draw);
            var lyrPoly = legendUtilities.getLayerByName("ktima_poly_layer");
            draw = ktimaUtils.addDrawPolyInteraction('Polygon', lyrPoly.getSource());
            mymap.addInteraction(draw); //draw variable must be set now
            //Create tooltips for when drawing
            ktimaUtils.createktimaPolyTooltip(mymap);
            ktimaUtils.createHelpTooltip(mymap);
            var listener;
            draw.on('drawstart',
                function (evt) {
                    // set sketch
                    sketchPoly = evt.feature;

                    /** @type {ol.Coordinate|undefined} */
                    var tooltipCoord = evt.coordinate;

                    listener = sketchPoly.getGeometry().on('change', function (evt) {
                        var geom = evt.target;
                        var output;
                        if (geom instanceof ol.geom.Polygon) {
                            output = ktimaUtils.formatArea(geom);
                            tooltipCoord = geom.getInteriorPoint().getCoordinates();
                        }
                        ktimaPolyTooltipElement.innerHTML = output;
                        ktimaPolyTooltip.setPosition(tooltipCoord);
                    });
                }, this);
            draw.on('drawend',
                function (event) {
                    // Get the drawn feature
                    var polyfeat = event.feature;
                    //Loop through the coordinates and add them to the vertex layer
                    var vCounter = 1;
                    var lyrVertex = legendUtilities.getLayerByName("ktima_poly_vertex_layer");
                    lyrVertex.getSource().clear();
                    for (i = 0; i < polyfeat.getGeometry().getCoordinates()[0].length - 1; i++) {
                        //polyfeat.getGeometry().getCoordinates()[0].forEach(function (coord) {
                        var coord = polyfeat.getGeometry().getCoordinates()[0][i];
                        var vFeat = new ol.Feature({
                            geometry: new ol.geom.Point(coord),
                            labelPoint: new ol.geom.Point(coord),
                            vertex_id: vCounter
                        });
                        lyrVertex.getSource().addFeature(vFeat);
                        vCounter++;
                    }
                    //Create the label for the area
                    ktimaPolyTooltipElement.className = 'tooltipm tooltipm-static';
                    ktimaPolyTooltip.setOffset([0, -7]);
                    // unset sketch
                    sketchPoly = null;
                    // unset tooltip so that a new one can be created
                    ktimaPolyTooltipElement = null;
                    ktimaUtils.createktimaPolyTooltip(mymap);
                    ol.Observable.unByKey(listener);
                    ktimaUtils.openPrintDialog(polyfeat);
                }, this);
        },
        vertexLayerStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.2)' }),
                    stroke: new ol.style.Stroke({ color: 'red', width: 1 })
                }),
                text: new ol.style.Text({
                    text: feature.get('vertex_id').toString(),
                    fill: new ol.style.Fill({ color: 'red' }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 3
                    })
                })
            });
            return [style];
        },
        formatArea: function (polygon) {
            var projPoly = mapUtils.convertGeometryToDestProjection('Polygon', polygon);
            if (typeof projPoly === "undefined") { return; }
            //Unlike the measure tool, here, always show area in meters.
            var area = projPoly.getArea();
            //console.log("Sphere are: " + ol.Sphere.getArea(projPoly));
            var output;
            output = (Math.round(area * 100) / 100) +
                ' ' + 'τ.μ';
            output = output.replace('.', ',');
            return output;
        },
        formatAreaInM: function (polygon) {
            var area = polygon.getArea();
            var output;
            output = (Math.round(area * 100) / 100);
            return output;
        },
        addDrawPolyInteraction: function (geomtype, source) {
            var interaction = new ol.interaction.Draw({
                source: source,
                type: geomtype,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.5)',
                        lineDash: [10, 10],
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 5,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.7)'
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        })
                    })
                })
            });
            return interaction;
        },
        createHelpTooltip: function (map) {
            if (helpTooltipElement) {
                helpTooltipElement.parentNode.removeChild(helpTooltipElement);
            }
            helpTooltipElement = document.createElement('div');
            helpTooltipElement.className = 'tooltipm hidden';
            helpTooltip = new ol.Overlay({
                element: helpTooltipElement,
                offset: [15, 0],
                positioning: 'center-left',
                id: 'draw_ktima_poly_help'
            });
            map.addOverlay(helpTooltip);
        },
        createktimaPolyTooltip: function (map) {
            if (ktimaPolyTooltipElement) {
                ktimaPolyTooltipElement.parentNode.removeChild(ktimaPolyTooltipElement);
            }
            ktimaPolyTooltipElement = document.createElement('div');
            ktimaPolyTooltipElement.className = 'tooltipm tooltipm-measure';
            ktimaPolyTooltip = new ol.Overlay({
                element: ktimaPolyTooltipElement,
                offset: [0, -15],
                positioning: 'bottom-center',
                id: 'ktima_poly_overlay'
            });
            map.addOverlay(ktimaPolyTooltip);
        },
        clearPolyLayer: function () {
            $('#info1').removeClass('active');

            var $map = $('#mapid').data('map');
            $map.removeInteraction(draw);
            $map.removeInteraction(modifyPolyIntrAct);
            var layersToRemove = [];
            $map.getLayers().forEach(function (layer) {
                if (typeof layer.get("name") !== "undefined" && (layer.get("name") === "ktima_poly_layer" || layer.get("name") === "ktima_poly_vertex_layer")) {
                    layersToRemove.push(layer);
                }
            });
            //Remove polygon and vertex layers
            var len = layersToRemove.length;
            for (var i = 0; i < len; i++) {
                $map.removeLayer(layersToRemove[i]);
            }
            //Remove overlays (the tooltips)
            var ovlToRemove = [];
            $map.getOverlays().forEach(function (ovl) {
                if (ovl.getId() !== undefined && (ovl.getId() === 'ktima_poly_overlay') || (ovl.getId() === 'ktima_poly_help')) {
                    ovlToRemove.push(ovl);
                }
            });

            var len1 = ovlToRemove.length;
            for (var ii = 0; ii < len1; ii++) {
                $map.removeOverlay(ovlToRemove[ii]);
            }
            //Unbind pointermove event
            ol.Observable.unByKey(ktimaUtils.pm);

            //Remove grid
            if (grat) $map.removeControl(grat);
        },
        renderPrintUI: function () {
            var dlgPrintApospasma = document.createElement('div');
            dlgPrintApospasma.setAttribute('id', 'dlgPrintApospasma');
            var divhtml = '<div class="container-fluid">' +
                '<input type="hidden" id="hidKtimaPoly"/><input type="hidden" id="hidPolyArea"/>' +
                '<div class="row">' +
                '    <div class="col-lg-12">' +
                '       <p>Πατήστε το κουμπί [Εκτύπωση] για να εκτυπώσετε το απόσπασμα</p>' +
                '       <p>Μπορείτε να αλλάξετε το ψηφιοποιημένο πολύγωνο κάνοντας κλικ πάνω σε μια πλευρά ή κορυφή για να αλλάξετε το σχήμα</p>' +
                '       <p><strong>Προσοχή</strong></p>' +
                '       <p>Αν πατώντας [Εκτύπωση] δεν εμφανιστεί ένα καινούριο παράθυρο με τη εκτύπωση του αποσπάσματος, βεβαιωθείτε ότι δεν έχετε ενεργοποιήσει κάποιο popup ή ad blocker</p>' +
                '       <p>Αν χρησιμοποιείτε Internet Explorer ή Microsoft Edge, η [Εκτύπωση] θα αποθηκεύσει τοπικά στον υπολογιστή σας το απόσπασμα σε μορφή pdf</p>' +
                '    </div>' +
                '</div>' +
                '<div class="row" id="divWMSLayerList">' +
                '    <div class="col-lg-12">' +
                '    </div>' +
                '</div>' +
                '</div>';
            $(dlgPrintApospasma).append(divhtml);
            $(dlgPrintApospasma).appendTo($("#mainparent"));
            $("#dlgPrintApospasma").dialog({
                title: "Εκτύπωση αποσπάσματος",
                autoOpen: false,
                height: 400,
                width: 400,
                resizable: false,
                position: { my: "right-5 top+60", at: "right-5 top+60" },
                buttons: [
                    {
                        id: "btnPrintApospasma",
                        text: "Εκτύπωση",
                        click: function () {
                            ktimaUtils.printApospasma();
                        }
                    },
                    {
                        id: "btnClosePrintApospasma",
                        text: "Ακύρωση",
                        class: "btn btn-default",
                        click: function () {
                            $("#dlgPrintApospasma").dialog("close");
                        }
                    }
                ],
                open: function (event) { // Add classes manually because of jqueryui classes overlapping
                    document.getElementById("btnPrintApospasma").removeAttribute("class");
                    $('#btnPrintApospasma').addClass("btn btn-primary");
                    document.getElementById("btnClosePrintApospasma").removeAttribute("class");
                    $('#btnClosePrintApospasma').addClass("btn btn-default");
                    $('#btnAddWxS').prop("disabled", true);
                    $('.glyphicon-resize-full').removeClass('ui-icon');
                    $('.glyphicon-resize-small').removeClass('ui-icon');
                },
                close: function (event) {
                    ktimaUtils.clearPolyLayer();
                }
            });
        },
        openPrintDialog: function (f) {
            // Add coordinates in hidden field so it can be used to create
            // the coordinates table in pdf and make sure the coordinates are ALWAYS
            // in EPSG:2100 (ΕΓΣΑ)
            var egsaCoordString = '';
            for (i = 0; i < f.getGeometry().getCoordinates()[0].length - 1; i++) {
                var coordInEgsa = ol.proj.transform(f.getGeometry().getCoordinates()[0][i], mymap.getView().getProjection(), ol.proj.get('EPSG:2100'));
                egsaCoordString = egsaCoordString + "," + coordInEgsa;
            }
            //var coords = f.getGeometry().getCoordinates().toString();
            var projPoly = mapUtils.convertGeometryToDestProjection('Polygon', f.getGeometry());
            var coords = projPoly.getCoordinates().toString();
            //console.log(egsaCoordString);
            $('#hidKtimaPoly').val(coords);
            // Add polygon area in hidden field to display in pdf
            var polyArea = ktimaUtils.formatArea(f.getGeometry());
            $('#hidPolyArea').val(polyArea);
            $("#dlgPrintApospasma").dialog("open");
            // Remove draw interaction and add modify interaction
            // so only one layer is digitised each time
            mymap.removeInteraction(draw);
            mymap.removeInteraction(modifyPolyIntrAct);
            modifyPolyIntrAct = new ol.interaction.Modify({
                features: new ol.Collection([f]),
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
            modifyPolyIntrAct.on("modifyend", ktimaUtils.onModifyPoly);
            mymap.addInteraction(modifyPolyIntrAct);
            // Add grid
            if (grat) mymap.removeControl(grat);
            grat = new ol.control.Graticule({ step: 250, stepCoord: 1, projection: 'EPSG:2100' });
            var style = new ol.style.Style({});
            style.setStroke(new ol.style.Stroke({ color: 'black', width: 1 }));
            style.setText(new ol.style.Text(
                {
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
                    fill: new ol.style.Fill({ color: 'black' })
                }));

            grat.setStyle(style);
            mymap.addControl(grat);
            var ext = ol.proj.transformExtent(mymap.getView().getProjection().getExtent(), mymap.getView().getProjection(), grat.get('projection'));
            ext = ol.proj.transformExtent(ext, grat.get('projection'), mymap.getView().getProjection());
            //mymap.getView().fit(ext, ol.proj.get(g.get('projection')).getExtent(), mymap.getSize());
        },
        onModifyPoly: function (e) {
            var f = e.features.getArray()[0]; //Modified polygon
            var format = new ol.format.WKT();
            // Update area tooltip while modifying geometry
            var polyArea = ktimaUtils.formatArea(f.getGeometry());
            // Update the hidden field that holds the polygon area
            $('#hidPolyArea').val(polyArea);
            // Get the coordinates of the center of gravity for the polygon.
            // This is where the area tooltip will display
            tooltipCoord = f.getGeometry().getInteriorPoint().getCoordinates();
            //Remove overlays (the tooltip that displays the area) 
            var ovlToRemove = [];
            mymap.getOverlays().forEach(function (ovl) {
                if (ovl.getId() !== undefined && (ovl.getId() === 'ktima_poly_overlay')) {
                    ovlToRemove.push(ovl);
                }
            });

            var len1 = ovlToRemove.length;
            for (var ii = 0; ii < len1; ii++) {
                mymap.removeOverlay(ovlToRemove[ii]);
            }
            // unset sketch
            sketchPoly = null;
            // unset tooltip so that a new one can be created
            ktimaPolyTooltipElement = null;
            ktimaUtils.createktimaPolyTooltip(mymap);
            ktimaPolyTooltipElement.innerHTML = polyArea;
            ktimaPolyTooltip.setPosition(tooltipCoord);
            ktimaPolyTooltipElement.className = 'tooltipm tooltipm-static';
            ktimaPolyTooltip.setOffset([0, -7]);
            //Get the polygon vertex layer
            var coords = f.getGeometry().getCoordinates().toString();
            $('#hidKtimaPoly').val(coords);
            // Clear and read the vertices
            var lyrVertex = legendUtilities.getLayerByName("ktima_poly_vertex_layer");
            lyrVertex.getSource().clear();
            var vCounter = 1;
            for (i = 0; i < f.getGeometry().getCoordinates()[0].length - 1; i++) {
                //polyfeat.getGeometry().getCoordinates()[0].forEach(function (coord) {
                var coord = f.getGeometry().getCoordinates()[0][i];
                var vFeat = new ol.Feature({
                    geometry: new ol.geom.Point(coord),
                    labelPoint: new ol.geom.Point(coord),
                    vertex_id: vCounter
                });
                lyrVertex.getSource().addFeature(vFeat);
                vCounter++;
            }
        },
        buildTableBody: function (data, columns) {
            var body = [];

            body.push(columns);

            data.forEach(function (row) {
                var dataRow = [];

                columns.forEach(function (column) {
                    dataRow.push(row[column].toString());
                });

                body.push(dataRow);
            });

            return body;
        },
        coordsTable: function (data, columns) {
            return {
                table: {
                    style: 'coordTable',
                    fontSize: 9,
                    headerRows: 1,
                    body: ktimaUtils.buildTableBody(data, columns)
                }
            };
        },
        printApospasma: function () {
            var canvas;
            var $map = $('#mapid').data('map');

            var printScale = Number($('#selScale').val());
            $map.once('precompose', function (event) {
                canvas = event.context.canvas;
            });
            $map.once('postcompose', function (event) {
                var ctx = event.context;
                var canvas = event.context.canvas;
                var orientation = 'Portrait';
                var headerline1 = 'ΠΕΡΙΦΕΡΕΙΑΚΗ ΕΝΟΤΗΤΑ: ';
                if (configfile === "ktimamap.json") {
                    headerline1 = 'ΠΕΡΙΦΕΡΕΙΑΚΗ ΕΝΟΤΗΤΑ: ΘΕΣΣΑΛΟΝΙΚΗ ';
                }
                else if (configfile === "ktimamapgrev.json") {
                    headerline1 = 'ΠΕΡΙΦΕΡΕΙΑΚΗ ΕΝΟΤΗΤΑ: ΓΡΕΒΕΝΑ ';
                }
                var headerline2 = 'ΟΤΑ: ';
                var title = 'ΑΠΟΣΠΑΣΜΑ ΠΡΟΣΩΡΙΝΟΥ ΥΠΟΒΑΘΡΟΥ ΚΤΗΜΑΤΟΓΡΑΦΗΣΗΣ';

                var printPageSize = 'A4';
                var mapimg = new Image();
                mapimg.setAttribute('crossOrigin', 'anonymous');
                mapimg = canvas.toDataURL('image/png');

                var size = mymap.getSize();

                var imgW = ((294 / 10) - 10) / 2.54 * 72; //19cm default width;
                var imgH = ((210 / 10) - 6) / 2.54 * 72; //23 default height;

                // 2cm margin around the page
                var margin = 1 / 2.54 * 72;
                //Get the coordinate array
                var coordstr = $('#hidKtimaPoly').val();
                var column = [];
                column.push({ text: 'Α/Α', style: 'tableHeader' });
                column.push({ text: 'Χ', style: 'tableHeader' });
                column.push({ text: 'Υ', style: 'tableHeader' });
                var coordArray = coordstr.split(',');
                var aa = 1; //Initialize A/A
                var data = [];
                for (i = 0; i < coordArray.length - 2; i += 2) {
                    //Create the item object which will hold the A/A and XY & Y coordinates
                    var item = {};
                    item["Α/Α"] = aa;
                    //Format to 2 decimals
                    var xcoord = Number(coordArray[i].split(',')[0]).toFixed(2);
                    var ycoord = Number(coordArray[i + 1].split(',')[0]).toFixed(2);
                    item["Χ"] = xcoord;
                    item["Υ"] = ycoord;
                    //Add it to the data list
                    data.push(item);
                    aa++;
                }
                var docDefinition;
                docDefinition = {
                    pageSize: printPageSize,
                    pageOrientation: orientation,
                    pageMargins: [margin, margin, margin, 20],
                    header: {
                        text: [
                            { text: headerline1 + '\n', style: 'HeaderStyle', bold: true },
                            { text: headerline2 + '\n', style: 'HeaderStyle', bold: true }
                        ],
                        style: 'HeaderStyle'
                    },
                    footer: {
                        columns: [
                            { text: 'Αυτόματη δημιουργία από το citiMap', style: 'FooterStyle', margin: [9, 0, 0, 9] },
                            { text: 'Consortis © 2018-2019', style: 'FooterStyle', alignment: 'right', margin: [0, 0, 9, 9] }
                        ]
                    },
                    content: [
                        { text: title, style: 'Title' },
                        { image: mapimg, width: imgW, height: imgH },
                        { text: '\nΕμβαδόν: ' + $('#hidPolyArea').val(), style: 'DescrStyle' },
                        { text: '\nΠίνακας Συν/νων', style: 'DescrStyle' },
                        {
                            columns: [
                                ktimaUtils.coordsTable(data, ['Α/Α', 'Χ', 'Υ']),
                                {
                                    text: [
                                        { text: 'Τα όρια του γεωτεμαχίου υποδείχθηκαν απο τον δηλούντα.\n\n\n', style: 'DescrStyle', bold: true },
                                        { text: 'Τόπος ..................................... Ημερομηνία: ' + new Date().getDate() + '/' + (new Date().getMonth()+1) + '/' + new Date().getFullYear() + '\n\n\n', style: 'DescrStyle', bold: true, alignment: 'right' },
                                        { text: 'Ο/Η Δηλών/ούσα', style: 'DescrStyle', bold: true, alignment: 'right' }
                                    ]
                                }
                            ]
                        }

                    ],
                    styles: {
                        Title: {
                            fontSize: 14,
                            bold: true,
                            alignment: 'center'
                        },
                        FooterStyle: {
                            fontSize: 9,
                            color: 'grey',
                            italic: true
                        },
                        DescrStyle: {
                            fontSize: 10,
                            bold: false
                        },
                        coordTable: {
                            margin: [0, 5, 0, 15],
                            fontSize: 10
                        },
                        tableHeader: {
                            fontSize: 10,
                            alignment: 'center',
                            color: 'black'
                        },
                        HeaderStyle: {
                            margin: [10, 5, 2, 2],
                            fontSize: 8
                        },
                    },
                    defaultStyle: {
                        fontSize: 8
                    }
                };
                // Internet Explorer 6-11
                var isIE = /*@cc_on!@*/false || !!document.documentMode;

                // Edge 20+
                var isEdge = !isIE && !!window.StyleMedia;
                if (isIE || isEdge) {
                    pdfMake.createPdf(docDefinition).download();
                } else {
                    pdfMake.createPdf(docDefinition).open();
                }
                //$("#dlgPrintApospasma").dialog("close");
                //ktimaUtils.clearPolyLayer();
                ctx.restore();
            });
            $map.renderSync();
        }
    };
})();



window.Ktima = {};
var Ktima= window.Ktima;
Ktima.DrawPoly = function (div) {
    var str = '<button data-toggle="popover" data-trigger="hover" data-content="Επιλέξτε αυτό το κουμπί για να σχεδιάσετε τα όρια ενός νέου γεωτεμαχίου στο χάρτη" data-placement="left" class="btn btn-success" id="btnDrawParcel" style="width:50px;height:50px;border-radius:50%" onclick="ktimaUtils.enableDrawKtimaPoly();"><img src="css/images/polygon-white.png" style="width: 20px;" /></button>';
    $('#' + div).prepend(str);
    $("#btnDrawParcel").prop("title", "Ψηφιοποίηση γεωτεμαχίου");
    var str1 = '<button class="btn btn-success" id="btnblank" style="width:40px;height:40px;margin-bottom:20px;border-radius:50%;opacity:0" ></button>';
    $('#' + div).prepend(str1);
};
Ktima.SearchControl = function (div) {
    var str = '<button data-toggle="popover" class="btn btn-success" id="btnKtimaSearch" data-trigger="hover" data-content="Επιλέξτε αυτό το κουμπί για να αναζητήσετε υφιστάμενα γεωτεμάχια ανά ΟΤΑ και Αριθμό Γεωτεμαχίου ή/και Οικοδομικού Τετραγώνου " style="width:50px;height:50px;border-radius:50%"><img src="css/images/search-white.png" style="width: 20px;" />';
    $('#' + div).prepend(str);
    $("#btnKtimaSearch").prop("title", "Αναζήτηση γεωτεμαχίων...");
};
// Draw and modify interactions. Global so we can remove them later
var draw = null;
var modifyPolyIntrAct = null;
/**
    * Overlay to show the help messages.
    * @type {ol.Overlay}
    */
var helpTooltip;
/**
     * Overlay to show the measurement.
     * @type {ol.Overlay}
     */
var ktimaPolyTooltip;
var ktimaPolyLyr = null;
$(document).ready(function () {
    var $map = $('#mapid').data('map');
    if (typeof $map !== "undefined") {
        $map.removeInteraction(draw);
    }
    var divstr = '<div id="ktimaTools" class="btn-group-vertical" data-toggle="buttons" style="position: fixed;z-index: 9999;top:10%;right:1%"></div>';
    $("#mainparent").append(divstr);
    var dp = new Ktima.DrawPoly('ktimaTools');
    var sp = new Ktima.SearchControl('ktimaTools');
    ktimaUtils.renderPrintUI();
    $('#btnDrawParcel').popover({
        placement: 'left',
        template: '<div class="popover" style="margin-left:-150px;"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
    }).popover('show');
    $('#btnKtimaSearch').popover({
        placement: 'left',
        template: '<div class="popover" style="margin-left:-150px;"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
    }).popover('show');
});