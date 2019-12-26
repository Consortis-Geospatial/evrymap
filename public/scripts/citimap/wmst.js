var WMSTUtils = (function () {
    var frameRate = 0.5; // frames per second
    var animationId = null;
    $(document).ready(function () {
        let tlayers = [];
        layers = mapPortal.readConfig("layers");
        $.each(layers, function (key, lyr) {
            if (lyr.type === "WMS" && typeof lyr.timeSettings !== "undefined") {
                tlayers.push(lyr);
            }
        });
        if (tlayers.length > 0) {
            WMSTUtils.renderTools();
            $('#wmsTLayers').empty();
            $('#wmsTLayers').append('<option value="-1">Select...</option>');
            $.each(tlayers, function (key, tlyr) {
                $('#wmsTLayers').append('<option value="' + tlyr.name + ';'
                    + tlyr.timeSettings.unit
                    + ';' + tlyr.timeSettings.format
                    + ';' + tlyr.timeSettings.dateSeparator
                    + ';' + tlyr.timeSettings.min
                    + ';' + tlyr.timeSettings.max
                    + ';' + tlyr.timeSettings.step + '">' + tlyr.label + '</option>');
            });
        }
        $('#wmsTLayers').on('change', function () {
            WMSTUtils.stop();
            WMSTUtils.setSlider(this.value);
        });
        //WMSTUtils.setSlider($("#wmsTLayers").val());
        $('#btnPlayWms').off('click').on('click', function () { WMSTUtils.play(); });
        $('#btnStopWms').off('click').on('click', function () { WMSTUtils.stop(); });
    });
    return {
        resetWmsTLayers: function () {
            $.each(layers, function (key, lyr) {
                if (lyr.type === "WMS" && typeof lyr.timeSettings !== "undefined") {
                    var maplyr=legendUtilities.getLayerByName(lyr.name);
                    maplyr.setVisible(false);
                }
                var active_layer_name=$('#wmsTLayers').val();
                if (active_layer_name !== "-1") {
                    active_layer_name=$('#wmsTLayers').val().split(';')[0];
                    activeLyr=legendUtilities.getLayerByName(active_layer_name);
                    activeLyr.setVisible(true);
                }                
            });
        },
        renderTools: function () {
            str = '<style>';
            str = str + 'div#fixBootstrapSliderPluginStyles div.slider.slider-horizontal .slider-track .slider-handle {height: 30px!important; }';
            str = str + '</style>';
            str = str + '<div style="position: absolute;left:4%; top:4em;width:70%">';
            str = str + '<div class="row">';
            str = str + '   <div class="col-lg-6">';
            str = str + '       <div class="input-group"> <span class="input-group-addon">Layer</span>';
            str = str + '          <select class="form-control" id="wmsTLayers" ></select>';
            str = str + '           <span class="input-group-btn"><button id="btnPlayWms" style="display:none" class="btn btn-success" type="button"><span class="glyphicon glyphicon-play-circle"></span></button></span>';
            str = str + '           <span class="input-group-btn"><button id="btnStopWms" style="display:none" class="btn btn-danger" type="button" disabled><span class="glyphicon glyphicon-pause"></span></button></span>';
            str = str + '       </div>';
            str = str + '   </div>';
            str = str + '   <div class="col-lg-6" id="fixBootstrapSliderPluginStyles">';
            str = str + '       <div id="wmsTSlider"></div>';
            str = str + '   </div>';
            str = str + '</div>';
            str = str + '</div>';
            $("#mainparent").append(str);
        },
        setSlider: function (val) {
            if (val === "-1") {
                $('#btnPlayWms').hide();
                $('#btnStopWms').hide();
                WMSTUtils.stop();
                //$("#wmsTSlider").bootstrapSlider();
                $("#wmsTSlider").bootstrapSlider('disable');
                return;
            }
            $('#btnPlayWms').show();
            $('#btnStopWms').show();
            $("#wmsTSlider").bootstrapSlider('enable');
            let arrval = val.split(';');
            let timeLayerName = arrval[0];
            let unit = arrval[1];
            let format = arrval[2];
            let sep = arrval[3];
            let min = arrval[4];
            let max = arrval[5];
            let step = arrval[6];
            let mins, maxs;
            let tics = [];
            let darr = format.split(sep);
            let dict = [];
            let y, m, d;
            if (darr[0] === 'YYYY' || darr[0] === 'YY' || darr[0] === 'yyyy' || darr[0] === 'yy') {
                y = 0;
            } else if (darr[1] === 'YYYY' || darr[1] === 'YY' || darr[1] === 'yyyy' || darr[1] === 'yy') {
                y = 1;
            } else if (darr[2] === 'YYYY' || darr[2] === 'YY' || darr[2] === 'yyyy' || darr[2] === 'yy') {
                y = 2;
            }
            dict["YEAR"] = y;
            if (darr[0] === 'MM' || darr[0] === 'M' || darr[0] === 'mm' || darr[0] === 'mm') {
                m = 0;
            } else if (darr[1] === 'MM' || darr[1] === 'M' || darr[1] === 'mm' || darr[1] === 'mm') {
                m = 1;
            } else if (darr[2] === 'MM' || darr[2] === 'M' || darr[2] === 'mm' || darr[2] === 'mm') {
                m = 2;
            }
            dict["MONTH"] = m;
            if (darr[0] === 'DD' || darr[0] === 'D' || darr[0] === 'dd' || darr[0] === 'd') {
                d = 0;
            } else if (darr[1] === 'DD' || darr[1] === 'D' || darr[1] === 'dd' || darr[1] === 'd') {
                d = 1;
            } else if (darr[2] === 'DD' || darr[2] === 'D' || darr[2] === 'dd' || darr[2] === 'd') {
                d = 2;
            }
            dict["DAY"] = d;
            dict.sort();
            //console.log(dict);
            if (unit === "MONTH") {
                if (format.indexOf('MM') !== -1) {
                    mins = min.substr(format.indexOf('MM'), 2);
                    maxs = max.substr(format.indexOf('MM'), 2);
                } else if (format.indexOf('MON') !== -1) {
                    mins = min.substr(format.indexOf('MON'), 3);
                    maxs = max.substr(format.indexOf('MON'), 3);
                } else { return; }
                //Find the date components from the format

                $("#wmsTSlider").bootstrapSlider({
                    formatter: function (value) {
                        let v_month = '';
                        let v_date = '';
                        if (value <= 9) {
                            v_month = '0' + value.toString();
                        } else {
                            v_month = value.toString();
                        }
                        // Year can only be 0 or 2
                        //if (dict.YEAR === 0) {
                        v_date = min.split(sep)[0] + sep + v_month + sep + min.split(sep)[2]; //YYYY-MM-DD
                        //} else {
                        //    v_date = min.split(sep)[0] + sep + v_month + sep + min.split(sep)[2]; //YYYY-MM-DD
                        //}

                        return v_date;
                    },
                    value: parseInt(mins),
                    min: parseInt(mins),
                    max: parseInt(maxs),
                    step: parseInt(step),
                    tooltip: 'always',
                    tooltip_position: 'bottom'//,

                    //ticks: [0, 1],
                    //ticks_positions: [0, 100],
                    //tick_labels: ['0%', '100%']
                });
                $('#wmsTSlider').bootstrapSlider().on('change', function (e) {
                    var v = e.value.newValue;
                    var b = e.value.oldValue;
                    //console.log(v);
                    let v_date = '';
                    let v_month = '';
                    if (v <= 9) {
                        v_month = '0' + v.toString();
                    } else {
                        v_month = v.toString();
                    }
                    v_date = min.split(sep)[0] + sep + v_month + sep + min.split(sep)[2];
                    //console.log(v_date);
                    let timeLayer = legendUtilities.getLayerByName(timeLayerName);
                    timeLayer.getSource().updateParams({ 'TIME': v_date });
                });
            } else {
                // for now only support months
                return;
            }
        },
        play: function () {
            let min = $('#wmsTSlider').bootstrapSlider('getAttribute', 'min');
            let max = $('#wmsTSlider').bootstrapSlider('getAttribute', 'max');
            let step = $('#wmsTSlider').bootstrapSlider('getAttribute', 'step');
            var i = min;
            $('#btnStopWms').prop('disabled', false);
            WMSTUtils.resetWmsTLayers();
            function iterate() {
                WMSTUtils.stop();
                if (max >= i) {
                    //alert(list[i]);
                    $('#wmsTSlider').bootstrapSlider('setValue', i, true, true);
                    i += step;
                }
                animationId = window.setTimeout(iterate, 3000);
                if (max + 1 === i) {
                    i = min;
                }
            }
            iterate();
        },
        wait: function (ms) {
            var start = new Date().getTime();
            var end = start;
            while (end < start + ms) {
                end = new Date().getTime();
            }
        },
        test: function () {
            WMSTUtils.stop();
            animationId = window.setInterval(WMSTUtils.setDateTime, 1000 / frameRate);
            $('#btnStopWms').prop('disabled', false);
        },
        stop: function () {
            if (animationId !== null) {
                window.clearTimeout(animationId);
                animationId = null;
                //$('#btnStopWms').prop('disabled', true);
            }
        }
    };
})();