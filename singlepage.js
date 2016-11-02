function commitNewText(element) {
    if (element.val() == '') {
        element.val(element.attr('default'));
        element.autoGrowInput({minWidth: 20, maxWidth: 1000, comfortZone: 0});
    }
}

$(document).ready(function() {
    $(':text').autoGrowInput({minWidth: 20, maxWidth: 1000, comfortZone: 0});

    $('input[type=file]').change(function(evt) {
        $('#' + $(this).attr('target')).attr('src',
                                             URL.createObjectURL(evt.target.files[0]));
    });

    $(':text').keypress(function(evt) {
        if (evt.which == 13) commitNewText($(this));  // Enter
    }).focusout(function() {
        commitNewText($(this));
    });
});
