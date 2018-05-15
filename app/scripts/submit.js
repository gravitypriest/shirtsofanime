$(document).ready(function() {
    'use strict';
    $('#upload').submit(function(event) {
        event.preventDefault();
        var formdata = new FormData(this);
        $.ajax({
            url: '/api/shirts/', 
            data: formdata,
            type: 'POST',
            contentType: false,
            processData: false,
            success: function() {
                alert('Submitted successfully.');
                $('#upload')[0].reset();
            },
            error: function() {
                alert('There was an error. Try again later.');
            }
        });
    });
});