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
    'stateService',
    'd3Service',
    function($scope, $q, $modal, stateService, d3Service) {
      $scope.selectedState = null;
      $scope.selectedCongress = null;
      $scope.latestCongress = null;
      $scope.repList = null;
      $scope.leData = {};
      $scope.statusMessage = 'Loading data...';

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
            var congressNum = parseInt(row.congress);
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
            var newRep = {
              'id': row.id,
              'congress': row.congress,
              'stName': row.st_name,
              'cd': row.cd,
              'repName': row.thomas_name,
              'party': row['Democrat.'],
              'les': getFloat(row.LES),
              'benchmark': getFloat(row.Benchmark),
              'expect': row['Expectations.'],
              'totalInParty': row['Total.in.Party'],
              'lesInParty': row['LES.Rank.In.Party'],
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
              if (rep.cd === zRow.district) {
                // map list of zips to rep
                rep.zips = zips;
              }
            }
          }

          // select Washington
          stateService.prepForBroadcast('WA', null);
        });
      });

      // update scope vars when a state is selected
      $scope.$on('handleBroadcast', function() {
        $scope.selectedState = stateService.code;
        $scope.zip = stateService.zip;
        if (stateService.code != null) {
          $scope.repName = null;
        }
        $scope.selectCongress();
      });

      // performa a new lookup when a new congress is selected
      $scope.switchCongress = function() {
        $scope.zip = null;
        if ($scope.repName != null) {
          $scope.lookupName($scope.repName);
        } else {
          $scope.selectCongress();
        }
      };

      // update list of representatives
      $scope.selectCongress = function() {
        if ($scope.selectedState == null) {
          $scope.repList = null;
        }
        $scope.repList = $scope.selectedCongress.states[$scope.selectedState];
      };

      // return glyph name based on expectation status
      $scope.expectGlyph = function(str) {
        str = str.toLowerCase();
        if (str == 'below expectations') {
          return 'remove-circle';
        } else if (str == 'meets expectations') {
          return 'record';
        } else if (str == 'exceeds expectations') {
          return 'ok-circle';
        }
        return 'question-sign';
      };

      // return text style based on expectation status
      $scope.expectText = function(str) {
        str = str.toLowerCase();
        if (str == 'below expectations') {
          return 'danger';
        } else if (str == 'meets expectations') {
          return 'info';
        } else if (str == 'exceeds expectations') {
          return 'success';
        }
        return 'muted';
      };

      // display model for selected representative
      $scope.showRep = function(rep) {
        $modal.open({
          templateUrl: 'views/modalContent.html',
          controller: 'RepModalCtrl',
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
        var results = [];
        // loop through each state of the currently selected congress
        var states = $scope.selectedCongress.states;
        for (var state in states) {
          var reps = states[state];
          // loop through each representative within the current state
          for (var i = 0; i < reps.length; i++) {
            if (reps[i].repName.toLowerCase().indexOf(repName.toLowerCase()) > -1) {
              // add reps whose name contains the search string
              results.push(reps[i]);
            }
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
            var zips = reps[i].zips;
            if (zips == null) {
              // console.log(state + reps[i].cd + ' has no zips');
              continue;
            }
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
    }
  ]);

angular.module('lepMapApp')
  .controller('RepModalCtrl', function($scope, $modalInstance, rep, expectText, expectGlyph) {
    $scope.rep = rep;
    $scope.expectText = expectText;
    $scope.expectGlyph = expectGlyph;
  });