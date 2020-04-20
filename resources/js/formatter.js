/**
 * Schedule Formatter
 * (c) Ilya Hoilik - https://ilyahoilik.com
 *
 * formatter.js - Format schedule raw data into readable format
 *
 * Author: Ilya Hoilik
 */
;( function(){
    "use strict";

    window._ = require('lodash');

    return {

        raw: null,
        result: null,
        type: null,

        initialize: function () {
            this.raw = document.getElementById('raw');
            this.result = document.getElementById('result');
            this.type = document.getElementById('type');
            this.number = document.getElementById('number');
            this.template = _.template(document.getElementById('section').innerHTML);

            this.raw.oninput = this.format.bind(this);
        },

        format: function (e) {
            e.preventDefault();

            var self = this;
            var schedule = this.raw.value;

            try {
                var sections = this.minsktrans(schedule);
            } catch (error) {
                try {
                    var sections = this.transnavigation(schedule);
                } catch (error) {
                    throw error;
                }
            }            

            var result = _.map(sections, function (section) {
                return self.template({
                    title: section.title,
                    schedule: self.toReadable(section.schedule),
                });
            });

            this.result.innerHTML = result.join('');
        },

        toReadable: function (schedule) {
            var result = [];

            _.map(schedule, function (minutes, hour) {
                hour = hour.trim();

                hour = (hour.length == 2) ? hour : '0' + hour;

                minutes.forEach(function (minute) {
                    result.push(hour + ':' + minute);
                });
            });

            return result.join(', ');
        },

        minsktrans: function (schedule) {
            schedule = schedule.split('\n');

            var sections = {};

            schedule.forEach(function (row, id) {
                var periods = _.compact(row.split('	'));

                // Если строка - шапка, то сохраняем названия секций и продолжаем
                if (id == 0 && /[A-Za-zА-Яа-я]/.test(row)) {
                    periods.forEach(function (period, periodId) {
                        sections[periodId] = {
                            title: period,
                            schedule: {}
                        };
                    });

                    return;
                }

                // Если мы здесь, то парсим расписание...
                var number = periods.length / 2;

                for (let i = 0; i < number; i++) {
                    var hour = periods[i * 2];

                    if (/\d+/.test(hour)) {
                        var minutes = periods[i * 2 + 1];

                        if (!sections[i]) {
                            sections[i] = {
                                title: '',
                                schedule: {}
                            }
                        }

                        sections[i]['schedule'][hour] = minutes.split(' ');
                    }
                }
            });

            return sections;
        },

        transnavigation: function (schedule) {
            schedule = schedule.split('\n');

            var data = {};

            var lastHour;
            schedule.forEach(function (row) {
                // Если строка содержит табуляцию, значит это час.
                if (/	/.test(row)) {
                    var hour = row.replace('	', '');

                    data[hour] = [];

                    lastHour = hour;
                    return;
                }

                // Если мы здесь, то значит это минута. Добавляем её к часу.
                if (/\d+/.test(row)) {
                    data[lastHour].push(row);
                }
            });

            return [{
                title: '',
                schedule: data
            }];
        }

    };
}().initialize());