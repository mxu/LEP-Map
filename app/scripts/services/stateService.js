'use strict';

angular
    .module('lepMapApp.services', [])
    .factory('stateService', ['$rootScope', function($rootScope) {
        var stateService = {
            code: '',
            zip: ''
          };

        stateService.prepForBroadcast = function(code, zip) {
            this.code = code;
            this.zip = zip;
            this.broadcastItem();
          };

        stateService.broadcastItem = function() {
            $rootScope.$broadcast('handleBroadcast');
          };

        return stateService;
      }]);