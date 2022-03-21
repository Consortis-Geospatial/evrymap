var WMSTUtils = (function () {
    var frameRate = 0.5; // frames per second
    var animationId = null;
    $(document).ready(function () {
        let tlayers = [];
        //layers = mapPortal.readConfig("layers");
        layers=cfg.layers;
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
        /**
         * addDays: add days to a date and return a string YYYY-MM-DD
         * @param {string} year starting year
         * @param {string} month starting month
         * @param {string} day starting day
         * @param {string} days days to add
         */
        addDays: function (year, month, day, days, sep) {
            let v_date = new Date(year+"-"+month+"-"+day);
            v_date.setDate(v_date.getDate() + days);

            let v_month = (v_date.getMonth()+1);
            if(v_month<10)
                v_month= "0"+v_month;
            let v_day = v_date.getDate();
            if(v_day<10)              
                v_day= "0"+v_day;   

            v_date = v_date.getFullYear() + sep + v_month + sep + v_day;
 
            return v_date;
        },
        /**
         * dateformat: change format of date from YYYY-MM-DD to what was defined
         * @param {string} date the date to change
         * @param {string} sep separator
         * @param {string} dict dictionary with YEAR, MONTH, DAY properties
         */
        dateformat: function (date, sep, dict)
        {
            let year = date.split(sep)[0];
            let month = date.split(sep)[1];
            let day = date.split(sep)[2];

            let result='';
            if(dict["YEAR"]===0) 
                result += year;
            if(dict["MONTH"]===0) 
                result += month;
            if(dict["DAY"]===0) 
                result += day;
            if(dict["YEAR"]===1) 
                result += sep + year;
            if(dict["MONTH"]===1) 
                result += sep + month;
            if(dict["DAY"]===1) 
                result += sep + day;
            if(dict["YEAR"]===2) 
                result += sep + year;
            if(dict["MONTH"]===2) 
                result += sep + month;
            if(dict["DAY"]===2) 
                result += sep + day;
            
            return result;
        },
        /**
         * monthValueToDate: converts slider value to date
         * @param {string} sliderValue slider value
         * @param {string} minYear starting year
         * @param {string} minMonth starting month
         * @param {string} minDay starting day
         * @param {string} sep separator
         */
        monthValueToDate: function (sliderValue, minYear, minMonth,minDay, sep ) {
            sliderValue = +sliderValue + +minMonth;
                        
            v_year= +minYear;

            let yearsDiff =  Math.trunc ((+sliderValue-1)/12); //-1 for month
            if (sliderValue > sliderValue - 12 * yearsDiff ) {
                sliderValue = sliderValue - 12 * yearsDiff;
                v_year = v_year + yearsDiff;
            }
            
            if (sliderValue <= 9) {
                v_month = '0' + sliderValue.toString();
            } else {
                v_month = sliderValue.toString();
            }
            
            let v_date = v_year + sep + v_month + sep + minDay; 
            return v_date;
        },
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
            str = '';
            str = str + '<div class="wms-t-control">';
            str = str + '<div class="row">';
            str = str + '   <div class="col-lg-6 col-md-6 col-sm-12" style="margin-bottom:15px;">';
            str = str + '       <div class="input-group"> <span class="input-group-addon">Layer</span>';
            str = str + '          <select class="form-control" id="wmsTLayers" ></select>';
            str = str + '           <span class="input-group-btn"><button id="btnPlayWms" style="display:none" class="btn btn-success" type="button"><span class="glyphicon glyphicon-play-circle"></span></button></span>';
            str = str + '           <span class="input-group-btn"><button id="btnStopWms" style="display:none" class="btn btn-danger" type="button" disabled><span class="glyphicon glyphicon-pause"></span></button></span>';
            str = str + '       </div>';
            str = str + '   </div>';
            str = str + '   <div class="col-lg-6 col-md-6 col-sm-12" id="fixBootstrapSliderPluginStyles">';
            str = str + '       <div id="wmsTSlider" style="width:80%; "></div>';
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
            let step = arrval[6].split(',');
            if(step.length<=1)
            {
                step = parseInt(step[0]);
            }
            let mins, maxs, miny, maxy , mind, maxd;
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
            if (format.indexOf('MM') !== -1) {
                mins = min.substr(format.indexOf('MM'), 2);
                maxs = max.substr(format.indexOf('MM'), 2);
            } else if (format.indexOf('mm') !== -1) {
                mins = min.substr(format.indexOf('mm'), 2);
                maxs = max.substr(format.indexOf('mm'), 2);
            } else { return; }

            if (format.indexOf('YYYY') !== -1) {
                miny = min.substr(format.indexOf('YYYY'), 4);
                maxy = max.substr(format.indexOf('YYYY'), 4);
            } else if (format.indexOf('yyyy') !== -1) {
                miny = min.substr(format.indexOf('yyyy'), 4);
                maxy = max.substr(format.indexOf('yyyy'), 4);
            } else { return; }

            if (format.indexOf('DD') !== -1) {
                mind = min.substr(format.indexOf('DD'), 2);
                maxd = max.substr(format.indexOf('DD'), 2);
            } else if (format.indexOf('dd') !== -1) {
                mind = min.substr(format.indexOf('dd'), 2);
                maxd = max.substr(format.indexOf('dd'), 2);
            } else { return; }

            if(!Array.isArray(step))
            {
                if (unit === "MONTH") {
                    
                    //Find the date components from the format

                    let monthsDiff = (+maxy - +miny)*12;
                    monthsDiff -= +mins;
                    monthsDiff += +maxs;

                    $("#wmsTSlider").bootstrapSlider({
                        formatter: function (value) {
                            
                            let v_date = WMSTUtils.monthValueToDate(value, miny, mins, mind, sep );
                            v_date = WMSTUtils.dateformat(v_date, sep, dict);
                            return v_date;
                        },
                        value: 0,
                        min: 0,
                        max: monthsDiff,
                        step: step,
                        tooltip: 'always',
                        tooltip_position: 'bottom'//,

                        //ticks: [0, 1],
                        //ticks_positions: [0, 100],
                        //tick_labels: ['0%', '100%']
                    });
                    $('#wmsTSlider').bootstrapSlider().on('change', function (e) {
                        var v = e.value.newValue;
                        var b = e.value.oldValue;
                        let v_date = '';

                        v_date = WMSTUtils.monthValueToDate(v, miny, mins, mind, '-');
                        let timeLayer = legendUtilities.getLayerByName(timeLayerName);
                        timeLayer.getSource().updateParams({ 'TIME': v_date });
                    });
                } else if(unit === "DAY") {
                    
                    //Find the date components from the format

                    //in milliseconds, plus 1 day because maximum has to be considered as a day also
                    let daysDiff = new Date(maxy,maxs,maxd) - new Date(miny,mins,mind) + 1*24*60*60*1000; 
                    daysDiff = daysDiff/1000; //seconds
                    daysDiff = daysDiff/60  //minutes
                    daysDiff = daysDiff/60  //hours
                    daysDiff = daysDiff/24  //days
                    daysDiff = Math.round(daysDiff);

                    $("#wmsTSlider").bootstrapSlider({
                        formatter: function (value) {
                            
                            v_date = WMSTUtils.addDays(+miny, +mins, +mind, value, sep);
                            
                            v_date = WMSTUtils.dateformat(v_date, sep, dict);

                            return v_date;
                        },
                        value: 0,
                        min: 0,
                        max: daysDiff,
                        step: parseInt(step),
                        tooltip: 'always',
                        tooltip_position: 'bottom'//,

                    });
                    $('#wmsTSlider').bootstrapSlider().on('change', function (e) {
                        var v = e.value.newValue;
                        var b = e.value.oldValue;
                        
                        let v_date = '';
                        
                    
                        
                        v_date = WMSTUtils.addDays(+miny, +mins, +mind, v, '-');
                        
                        let timeLayer = legendUtilities.getLayerByName(timeLayerName);
                        timeLayer.getSource().updateParams({ 'TIME': v_date });
                    });
                
                }
                else {
                    // for now only support months and days
                    return;
                }
            }
            else {
                $("#wmsTSlider").bootstrapSlider({
                    formatter: function (value) {
                        console.log('slider',value,step[value]);
                        return step[value];
                    },
                    value: 0,
                    min: 0,
                    max: step.length-1,
                    step: 1,
                    tooltip: 'always',
                    tooltip_position: 'bottom'//,

                    //ticks: [0, 1],
                    //ticks_positions: [0, 100],
                    //tick_labels: ['0%', '100%']
                });
                $('#wmsTSlider').bootstrapSlider().on('change', function (e) {
                    var v = e.value.newValue;
                    var b = e.value.oldValue;
                    let v_date = '';

                    v_date = step[v];
                    let timeLayer = legendUtilities.getLayerByName(timeLayerName);
                    timeLayer.getSource().updateParams({ 'TIME': v_date });
                });
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