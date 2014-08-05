(function() {
    'use strict';

    function TestCtrl() {
        this.tourstep = -1;
        this.someStr = 'this is some string';
        this.someObject = {
            a: 'first property',
            b: 'second property',
            c: 'third property'
        };
        this.someArray = [
            'one',
            'two',
            'three',
            'four',
            'five'
        ];
        this.anotherArray = [
            '1',
            '2',
            '3',
            '4',
            '5'
        ];
        this.theArray = this.someArray;

        this.doSomething = function() {
            if(this.theArray === this.someArray) { this.theArray = this.anotherArray; }
            else { this.theArray = this.someArray; }
            console.log('arrays swapped');
        };
    }

    angular.module('lepMapApp')
        .controller('TestCtrl', [
            '$scope',
            TestCtrl
        ]);
})();