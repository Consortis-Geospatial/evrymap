/**
 * Handles the communication between evrymap 
 * and its parent container IF evrymap is running in an iframe
 *  * See:
 *  *  https://developer.mozilla.org/en-US/docs/Web/API/window.postMessage
 *  *  http://ejohn.org/blog/cross-window-messaging/
*  *   http://benalman.com/projects/jquery-postmessage-plugin/
*  *  http://benalman.com/code/projects/jquery-postmessage/docs/files/jquery-ba-postmessage-js.html
 */

/**
 * 
 * @param {object} evt
 *  * .data – A string holding the message passed from the other window.
 *  *  .domain (origin?) – The domain name of the window that sent the message.
 *  *  .uri – The full URI for the window that sent the message.
 *  *  .source – A reference to the window object of the window that sent the message.
 */
 

function ReceiveMessage(evt) {
    //document.location.origin !== evt.origin && 
    if (!evt.origin.startsWith("chrome-extension")) { //So we don't get messages if we are running in standalone mode and not through an iframe 
        //alert(message);
        //console.log("Receive message from parent: " + evt.data);
        
        try {
            let inMsg = JSON.parse(evt.data.replace(/[\r\n]+/gm, ""));

            // console.log("received message ",inMsg,evt);

            if (inMsg.cmd === "zoomto") {
                searchUtilities.performSearchById(inMsg.value, inMsg.layer, inMsg.field, true);
            } else if (inMsg.cmd === "drawpin") {
                zoom2XY.zoomToXY(inMsg.x, inMsg.y, inMsg.epsgcode, inMsg.label);
            } else if (inMsg.cmd === "drawfeature") {
                searchUtilities.zoomToWKTFeature(inMsg.wkt);
            }
            else if (inMsg.cmd === "editPin") {
                let received_coords = inMsg.value.split(",");
                let $mymap = $('#mapid').data('map');
                let epsg = inMsg.epsg;
                
                let mapCrs = $mymap.getView().getProjection().getCode();

                if(received_coords[0] != "null" && received_coords[1]!= "null") {
                    let new_coords = ol.proj.transform([received_coords[0],received_coords[1]], 'EPSG:'+ epsg, mapCrs);
                    
                    
                    //legendUtilities.getLayerByName("editPinLayer").setVisible(true);
                    legendUtilities.getLayerByName("editPinLayer").getSource().getFeatures()[0].getGeometry().setCoordinates([new_coords[0], new_coords[1]]);

                }
                zoom2XY.addEditPinModify(epsg);
            }
            else if (inMsg.cmd === "hidePin") {
                let received_coords = inMsg.value.split(",");
                //legendUtilities.getLayerByName("editPinLayer").setVisible(false);
                let $mymap = $('#mapid').data('map');
                let mapCrs = $mymap.getView().getProjection().getCode();
                let epsg = inMsg.epsg;
                
                let new_coords = ol.proj.transform([received_coords[0],received_coords[1]],'EPSG:'+ epsg, mapCrs);
                $mymap.getView().setCenter(new_coords);
                $mymap.getView().setZoom(Number(preferences.getPointZoom()));

                zoom2XY.removeEditPinModify();
            }
        } catch (e) {
            return;
        }
    }

    // http://javascript.info/tutorial/cross-window-messaging-with-postmessage
    //evt.source.postMessage("thanks, got it", evt.origin);
    //evt.source.postMessage("thanks, got it", "*");
} 


if (!window['postMessage'])
    console.log("Browser does not support postMessage");
else {
    if (window.addEventListener) {
        //alert("standards-compliant");
        // For standards-compliant web browsers (ie9+)
        window.addEventListener("message", ReceiveMessage, false);
    }
    else {
        //alert("not standards-compliant (ie8)");
        window.attachEvent("onmessage", ReceiveMessage);
    }
}