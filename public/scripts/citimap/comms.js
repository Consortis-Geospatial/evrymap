/**
 * Handles the communication between citiMap 
 * and its parent container IF citiMap is running in an iframe
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
    if (document.location.origin !== evt.origin && !evt.origin.startsWith("chrome-extension")) { //So we don't get messages if we are running in standalone mode and not through an iframe 
        //alert(message);
        //console.log("Receive message from parent: " + evt.data);
        try {
            let zoomparams = JSON.parse(evt.data);
            // TEST ONLY - zoom to a feature
            // In a production environment we would need to find 
            // what the message is from evt.data and call the relevant function
            searchUtilities.performSearchById(zoomparams.value, zoomparams.layer, zoomparams.field, true);
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