'use strict';

/**
* @ngdoc function
* @name lepMapApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the lepMapApp
*/
angular.module('lepMapApp')
.controller('MainCtrl', function ($scope, stateService) {
    
    $scope.selectedState = 'None';

    $scope.$on('handleBroadcast', function() {
        $scope.selectedState = stateService.name + ' (' + stateService.code + ')';
        $scope.$apply();
      });
  });