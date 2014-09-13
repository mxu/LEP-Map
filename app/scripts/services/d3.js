'use strict';

angular
    .module('d3', [])
    .factory('d3Service', ['$document', '$q', '$rootScope',
        function($document, $q, $rootScope) {
            var d = $q.defer();
            function onScriptLoad() {
                // load client in the browser
                $rootScope.$apply(function() { d.resolve(window.d3); });
              }
            // create a script tag with d3 as the source
            // and call onScriptLoad callback when it loads
            var scriptTag = $document[0].createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.async = true;
            scriptTag.src = 'scripts/d3.v3.min.js';
            scriptTag.onreadystatechange = function() {
                if(this.readyState === 'complete') { onScriptLoad(); }
              };
            scriptTag.onload = onScriptLoad;

            var s = $document[0].getElementsByTagName('body')[0];
            s.appendChild(scriptTag);

            return {
                d3: function() { return d.promise; }
              };
          }]);