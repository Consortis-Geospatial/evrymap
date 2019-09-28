var esriUtils = (function () {
    return {
        createEsriRestTile: function (name, url, label, srid, group) {
            var arcgislayer = new ol.layer.Tile({
                source: new ol.source.TileArcGISRest({
                    url: url
                })
            });
            if (typeof name === "undefined" || name === "") {
                name = label.replace(" ", "");
            }
            if (typeof srid === "undefined" || srid === "") {
                srid = projcode;
            }
            arcgislayer.set('name', name);
            arcgislayer.set('label', label);
            arcgislayer.set("tag", ["ESRIRESTTILE", url]);
            arcgislayer.set("srid", srid);
            arcgislayer.set('feature_info_format', "GEOJSON");
            arcgislayer.set('identify_fields', "");
            arcgislayer.set('search_fields', "");
            if (typeof group !== "undefined" && group !== "") {
                arcgislayer.set('group', group);
            }
            arcgislayer.set('queryable', false);
            return arcgislayer;
        },
        drawEsriRestLegend: function (layerurl, name) {
            $.ajax({
                url: layerurl + '/Legend?f=pjson',
                async: true,
                dataType: 'json',
                success: function (esriLyrs) {
                    var injectString = '';
                    $.each(esriLyrs.layers, function (index, item) {
                        var lname = item.layerName;
                        var imgtype = item.legend[0].contentType;
                        var imgdata = item.legend[0].imageData;
                        injectString = injectString + '<p style="margin-left:20px;margin-top:20px"><span><img src="data:' + imgtype + ';base64,' + imgdata + '" />' + lname + '</span></p>';
                    });
                    $("#legendLayer_" + name).append(injectString);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //console.log("request failed " + textStatus);
                }
            });
        }
    };
})();