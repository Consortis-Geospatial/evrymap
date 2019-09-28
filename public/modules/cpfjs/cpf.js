var cpfUtils = (function () {

    $(document).ready(function () {
        $("#mainparent").prepend('<div id="cpfContainer"></div>');
        $("#cpfContainer").load("modules/cpfjs/cpf_template.html", function () {
            $('.modal-dialog').draggable({ handle: ".modal-header" });
            $("#modCpfDlg").resizable({});
        });
    });
    return {
        showProjectDetails: function (ctrl) {
            if ($('#hidEnc').val().trim() === "") {
                mapUtils.showMessage('danger', "YOU HAVE NOT LOGGED IN", "YOU HAVE NOT LOGGED IN");
                return;
            }
            let rawdata = $('#' + ctrl).val();
            let rowdata = JSON.parse(rawdata);
            $('#projTitle').val(rowdata.properties.proj_name);
            $('#projCode').val(rowdata.properties.proj_code);
            $('#projCategory').val(rowdata.properties.proj_type);
            $('#projTags').val(rowdata.properties.proj_tags);
            $('#hlkProjUrl').attr("href", rowdata.properties.proj_file_url);
            $('#projTags').tagsinput({
                onTagExists: function (item, $tag) {
                    $tag.hide().fadeIn();
                },
                trimValue: true,
                maxTags: 10,
                confirmKeys: [13, 44]
            });
            $('#lblProjectTitle').text("Τίτλος Έργου: " + rowdata.properties.proj_name);

            //Close search dialog
            $('#modSearchResults').dialog('close');

         
            //Show Form
            $('#modProjectsDets').modal('show');
        },
    };
})();