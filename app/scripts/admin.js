$(document).ready(function() {
    'use strict';
    $('#nav').load('nav.html');
    $('#byline').load('byline.html');
    $.ajax({
        url: '/api/shirts/unpublished',
        type: 'GET'
    })
    .then(function(result) {
        if (Object.keys(result).length === 0){
            var none = document.createElement('h3');
            none.innerHTML = 'Nothing to see here!';
            $('#list').append(none);
            return;
        }
        Object.keys(result).sort().forEach(function(key) {
            var series = document.createElement('div');
            var title = document.createElement('h3');
            
            series.className = 'series-block';
            series.append(title);
            series.append(document.createElement('hr'));

            title.innerHTML = key;
            $('#list').append(series);

            result[key].forEach(function(obj) {
                var link = document.createElement('a');
                link.href = '/admin/' + obj.id;
                var shirtThumb = document.createElement('img');
                shirtThumb.src = 'images/' + obj.id + '_thumb.jpg';
                shirtThumb.className = 'shirt-thumbnail';
                link.append(shirtThumb);
                series.append(link);
            });
        });
    });
});
