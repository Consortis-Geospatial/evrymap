var ktimaSearch = (function () {
   
    return {
        showKtimaSearch: function () {
            $("#dlgKtimaAdv").dialog("open"); 
        },
        renderUI: function () {
            $('#info1').hide();
            $('#btnSelByRect').hide();
            $('#grpBtnSearch').hide();
            $('#searchfield').hide();
            $('#btnKtimaSearch').off('click').on('click', function () {
                ktimaSearch.showKtimaSearch();
            });
        }
    };
})();
window.KtimaSearch = {};
var KtimaSearch = window.KtimaSearch;

// Draw and modify interactions. Global so we can remove them later
$(document).ready(function () {
    ktimaSearch.renderUI();
});