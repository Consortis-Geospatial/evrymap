var waterLayers = (function () {
    $(document).ready(function () {
        $('#measArea').find('img').prop('src', 'css/images/surface-icon_white.png');
        waterLayers.setLayerStyles();
    });
    return {
        setLayerStyles: function () {
            $mymap = $('#mapid').data('map');
            $mymap.getLayers().forEach(function (layer, i) {
                if (typeof layer.get('tag') !== "undefined" && layer.get('tag')[0] === "GeoJSON") {
                    var name = layer.get('name');
                    if (name === "water_pipe") {
                        layer.setStyle(waterLayers.waterPipeStyle);
                    } else if (name === "water_pipe_node") {
                        layer.setStyle(waterLayers.waterPipeNodeStyle);
                    } else if (name === "tank") {
                        layer.setStyle(waterLayers.tankStyle);
                    } else if (name === "manhole") {
                        layer.setStyle(waterLayers.manholeStyle);
                    } else if (name === "control_valve") {
                        layer.setStyle(waterLayers.controlValveStyle);
                    } else if (name === "lateral") {
                        layer.setStyle(waterLayers.lateralStyle);
                    } else if (name === "hydrant") {
                        layer.setStyle(waterLayers.hydrantStyle);
                    } else if (name === "netw_accs") {
                        layer.setStyle(waterLayers.netAccsStyle);
                    } else if (name === "pump_station") {
                        layer.setStyle(waterLayers.pumpStationStyle);
                    } else if (name === "system_valve") {
                        layer.setStyle(waterLayers.SystemValveStyle);
                    } else if (name === "water_treatment") {
                        layer.setStyle(waterLayers.WaterTreatmentStyle);
                    } else if (name === "water_meter_point") {
                        layer.setStyle(waterLayers.WaterMeterStyle);
                    }
                }
            });
        },
        waterPipeStyle: function (feature, resolution) {
            var style;
            if (feature.get("wp_type") === "Διανομής") {
                style = new ol.style.Style({
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
                    text: new ol.style.Text({
                        text: feature.get('wp_diameter').toString(),
                        fill: new ol.style.Fill({ color: 'red' }),
                        placement: "line",
                        textAlign: "center",
                        stroke: new ol.style.Stroke({
                            color: 'white',
                            width: 3
                        })
                    })
                });
            } else if (feature.get("wp_type") === "Μεταφοράς") {
                const geometry = feature.getGeometry();
                style = [
                    // linestring
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 2
                        })
                    })
                ];

                geometry.forEachSegment(function (start, end) {
                    const dx = end[0] - start[0];
                    const dy = end[1] - start[1];
                    const rotation = Math.atan2(dy, dx);
                    // arrows
                    style.push(new ol.style.Style({
                        geometry: new ol.geom.Point(end),
                        image: new ol.style.Icon({
                            src: 'css/images/arrow.png',
                            anchor: [0.75, 0.5],
                            rotateWithView: true,
                            rotation: -rotation
                        })
                    }));
                });
            } else {
                style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 0, 255, 0.2)',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    }),
                    text: new ol.style.Text({
                        text: "<Νέος αγωγός>",
                        fill: new ol.style.Fill({ color: 'red' }),
                        placement: "line",
                        textAlign: "center",
                        stroke: new ol.style.Stroke({
                            color: 'white',
                            width: 3
                        })
                    })
                });
            }
            return style;
        },
        waterPipeNodeStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.2)' }),
                    stroke: new ol.style.Stroke({ color: 'red', width: 1 })
                }),
                text: new ol.style.Text({
                    text: feature.get('wpn_gid').toString(),
                    fill: new ol.style.Fill({ color: 'red' }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 3
                    })
                })
            });
            return [style];
        },
        tankStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/Tank.png',
                    scale: 0.06
                })
            });
            return [style];
        },
        manholeStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/Manhole.png',
                    scale: 0.03
                })
            });
            return [style];
        },
        controlValveStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/Control_Valve.png',
                    scale: 0.07
                })
            });
            return [style];
        },
        lateralStyle: function (feature, resolution) {
            var style;

            const geometry = feature.getGeometry();
            style = [
                // linestring
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#b82779',
                        width: 2
                    })
                })
            ];
            //geometry.forEachSegment(function (start, end) {
            //    const dx = end[0] - start[0];
            //    const dy = end[1] - start[1];
            //    const rotation = Math.atan2(dy, dx);
            //    // arrows
            //    style.push(new ol.style.Style({
            //        geometry: new ol.geom.Point(end),
            //        image: new ol.style.Icon({
            //            src: 'css/images/arrow.png',
            //            anchor: [0.75, 0.5],
            //            rotateWithView: true,
            //            rotation: -rotation
            //        })
            //    }));
            //});
            return style;
        },
        netAccsStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/PipeStop.png',
                    scale: 0.1
                })
            });
            return [style];
        },
        hydrantStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/hydrant.png',
                    scale: 0.1
                })
            });
            return [style];
        },
        pumpStationStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/pumpStation.png',
                    scale: 0.1
                })
            });
            return [style];
        },
        SystemValveStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/System_Valve.png',
                    scale: 0.05
                })
            });
            return [style];
        },
        WaterTreatmentStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/WaterTreatmentPlant.png',
                    scale: 0.3
                })
            });
            return [style];
        },
        WaterMeterStyle: function (feature, resolution) {
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'css/images/water/water_meter.png',
                    scale: 0.5
                })
            });
            return [style];
        }
    };
})();