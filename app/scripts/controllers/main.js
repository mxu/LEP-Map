'use strict';

/**
 * @ngdoc function
 * @name lepMapApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the lepMapApp
 */
angular.module('lepMapApp')
    .controller('MainCtrl', ['$scope', 'stateService', 'd3Service',
        function($scope, stateService, d3Service) {
            $scope.selectedState = 'None';
            $scope.selectedCongress = '';
            $scope.repList = null;
            $scope.leData = {};
            $scope.statusMessage = 'Loading data...';

            d3Service.d3().then(function(d3) {
                d3.csv('data/congress.csv', function(rows) {
                    $scope.$apply(function() {
                        $scope.statusMessage = 'Data loaded';

                        for (var i = 0; i < rows.length; i++) {
                            var row = rows[i];
                            if (parseInt(row.congress) < 100) {
                                row.congress = '0' + row.congress;
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
                                'thomasName': row.thomas_name,
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
                                'totalInParty': row['Total in Party'],
                                'lesInParty': row['LES Rank In Party'],
                                'les': row.LES,
                                'expectations': row['Expectations?'],
                                'democrat': row['Democrat?'],
                                'benchmark': row.Benchmark
                            };

                            $scope.leData[row.congress].states[row.st_name].push(member);
                        }

                        $scope.selectedCongress = $scope.leData['110'];
                    });
                });
            });

            $scope.$on('handleBroadcast', function() {
                $scope.$apply(function() {
                    $scope.selectedState = stateService.code;
                    $scope.selectCongress();
                });
            });

            $scope.selectCongress = function() {
                if ($scope.selectedState === null) {
                    return;
                }
                $scope.repList = $scope.selectedCongress.states[$scope.selectedState];
            };
        }
    ]);