'use strict';

/**
 * @ngdoc function
 * @name lepMapApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the lepMapApp
 */
angular.module('lepMapApp')
  .controller('MainCtrl', [
    '$scope',
    '$q',
    '$modal',
    '$document',
    'stateService',
    'd3Service',
    function($scope, $q, $modal, $document, stateService, d3Service) {
      $scope.selectedState = null;
      $scope.selectedCongress = null;
      $scope.latestCongress = null;
      $scope.repList = null;
      $scope.leData = {};
      $scope.orderByField = 'repName';
      $scope.reverseSort = false;
      $scope.statusMessage = 'Loading data...';
      $scope.currentStep = 0;

      $scope.setOrder = function(field) {
        if($scope.checkOrder(field)) {
          $scope.reverseSort = !$scope.reverseSort;
        } else {
          $scope.orderByField = field;
        }
      };

      $scope.checkOrder = function(field) {
        if($scope.orderByField === field) {
          return true;
        } else if (typeof field === 'object') {
          for(var i = 0; i < field.length; i++) {
            if($scope.orderByField[i] !== field[i]) {
              return false;
            }
          }
          return true;
        }
        return false;
      };

      // wait for D3 to load
      d3Service.d3().then(function(d3) {
        // return a promise for loading external data
        var getData = function(url) {
          var d = $q.defer();
          d3.csv(url, function(data) {
            d.resolve(data);
          });
          return d.promise;
        };
        // parse a string into a float, or return 0 if NaN
        var getFloat = function(str) {
          var n = parseFloat(str);
          if (isNaN(n)) {
            return 0;
          }
          return n;
        };

        $q.all([
          getData('data/congress.csv'), // load congress data
          getData('data/zip.csv') // load zip code data
        ]).then(function(data) {
          var congressData = data[0];
          var zipData = data[1];

          var latestCongress = 0;

          $scope.statusMessage = 'Data loaded';
          // parse the congress data
          for (var i = 0; i < congressData.length; i++) {
            var row = congressData[i];
            // update most recent congress number
            var congressNum = parseInt(row.congress, 10);
            if (congressNum < 100) {
              row.congress = '0' + row.congress;
            }
            if (congressNum > latestCongress) {
              latestCongress = congressNum;
            }
            // create an object for each congress
            if (!$scope.leData.hasOwnProperty(row.congress)) {
              $scope.leData[row.congress] = {
                'states': {},
                'year': ' (' + row.year + ')'
              };
            }
            // create an object for each state within the congress
            if (!$scope.leData[row.congress].states.hasOwnProperty(row.st_name)) {
              $scope.leData[row.congress].states[row.st_name] = [];
            }
            // copy all the row data into a new representative object within the state
            /*jshing camelcase: false */
            var newRep = {
              'id': row.id,
              'congress': row.congress,
              'stName': row.st_name,
              'cd': getFloat(row.cd),
              'repName': row.thomas_name,
              'party': row['Democrat.'],
              'les': getFloat(row.LES),
              'benchmark': getFloat(row.Benchmark),
              'expect': row['Expectations.'],
              'totalInParty': getFloat(row['Total.in.Party']),
              'partyRank': getFloat(row['LES.Rank.In.Party']),
              'icpsr': row.icpsr,
              // substantive and significant
              'ssPass': row.ss_pass,
              'ssLaw': row.ss_law,
              'ssBills': row.ss_bills,
              'ssAic': row.ss_aic,
              'ssAbc': row.ss_abc,
              // substantive
              'sPass': row.s_pass,
              'sLaw': row.s_law,
              'sBills': row.s_bills,
              'sAic': row.s_aic,
              'sAbc': row.s_abc,
              // commemorative
              'cPass': row.c_pass,
              'cLaw': row.c_law,
              'cBills': row.c_bills,
              'cAic': row.c_aic,
              'cAbc': row.c_abc
            };

            $scope.leData[row.congress].states[row.st_name].push(newRep);
          }

          // select the most recent congress
          $scope.latestCongress = latestCongress.toString();
          $scope.selectedCongress = $scope.leData[$scope.latestCongress];

          // parse zip data
          for (i = 0; i < zipData.length; i++) {
            var zRow = zipData[i];
            // parse zips
            var zips = zRow.zip.split('-');
            // find the rep for the given state and district
            var stateReps = $scope.selectedCongress.states[zRow.state];
            for (var j = 0; j < stateReps.length; j++) {
              var rep = stateReps[j];
              if (rep.cd === parseInt(zRow.district, 10)) {
                // map list of zips to rep
                rep.zips = zips;
              }
            }
          }

          // select Washington
          stateService.prepForBroadcast('CA', null);
        });
      });

      // update scope vars when a state is selected
      $scope.$on('handleBroadcast', function() {
        $scope.selectedState = stateService.code;
        $scope.zip = stateService.zip;
        if (stateService.code !== null) {
          $scope.repName = null;
        }
        $scope.selectCongress();
      });

      // performa a new lookup when a new congress is selected
      $scope.switchCongress = function() {
        console.log($scope.selectedCongress);
        $scope.zip = null;
        if ($scope.repName !== null) {
          $scope.lookupName($scope.repName);
        } else {
          $scope.selectCongress();
        }
      };

      // update list of representatives
      $scope.selectCongress = function() {
        if ($scope.selectedState === null) {
          $scope.repList = null;
        }
        $scope.repList = $scope.selectedCongress.states[$scope.selectedState];
      };

      // return glyph name based on expectation status
      $scope.expectGlyph = function(str) {
        str = str.toLowerCase();
        if (str === 'below expectations') {
          return 'remove-sign';
        } else if (str === 'meets expectations') {
          return 'ok-sign';
        } else if (str === 'exceeds expectations') {
          return 'plus-sign';
        }
        return 'question-sign';
      };

      // return text style based on expectation status
      $scope.expectText = function(str) {
        str = str.toLowerCase();
        if (str === 'below expectations') {
          return 'danger';
        } else if (str === 'meets expectations') {
          return 'info';
        } else if (str === 'exceeds expectations') {
          return 'success';
        }
        return 'muted';
      };

      // return tooltip text based on expectation status
      $scope.expectTooltip = function(str) {
        str = str.toLowerCase();
        if (str === 'below expectations') {
          return 'A Representative’s Legislative Effectiveness Score is denoted as being “Below Expectations” if the ratio of her Legislative Effectiveness Score to her Benchmark Score is lower than .50.';
        } else if (str === 'meets expectations') {
          return 'A Representative’s Legislative Effectiveness Score is denoted as “Meets Expectations” if the ratio of her Legislative Effectiveness Score to her Benchmark Score is between .50 and 1.50.';
        } else if (str === 'exceeds expectations') {
          return 'A Representative’s Legislative Effectiveness Score is denoted as being “bove Expectations” if the ration of her Legislative Effectiveness Score to her Benchmark Score is greater than 1.50.';
        }
        return '???';
      };

      // display model for selected representative
      $scope.showRep = function(rep) {
        $modal.open({
          templateUrl: 'views/modalContent.html',
          controller: 'RepModalCtrl',
          size: '',
          resolve: {
            rep: function() {
              return rep;
            },
            expectText: function() {
              return $scope.expectText(rep.expect);
            },
            expectGlyph: function() {
              return $scope.expectGlyph(rep.expect);
            }
          }
        });
      };

      // look up representative within the current congress by name
      $scope.lookupName = function(repName) {
        var repStrs = repName.toLowerCase().split(' ');
        var results = [];
        // loop through each state of the currently selected congress
        var states = $scope.selectedCongress.states;
        for (var state in states) {
          var reps = states[state];
          // loop through each representative within the current state
          for (var i = 0; i < reps.length; i++) {
            var matches = true;
            for (var j = 0; j < repStrs.length; j++) {
              var repStr = repStrs[j];
              if (reps[i].repName.toLowerCase().indexOf(repStr) === -1) {
                matches = false;
              }
            }
            // add reps whose name matches all search strings
            if(matches) { results.push(reps[i]); }
          }
        }
        // deselect state and zip
        stateService.prepForBroadcast(null, null);
        // display list of matching reps
        $scope.repList = results;
      };

      // look up representative within the latest congress by zip
      $scope.lookupZip = function(zip) {
        var results = [];
        var inState = null;
        // select the latest congress
        $scope.selectedCongress = $scope.leData[$scope.latestCongress];
        // loop through each state
        var states = $scope.selectedCongress.states;
        for (var state in states) {
          // loop through each rep
          var reps = states[state];
          for (var i = 0; i < reps.length; i++) {
            if (!reps[i].hasOwnProperty('zips')) {
              console.log(state + reps[i].cd + ' has no zips');
              continue;
            }
            var zips = reps[i].zips;
            // loop through zips associate with the rep
            for (var j = 0; j < zips.length; j++) {
              if (zips[j] === zip) {
                // add reps that match the zip
                results.push(reps[i]);
                // mark the current state
                inState = state;
              }
            }
          }
        }
        // select the correct state and zip
        stateService.prepForBroadcast(inState, zip);
        // display list of matching reps
        $scope.repList = results;
      };

      // scroll back to the top when tour is complete
      $scope.tourComplete = function() {
        $document.scrollTo(0, 0, 300);
      };

      
    }
  ]);

angular.module('lepMapApp')
  .controller('SplashCtrl', function($scope) {
    $scope.data = '';
  });

angular.module('lepMapApp')
  .controller('AboutCtrl', function($scope) {
    $scope.data = '';
  });

angular.module('lepMapApp')
.controller('BookCtrl', function($scope) {
  $scope.data = '';
});

angular.module('lepMapApp')
.controller('MethodCtrl', function($scope) {
  $scope.data = '';
});

angular.module('lepMapApp')
.controller('ResearchCtrl', function($scope) {
  $scope.data = '';
});

angular.module('lepMapApp')
.controller('DownloadsCtrl', function($scope) {
  $scope.data = '';
});

angular.module('lepMapApp')
.controller('MediaCtrl', function($scope) {
  $scope.data = '';
});

angular.module('lepMapApp')
  .controller('RepModalCtrl', function($scope, $modalInstance, rep, expectText, expectGlyph) {
    $scope.rep = rep;
    $scope.expectText = expectText;
    $scope.expectGlyph = expectGlyph;

    $scope.close = function() {
      $modalInstance.dismiss();
    };
  });