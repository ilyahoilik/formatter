/** Module dependencies. */
import _ from 'lodash';
import $ from 'jquery';

/**
 * Schedule Formatter <https://github.com/ilyahoilik/formatter>
 * Simple module allowing us to paste raw schedule and receive formatted result.
 * 
 * Copyright Ilya Hoilik <https://ilyahoilik.com>
 * Released under MIT license <https://mit-license.org>
 */
;(function() {
    'use strict';

    /** Used as reference to input field with raw schedule. */
    var input = document.getElementById('input');

    /** Used as reference to output block with formatted schedule. */
    var output = document.getElementById('output');

    /** Used as reference to clear input field button. */
    var clear = document.getElementById('clear');

    /** Used as reference to enable/disable speech recognition button. */
    var microphone = document.getElementById('microphone');

    /** Used as schedule block template. */
    var template = _.template(document.getElementById('section').innerHTML);

    /** Used as reference to speech recognition. */
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = null;

    /** Used to handle schedule change. */
    input.oninput = function (e) {
        e.preventDefault();

        var sections = parseSchedule(input.value);

        var schedule = _.map(sections, function (schedule, title) {
            if (schedule.length) {
                return template({
                    title: /[A-Za-zА-Яа-я]/.test(title) ? title : null,
                    schedule: schedule.join(', ')
                });
            }
        });

        output.innerHTML = schedule.join('');
    };

    /** Used to handle paste event. */
    input.onpaste = function (e) {
		var clipboardData, pastedData;

        clipboardData = e.clipboardData || window.clipboardData;
        pastedData = $('<div/>').html(
            clipboardData.getData('text/html')
        );

        var sections = {0: []};

        pastedData.find('table.schedule td').each(function () {
            var hour = $(this).find('.hour').html();

            $(this).find('.minutes').each(function () {
                sections[0].push(hour + ':' + $(this).html());
            });
        });

        if (sections[0].length) {
            console.log('lkcar');

            var schedule = _.map(sections, function (schedule, title) {
                if (schedule.length) {
                    return template({
                        title: /[A-Za-zА-Яа-я]/.test(title) ? title : null,
                        schedule: schedule.join(', ')
                    });
                }
            });
    
            if (schedule) {
                e.preventDefault();
            }
    
            $(input).val(clipboardData.getData('Text'));
            output.innerHTML = schedule.join('');
        }
    };

    /** Used to handle speech recognition. */
    microphone.onclick = function (e) {
        e.preventDefault();

        if (recognition) {
            recognition.stop();
            recognition = null;

            return;
        }

        recognition = new SpeechRecognition();

        recognition.interimResults = true;
        recognition.lang = 'ru-RU';

        recognition.onaudiostart = function (e) {
            microphone.className = microphone.className.replace('text-gray', 'text-red');
        };

        recognition.onaudioend = function (e) {
            microphone.className = microphone.className.replace('text-red', 'text-gray');

            recognition = null;
        };

        recognition.onresult = function (e) {
            var result = e.results[e.resultIndex];

            input.value = result[0].transcript.replace(/[^0-9]/g, '');

            input.dispatchEvent(new Event('input'));
        };

        recognition.start();
    }

    /** Used to clear input field. */
    clear.onclick = function (e) {
        input.value = null;
        input.dispatchEvent(new Event('input'));
    }

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
                var minutes = _.filter(_.map(minutes, function (minute) {
                    if (minute) {
                        return hourOrSchedule + ':' + minute;
                    }
                }));

                sections[sectionId] = sectionId in sections ? sections[sectionId] : [];
                sections[sectionId].push(...minutes);
            }
        }

        /** Like Organizator Perevozok */
        if (matchWithRegexp(/^ (\d{2}):\n([\d{2}, 	]+)$/gm)) {
            console.log('Organizator Perevozok');

            /** Search for text row (section title). */
            var firstRow = data.split('\n')[0].trim().split('\t');

            /** Iterate through each row. */
            [...data.matchAll(/^ (\d{2}):\n([\d{2}, 	]+)$/gm)].forEach(function (section) {
                var hour = section[1];

                section[2].split('	').forEach(function (string, id) {
                    var minutes = _.map([...string.matchAll(/\d{2}/g)], 0);
                    var sectionId = id+1 in firstRow ? firstRow[id+1] : id;

                    pushToSection(sectionId, hour, minutes);
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
        if (matchWithRegexp(/^(\d{1,2})	$((\n^\d{2}(\[.+\])?$)+)/gm)) {
            console.log('Transnavigation');

            /** Iterate through each row. */
            [...data.matchAll(/^(\d{1,2})	$((\n^\d{2}(\[.+\])?$)+)/gm)].forEach(function (section) {
                var hour = (section[1].length < 2 ? '0' : '') + section[1];
                var minutes = _.map([...section[2].matchAll(/\d{2}/g)], 0);

                pushToSection(0, hour, minutes);
            });

            return sections;
        }

        /** Like Vitoperator.by */
        if (matchWithRegexp(/^(\d{2}):(\d{2},?)+$/gm)) {
            console.log('Vitoperator.by');

            /** Iterate through each row. */
            [...data.matchAll(/^(\d{2}):(\d{2},?)+$/gm)].forEach(function (section) {
                var data = section[0].split(':');

                var hour = data[0];
                var minutes = data[1].split(',');

                pushToSection(0, hour, minutes);
            });

            return sections;
        }

        /** Like mos.ru */
        if (matchWithRegexp(/^(\d{2}):(\n\d{2})+$/gm)) {
            console.log('mos.ru');

            /** Iterate through each row. */
            [...data.matchAll(/^(\d{2}):(\n\d{2})+$/gm)].forEach(function (section) {
                var data = section[0].split(':');

                var hour = data[0];
                var minutes = data[1].split('\n');
                minutes.shift();

                pushToSection(0, hour, minutes);
            });

            return sections;
        }

        sections[0] = _.map(data.match(/(\d{4})/g), function (time) {
            return time.replace(/^(\d{2})/, '$1:');
        });

        return sections;
    };

}.call(this));