$(document).ready(function() {
    $(':text').autoGrowInput({minWidth: 20, maxWidth: 1000, comfortZone: 0});

    $('input[type=file]').change(function(evt) {
        $('#' + $(this).attr('target')).attr('src',
                                             URL.createObjectURL(event.target.files[0]));
    });
});
