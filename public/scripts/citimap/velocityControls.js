var velocityColorScaleArray = [
    "#0268DC",
    "#079CF3",
    "#0AB8E4",
    "#0BFA9D",
    "#B0F941",
    "#DAE818",
    "#FBDD12",
    "#F98F06",
    "#EF6126",
    "#C90202",
    "#AF04C1",
    "#DF05DB"
];

var velocityControls = (function() {
    var velocityLyr = {};
    return {
        renderTool: function () {
            var selectElement = document.createElement('div');
            selectElement.setAttribute("id", "velocitySelId");
            // selectElement.setAttribute("style", "position: absolute;left:4%; top:4em;width:30%");
            selectElement.innerHTML = '<div style="width:100%"><span style="width:50%; padding-right:10px; display:none;">aaaa</span><select class="form-control" style="width:50%"></select></div>';
            selectElement.addEventListener("change", function() {
                mapUtils.removeWind();
                mapUtils.addWind($("#velocitySelId select").val());
            });
            $("#velocityMapId").append(selectElement);

            var velocityColorScale = document.createElement('div');
            var colorTable = document.createElement('table');
            colorTable.setAttribute("style", "width:100%");
            var colorTds;
            velocityColorScale.setAttribute("id", "velocityColorScaleId");
            for (let index = 0; index < velocityColorScaleArray.length; index++) {
                if (index === 0) {
                    colorTds = "<td style='background-color:" + velocityColorScaleArray[index] + ";width:" + (100 / velocityColorScaleArray.length) + "%;height:20px;'></td>";
                } else {
                    colorTds += "<td style='background-color:" + velocityColorScaleArray[index] + ";width:" + (100 / velocityColorScaleArray.length) + "%;height:20px;'></td>";   
                }
            }
            
            colorTable.innerHTML = colorTds;
            var scaleRow = colorTable.insertRow(1);

            for (let index = 0; index < velocityColorScaleArray.length; index++) {
                var cel = scaleRow.insertCell(index);
                if (index === 0) {
                    cel.innerHTML = "<td style='width:" + (100 / velocityColorScaleArray.length) + "%;height:20px;'>" + (index + 1) + "</td>";
                } else {
                    cel.innerHTML += "<td style='width:" + (100 / velocityColorScaleArray.length) + "%;height:20px;'>" + (index + 1) + "</td>";   
                }
            }

            scaleRow = colorTable.insertRow(2);
            var cels = scaleRow.insertCell(0);
            cels.innerHTML = "Beaufort";
            cels.setAttribute("colspan", "12");

            velocityColorScale.innerHTML = colorTable.outerHTML;

            $("#velocityMapId").append(velocityColorScale);
        },
        renderSelectOptions(refDate) {
            timeSettings = velocityLyr.timeSettings;
            // convert iso format to Date
            var b = refDate.split(/\D+/);
            var referenceDate = new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
            
            // return if select options are loaded
            if ($("#velocitySelId select option").length > 0) {
                $("#velocitySelId select").val(refDate);
                return;
            }
            
            var fromDate = new Date(new Date(referenceDate).setDate(new Date(referenceDate).getDate() - (timeSettings.days - 1) ));
            
            // console.log('dateFormatArray', dateFormatArray);

            if (timeSettings.unit.toUpperCase() === 'HOUR') {
                for (var d = referenceDate; d >= fromDate; d.setHours(d.getHours() - timeSettings.step)) {
                    this.createFullDateString(d, timeSettings);
                }
            } else if (timeSettings.unit.toUpperCase() === 'DAY') {
                for (var d = referenceDate; d >= fromDate; d.setDate(d.getDate() - timeSettings.step)) {
                    this.createFullDateString(d, timeSettings);
                }
            } else if (timeSettings.unit.toUpperCase() === 'MONTH') {
                for (var d = referenceDate; d >= fromDate; d.setMonth(d.getMonth() - timeSettings.step)) {
                    this.createFullDateString(d, timeSettings);
                }
            }
            
            
            $("#velocitySelId select").val(refDate);
        },
        createFullDateString(d, timeSettings) {
            var dateFormatArray = timeSettings.format.split(timeSettings.dateSeparator);
            var dd = d.getDate().toString().length == 1 ? '0' + d.getDate() : d.getDate();
            // january is 0
            var mm = d.getMonth() + 1;
            var yyyy = d.getFullYear();
            var hh = d.getHours().toString().length == 1 ? '0' + d.getHours() : d.getHours();
            var min = d.getMinutes() + '0';

            var fullDate = '';
            dateFormatArray.forEach((dateEl, index) => {
                
                if (dateEl.toUpperCase() === 'YYYY') {
                    fullDate += yyyy;
                } else if (dateEl.toUpperCase() === 'MM') {
                    fullDate += mm;
                } else {
                    fullDate += dd;
                }

                if (index < 2) {
                    fullDate += timeSettings.dateSeparator;
                }
            });
            fullDate += ' ' + hh + ':' + min;
            // var fullDate = dd + velocityLyr.timeSettings.dateSeparator + mm + velocityLyr.timeSettings.dateSeparator + yyyy + ' ' + hh + ':' + min;
            var optionElement = document.createElement('option');
            optionElement.innerHTML = fullDate;
            optionElement.setAttribute("value", d.toISOString());
            $("#velocitySelId select").append(optionElement);
            // $("#velocitySelId select").append('<option value="' + refDate + '">' + fullDate + '</option>');
        },
        getVelocitySettings: function() {
            layers=cfg.layers;
            $.each(layers, function (key, lyr) {
                if (lyr.type === "Velocity" && typeof lyr.timeSettings !== "undefined") {
                    velocityLyr = lyr;
                    return false;
                }
            });
            return velocityLyr;
        },
        velocityLayerIsLoaded() {
            var velocityMap = $("#mapid2");
            if (velocityMap[0]) {
                return true;
            } else {
                return false;
            }
        }
    }
})()