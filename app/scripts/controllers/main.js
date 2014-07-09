'use strict';

/**
 * @ngdoc function
 * @name lepMapApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the lepMapApp
 */
angular.module('lepMapApp')
  .controller('MainCtrl', ['$scope', '$q', '$modal', 'stateService', 'd3Service',
    function($scope, $q, $modal, stateService, d3Service) {
      $scope.selectedState = null;
      $scope.selectedCongress = null;
      $scope.latestCongress = null;
      $scope.repList = null;
      $scope.leData = {};
      $scope.statusMessage = 'Loading data...';

      d3Service.d3().then(function(d3) {

        function getData(url) {
          var d = $q.defer();

          d3.csv(url, function(data) {
            d.resolve(data);
          });

          return d.promise;
        }

        $q.all([
          getData('data/congress.csv'),
          getData('data/zip.csv')
        ]).then(function(data) {
          var congressData = data[0];
          var zipData = data[1];
          var latestCongress = 0;

          window.allData = $scope.leData;

          $scope.statusMessage = 'Data loaded';

          for (var i = 0; i < congressData.length; i++) {
            var row = congressData[i];

            var congressNum = parseInt(row.congress);
            if (congressNum < 100) {
              row.congress = '0' + row.congress;
            }
            if (congressNum > latestCongress) {
              latestCongress = congressNum;
            }
            if (!$scope.leData.hasOwnProperty(row.congress)) {
              $scope.leData[row.congress] = {
                'states': {},
                'year': ' (' + row.year + ')'
              };
            }

            if (!$scope.leData[row.congress].states.hasOwnProperty(row.st_name)) {
              $scope.leData[row.congress].states[row.st_name] = [];
            }

            var member = {
              'repName': row.thomas_name,
              'congress': row.congress,
              'ssPass': row.ss_pass,
              'ssLaw': row.ss_law,
              'ssBills': row.ss_bills,
              'ssAic': row.ss_aic,
              'ssAbc': row.ss_abc,
              'sPass': row.s_pass,
              'sLaw': row.s_law,
              'sBills': row.s_bills,
              'sAic': row.s_aic,
              'sAbc': row.s_abc,
              'id': row.id,
              'icpsr': row.icpsr,
              'cd': row.cd,
              'cPass': row.c_pass,
              'cLaw': row.c_law,
              'cBills': row.c_bills,
              'cAic': row.c_aic,
              'cAbc': row.c_abc,
              'stName': row.st_name,
              'totalInParty': row['Total.in.Party'],
              'lesInParty': row['LES.Rank.In.Party'],
              'les': row.LES,
              'expect': row['Expectations.'],
              'party': row['Democrat.'],
              'benchmark': row.Benchmark
            };

            $scope.leData[row.congress].states[row.st_name].push(member);
          }
          
          $scope.latestCongress = latestCongress.toString();
          $scope.selectedCongress = $scope.leData[$scope.latestCongress];

          // loop through each row of zip data
          for (i = 0; i < zipData.length; i++) {
            var zRow = zipData[i];
            // parse zips
            var zips = zRow.zip.split('-');
            // find the rep for the given state and district
            var stateReps = $scope.selectedCongress.states[zRow.state];
            for (var j = 0; j < stateReps.length; j++) {
              var rep = stateReps[j];
              if(rep.cd === zRow.district) {
                // map list of zips to rep
                rep.zips = zips;
              }
            }
          }

        });
      });

      $scope.$on('handleBroadcast', function() {
        $scope.selectedState = stateService.code;
        $scope.zip = stateService.zip;
        $scope.selectCongress();
      });

      $scope.switchCongress = function() {
        $scope.zip = null;
        $scope.selectCongress();
      };

      $scope.selectCongress = function() {
        if ($scope.selectedState === null) {
          return;
        }
        // $scope.zip = null;
        $scope.repList = $scope.selectedCongress.states[$scope.selectedState];
      };

      $scope.expectGlyph = function(str) {
        str = str.toLowerCase();
        if(str == 'below expectations') {
          return 'circle-arrow-down';
        } else if(str == 'meets expectations') {
          return 'minus-sign';
        } else if(str == 'exceeds expectations') {
          return 'circle-arrow-up';
        }
        return 'question-sign';
      };

      $scope.expectText = function(str) {
        str = str.toLowerCase();
        if(str == 'below expectations') {
          return 'danger';
        } else if(str == 'meets expectations') {
          return 'info';
        } else if(str == 'exceeds expectations') {
          return 'success';
        }
        return 'muted';
      };

      $scope.showRep = function(rep) {
        $modal.open({
          templateUrl: 'views/modalContent.html',
          controller: 'RepModalCtrl',
          resolve: {
            rep: function() { return rep; },
            expectText: function() { return $scope.expectText(rep.expect); },
            expectGlyph: function() { return $scope.expectGlyph(rep.expect); }
          }
        });
      };

      $scope.lookupName = function(repName) {
        var results = [];

        var states = $scope.selectedCongress.states;
        for(var state in states) {
          if(!states.hasOwnProperty(state)) { continue; }
          var reps = states[state];
          for(var i = 0; i < reps.length; i++) {
            if(reps[i].repName.toLowerCase().indexOf(repName.toLowerCase()) > -1) {
              results.push(reps[i]);
            }
          }
        }

        stateService.prepForBroadcast(null, null);
        $scope.repList = results;
      }

      $scope.lookupZip = function(zip) {
        var results = [];
        var inState = null;
        $scope.selectedCongress = $scope.leData[$scope.latestCongress];
        
        var states = $scope.selectedCongress.states;
        for(var state in states){
          if(!states.hasOwnProperty(state)) { continue; }
          var reps = states[state];
          for(var i = 0; i < reps.length; i++) {
            var zips = reps[i].zips;
            if(zips == null) {
              // console.log(state + reps[i].cd + ' has no zips');
              continue;
            }
            for(var j = 0; j < zips.length; j++) {
              if(zips[j] === zip) {
                results.push(reps[i]);
                inState = state;
              }
            }
          }
        }

        stateService.prepForBroadcast(inState, zip);
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