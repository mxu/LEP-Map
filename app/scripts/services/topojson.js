'use strict';

angular
    .module('topojson', [])
    .factory('topojsonService', ['$document', '$q', '$rootScope',
        function($document, $q, $rootScope) {
            var d = $q.defer();
            function onScriptLoad() {
                // load client in the browser
                $rootScope.$apply(function() { d.resolve(window.topojson); });
              }
            // create a script tag with d3 as the source
            // and call onScriptLoad callback when it loads
            var scriptTag = $document[0].createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.async = true;
            scriptTag.src = 'scripts/topojson.v1.min.js';
            scriptTag.onreadystatechange = function() {
                if(this.readyState === 'complete') { onScriptLoad(); }
              };
            scriptTag.onload = onScriptLoad;

            var s = $document[0].getElementsByTagName('body')[0];
            s.appendChild(scriptTag);

            return {
                topojson: function() { return d.promise; }
              };
          }]);