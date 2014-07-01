'use strict';

angular
    .module('lepMapApp.services', [])
    .factory('stateService', function($rootScope) {
        var stateService = {
            name: '',
            code: ''
          };

        stateService.prepForBroadcast = function(name, code) {
            this.name = name;
            this.code = code;
            this.broadcastItem();
          };

        stateService.broadcastItem = function() {
            $rootScope.$broadcast('handleBroadcast');
          };

        return stateService;
      });