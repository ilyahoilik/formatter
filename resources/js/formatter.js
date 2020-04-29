/**
 * Schedule Formatter <https://github.com/ilyahoilik/formatter>
 * Simple module allowing us to paste raw schedule and receive formatted result.
 * 
 * Copyright Ilya Hoilik <https://ilyahoilik.com>
 * Released under MIT license <https://mit-license.org>
 */
;(function() {
    'use strict';

    /** Module dependencies. */
    var _ = require('lodash');
    
    // /** Include parsers. */
    // var parsers = [
    //     require('lodash'),
    //     require('lodash'),
    //     require('lodash'),
    // ];

    /** Used as reference to input field with raw schedule. */
    var input = document.getElementById('input');

    /** Used as reference to output block with formatted schedule. */
    var output = document.getElementById('output');

    /** Used as schedule block template. */
    var template = _.template(document.getElementById('section').innerHTML);

    /** Used to handle schedule change. */
    input.oninput = function (e) {
        e.preventDefault();

        var sections = parseSchedule(input.value);

        var schedule = _.map(sections, function (schedule, title) {
            return template({
                title: /[A-Za-zА-Яа-я]/.test(title) ? title : null,
                schedule: schedule.join(', ')
            });
        });

        output.innerHTML = schedule.join('');
    };

    /**
     * Determines schedule format and returns parsed schedule as array.
     * 
     * @param {string} data
     * @returns {array}
     */
    function parseSchedule(data) {

        var sections = {};

        /** Used to compare raw schedule with regular expression. */
        function matchWithRegexp(regexp) {
            var exploded = [...data.matchAll(regexp)];

            return (exploded && exploded.length);
        }

        /** Used to concat hours and minutes and push them into object. */
        function pushToSection(sectionId, hourOrSchedule, minutes) {
            if (!['string', 'object'].includes(typeof hourOrSchedule)) {
                console.warn('Invalid {hourOrSchedule} argument.');
            }

            if (minutes && (typeof minutes != 'object' || !minutes.length)) {
                console.warn('Invalid {minutes} argument.');
            }

            if (typeof hourOrSchedule != 'object' && minutes) {
                var minutes = _.map(minutes, function (minute) {
                    return hourOrSchedule + ':' + minute;
                });

                sections[sectionId] = sectionId in sections ? sections[sectionId] : [];
                sections[sectionId].push(...minutes);
            }
        }

        /** Like Organizator Perevozok */
        if (matchWithRegexp(/^(\d{2}):	([\d{2}, 	]+)$/gm)) {
            console.log('Organizator Perevozok');

            /** Iterate through each row. */
            [...data.matchAll(/^(\d{2}):	([\d{2}, 	]+)$/gm)].forEach(function (section) {
                var hour = section[1];

                section[2].split('	').forEach(function (string, id) {
                    var minutes = _.map([...string.matchAll(/\d{2}/g)], 0);

                    pushToSection(id, hour, minutes);
                });
            });

            return sections;
        }

        /** Like PikasWWW */
        if (matchWithRegexp(/^(\d{1,2})	([\d{2}]+)$/gm)) {
            console.log('PikasWWW');

            var sectionId;

            /** Iterate through each row. */
            data.split('\n').forEach(function (row) {

                /** Search for text row (section title). */
                if (/[A-Za-zА-Яа-я]/.test(row)) {
                    sectionId = row.trim();
                    return;
                }

                var section = row.match(/^(\d{1,2})	([\d{2}]+)$/);

                var hour = (section[1].length < 2 ? '0' : '') + section[1];
                var minutes = _.map([...section[2].matchAll(/\d{2}/g)], 0);

                pushToSection(sectionId, hour, minutes);
            });

            return sections;
        }

        /** Like Minsktrans */
        if (matchWithRegexp(/^\d{1,2}	([\d{2} ?]+)/gm)) {
            console.log('Minsktrans');

            /** Iterate through each row. */
            data.split('\n').forEach(function (row) {

                /** Iterate through each section in the row. */
                [...row.matchAll(/(\d{1,2})	([\d{2} ?]+)/g)].forEach(function (section, sectionId) {
                    var hour = (section[1].length < 2 ? '0' : '') + section[1];
                    var minutes = _.map([...section[2].matchAll(/\d{2}/g)], 0);

                    pushToSection(sectionId, hour, minutes);
                });

            });

            return sections;
        }

        /** Like Transnavigation */
        if (matchWithRegexp(/^(\d{1,2})	$((\n^\d{2}$)+)/gm)) {
            console.log('Transnavigation');

            /** Iterate through each row. */
            [...data.matchAll(/^(\d{1,2})	$((\n^\d{2}$)+)/gm)].forEach(function (section) {
                var hour = (section[1].length < 2 ? '0' : '') + section[1];
                var minutes = _.map([...section[2].matchAll(/\d{2}/g)], 0);

                pushToSection(0, hour, minutes);
            });

            return sections;
        }

        return {};
    };

}.call(this));