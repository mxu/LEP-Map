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
    'ui.bootstrap',
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
      .when('/book', {
        templateUrl: 'views/book.html',
        controller: 'BookCtrl'
      })
      .when('/method', {
        templateUrl: 'views/method.html',
        controller: 'MethodCtrl'
      })
      .when('/research', {
        templateUrl: 'views/research.html',
        controller: 'ResearchCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

angular.module('d3', []);
angular.module('topojson', []);
angular.module('lepMapApp.services', []);
angular.module('lepMapApp.directives', ['d3', 'topojson', 'lepMapApp.services']);