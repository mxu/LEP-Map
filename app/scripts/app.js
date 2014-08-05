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
    'ngAnimate',
    'ngRoute',
    'duScroll',
    'mgcrea.ngStrap.helpers.dimensions',
    'mgcrea.ngStrap.affix',
    'mgcrea.ngStrap.tooltip',
    'mgcrea.ngStrap.modal',
    'angular-tour',
    'lepMapApp.directives',
    'lepMapApp.services'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/splash.html',
        controller: 'SplashCtrl'
      })
      .when('/find', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
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
      .when('/faq', {
        templateUrl: 'views/faq.html',
        controller: 'FAQCtrl'
      })
      .when('/research', {
        templateUrl: 'views/research.html',
        controller: 'ResearchCtrl'
      })
      .when('/downloads', {
        templateUrl: 'views/downloads.html',
        controller: 'DownloadsCtrl'
      })
      .when('/media', {
        templateUrl: 'views/media.html',
        controller: 'MediaCtrl'
      })
      .when('/test', {
        templateUrl: 'views/test.html',
        controller: 'TestCtrl',
        controllerAs: 'test'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

angular.module('d3', []);
angular.module('topojson', []);
angular.module('lepMapApp.services', []);
angular.module('lepMapApp.directives', ['d3', 'topojson', 'lepMapApp.services']);