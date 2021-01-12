var set_locale_to = function (locale) {
    if (locale) {
        $.i18n().locale = locale;
    }
    $('body').i18n();
};
var projDef;
var cfg;
var mapPortal = (function (configfile) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("config") !== null) {
        configfile = urlParams.get("config") + ".json";
    }
    $(document).ready(function () {
        $.i18n.load(uiStrings);
        mapPortal.config();
        mapPortal.init(configfile, projcode, projdescr, mapextent);
        if (urlParams.get("action") !== null) {
            let action = urlParams.get("action");
            if (action === "featurezoom") {
                setTimeout(
                    function() 
                    {
                        if (urlParams.get("layer") !== null && urlParams.get("field") !== null && urlParams.get("value") !== null) {
                           
                            if (!(legendUtilities.getLayerByName(urlParams.get("layer")) instanceof ol.layer.AnimatedCluster) )
                                searchUtilities.performSearchById(urlParams.get("value"), urlParams.get("layer"), urlParams.get("field"), true);    
                            else {
                                searchUtilities.zoomToCluster( urlParams.get("layer"),urlParams.get("field"), urlParams.get("value"));   
                            }
                            
                        
                        }
                    }, 2000
                );
            }
        }
    });
    return {
        config: function () {
            // Set User dropdown options
            $('#lnkOptions').html("<span class='glyphicon glyphicon-cog' aria-hidden='true'></span>&nbsp;&nbsp;" + $.i18n._('_PREFERENCES'));
            $('#lnkUserGuide').html("<span class='glyphicon glyphicon-question-sign' aria-hidden='true'></span>&nbsp;&nbsp;" + $.i18n._('_USERGUIDE'));
            $("#lnkUserGuide").prop("href", userGuide);
            $("#lnkUserGuide").prop("target", "_blank");
            // Set the app layout if defined
            //var layout = mapPortal.readConfig("layout");
            cfg= mapPortal.readConfig(null);
            var layout=cfg.layout;
            if (typeof layout !== "undefined") {
                showprint = layout.print;
                showheader = layout.header;
                showquicksearch= layout.quicksearch;
                showlegendcontrol=layout.legendcontrol;
                showmeasure=layout.measuretools;
                showsave=layout.saveview;
                if (!showheader) $('#cnavbar').hide();
                if (!showquicksearch) $('.searchpanel').hide();
                // TODO: Add ids to the bottom toolbar controls so we can control them from layerconfig.json
                //if (!showlegendcontrol)
            }
            //Read mapsettings from config
            //var mapSettings = mapPortal.readConfig("map");
            var mapSettings=cfg.map;
            mapserver = mapSettings.mapserver;
            if (mapSettings.useWrappedMS !== "undefined" && mapSettings.useWrappedMS === true) {
                mapservexe = '';
                $('#hidMS').val(mapserver);
            } else {
                mapservexe = mapSettings.mapservexe;
                $('#hidMS').val(mapserver + "/" + mapservexe);
            }           
            mcenter = mapSettings.mcenter;
            initzoomlevel = mapSettings.initzoomlevel;
            projcode = mapSettings.projcode;
            projdescr = mapSettings.projdescr;
            destprojcode = mapSettings.destprojcode;
            xyzoomlevel = mapSettings.xyzoomlevel;
            if (typeof destprojcode === "undefined") {
                destprojcode = projcode;
            }
            destprojdescr = mapSettings.destprojdescr;
            if (typeof destprojdescr === "undefined") {
                destprojdescr = projdescr;
            }
            mapextent = mapSettings.mapextent;
            
        },
        init: function (configfile, projcode, projdescr, mapextent) {
            // prevent forms from auto submitting on all inputs
            $(document).on("keydown", "input", function (e) {
                if (e.which === 13) e.preventDefault();
            });

            if ($('#txbUsername').length === 1 && $('#txbPassword').length === 1) {
                $('#txbUsername').bind('keyup', function (e) {
                    if (e.keyCode === 13 && $('#txbUsername').val().trim() !== "") { // 13 is enter key
                        $('#btnLogin').click();
                    }
                });
                $('#txbPassword').bind('keyup', function (e) {
                    if (e.keyCode === 13 && $('#txbPassword').val().trim() !== "") { // 13 is enter key
                        $('#btnLogin').click();
                    }
                });
            }
            
            $('#hidJConfig').val(configfile);
            $('.modal-dialog').draggable();

            mapUtils.initlayers(projcode, projdescr, mapextent);

            //if (window.location.pathname.includes("urban_docs")) {
            //    $('#liHome').removeClass('active'); $('#liUrban').addClass('active');
            //} else {
            //    $('#liHome').addClass('active'); $('#liUrban').removeClass('active');
            //}
        },
        showMessage: function (msg) {
            $('#spMsg').html("<label>&nbsp;" + msg + "</label>");
            $('#divStatus').show();
            $('#divStatus').delay(2000).fadeOut(500);
        },
        readConfig: function (prop) {
            // Get projection definitions
            mapPortal.readProjDef();
            // Read layer config file
            var ret;
            $.ajax({
                url: 'config/' + configfile,
                async: false,
                dataType: 'json',
                success: function (data) {
                    if (prop === null || typeof prop=== "undefined") {
                        ret=data;
                    } else {
                        ret = data[prop];
                    }
                    
                },
                error: function (response) {
                    alert(response.responseText);
                },
                failure: function (response) {
                    alert(response.responseText);
                }
            });
            return ret;
        },
        readProjDef: function () {
            $.ajax({
                url: 'config/projdef.json',
                async: false,
                dataType: 'json',
                success: function (data) {
                    projDef = data;
                },
                error: function (response) {
                    projDef = void 0;
                },
                failure: function (response) {
                    projDef = void 0;
                }
            });
        }
    };
})(configfile);