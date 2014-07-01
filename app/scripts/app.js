'use strict';

/**
 * @ngdoc overview
 * @name lepMapApp
 * @description
 * # lepMapApp
 *
 * Main module of the application.
 */
angular
  .module('lepMapApp', [
    'lepMapApp.directives',
    'lepMapApp.services',
    'ngRoute'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

angular.module('d3', []);
angular.module('topojson', []);
angular.module('lepMapApp.services', []);
angular.module('lepMapApp.directives', ['d3', 'topojson', 'lepMapApp.services']);