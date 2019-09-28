var printUtilities = (function () {
    return {
        createPrintSettingsDlg: function () {
            var htmlStr = '<div class="modal" tabindex="-1" role="dialog" id="modPrintDialog" data-backdrop="static">' +
                '<div class="modal-dialog" id="modalPrint" role="document">' +
                '<div class="modal-content">' +
                '<div class="modal-header" style="cursor:move">' +
                '<button type="button" class="close btn-lg" data-dismiss="modal" aria-label="Close">' +
                '<span aria-hidden="true" class="glyphicon glyphicon-remove-circle"></i></span>' +
                '</button>' +
                '<div id="div1"  runat="server" clientidmode="Static">' +
                '<h3 class="modal-title">' + $.i18n._("_PRINTSETTINGS") +'</h3>' +
                '</div>' +
                '</div>' +
                '<div class="modal-body">' +
                '<div class="container-fluid">' +
                '<div class="row">' +
                '<div class="form-group col-lg-6">' +
                '<label for="selPageSize">' + $.i18n._("_PAGESIZE") +'</label>' +
                '<select id="selPageSize" class="form-control">' +
                '<option value="A0">A0</option>' +
                '<option value="A1">A1</option>' +
                '<option value="A2">A2</option>' +
                '<option value="A3">A3</option>' +
                '<option value="A4" selected>A4</option>' +
                '<option value="A5">A5</option>' +
                '</select>' +
                '</div> ' +
                '<div class="form-group col-lg-6">' +
                '<label for="selPageOrientation">' + $.i18n._("_ORIENTATION") +'</label>' +
                '<select id="selPageOrientation" class="form-control">' +
                '<option value="portrait">' + $.i18n._("_PORTRAIT") +'</option>' +
                '<option value="landscape" selected>' + $.i18n._("_LANDSCAPE") +'</option>' +
                '</select>' +
                '</div> ' +
                '</div>' +
                '<div class="row">' +
                '<div class="form-group col-lg-6">' +
                '<label for="selDPI">DPI</label>' +
                '<select id="selDPI"  class="form-control">' +
                '<option value="96" selected>96</option>' +
                '<option value="120">120</option>' +
                '<option value="150">150</option>' +
                '<option value="300">300</option>' +
                '</select>' +
                '</div> ' +
                '<div class="form-group col-lg-6">' +
                '<label for="selScale">' + $.i18n._("_SCALE") +'</label>' +
                '<select id="selScale"  class="form-control">' +
                '</select>' +
                '</div> ' +
                '</div>' +

                '<div class="row">' +
                '<div class="form-group col-lg-4">' +
                '<label for="chkGrid">' + $.i18n._("_USEGRID") +'</label>' +
                '<input type="checkbox" data-toggle="toggle" id="chkGrid" value="">' +
                '</div> ' +
                '<div class="form-group col-lg-4">' +
                '&nbsp;' +
                '</div> ' +
                '<div class="form-group col-lg-4">' +
                '<label for="txbGridStep">' + $.i18n._("_GRIDSTEP") + '</label>' +
                '<input type="number" class="form-control" data-toggle="toggle" id="txbGridStep" value="">' +
                '</div> ' +
                '</div>' +

                '<div class="row">' +
                '<div class="form-group col-lg-12">' +
                '<label for="tbTitle">' + $.i18n._("_TITLE") +'</label>' +
                '<input id="tbTitle" class="form-control" placeholder="' + $.i18n._("_TITLETT") +'" />' +
                '</div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="form-group col-lg-12">' +
                '<label for="tbDescr">' + $.i18n._("_DESCRIPTION") +'</label>' +
                '<textarea id="tbDescr" class="form-control" placeholder="' + $.i18n._("_DESCRIPTIONTT") +'"></textarea>' +
                '</div > ' +
                '</div>' +
                '<div class="col-lg-12">' +
                '<div class="row">' +
                '       <p><strong>' + $.i18n._("_NOTE") + '</strong></p>' +
                '       <p>' + $.i18n._("_NOTEDESCRIPTION") + '</p>' +
                '</div>' +
                '</div>' +
                '</div>' + //container close
                '</div>' + //modal body close
                '<div class="modal-footer">' +
                '    <button type="button" id="btnPrint" class="btn btn-success" onclick="printUtilities.printMap();">' + $.i18n._("_PRINT") +'</button>' +
                '    <button type="button" id="btnCloseSearch" class="btn btn-secondary" data-dismiss="modal" onclick="printUtilities.removeGrid();">' + $.i18n._("_CLOSE") +'</button>' +
                '</div>' +
                '</div>' +
                '</div>';
            return htmlStr;
        },
        printMap: function () {
            var $map = $('#mapid').data('map');
            var printScale = Number($('#selScale').val());
            var resolution = printUtilities.getResolutionFromScale(printScale);
            $map.getView().setResolution(resolution);
            $map.renderSync();
            var dpi = Number($('#selDPI').val());
            $map.once('precompose', function (event) {
                var canvas = event.context.canvas;
                printUtilities.setDPI(canvas, dpi);
            });
            $map.once('postcompose', function (event) {
                var canvas = event.context.canvas;
                var dims = {
                    A0: [1189, 841],
                    A1: [841, 594],
                    A2: [594, 420],
                    A3: [420, 297],
                    A4: [297, 210],
                    A5: [210, 148]
                };
                var orientation = $('#selPageOrientation').val();
                var title = $('#tbTitle').val();
                var descr = $('#tbDescr').val();

                var printPageSize = $('#selPageSize').val();
                var dpi = Number($('#selDPI').val());

                var dim = dims[printPageSize];
                var mapimg = new Image();
                mapimg.setAttribute('crossOrigin', 'anonymous');
                mapimg = canvas.toDataURL('image/png');
                var docDefinition;
                var imgW = ((dims[printPageSize][1] / 10) - 2) / 2.54 * 72; //19cm default width;
                var imgH = ((dims[printPageSize][0] / 10) - 6) / 2.54 * 72; //23 default height;

                // 2cm margin around the page
                var margin = 1 / 2.54 * 72;
                if (orientation === "landscape") {
                    imgW = ((dims[printPageSize][0] / 10) - 2) / 2.54 * 72;
                    imgH = ((dims[printPageSize][1] / 10) - 6) / 2.54 * 72;
                }
                docDefinition = {
                    pageSize: printPageSize,

                    // by default we use portrait, you can change it to landscape if you wish
                    pageOrientation: orientation,

                    // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins

                    pageMargins: [margin, margin, margin, 20],
                    footer: {
                        columns: [
                            { text: 'Αυτόματη δημιουργία από το citiMap', style: 'FooterStyle', margin: [9, 0, 0, 9] },
                            { text: 'Consortis © 2018-2019', style: 'FooterStyle', alignment: 'right', margin: [0, 0, 9, 9] }
                        ]
                    },
                    content: [
                        { text: title, style: 'Maptitle' },
                        { image: mapimg, width: imgW, height: imgH },
                        {
                            columns: [
                                { text: 'Κλίμακα: 1:' + printScale, style: 'ScaleStyle' },
                                { image: 'data:image/png;base64,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', width: 10, height: 30, alignment: 'right' }
                            ]
                        },
                        { text: descr, style: 'DescrStyle' }
                    ],
                    styles: {
                        Maptitle: {
                            fontSize: 22,
                            bold: true
                        },
                        ScaleStyle: {
                            fontSize: 12,
                            bold: true
                        },
                        FooterStyle: {
                            fontSize: 9,
                            color: 'grey',
                            italic: true
                        },
                        DescrStyle: {
                            fontSize: 10,
                            bold: false
                        }
                    }
                };

                //pdfMake.createPdf(docDefinition).download('asdasd.pdf');

                // Internet Explorer 6-11
                var isIE = /*@cc_on!@*/false || !!document.documentMode;

                // Edge 20+
                var isEdge = !isIE && !!window.StyleMedia;
                if (isIE || isEdge) {
                    pdfMake.createPdf(docDefinition).download();
                } else {
                    pdfMake.createPdf(docDefinition).open();
                }
                printUtilities.removeGrid();
            });
            $map.renderSync();
        },
        setDPI: function (canvas, dpi) {
            var scaleFactor = dpi / 96;
            canvas.width = Math.ceil(canvas.width * scaleFactor);
            canvas.height = Math.ceil(canvas.height * scaleFactor);
            var ctx = canvas.getContext("2d");
            ctx.scale(scaleFactor, scaleFactor);
        },
        getResolutionFromScale: function (scale) {
            var $map = $('#mapid').data('map');
            var units = $map.getView().getProjection().getMetersPerUnit();
            //var dpi = 25.4 / 0.28;
            //var mpu = ol.proj.METERS_PER_UNIT[units];
            //var resolution = scale / (mpu * 39.37 * dpi);
            var resolution = scale / (units / (1 / 96 * 0.0254));
            return resolution;
        },
        getScaleFromResolution: function (resolution, units, opt_round) {
            var $map = $('#mapid').data('map');
            //var INCHES_PER_UNIT = {
            //    'm': 39.37,
            //    'dd': 4374754
            //};
            //var DOTS_PER_INCH = 72;
            //var scale = INCHES_PER_UNIT[units] * DOTS_PER_INCH * resolution;
            //if (opt_round) {
            //    scale = Math.round(scale);
            //}
            scale = resolution * ($map.getView().getProjection().getMetersPerUnit() / (1 / 96 * 0.0254));
            var ceilScale;
            var floorScale;
            if (scale < 1000) {
                ceilScale = Math.ceil(scale / 100) * 100;
                floorScale = Math.floor(scale / 100) * 100;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else if (scale < 10000) {
                ceilScale = Math.ceil(scale / 1000) * 1000;
                floorScale = Math.floor(scale / 1000) * 1000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else if (scale < 100000) {
                ceilScale = Math.ceil(scale / 10000) * 10000;
                floorScale = Math.floor(scale / 10000) * 10000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else if (scale < 100000) {
                ceilScale = Math.ceil(scale / 10000) * 10000;
                floorScale = Math.floor(scale / 10000) * 10000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            } else {
                ceilScale = Math.ceil(scale / 100000) * 100000;
                floorScale = Math.floor(scale / 100000) * 100000;
                diffCeil = ceilScale - scale;
                diffFloor = scale - floorScale;
                if (diffFloor < diffCeil) {
                    scale = floorScale;
                } else {
                    scale = ceilScale;
                }
            }

            return scale;
        },
        populateScales: function () {
            var $map = $('#mapid').data('map');
            var currentScale = printUtilities.getScaleFromResolution($map.getView().getResolution(), $map.getView().getProjection().getUnits(), true);
            var scales = [currentScale, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000];

            $("#selScale option").remove();
            var option = '';
            for (var i = 0; i < scales.length; i++) {
                option += '<option value="' + scales[i] + '">' + scales[i] + '</option>';
            }
            $('#selScale').append(option);
        },
        cm2pixels: function (cm, dpi) {
            return dpi * cm / 2.54;
        },
        getDataUri: function (url, callback) {
            var image = new Image();

            image.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
                canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

                canvas.getContext('2d').drawImage(this, 0, 0);

                // Get raw image data
                callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

                // ... or get as Data URI
                callback(canvas.toDataURL('image/png'));
            };

            image.src = url;
        },
        showGrid: function () {
            var gridStep = Number($('#txbGridStep').val());
            if (isNaN(gridStep)) {
                gridStep = 250;
            }
           // Add grid
            var grat = new ol.control.Graticule({ step: gridStep, stepCoord: 1, projection: projcode });
            var style = new ol.style.Style({});
            style.setStroke(new ol.style.Stroke({ color: 'black', width: 1 }));
            style.setText(new ol.style.Text(
                {
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
                    fill: new ol.style.Fill({ color: 'black' })
                }));

            grat.setStyle(style);
            mymap.addControl(grat);
            
        },
        removeGrid: function () {
            var grat;
            mymap.getControls().forEach(function (ctrl) {
                if (ctrl instanceof ol.control.Graticule) {
                    grat = ctrl;
                }
            });
            try {
                if (grat) mymap.removeControl(grat);
                // Always set toggle to off
                $('#chkGrid').bootstrapToggle('off');
            } catch (err) { }
        }
    };
})();
window.print = {};
var print = window.print;
print.PrintControl = function (opt_options) {
    var options = opt_options || {};
    var element = document.createElement('button');
    element.innerHTML = '<img src="css/images/print-white.png" style="width: 20px;"/>';
    element.className = 'btn btn-primary bottomtb';
    element.setAttribute('title', $.i18n._("_PRINTMAP"));
    element.addEventListener('click', function () {
        $('#modPrintDialog').modal('show');
    }, false);
    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};
ol.inherits(print.PrintControl, ol.control.Control);

$(document).ready(function () {
    if (typeof showprint !== "undefined") {
        if (!showprint) {
            return;
        }
    }
    //Get the map reference
    var $map = $('#mapid').data('map');
    //Remove the Legend dialog from DOM
    $("#modPrintDialog").remove();
    //Create Modal print dialog
    $("body").prepend(printUtilities.createPrintSettingsDlg());
    //Convert checkboxes to switches
    $('#chkGridLabels').bootstrapToggle({
        on: $.i18n._('_YES'),
        off: $.i18n._('_NO')
    });
    $('#chkGrid').bootstrapToggle({
        on: $.i18n._('_YES'),
        off: $.i18n._('_NO')
    });
    $("#chkGrid").change(function () {
        if (this.checked) {
            printUtilities.showGrid();
        } else {
            printUtilities.removeGrid();
        }
    });
    //Add layer
    mymap.getControls().push(new print.PrintControl({ 'target': 'bottomToolbar' }));
    $('.modal-dialog').draggable({ handle: ".modal-header" });
    $("#modalPrint").resizable({});
    //alsoResize: ".modal-dialog",
    //    maxHeight: 620,
    //    maxWidth: 530
    //});
    $('#modPrintDialog').on('shown.bs.modal', function (e) {
        printUtilities.populateScales();
    });
});