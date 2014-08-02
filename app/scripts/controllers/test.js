(function() {
    'use strict';

    function TestCtrl() {
        this.someStr = 'this is some string';
        this.someObject = {
            a: 'first property',
            b: 'second property',
            c: 'third property'
        };

        this.doSomething = function() {
            var temp = this.someObject.a;
            this.someObject.a = this.someObject.b;
            this.someObject.b = temp;
            console.log('someObject properties swapped');
        };
    }

    angular.module('lepMapApp')
        .controller('TestCtrl', [
            '$scope',
            TestCtrl
        ]);
})();