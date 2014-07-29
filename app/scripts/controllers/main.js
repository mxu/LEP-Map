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
      $scope.select = {
        'congress': null,
        'latest': null,
        'state': null,
        'zip': null,
        'name': null,
        'reps': null,
        'rep': null
      };

      $scope.sort = {
        'field': 'repName',
        'reverse': false
      };

      $scope.congressData = {};

      $scope.tourtips = {
        'currentStep': -1,
        'congress': 'Step 1: Select a session of Congress to explore',
        'state': 'Step 2: Search the selected congress by clicking a state on the map...',
        'zip': '... or search the latest congress by zip...',
        'name': '... or search the selected congress by representative name',
        'list': 'Step 3: Browse and compare the list of representatives.  Click a row to view their LES scorecard.  Hover over (?) icons to view an explanation of each term.'
      };

      $scope.tooltips = {
        'representative': 'A Legislative Effectiveness Scorecard identifies for a given member of the House of Representatives in a given Congress her Legislative Effectiveness Score, and within that congress: how many bills that she introduced (BILL), how many of those bills received some sort of Action in Committee (AIC) and/or Action beyond Committee (ABC), how many of those bills passed the House (PASS) and how many of those bills ultimately became Law (LAW).  Moreover, the Legislative Effectiveness Scorecard also identifies, for each bill in each stage of the legislative process, how many bills were Commemorative (C), Substantive (S), or Substantive and Significant (SS).',
        'partyRank': 'The Rank in Party is the numerical ranking of a member of the House of Representative’s Legislative Effectiveness Score in comparison to other members of her political party in a given two-year Congress, where “1” connotes the highest Legislative Effectiveness Score.',
        'benchmark': 'The Benchmark Score for a member of the House of Representatives is the expected Legislative Effectiveness Score for a Representative in a given Congress who is of the same political party, has served the same number of terms in Congress, and has held the same number of Committee and/or Subcommittee Chairmanships as the given member.',
        'les': 'The Legislative Effectiveness Score (LES) is a summary measure that captures how successful each member of the House of Representatives is, in a given two-year Congress, at moving her agenda items, which are coded for their relative substantive significance, through the different steps of the legislative process, which begins with introducing a bill into the House until it (possibly) becomes law.',
        'below': 'A Representative’s Legislative Effectiveness Score is denoted as being “Below Expectations” if the ratio of her Legislative Effectiveness Score to her Benchmark Score is lower than .50.',
        'meets': 'A Representative’s Legislative Effectiveness Score is denoted as “Meets Expectations” if the ratio of her Legislative Effectiveness Score to her Benchmark Score is between .50 and 1.50.',
        'exceeds': 'A Representative’s Legislative Effectiveness Score is denoted as being “Above Expectations” if the ratio of her Legislative Effectiveness Score to her Benchmark Score is greater than 1.50.',
        'c': 'A bill is denoted as “Commemorative (C)” if it the substance of the legislation satisfies one of several criteria deeming it as commemorative or symbolic in purpose, such as the naming and/or renaming of public buildings, the striking of commemorative coins and medals, and related matters.',
        's': 'A bill is denoted as “Substantive (S)” if it is neither Commemorative or Substantive and Significant, according to our coding protocol; or, if it would have been denoted as Commemorative, but it was mentioned in an end-of-the-year write-up in the Congressional Quarterly (CQ) Almanac that corresponds to the relevant Congress.',
        'ss': 'A bill is denoted as “Substantive and Significant (SS)” if the bill is mentioned in an end-of-the-year write-up in the Congressional Quarterly (CQ) Almanac that corresponds to the relevant Congress.',
        'bill': 'Bill tooltip text blah blah blah blah blah',
        'aic': 'Action in Committee text blah blah blah blah blah',
        'abc': 'Action Beyond Committee text blah blah blah blah blah',
        'pass': 'Bills Passed text blah blah blah blah blah',
        'law': 'Bills that become Law text blah blah blah blah blah'
      };

      $scope.setOrder = function(field) {
        if($scope.checkOrder(field)) {
          $scope.sort.reverse = !$scope.sort.reverse;
        } else {
          $scope.sort.field = field;
        }
      };

      $scope.checkOrder = function(field) {
        if($scope.sort.field === field) {
          return true;
        } else if (typeof field === 'object') {
          for(var i = 0; i < field.length; i++) {
            if($scope.sort.field[i] !== field[i]) {
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
            if (!$scope.congressData.hasOwnProperty(row.congress)) {
              $scope.congressData[row.congress] = {
                'states': {},
                'num': congressNum,
                'year': ' (' + row.year + ')'
              };
            }
            console.log($scope.congressData[row.congress]);
            // create an object for each state within the congress
            if (!$scope.congressData[row.congress].states.hasOwnProperty(row.st_name)) {
              $scope.congressData[row.congress].states[row.st_name] = [];
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

            $scope.congressData[row.congress].states[row.st_name].push(newRep);
          }

          // select the most recent congress
          $scope.select.latest = latestCongress.toString();
          $scope.select.congress = $scope.congressData[$scope.select.latest];

          // parse zip data
          for (i = 0; i < zipData.length; i++) {
            var zRow = zipData[i];
            // parse zips
            var zips = zRow.zip.split('-');
            // find the rep for the given state and district
            var stateReps = $scope.select.congress.states[zRow.state];
            for (var j = 0; j < stateReps.length; j++) {
              var rep = stateReps[j];
              if (rep.cd === parseInt(zRow.district, 10)) {
                // map list of zips to rep
                rep.zips = zips;
              }
            }
          }

          // select Washington
          // stateService.prepForBroadcast('CA', null);
        });
      });

      // update scope vars when a state is selected
      $scope.$on('handleBroadcast', function() {
        $scope.select.state = stateService.code;
        $scope.select.zip = stateService.zip;
        if (stateService.code !== null) {
          $scope.select.name = null;
        }
        $scope.selectCongress();
      });

      // performa a new lookup when a new congress is selected
      $scope.switchCongress = function() {
        $scope.select.zip = null;
        if ($scope.select.name !== null && $scope.select.name !== '') {
          $scope.lookupName($scope.select.anem);
        } else {
          $scope.selectCongress();
        }
      };

      // update list of representatives
      $scope.selectCongress = function() {
        $scope.select.reps = null;
        if ($scope.select.state === null) {
          $scope.select.reps = null;
        }
        $scope.select.reps = $scope.select.congress.states[$scope.select.state];
        //$document.scrollToElement(angular.element('#repList'), 50, 300);
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
          return $scope.tooltips.below;
        } else if (str === 'meets expectations') {
          return $scope.tooltips.meets;
        } else if (str === 'exceeds expectations') {
          return $scope.tooltips.exceeds;
        }
        return '???';
      };

      // display model for selected representative
      var repModal = $modal({
        scope: $scope,
        template: 'views/modalContent.html',
        animation: 'am-fade-and-slide-top',
        show: false
      });

      $scope.showRep = function(rep) {
        $scope.select.rep = rep;
        repModal.$promise.then(repModal.show);
      };

      $scope.hideRep = function() {
        repModal.$promise.then(repModal.hide);
      };

      // look up representative within the current congress by name
      $scope.lookupName = function(repName) {
        $scope.select.reps = null;
        var repStrs = repName.toLowerCase().split(' ');
        var results = [];
        // loop through each state of the currently selected congress
        var states = $scope.select.congress.states;
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
        $scope.select.reps = results;
      };

      // look up representative within the latest congress by zip
      $scope.lookupZip = function(zip) {
        $scope.select.reps = null;
        var results = [];
        var inState = null;
        // select the latest congress
        $scope.select.congress = $scope.congressData[$scope.select.latest];
        // loop through each state
        var states = $scope.select.congress.states;
        for (var state in states) {
          // loop through each rep
          var reps = states[state];
          for (var i = 0; i < reps.length; i++) {
            if (!reps[i].hasOwnProperty('zips')) {
              // console.log(state + reps[i].cd + ' has no zips');
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
        $scope.select.reps = results;
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
.controller('FAQCtrl', function($scope) {
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