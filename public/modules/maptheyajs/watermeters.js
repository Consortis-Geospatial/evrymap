$(document).ready(function () {
});
function getRelatedWaterMeters(pk, service_url, edit_mode) {
    var ret = '';
    //ret = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'
    ret = ' <div class="panel-group" id="accordion">';

    var params = {};
    params["wmp_id"] = pk;
    params = JSON.stringify(params);
    $.ajax({
        url: service_url + '/getWaterMeters',
        data: params,
        dataType: "json",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        beforeSend: function () {
            $(".wait").show();
        },
        success: function (data) {
            var vals = JSON.parse(data.d);
            if (vals !== null && vals.length > 0) {
                $.each(vals, function (key, valueObj) {
                    //ret = ret + '<tr><td>' + valueObj +'</td></tr>'
                    ret = ret + '<div class="panel panel-default"> ' +
                        '   <div class="panel-heading" >' +
                        '       <h4 class="panel-title">';
                    if (edit_mode === false || typeof edit_mode === "undefined") {
                        ret = ret + ' <a data-toggle="collapse" data-parent="#accordion" href="#collapse' + valueObj + '"><span style="font-size: 1.5em;"><i class="fab fa-cloudscale"></i>' +
                            '           </span> Κωδικός Υδρομέτρου: ' + valueObj + '</a>';
                    } else {
                        ret = ret + ' <a data-toggle="collapse" data-parent="#accordion" href="#collapse' + valueObj + '"><span style="font-size: 1.5em;"><i class="fab fa-cloudscale"></i>' +
                            '           </span> Κωδικός Υδρομέτρου: ' + valueObj + '<span style="font-size: 1.5em; color:red" class="pull-right"><i class="fas fa-trash-alt"  onclick="deleteWM(\'' + valueObj.trim() + '\', \'' + service_url + '\', \'' + pk + '\');"></i></span></a>';
                    }

                    ret = ret + '</h4>' +
                        '   </div >' +
                        '<div id="collapse' + valueObj + '" class="panel-collapse collapse">' +
                        'εδω θα έρθουν τα αποτελέσματα από το ΤΡΙΤΩΝ' +
                        '</div>' +
                        '</div>';
                });
            } else {
                ret = ret + '<div class="alert alert-warning">' +
                    'Δε βρέθηκαν υδρόμετρα σε αυτό το σημείο' +
                    '</div>';
            }
        },
        error: function (response) {
            mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
            console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
           
        },
        failure: function (response) {
            mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
            console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
        },
        complete: function (response) {
            $(".wait").hide();
        },
        async: false
    });
    ret = ret + '</div>';
    return ret;
}
function getTritonData(pk, service_url) {
    $('#accordion').on('show.bs.collapse', function () {
        alert("Εκτέλεση web service του ΤΡΙΤΩΝ");
    });
}

function getDataFromMemoplan(pk, service_url) {
    
    $('#accordion').on('show.bs.collapse', function () {

        //var params = {};
        //params["wmp_id"] = pk;
        //params = JSON.stringify(params);

        var params = {};
        //params["data"] = "<ARGUMENTS KOD_YDRO="'00000001', '00000002', '00000003'" ><CREDENTIALS USERNAME="memoplan" PASSWORD="memo2018" /></ARGUMENTS>`;
        params["args"] = "<ARGUMENTS KOD_YDRO=\"'00000001', '00000002', '00000003'\" ><CREDENTIALS USERNAME=\"memoplan\" PASSWORD=\"memo2018\" /></ARGUMENTS>";
        params = JSON.stringify(params);
        $.ajax({
            type: "POST",
            data: params,
            url: "http://localhost/deyasrv/deyacrud.asmx/getMemoPlanData",
            dataType: "xml",
            contentType: "application/json; charset=utf-8",
            success: function (xml) {
                //var dom = null;
                //if (window.DOMParser) {
                //    try {
                //        dom = (new DOMParser()).parseFromString(xml, "text/xml");
                //    }
                //    catch (e) { dom = null; }
                //}
                //else if (window.ActiveXObject) {
                //    try {
                //        dom = new ActiveXObject('Microsoft.XMLDOM');
                //        dom.async = false;
                //        if (!dom.loadXML(xml)) // parse error ..

                //            window.alert(dom.parseError.reason + dom.parseError.srcText);
                //    }
                //    catch (e) { dom = null; }
                //}
                //if (dom !== null) {
                    var jsonString = xml2json(xml, " ");
                    
                    var memoPlanConsumer = JSON.parse(jsonString);
                    console.log(memoPlanConsumer);
                //}
                    
            }
            //error: function (err) {
            //    console.log(err.responseText);
            //}
        });
    });
}
function getEditWMPanel(pk, service_url) {
    var str = '<div id="editRow" class="row"><label for="txbAddWM" class="control-label">Προσθήκη Υδρομέτρων</label> <div class="col-sm-9">' +
        '               <input type="text" id="txbInsWm" class="form-control" placeholder="Κωδ. Υδρομέτρου1,Κωδ. Υδρομέτρου2,.. " title="Εισάγετε τους κωδικούς υδρομέτρων,χωρισμένους με κόμμα(,)" /> ' +
        '           </div> <div class="col-sm-3">' +
        '                   <button class="btn btn-default" type="button" onclick="insertWM(\'' + pk.trim() + '\', \'' + service_url + '\');">Προσθήκη</button> ' +
        '            </div>' +
        '      </div>';
    str = str + getRelatedWaterMeters(pk, service_url, true);
    return str;
}
function addSearchOption(search_url) {
    var str = '<li><a id="btnWMSearch" href="#" onclick="searchWM(\'' + search_url + '\');">Αναζήτηση υδρομέτρων</a></li>';
    $('#searchOpt').append(str);
}
function searchWM(search_url) {
    var wm_code = $('#searchfield').val();
    var wmp_gid = '';
    if (wm_code.trim() === "") {
        return false;
    }
    //Αναζήτηση στη βάση για την εύρεση του ID του σημείου (water_meter_point) που περιέχει το κωδικό υδρομέτρου
    var params = {};
    params["wm_code"] = wm_code;
    params = JSON.stringify(params);
    $.ajax({
        url: search_url + "/searchWaterMeters",
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
                wmp_gid = vals;
            }
        },
        error: function (response) {
            console.log(response.responseText);
            mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
            //featureEditForms.showMessage(true, response.statusText, "ΠΑΡΟΥΣΙΑΣΤΗΚΕ ΣΦΑΛΜΑ");
        },
        failure: function (response) {
            console.log(response.responseText);
            mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
        },
        complete: function (response) {
            $(".wait").hide();
        },
        async: false
    });
    // Τώρα που ξέρουμε το feature id μπορούμε να κάνουμε μια 'κανονική' WFS αναζήτηση
    searchUtilities.performSearchById(wmp_gid, "water_meter_point", "wmp_gid");
}
function insertWM(pk, url) {
    var newWM = $("#txbInsWm").val();
    if (newWM.trim() === "") {
        return false;
    }
    var testExpr = /^\w+(,\w+)*$/;
    if (testExpr.test(newWM)) {
        var params = {};
        params["wmp_id"] = pk;
        params["wm_codes"] = newWM;
        params = JSON.stringify(params);
        $.ajax({
            url: url + '/insertWaterMeters',
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
                    $('#editRow').remove();
                    $('#accordion').remove();
                    $('#attrContent').append(getEditWMPanel(pk, url))
                }
            },
            error: function (response) {
                mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
                console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
                
            },
            failure: function (response) {
                mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
                console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
            },
            complete: function (response) {
                $(".wait").hide();
            },
            async: false
        });
    } else {
        alert('Μόνο αριθμοί χωρισμένοι με κόμμα χωρίς κενά');
    }
}
function deleteWM(wm, url, pk) {
    var params = {};
    params["wm_code"] = wm;
    params = JSON.stringify(params);
    $.ajax({
        url: url + '/deleteWaterMeter',
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
                $('#editRow').remove();
                $('#accordion').remove();
                $('#attrContent').append(getEditWMPanel(pk, url));
            }
        },
        error: function (response) {
            mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
            console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
            
        },
        failure: function (response) {
            mapUtils.showMessage('danger', response.statusText, $.i18n._('_ERROROCCUREDTITLE'));
            console.log(response.responseJSON.Message + ":\n" + response.responseJSON.StackTrace);
        },
        complete: function (response) {
            $(".wait").hide();
        },
        async: false
    });
}