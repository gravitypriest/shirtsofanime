$(document).ready(function() {
    'use strict';
    var shirt_id;
    if (location.pathname === '/'||
        location.pathname === '/random' ||
        location.pathname === '/random/') {
        shirt_id = 'random';
    } else {
        shirt_id = location.pathname.split('/shirt/')[1];
    }
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
    })
    .catch(function() {
        $('#image').remove();
        $('#content').prepend('<h1 class="fourohfour">404</h1>');
        $('#origin').text('Shirt not found');
    });
});