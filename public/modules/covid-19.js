/**
 * Controls the Preferences dialog
 * @namespace covid19
 */
var covid19 = (function () {
    $(document).ready(function () {
        covid19.createDialog();
        covid19.renderHelpButton();
        $('#graphicLegend').show();
        var c = covid19.getCookie("consortis-geo-covid");
        if (c === null) {
            $('#chkShowHelp').prop('checked', false);
            $('#modCovidHelpDialog').modal('show');
        } else {
            $('#chkShowHelp').prop('checked', true);
        }
        console.log(c);
        
    });
    return {
        /** 
         * Create the COVID-19 Help dialog and adds it to the DOM
         * @function createDialog
         * @memberof covid19
         */
        createDialog: function () {
            $.i18n.load(uiStrings);
            var divhtml = '<div class="modal fade" tabindex="-1" role="dialog" id="modCovidHelpDialog" data-backdrop="static">' +
                '<div class="modal-dialog" role="document">' +
                '  <div class="modal-content">' +
                '     <div class="modal-header">' +
                '      <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                '      <h4 class="modal-title" style="color: #5e9ca0;"><span><img src="css/images/menoumespiti.png" alt="Μένουμε σπίτι"></span>' + "Στατιστικά εξάπλωσης Κορονοϊού στην Ελλάδα και στο κόσμο" + '</h4>' +
                '    </div>' +
                '    <div class="modal-body">' +
                '          <h5 style="color: #2e6c80;">Πως να χρησιμοποιήσετε αυτή την ιστοσελίδα:</h5>' +
                '           <p>Τη πρώτη φορά που θα φορτώσει ο χάρτης, εμφανίζει τα επιβεβαιωμένα κρούσματα του κορωνοϊου ανά χώρα ως κόκκινους κύκλους, με το μέγεθος του κύκλου να είναι αντίστοιχο του συνολικού αριθμού κρουσμάτων.<p/>' +
                '           <p>Τα δεδομένα προέρχονται από το <a href= "https://systems.jhu.edu/" target="_blank">Johns Hopkins University Center for Systems Science and Engineering (JHU CSSE)</a>' +
                '           <p>Ειδικότερα για την Ελλάδα, εμφανίζονται και τα κρούσματα ανά περιφερειακή Ενότητα όπως αυτά αναφέρονται από τον <a href= "https://eody.gov.gr/" target="_blank">ΕΟΔΥ</a><p/>' +
                '           <p><strong>Τα παραπάνω δεδομένα ενημερώνονται καθημερινά</strong></p>' +
                '           <p>Περνώντας το ποντίκι σας πάνω από κάθε Περιφερειακή ενότητα, μπορείτε να δείτε τα ακριβή στοιχεία. Το ίδιο μπορείτε να κάνετε και για κάθε χώρα, ' +
                '              όπου θα εμφανιστούν το όνομα της χώρας, αριθμός κρουσμάτων, θανάτων και ημ/νία και ώρα ενημέρωσης.</p>' +
                '           <p>Μπορείτε να δείτε άλλα θεματικά επίπεδα επιλέγοντας το κουμπί <img src="css/images/layers-grey.png" alt="layers" /> στη κάτω εργαλειομπάρα</p>' +
                '           <p>Πατήστε το ΟΚ για να κλείσετε αυτό το παράθυρο. Αν θέλετε να το επανεμφανίσετε, πατήστε το κουμπί <img src="css/images/help-grey.png" alt="Κουμπί βοήθειας" />που βρίσκεται δεξιά.</p>' +
                '    </div>' +
                '    <div class="modal-footer">' +
                '      <span><img class="pull-left" style="width:30%;height:30%" src="css/images/CONSORTIS_geospatial_LOGO_transparent.png" alt="Μένουμε σπίτι"></span>' +
                '      &nbsp;&nbsp;<label style="font-size=10px;font-weight:normal" for="chkShowHelp">Μη ξαναδείξεις αυτό το παράθυρο</label>&nbsp;<input type="checkbox" id="chkShowHelp" name="chkShowHelp">' +
                '      <button type="button" onclick="covid19.closeHelp();" class="btn btn-default" data-dismiss="modal">' + "ΟΚ" + '</button>' +
                '    </div>' +
                '  </div><!-- /.modal-content -->' +
                '</div><!-- /.modal-dialog -->' +
                '</div><!-- /.modal -->';
            $("body").prepend(divhtml);
            
        },
        closeHelp: function() {
            if ($('#chkShowHelp').prop('checked')) {
                covid19.setCookie("consortis-geo-covid", true, 7);
            } else {
                covid19.eraseCookie("consortis-geo-covid");
            }
        },
        eraseCookie: function(name) {   
            document.cookie = name+'=; Max-Age=-99999999;';  
        },
        renderHelpButton: function() {
            var hbString='<button class="btn btn-primary" onclick="$(\'#modCovidHelpDialog\').modal(\'toggle\');" style="position: fixed; right:5px;top:105px !important;font-size:24px;" id="covid19Help" title="Εμφάνιση Οδηγιών">' +
            '               <i class="fas fa-question-circle"></i>' +
            '             </button>';
            $("body").append(hbString);
        },
        setCookie: function(name,value,days) {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days*24*60*60*1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + (value || "")  + expires + "; path=/";
        },
        getCookie: function(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        }
    };
})();
