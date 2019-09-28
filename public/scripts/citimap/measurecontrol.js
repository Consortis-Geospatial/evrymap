var measureUtilities = (function () {
    /**
    * Currently drawn feature.
           * @type { ol.Feature }
           */
    var sketch;

    /**
     * The help tooltip element.
     * @type {Element}
     */
    var helpTooltipElement;

    /**
     * The measure tooltip element.
     * @type {Element}
     */
    var measureTooltipElement;

    /**
     * Message to show when the user is drawing a polygon.
     * @type {string}
     */
    var continuePolygonMsg = $.i18n._('_MEASUREAREAPROMPT');

    /**
     * Message to show when the user is drawing a line.
     * @type {string}
     */
    var continueLineMsg = $.i18n._('_MEASURELENGTHPROMPT');

    var pm; //pointer move event

    return {
        enableMeasure: function (type) {
            var $map = $('#mapid').data('map');
            mapUtils.resetMapInteractions($map);
            
            //Create temp layer to use for measure
            measureUtilities.clearMeasures();
            var measureSource = new ol.source.Vector();

            measureLyr = new ol.layer.Vector({
                source: measureSource,
                name: "measure_layer",
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            });
            //Add layer to map
            $map.addLayer(measureLyr);

            //Add events
            measureUtilities.pm = $map.on('pointermove', function (evt) {
                if (evt.dragging) {
                    return;
                }
                /** @type {string} */
                var helpMsg = $.i18n._('_MEASURESTARTPROMPT');

                if (sketch) {
                    $.i18n.load(uiStrings);
                    var geom = sketch.getGeometry();
                    if (geom instanceof ol.geom.Polygon) {
                        //$('#measure_help').html($.i18n._('_MEASURELENGTHPROMPT'));
                        helpMsg = $.i18n._('_MEASURELENGTHPROMPT');
                    } else if (geom instanceof ol.geom.LineString) {
                        helpMsg = $.i18n._('_MEASURELENGTHPROMPT');
                    }
                }
                helpTooltipElement.innerHTML = helpMsg;
                helpTooltip.setPosition(evt.coordinate);

                helpTooltipElement.classList.remove('hidden');
            });
            $map.getViewport().addEventListener('mouseout', function () {
                helpTooltipElement.classList.add('hidden');
            });
            //Add measure interaction
            $map.removeInteraction(draw);
            draw = measureUtilities.addMeasureInteraction(type, measureSource);
            $map.addInteraction(draw); //draw variable must be set now
            //Create tooltips for when drawing
            measureUtilities.createMeasureTooltip($map);
            measureUtilities.createHelpTooltip($map);
            var listener;
            draw.on('drawstart',
                function (evt) {
                    // set sketch
                    sketch = evt.feature;

                    /** @type {ol.Coordinate|undefined} */
                    var tooltipCoord = evt.coordinate;

                    listener = sketch.getGeometry().on('change', function (evt) {
                        var geom = evt.target;
                        var output;
                        if (geom instanceof ol.geom.Polygon) {
                            output = measureUtilities.formatArea(geom);
                            tooltipCoord = geom.getInteriorPoint().getCoordinates();
                        } else if (geom instanceof ol.geom.LineString) {
                            output = measureUtilities.formatLength(geom);
                            tooltipCoord = geom.getLastCoordinate();
                        }
                        measureTooltipElement.innerHTML = output;
                        measureTooltip.setPosition(tooltipCoord);
                    });
                }, this);
            draw.on('drawend',
                function () {
                    measureTooltipElement.className = 'tooltipm tooltipm-static';
                    measureTooltip.setOffset([0, -7]);
                    // unset sketch
                    sketch = null;
                    // unset tooltip so that a new one can be created
                    measureTooltipElement = null;
                    measureUtilities.createMeasureTooltip($map);
                    ol.Observable.unByKey(listener);
                }, this);
        },
        formatLength: function (line) {
            //Make sure we reproject if required
            var projLine = mapUtils.convertGeometryToDestProjection('LineString', line);
            //console.log('Format Length - ProjLine: ' + projLine.getLength() + 'Input line length: ' + projLine.getLength() + 'Projline on sphere length: ' + ol.Sphere.getLength(projLine));
            //var length = ol.Sphere.getLength(projLine);
            var length = projLine.getLength();
            var output;
            if (length > 1000) {
                output = (Math.round(length / 1000 * 100) / 100) +
                    ' ' + 'km';
            } else {
                output = (Math.round(length * 100) / 100) +
                    ' ' + 'm';
            }
            return output;
        },
        formatLengthInM: function (line) {
            var length;
            if (line instanceof ol.geom.Polygon) {
                let perimeter = new ol.geom.LineString(line.getLinearRing(0).getCoordinates());
                length = perimeter.getLength();
            } else {
                length = line.getLength();
            }
            var output;
            output = (Math.round(length * 100) / 100);
            return output;
        },
        formatArea: function (polygon) {
            //Make sure we reproject if required
            var projPoly = mapUtils.convertGeometryToDestProjection('Polygon', polygon);
            var area = projPoly.getArea();
            var output;
            if (area > 10000) {
                output = (Math.abs(Math.round(area / 1000000 * 100) / 100)) +
                    ' ' + 'km<sup>2</sup>';
            } else {
                output = (Math.abs(Math.round(area * 100) / 100)) +
                    ' ' + 'm<sup>2</sup>';
            }
            return output;
        },
        formatAreaInM: function (polygon) {
            //Make sure we reproject if required
            var projPoly = mapUtils.convertGeometryToDestProjection('Polygon', polygon);
            var area = 0;
            // OL doesn't seem to calculate multipolygon areas correctly so adding areas each polygon
            if (projPoly.getType() === "Multipolygon") { // Will never get here since we are converting it to a polygon first. But... just in case
                $.each(projPoly.getPolygons(), function (i, part) {
                    area = area + part.getArea();
                });
            } else {
                $.each(projPoly.getLinearRings(), function (i, ring) {
                    area = area + ring.getArea();
                });
               //area = projPoly.getArea();
            }
            if (isNaN(area)) {
                area = 0;
            }
            var output;
            output = Math.abs((Math.round(area * 100) / 100));
            return output;
        },
        addMeasureInteraction: function (geomtype, source) {
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
                id: 'measure_help'
            });
            map.addOverlay(helpTooltip);
        },
        createMeasureTooltip: function (map) {
            if (measureTooltipElement) {
                measureTooltipElement.parentNode.removeChild(measureTooltipElement);
            }
            measureTooltipElement = document.createElement('div');
            measureTooltipElement.className = 'tooltipm tooltipm-measure';
            measureTooltip = new ol.Overlay({
                element: measureTooltipElement,
                offset: [0, -15],
                positioning: 'bottom-center',
                id: 'measure_overlay'
            });
            map.addOverlay(measureTooltip);
        },
        clearMeasures: function () {
            $('#info1').removeClass('active');

            var $map = $('#mapid').data('map');
            $map.removeInteraction(draw);
            var layersToRemove = [];
            $map.getLayers().forEach(function (layer) {
                if (layer.get('name') !== undefined && layer.get('name') === 'measure_layer') {
                    layersToRemove.push(layer);
                }
            });
            //Remove measure layer
            var len = layersToRemove.length;
            for (var i = 0; i < len; i++) {
                $map.removeLayer(layersToRemove[i]);
            }
            //Remove measure overlays
            var ovlToRemove = [];
            $map.getOverlays().forEach(function (ovl) {
                if (ovl.getId() !== undefined && (ovl.getId() === 'measure_overlay') || (ovl.getId() === 'measure_help')) {
                    ovlToRemove.push(ovl);
                }
            });

            var len1 = ovlToRemove.length;
            for (var ii = 0; ii < len1; ii++) {
                $map.removeOverlay(ovlToRemove[ii]);
            }
            //Unbind pointermove event
            ol.Observable.unByKey(measureUtilities.pm);
        },
        clearMeasuresFromInfo: function () {
            var $map = $('#mapid').data('map');
            $map.removeInteraction(draw);
            var layersToRemove = [];
            $map.getLayers().forEach(function (layer) {
                if (layer.get('name') !== undefined && layer.get('name') === 'measure_layer') {
                    layersToRemove.push(layer);
                }
            });
            //Remove measure layer
            var len = layersToRemove.length;
            for (var i = 0; i < len; i++) {
                $map.removeLayer(layersToRemove[i]);
            }
            //Remove measure overlays
            var ovlToRemove = [];
            $map.getOverlays().forEach(function (ovl) {
                if (ovl.getId() !== undefined && (ovl.getId() === 'measure_overlay') || (ovl.getId() === 'measure_help')) {
                    ovlToRemove.push(ovl);
                }
            });

            var len1 = ovlToRemove.length;
            for (var ii = 0; ii < len1; ii++) {
                $map.removeOverlay(ovlToRemove[ii]);
            }
            //Unbind pointermove event
            ol.Observable.unByKey(measureUtilities.pm);
        }
    };
})();
window.measure = {};
var measure = window.measure;
measure.MeasureControl = function (div) {
    var str = '<button class="btn btn-primary bottomtb" id="measLine" onclick="measureUtilities.enableMeasure(\'LineString\');"><img src="css/images/ruler-white.png" style="width: 20px;" />';
    str = str + '<button class="btn btn-primary bottomtb" id="measArea" onclick="measureUtilities.enableMeasure(\'Polygon\');"><img width="16" src="css/images/surface-icon_white.png" style="width: 20px;"/></button>';
    str = str + '<button class="btn btn-primary bottomtb" id="measClear" onclick="measureUtilities.clearMeasures();"><img src="css/images/erase-white.png" style="width: 20px;"/></button>';
    $('#' + div).prepend(str);
    $("#measLine").prop("title", $.i18n._('_MEASURELENGTH'));
    $("#measArea").prop("title", $.i18n._('_MEASUREAREA'));
    $("#measClear").prop("title", $.i18n._('_MEASURECLEAR'));
};
var draw = null; // global so we can remove it later
/**
    * Overlay to show the help messages.
    * @type {ol.Overlay}
    */
var helpTooltip;
/**
     * Overlay to show the measurement.
     * @type {ol.Overlay}
     */
var measureTooltip;
var measureLyr = null;
$(document).ready(function () {
    var $map = $('#mapid').data('map');
    if (typeof $map !== "undefined") {
        $map.removeInteraction(draw);
    }
    var mc = new measure.MeasureControl('bottomToolbar');
});