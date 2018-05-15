$(document).ready(function() {
    'use strict';
    $.ajax({
        url: '/api/shirts/',
        type: 'GET'
    })
    .then(function(result) {
        var top = $('#list');
        Object.keys(result).sort().forEach(function(key) {
            var series = document.createElement('div');
            var title = document.createElement('h3');
            
            series.className = 'series-block';
            series.append(title);
            series.append(document.createElement('hr'));

            title.innerHTML = key;
            top.append(series);

            result[key].forEach(function(obj) {
                var link = document.createElement('a');
                link.href = '/shirt/' + obj.id;
                var shirtThumb = document.createElement('img');
                shirtThumb.src = 'images/' + obj.id + '_thumb.jpg';
                shirtThumb.className = 'shirt-thumbnail';
                link.append(shirtThumb);
                series.append(link);
            });
        });
    });
});
