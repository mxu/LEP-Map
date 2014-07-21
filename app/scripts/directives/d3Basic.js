'use strict';

angular.module('lepMapApp.directives')
    .directive('d3Map',
        ['d3Service',
        'topojsonService',
        'stateService',
        function(d3Service, topojsonService, stateService) {
        return {
            restrict: 'E',
            template: '<div class="center-block d3-map"></div>',
            replace: true,
            link: function(scope, el) {
                d3Service.d3().then(function(d3) {
                    topojsonService.topojson().then(function(topojson) {
                        var width = 800,
                            height = 500;

                        var projection = d3.geo.albersUsa()
                            .scale(1000)
                            .translate([width / 2, height / 2]);

                        var path = d3.geo.path()
                            .projection(projection);

                        var svg = d3.select(el[0])
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height);

                        scope.$on('handleBroadcast', function() {
                          // deselect the previously selected state                                  
                          d3.select('.statesActive')
                            .attr('class', 'states');
                          // highlight the selected state
                          d3.select('#state_' + stateService.code)
                            .attr('class', 'statesActive');
                        });

                        d3.json('data/us-states.json', function(error, us) {
                            if(error) { return console.error(error); }

                            svg.append('defs').append('path')
                                .attr('id', 'land')
                                .datum(topojson.feature(us, us.objects.land))
                                .attr('d', path);

                            svg.append('clipPath')
                                .attr('id', 'clip-land')
                              .append('use')
                                .attr('xlink:href', '#land');

                            svg.append('g')
                                .attr('clip-path', 'url(#clip-land)')
                              .selectAll('path')
                                .data(topojson.feature(us, us.objects.states).features)
                              .enter().append('path')
                                .attr('id', function(d) { return 'state_' + d.properties.code; })
                                .attr('class', 'states')
                                .attr('d', path)
                                .on('click', function(d) {
                                    scope.$apply(stateService.prepForBroadcast(d.properties.code, null));
                                  })
                              .append('title')
                                .text(function(d) { return d.properties.name; });

                            svg.append('path')
                                .attr('class', 'state-boundaries')
                                .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
                                .attr('d', path);
                          });
                      });
                  });
              }
          };
      }]);

angular.module('lepMapApp.directives')
  .directive('winResize',
    function($window) {
      return function($scope) {
        $scope.setWindowSize = function() {
          $scope.windowHeight = $window.innerHeight;
          $scope.windowWidth = $window.innerWidth;
        };

        angular.element($window).bind('resize', function() {
          $scope.setWindowSize();
          $scope.$apply();
        });

        $scope.setWindowSize();
      };
    });