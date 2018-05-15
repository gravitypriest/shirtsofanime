$(document).ready(function() {
    'use strict';
    var shirt_id = location.pathname.split('/admin/')[1];
    $.get('/api/shirts/' + shirt_id)
    .then(function(result) {
        Object.keys(result).forEach(function(key) {
            if (key === 'filename') {
                $('#image').attr('src', 'images/' + result[key]);
                $('#image').css('max-width', '100%');
                $('#image').css('max-height', '500px');
            } else {
                var id = '#' + key;
                if (result[key]) {              
                    $(id).text(result[key]);
                } else {
                    $(id).hide();
                }
            }
        });
        $('#edit-origin-box').val(result.origin);
    })
    .catch(function() {
        $('#image').remove();
        $('#content').prepend('<h1 class="fourohfour">404</h1>');
        $('#origin').text('Shirt not found');
    });

    $('#publish').click(function(event) {
        var query = '';
        if ($('#edit-origin-box').val() !== $('#origin').text()) {
            query = '?modify=' + encodeURIComponent($('#edit-origin-box').val());
        }
        $.ajax({
            url: '/api/shirts/' + shirt_id + '/publish' + query,
            type: 'PUT',
            success: function() {
                alert('Published successfully.');
                location.pathname = '/admin';
            },
            error: function() {
                alert('There was an error. Try again later.');
            }
        });
    });

    $('#delete').click(function(event) {
        $.ajax({
            url: '/api/shirts/' + shirt_id + '/delete', 
            type: 'DELETE',
            success: function() {
                alert('Deleted successfully.');
                location.pathname = '/admin';
            },
            error: function() {
                alert('There was an error. Try again later.');
            }
        });
    });

    $('#edit-origin').click(function() {
        $('#origin').hide();
        $('#edit-origin').hide();
        $('#edit-origin-box').show();
    });
});
