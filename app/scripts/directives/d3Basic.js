'use strict';

angular.module('lepMapApp.directives')
    .directive('d3Map',
        ['d3Service',
        'topojsonService',
        function(d3Service, topojsonService) {
        return {
            restrict: 'E',
            scope: { },
            link: function(scope, el) {
                d3Service.d3().then(function(d3) {
                    topojsonService.topojson().then(function(topojson) {
                        var width = 800,
                            height = 500;

                        var projection = d3.geo.albersUsa()
                            .scale(800)
                            .translate([width / 2, height / 2]);

                        var path = d3.geo.path()
                            .projection(projection);

                        var svg = d3.select(el[0])
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height);

                        d3.json('data/us.json', function(error, us) {
                            if(error) { return console.error(error); }
                            window.us = us;
                            svg.insert('path', '.graticule')
                                .datum(topojson.feature(us, us.objects.land))
                                .attr('class', 'land')
                                .attr('d', path);

                            svg.insert('path', '.graticule')
                                .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
                                .attr('class', 'state-boundary')
                                .attr('d', path);
                          });
                      });
                  });
              }
          };
      }]);