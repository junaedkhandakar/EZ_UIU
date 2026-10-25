/* ==========================================================================
   EZ_UIU - Routine Builder
   - clash-free section solver (port of the UIU Routine Builder bitmask search)
   - academic-calendar aware .ics export (port of the UIU Routine -> .ics tool)
   All data stays in the browser.
   ========================================================================== */
(function () {
    'use strict';

    /* ---------------------------------------------------------------------
       Data + constants
       --------------------------------------------------------------------- */
    var DATA = window.UIU_ROUTINE_DATA || { courses: [], sections: [] };
    var COURSES = DATA.courses || [];
    var SECTIONS = DATA.sections || [];
    var CALS = (window.UIU_CALENDARS || []).slice();

    var DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
    var DAYS_WD = [6, 0, 1, 2, 3];
    var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var WDFULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    var TZ = 'Asia/Dhaka';
    var STORE_KEY = 'ez_uiu_routine_v1';
    var TERM_RANK = { spring: 1, summer: 2, fall: 3 };

    var PALETTE = ['#4f46e5', '#0e7490', '#047857', '#b45309', '#be123c', '#7c3aed', '#0369a1', '#4d7c0f'];

    var HANDWRITTEN_ALIASES = {
        os: ['CSE 4509', 'CSE 4510'], dsa: ['CSE 2215', 'CSE 2216', 'CSE 2217', 'CSE 2218'],
        algo: ['CSE 2215', 'CSE 2216', 'CSE 2217', 'CSE 2218'],
        oop: ['CSE 1115', 'CSE 1116', 'CSE 2118', 'DS 1115', 'DS 1116'],
        spl: ['CSE 1111', 'CSE 1112'], db: ['CSE 3521', 'CSE 3522'], dbms: ['CSE 3521', 'CSE 3522'],
        ai: ['CSE 3811', 'CSE 3812', 'GED 1005'], cn: ['CSE 3711', 'CSE 3712'], se: ['CSE 3421', 'CSE 3422'],
        dld: ['CSE 1325', 'CSE 1326'], coa: ['CSE 3313'], ca: ['CSE 3313'], toc: ['CSE 2233'],
        automata: ['CSE 2233'], compiler: ['CSE 4611'], fydp: ['CSE 4000A', 'CSE 4000B', 'CSE 4000C'],
        project: ['CSE 4000A', 'CSE 4000B', 'CSE 4000C', 'DS 4000A'],
        thesis: ['CSE 4000A', 'CSE 4000B', 'CSE 4000C', 'DS 4000A'], capstone: ['DS 4000A'],
        sqa: ['CSE 4495'], stqa: ['CSE 4495'], testing: ['CSE 4495'], vlsi: ['CSE 4327'],
        hci: ['CSE 4451', 'DS 4123'], nlp: ['CSE 4811', 'DS 4213'],
        ml: ['CSE 4889', 'DS 4889', 'DS 4491', 'CSE 4399'], dl: ['CSE 4813', 'DS 4211'],
        dip: ['CSE 4883'], graphics: ['CSE 4883'], security: ['CSE 4531', 'CSE 4777', 'CSE 4125'],
        network: ['CSE 3711', 'CSE 3712', 'CSE 4777', 'CSE 4125'], cloud: ['CSE 4587'],
        microprocessor: ['CSE 4325', 'CSE 4326'], microcontroller: ['CSE 4325', 'CSE 4326'],
        web: ['CSE 4165'], webdev: ['CSE 4165'], mobile: ['CSE 4181'], android: ['CSE 4181'],
        dm: ['CSE 2213', 'CSE 4891'], ds: ['CSE 2213'], discrete: ['CSE 2213'], bds: ['BDS 1201'],
        accounting: ['ACT 2111'], economics: ['ECO 4101']
    };

    /* ---------------------------------------------------------------------
       Small helpers
       --------------------------------------------------------------------- */
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function pad2(n) { return (n < 10 ? '0' : '') + n; }

    var mk = function (y, m, d) { return new Date(Date.UTC(y, m, d)); };
    function key(d) { return d.toISOString().slice(0, 10); }
    function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }
    function ymd(d) { return key(d).replace(/-/g, ''); }
    function fromKey(k) {
        var p = String(k || '').split('-').map(Number);
        if (p.length !== 3 || p.some(isNaN)) return null;
        return mk(p[0], p[1] - 1, p[2]);
    }
    function fmtDate(d) {
        if (!d) return '—';
        return WD[d.getUTCDay()] + ', ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
    }
    function fmtShort(d) { return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
    function fmtRange(a, b) {
        if (!a) return '—';
        if (!b || key(a) === key(b)) return fmtShort(a);
        return fmtShort(a) + ' – ' + fmtShort(b);
    }
    function minToHHMM(m) { return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
    function hhmmToMin(v) {
        var p = String(v || '').split(':').map(Number);
        if (p.length < 2 || isNaN(p[0]) || isNaN(p[1])) return null;
        return p[0] * 60 + p[1];
    }
    function fmtTime(mins) {
        var h = Math.floor(mins / 60), m = mins % 60;
        var ap = h >= 12 ? 'PM' : 'AM';
        var hh = h % 12 === 0 ? 12 : h % 12;
        return hh + ':' + pad2(m) + ' ' + ap;
    }
    function norm(s) {
        return String(s || '').replace(/&/g, ' and ').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function toast(message, type) {
        var stack = $('#toastStack');
        if (!stack) return;
        var el = document.createElement('div');
        el.className = 'rt-toast ' + (type || '');
        el.textContent = message;
        stack.appendChild(el);
        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transform = 'translateY(4px)';
            el.style.transition = 'opacity .2s ease, transform .2s ease';
            setTimeout(function () { el.remove(); }, 220);
        }, 3400);
    }

    /* ---------------------------------------------------------------------
       Indexes
       --------------------------------------------------------------------- */
    var SECTION_BY_ID = {};
    var SECTIONS_BY_CODE = {};
    SECTIONS.forEach(function (s) {
        SECTION_BY_ID[s.id] = s;
        (SECTIONS_BY_CODE[s.code] = SECTIONS_BY_CODE[s.code] || []).push(s);
    });
    Object.keys(SECTIONS_BY_CODE).forEach(function (code) {
        SECTIONS_BY_CODE[code].sort(function (a, b) {
            return String(a.section).localeCompare(String(b.section), undefined, { numeric: true }) ||
                (a.meetings[0] ? a.meetings[0][1] - b.meetings[0][1] : 0);
        });
    });

    var COURSE_BY_CODE = {};
    COURSES.forEach(function (c) { COURSE_BY_CODE[c.code] = c; });

    var ALIAS_BY_COURSE = {};
    Object.keys(HANDWRITTEN_ALIASES).forEach(function (alias) {
        HANDWRITTEN_ALIASES[alias].forEach(function (code) {
            (ALIAS_BY_COURSE[code] = ALIAS_BY_COURSE[code] || []).push(alias);
        });
    });

    function abbreviations(title) {
        var words = norm(title).split(' ').filter(Boolean).filter(function (w) {
            return ['and', 'of', 'the', 'to', 'in', 'for', 'a', 'an', 'on', 'with', 'by'].indexOf(w) === -1;
        });
        if (!words.length) return [];
        var set = {};
        set[words.map(function (w) { return w[0]; }).join('')] = 1;
        var nonLab = words.filter(function (w) { return w !== 'laboratory' && w !== 'lab'; });
        if (nonLab.length && nonLab.length < words.length) set[nonLab.map(function (w) { return w[0]; }).join('')] = 1;
        var last = words[words.length - 1];
        var roman = { i: '1', ii: '2', iii: '3', iv: '4' }[last];
        if (roman) {
            var base = words.slice(0, -1).map(function (w) { return w[0]; }).join('');
            if (base) { set[base] = 1; set[base + last] = 1; set[base + roman] = 1; }
        }
        return Object.keys(set);
    }

    var SEARCH_INDEX = [];
    (function buildIndex() {
        var countByCode = {};
        var facultyByCode = {};
        SECTIONS.forEach(function (s) {
            countByCode[s.code] = (countByCode[s.code] || 0) + 1;
            (facultyByCode[s.code] = facultyByCode[s.code] || []).push.apply(facultyByCode[s.code], s.faculty || []);
        });
        SEARCH_INDEX = COURSES.map(function (c) {
            var titleTokens = norm(c.title).split(' ').filter(Boolean);
            return {
                code: c.code,
                title: c.title,
                credit: c.credit,
                program: c.program,
                normCode: c.code.toLowerCase().replace(/[^a-z0-9]/g, ''),
                spaced: c.code.toLowerCase(),
                tokens: titleTokens,
                stems: titleTokens.map(function (t) { return t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t; }),
                abbr: abbreviations(c.title),
                aliases: ALIAS_BY_COURSE[c.code] || [],
                facultyTokens: Array.from(new Set((facultyByCode[c.code] || []).join(' ').toLowerCase().split(/\s+/).filter(Boolean))),
                count: countByCode[c.code] || 0
            };
        });
    })();

    function naturalCode(a, b) {
        var pa = /^([A-Za-z]+)\s*(\d+)([A-Za-z]*)$/.exec(a) || ['', a, 0, ''];
        var pb = /^([A-Za-z]+)\s*(\d+)([A-Za-z]*)$/.exec(b) || ['', b, 0, ''];
        if (pa[1] !== pb[1]) return pa[1].localeCompare(pb[1]);
        if (+pa[2] !== +pb[2]) return +pa[2] - +pb[2];
        return String(pa[3]).localeCompare(String(pb[3]));
    }

    function searchCourses(query) {
        var raw = String(query || '').trim();
        if (!raw) return [];
        var qNorm = norm(raw);
        var qTokens = qNorm.split(' ').filter(Boolean);
        var qCompact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
        var results = [];

        SEARCH_INDEX.forEach(function (e) {
            var score = 0;
            if (e.normCode === qCompact || e.spaced === qNorm) score = 1000;
            else if (e.aliases.indexOf(qCompact) !== -1 || e.abbr.indexOf(qCompact) !== -1) score = 800;
            else if (qCompact && (e.normCode.indexOf(qCompact) === 0 || e.normCode.indexOf(qCompact) !== -1)) score = 650;
            else if (e.tokens.join(' ').indexOf(qNorm) === 0) score = 500;
            else {
                var matchedWords = 0, ok = qTokens.length > 0;
                for (var i = 0; i < qTokens.length; i++) {
                    var qt = qTokens[i], qstem = qt.length > 3 && qt.slice(-1) === 's' ? qt.slice(0, -1) : qt;
                    var hit = e.normCode.indexOf(qt) !== -1;
                    for (var j = 0; !hit && j < e.tokens.length; j++) {
                        if (e.tokens[j].indexOf(qt) === 0 || e.stems[j] === qstem || e.stems[j].indexOf(qstem) === 0) {
                            hit = true; matchedWords++;
                        }
                    }
                    if (!hit) {
                        hit = e.abbr.some(function (a) { return a === qt || (qt.length >= 3 && a.indexOf(qt) === 0); }) ||
                            e.aliases.some(function (a) { return a === qt || (qt.length >= 3 && a.indexOf(qt) === 0); });
                    }
                    if (!hit && qt.length >= 3) {
                        hit = e.facultyTokens.some(function (f) { return f.indexOf(qt) === 0; });
                    }
                    if (!hit) { ok = false; break; }
                }
                if (ok) score = 350 + matchedWords * 25;
            }
            if (score > 0) results.push({ entry: e, score: score });
        });

        results.sort(function (a, b) { return b.score - a.score || naturalCode(a.entry.code, b.entry.code); });
        return results.slice(0, 10).map(function (r) { return r.entry; });
    }

    /* ---------------------------------------------------------------------
       State
       --------------------------------------------------------------------- */
    var state = {
        calId: CALS[0] ? CALS[0].id : '',
        cal: null,
        events: [],
        begin: null,
        first: '',
        last: '',
        program: 'all',
        selected: [],     // { code, sectionId }
        custom: [],       // { id, title, credit, faculty, meetings: [[day,start,end,room]] }
        options: [],
        activeOption: -1,
        daysOff: [],
        earliest: '',
        latest: '',
        includeInfo: true,
        alarm: true,
        alarmMin: 15,
        icsStats: null
    };

    function save() {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify({
                calId: state.calId,
                first: state.first,
                last: state.last,
                program: state.program,
                selected: state.selected.map(function (c) { return { code: c.code, sectionId: c.sectionId }; }),
                custom: state.custom,
                daysOff: state.daysOff,
                earliest: state.earliest,
                latest: state.latest,
                includeInfo: state.includeInfo,
                alarm: state.alarm,
                alarmMin: state.alarmMin
            }));
            var active = CALS.filter(function (c) { return c.id === state.calId; })[0];
            if (active && String(active.id).indexOf('fetched-') === 0) {
                localStorage.setItem(STORE_KEY + '_cal', JSON.stringify(active));
            }
        } catch (e) { /* storage can be unavailable */ }
    }

    function restore() {
        var saved = null;
        try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { saved = null; }
        try {
            var extra = JSON.parse(localStorage.getItem(STORE_KEY + '_cal') || 'null');
            if (extra && extra.id && extra.events && !CALS.some(function (c) { return c.id === extra.id; })) {
                CALS.unshift(extra);
            }
        } catch (e) { /* ignore malformed cache */ }
        if (!saved) return;

        var calFound = false;
        if (saved.calId && CALS.some(function (c) { return c.id === saved.calId; })) {
            state.calId = saved.calId;
            calFound = true;
        }
        if (calFound && fromKey(saved.first)) state.first = saved.first;
        if (calFound && fromKey(saved.last)) state.last = saved.last;
        if (['all', 'BSCSE', 'BSDS'].indexOf(saved.program) !== -1) state.program = saved.program;

        if (Array.isArray(saved.selected)) {
            state.selected = saved.selected.filter(function (c) {
                return c && COURSE_BY_CODE[c.code];
            }).map(function (c) {
                var sec = c.sectionId && SECTION_BY_ID[c.sectionId];
                if (!sec || sec.code !== c.code) sec = null;
                if (!sec && (SECTIONS_BY_CODE[c.code] || []).length === 1) sec = SECTIONS_BY_CODE[c.code][0];
                return { code: c.code, sectionId: sec ? sec.id : null };
            });
        }
        if (Array.isArray(saved.custom)) {
            state.custom = saved.custom.filter(function (c) {
                return c && c.title && Array.isArray(c.meetings) && c.meetings.length;
            });
        }
        if (Array.isArray(saved.daysOff)) state.daysOff = saved.daysOff.filter(function (d) { return DAYS.indexOf(d) !== -1; });
        if (typeof saved.earliest === 'string') state.earliest = saved.earliest;
        if (typeof saved.latest === 'string') state.latest = saved.latest;
        if (typeof saved.includeInfo === 'boolean') state.includeInfo = saved.includeInfo;
        if (typeof saved.alarm === 'boolean') state.alarm = saved.alarm;
        if (typeof saved.alarmMin === 'number') state.alarmMin = saved.alarmMin;
    }

    /* ---------------------------------------------------------------------
       Academic calendar parsing (ported from the UIU Routine -> .ics tool)
       --------------------------------------------------------------------- */
    var DATE_RE = /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:\s*[-\u2013\u2014]\s*(?:([A-Za-z]{3,9})\.?\s+)?(\d{1,2}))?\s*,?\s*(\d{4})/;

    function parseDateRow(line) {
        line = line.replace(/\|/g, '\t').replace(/\u00a0/g, ' ').trim();
        var m = line.match(DATE_RE);
        if (!m) return null;
        var m1 = MON[m[1].slice(0, 3).toLowerCase()];
        if (m1 === undefined) return null;
        var y = +m[5];
        var m2 = m[3] ? MON[m[3].slice(0, 3).toLowerCase()] : m1;
        if (m2 === undefined) m2 = m1;
        var d1 = +m[2], d2 = m[4] ? +m[4] : d1;
        var sy = y;
        if (m2 < m1) sy = y - 1;
        var start = mk(sy, m1, d1), end = mk(y, m2, d2);
        var rest = line.slice(m[0].length).replace(/^[\s\t]+/, '');
        rest = rest.replace(/^(?:(?:Sat|Sun|Mon|Tue|Wed|Thu|Fri)[a-z]*\s*[-\u2013]\s*)?(?:Sat|Sun|Mon|Tue|Wed|Thu|Fri)[a-z]*(?=[\s\t])\s*/i, '')
            .replace(/\s+/g, ' ').trim();
        if (!rest) return null;
        return { start: start, end: end < start ? start : end, text: rest };
    }

    function parseText(text) {
        var secs = [], cur = null;
        text.split(/\r?\n/).forEach(function (raw) {
            var line = raw.replace(/\u00a0/g, ' ').trim();
            if (!line) return;
            var h = line.match(/(Spring|Summer|Fall)\s+(\d{4})\s+(Trimester|Semester)/i);
            if (h && !DATE_RE.test(line)) {
                cur = { title: line.replace(/\s+/g, ' '), term: h[1].toLowerCase(), year: +h[2], events: [] };
                secs.push(cur);
                return;
            }
            var ev = parseDateRow(line);
            if (ev) {
                if (!cur) { cur = { title: 'Calendar', term: '', year: 0, events: [] }; secs.push(cur); }
                cur.events.push(ev);
            }
        });
        return secs.filter(function (s) { return s.events.length; });
    }

    function htmlToText(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('script,style,noscript').forEach(function (e) { e.remove(); });
        var out = [];
        (function walk(n) {
            if (n.nodeType === 3) {
                var t = n.textContent.trim();
                if (t) out.push(t);
                return;
            }
            if (n.nodeType !== 1) return;
            if (n.tagName === 'TR') {
                out.push(Array.prototype.map.call(n.children, function (c) {
                    return c.textContent.replace(/\s+/g, ' ').trim();
                }).join('\t'));
                return;
            }
            if (/^H[1-6]$/.test(n.tagName)) {
                out.push(n.textContent.replace(/\s+/g, ' ').trim());
                return;
            }
            Array.prototype.forEach.call(n.childNodes, walk);
        })(doc.body);
        return out.join('\n');
    }

    function parseIcsCalendar(text) {
        var un = text.replace(/\r?\n[ \t]/g, '');
        var name = (un.match(/X-WR-CALNAME:(.*)/) || [])[1] || 'Calendar (.ics)';
        var h = name.match(/(Spring|Summer|Fall)\s+(\d{4})/i);
        var events = [];
        un.split('BEGIN:VEVENT').slice(1).forEach(function (b) {
            var s = (b.match(/DTSTART[^:]*:(\d{8})/) || [])[1];
            var e = (b.match(/DTEND[^:]*:(\d{8})/) || [])[1];
            var t = (b.match(/SUMMARY:(.*)/) || [])[1];
            if (!s || !t) return;
            var st = mk(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
            var en = e ? addDays(mk(+e.slice(0, 4), +e.slice(4, 6) - 1, +e.slice(6, 8)), -1) : st;
            if (en < st) en = st;
            events.push({ start: st, end: en, text: t.trim() });
        });
        return events.length ? [{ title: name.trim(), term: h ? h[1].toLowerCase() : '', year: h ? +h[2] : 0, events: events }] : [];
    }

    function ingest(text) {
        text = String(text || '').trim();
        if (/^BEGIN:VCALENDAR/.test(text)) return parseIcsCalendar(text);
        if (/<(table|html|body)/i.test(text)) return parseText(htmlToText(text));
        return parseText(text);
    }

    function classifyEvent(text) {
        var t = String(text).toLowerCase(), m;
        if ((m = t.match(/regular\s+(saturday|sunday|monday|tuesday|wednesday|thursday|friday)\s+class/))) {
            return { kind: 'makeup', wd: WDFULL.indexOf(m[1]) };
        }
        if (/final\s*exam/.test(t)) return { kind: 'exam', sub: 'final' };
        if (/mid[-\s]?term/.test(t)) return { kind: 'exam', sub: 'mid' };
        if (/holiday/.test(t)) return { kind: 'holiday' };
        if (/suspend/.test(t)) return { kind: 'suspend' };
        if (/classes?\s+begin/.test(t)) return { kind: 'begin' };
        return { kind: 'info' };
    }

    function prepareCalendar(cal) {
        state.cal = cal || null;
        state.events = [];
        state.begin = null;
        if (!cal) return;

        var events = (cal.events || []).map(function (e) {
            var start = fromKey(e.start), end = fromKey(e.end);
            if (!start || !end) return null;
            if (end < start) end = start;
            var cls = classifyEvent(e.text);
            return {
                start: start,
                end: end,
                text: e.text,
                kind: cls.kind,
                sub: cls.sub,
                wd: cls.wd
            };
        }).filter(Boolean);

        var begin = events.filter(function (e) { return e.kind === 'begin'; })[0] || null;
        var finals = events.filter(function (e) { return e.kind === 'exam' && e.sub === 'final'; });
        var fStart = finals.length ? new Date(Math.min.apply(null, finals.map(function (e) { return +e.start; }))) : null;
        var fEnd = finals.length ? new Date(Math.max.apply(null, finals.map(function (e) { return +e.end; }))) : null;
        var lo = begin ? addDays(begin.start, -14) : null;
        var hi = fEnd ? addDays(fEnd, 45) : null;

        state.events = events.filter(function (e) {
            return (!lo || e.end >= lo) && (!hi || e.start <= hi);
        });
        state.begin = begin;
        state.finalsStart = fStart;
        state.finalsEnd = fEnd;
    }

    function applyCalendarDefaults(force) {
        if (!force && fromKey(state.first) && fromKey(state.last)) return;
        if (state.begin) state.first = key(state.begin.start);
        if (state.finalsStart) {
            state.last = key(addDays(state.finalsStart, -1));
        } else {
            var ends = state.events.map(function (e) { return e.end; });
            if (ends.length) state.last = key(new Date(Math.max.apply(null, ends.map(Number))));
            else if (state.begin) state.last = key(addDays(state.begin.start, 90));
        }
    }

    function calToOption(sec) {
        return {
            id: 'fetched-' + (sec.term || 'term') + '-' + (sec.year || '') + '-' + Math.random().toString(36).slice(2, 7) + '-' + Date.now(),
            title: sec.title,
            term: sec.term || '',
            year: sec.year || 0,
            kind: 'trimester',
            program: /undergrad/i.test(sec.title) ? 'Undergraduate' : (/graduate/i.test(sec.title) ? 'Graduate' : (/pharm/i.test(sec.title) ? 'B.Pharm' : 'General')),
            events: sec.events.map(function (e) { return { start: key(e.start), end: key(e.end), text: e.text }; })
        };
    }

    function addParsedCalendars(secs, how) {
        var msg = $('#calMsg');
        if (!secs.length) {
            msg.className = 'rt-msg bad';
            msg.textContent = 'No calendar rows found. Open the UIU calendar page, copy the text, and paste it below.';
            $('#calPasteWrap').hidden = false;
            return;
        }
        var rank = function (s) { return (/undergrad/i.test(s.title) ? 1e6 : 0) + (+s.year || 0) * 10 + (TERM_RANK[s.term] || 0); };
        var best = secs.slice().sort(function (a, b) { return rank(b) - rank(a); })[0];
        var fresh = calToOption(best);
        var existing = -1;
        for (var i = 0; i < CALS.length; i++) {
            if (CALS[i].title.replace(/\s*\[Revised\]/ig, '').trim() === fresh.title.replace(/\s*\[Revised\]/ig, '').trim()) {
                existing = i; break;
            }
        }
        var picked;
        if (existing !== -1) {
            CALS[existing] = Object.assign({}, CALS[existing], { events: fresh.events, year: fresh.year, term: fresh.term });
            picked = CALS[existing];
        } else {
            CALS.unshift(fresh);
            picked = fresh;
        }
        state.calId = picked.id;
        prepareCalendar(picked);
        state.first = '';
        state.last = '';
        applyCalendarDefaults(true);
        save();
        renderCalendar();
        renderPreview();
        msg.className = 'rt-msg ok';
        msg.textContent = how + ': found ' + secs.length + ' term(s). Loaded "' + picked.title + '".';
    }

    /* ---------------------------------------------------------------------
       Calendar UI
       --------------------------------------------------------------------- */
    function renderCalendar() {
        var sel = $('#calSelect');
        sel.innerHTML = CALS.map(function (c) {
            return '<option value="' + esc(c.id) + '"' + (c.id === state.calId ? ' selected' : '') + '>' +
                esc(c.title) + ' (' + c.year + ')</option>';
        }).join('');

        var cal = state.cal;
        var begin = state.begin;
        var makeup = state.events.filter(function (e) { return e.kind === 'makeup'; });
        var holidays = state.events.filter(function (e) { return e.kind === 'holiday'; });
        var suspended = state.events.filter(function (e) { return e.kind === 'suspend'; });
        var finals = state.events.filter(function (e) { return e.kind === 'exam' && e.sub === 'final'; });
        var fStart = finals.length ? new Date(Math.min.apply(null, finals.map(function (e) { return +e.start; }))) : null;
        var fEnd = finals.length ? new Date(Math.max.apply(null, finals.map(function (e) { return +e.end; }))) : null;

        var items = [
            ['Term', cal ? (cal.term ? cal.term.charAt(0).toUpperCase() + cal.term.slice(1) : '') + ' ' + cal.year +
                (cal.program ? ' · ' + cal.program : '') : '—'],
            ['Classes begin', begin ? fmtDate(begin.start) : 'not found'],
            ['Last class day', fromKey(state.last) ? fmtDate(fromKey(state.last)) : 'set manually'],
            ['Makeup days', makeup.length ? makeup.length + ' online day(s)' : 'none'],
            ['Closures', (holidays.length + suspended.length) + ' block(s)'],
            ['Final exam', fStart ? fmtRange(fStart, fEnd) : 'not listed']
        ];
        $('#calMeta').innerHTML = items.map(function (it) {
            return '<div class="rt-cal-item"><span class="k">' + esc(it[0]) + '</span>' +
                '<span class="v" title="' + esc(it[1]) + '">' + esc(it[1]) + '</span></div>';
        }).join('');

        $('#calFirst').value = state.first || '';
        $('#calLast').value = state.last || '';

        var makeupLine = makeup.map(function (e) {
            return fmtShort(e.start) + ' → ' + (WD[e.wd] || '?');
        }).join(' · ');
        var closeLine = holidays.concat(suspended).map(function (e) {
            var label = e.text.replace(/^holiday\s*:\s*/i, '').replace(/classes will remain suspended/i, 'suspended');
            return fmtRange(e.start, e.end) + ' (' + label.split('.').shift() + ')';
        }).join(' · ');
        var effects = $('#calEffects');
        effects.innerHTML =
            (makeupLine ? '<b>Makeup:</b> ' + esc(makeupLine) + '<br>' : '') +
            (closeLine ? '<b>No class:</b> ' + esc(closeLine) : '') ||
            'Set the dates manually if the calendar has no effects.';
    }

    function selectCalendar(id, reset) {
        var cal = CALS.filter(function (c) { return c.id === id; })[0];
        if (!cal) return;
        state.calId = id;
        prepareCalendar(cal);
        if (reset) { state.first = ''; state.last = ''; }
        applyCalendarDefaults(reset || !fromKey(state.first) || !fromKey(state.last));
        save();
        renderCalendar();
        renderPreview();
        var msg = $('#calMsg');
        msg.className = 'rt-msg';
        msg.textContent = 'Using ' + cal.title + '.';
    }

    /* ---------------------------------------------------------------------
       Courses UI
       --------------------------------------------------------------------- */
    function sectionSummary(sec) {
        if (!sec) return '';
        var m = sec.meetings[0] || ['', 0, 0, ''];
        var days = Array.from(new Set(sec.meetings.map(function (x) { return x[0]; }))).join('+');
        return days + ' ' + fmtTime(m[1]) + '–' + fmtTime(m[2]) + (m[3] ? ' · Rm ' + m[3] : '') +
            (sec.faculty.length ? ' · ' + sec.faculty.join(', ') : '');
    }

    function sectionOptionLabel(sec) {
        return sec.section + ' · ' + sectionSummary(sec) + (sec.tentative ? ' · tentative' : '');
    }

    function addCourse(code) {
        if (state.selected.some(function (c) { return c.code === code; })) {
            toast(code + ' is already in your list.', '');
            return;
        }
        var course = COURSE_BY_CODE[code];
        if (!course) return;
        var secs = SECTIONS_BY_CODE[code] || [];
        state.selected.push({ code: code, sectionId: secs.length === 1 ? secs[0].id : null });
        state.activeOption = -1;
        state.options = [];
        save();
        renderCourses();
        renderPreview();
        renderOptions();
        toast('Added ' + code + ' — ' + course.title, 'ok');
    }

    function removeCourse(code) {
        state.selected = state.selected.filter(function (c) { return c.code !== code; });
        state.activeOption = -1;
        state.options = [];
        save();
        renderCourses();
        renderOptions();
        renderPreview();
    }

    function removeCustom(id) {
        state.custom = state.custom.filter(function (c) { return c.id !== id; });
        state.options = [];
        state.activeOption = -1;
        save();
        renderCourses();
        renderOptions();
        renderPreview();
    }

    function renderCourses() {
        var list = $('#courseList');
        var total = state.selected.length + state.custom.length;
        $('#courseCount').textContent = total + (total === 1 ? ' course' : ' courses');

        if (!total) {
            list.innerHTML = '<div class="rt-empty"><i class="fas fa-book-open"></i>' +
                'No courses yet. Search above, or add a custom FYDP slot below.</div>';
            return;
        }

        var html = state.selected.map(function (sel) {
            var course = COURSE_BY_CODE[sel.code];
            var secs = SECTIONS_BY_CODE[sel.code] || [];
            var chosen = sel.sectionId ? SECTION_BY_ID[sel.sectionId] : null;
            var sub = (course ? course.credit : 0) + ' cr · ' + (course ? course.program : '') +
                ' · ' + secs.length + ' section' + (secs.length === 1 ? '' : 's');
            if (chosen) sub += ' · ' + sectionSummary(chosen);
            else sub += ' · section not chosen yet';

            var options = '<option value="">Auto — let the solver choose</option>' + secs.map(function (s) {
                return '<option value="' + esc(s.id) + '"' + (sel.sectionId === s.id ? ' selected' : '') + '>' +
                    esc(sectionOptionLabel(s)) + '</option>';
            }).join('');

            return '<div class="rt-course" data-code="' + esc(sel.code) + '">' +
                '<div class="rt-course-main">' +
                '<div><span class="rt-course-code">' + esc(sel.code) + '</span>' +
                '<span class="rt-course-title">' + esc(course ? course.title : sel.code) + '</span></div>' +
                '<div class="rt-course-sub"><span>' + esc(sub) + '</span></div>' +
                '</div>' +
                '<select class="ez-select" data-role="section" aria-label="Section for ' + esc(sel.code) + '">' + options + '</select>' +
                '<button type="button" class="rt-remove" data-remove="' + esc(sel.code) + '" aria-label="Remove ' + esc(sel.code) + '">' +
                '<i class="fas fa-xmark"></i></button>' +
                '</div>';
        }).join('');

        html += state.custom.map(function (c) {
            var m = c.meetings[0] || ['', 0, 0, ''];
            var days = Array.from(new Set(c.meetings.map(function (x) { return x[0]; }))).join('+');
            var sub = days + ' ' + fmtTime(m[1]) + '–' + fmtTime(m[2]) +
                (m[3] ? ' · Rm ' + m[3] : '') + (c.faculty ? ' · ' + c.faculty : '') + ' · custom';
            return '<div class="rt-course is-custom" data-custom="' + esc(c.id) + '">' +
                '<div class="rt-course-main">' +
                '<div><span class="rt-course-code">CUSTOM</span>' +
                '<span class="rt-course-title">' + esc(c.title) + '</span></div>' +
                '<div class="rt-course-sub"><span>' + esc(sub) + '</span></div>' +
                '</div>' +
                '<span></span>' +
                '<button type="button" class="rt-remove" data-remove-custom="' + esc(c.id) + '" aria-label="Remove custom class">' +
                '<i class="fas fa-xmark"></i></button>' +
                '</div>';
        }).join('');

        list.innerHTML = html;
    }

    function renderSearchResults() {
        var box = $('#searchResults');
        var q = $('#courseSearch').value;
        if (!q.trim()) {
            box.classList.remove('open');
            box.innerHTML = '';
            return;
        }
        var results = searchCourses(q).filter(function (e) {
            return state.program === 'all' || e.program === state.program;
        });
        if (!results.length) {
            box.innerHTML = '<div class="rt-search-empty">No course matches “' + esc(q) + '”. ' +
                'You can add it as a custom class below.</div>';
        } else {
            box.innerHTML = results.map(function (e) {
                return '<div class="rt-search-item" data-code="' + esc(e.code) + '">' +
                    '<span class="code">' + esc(e.code) + '</span>' +
                    '<span class="name">' + esc(e.title) + '</span>' +
                    '<span class="meta">' + e.credit + ' cr · ' + e.count + ' sec · ' + esc(e.program) + '</span>' +
                    '</div>';
            }).join('');
        }
        box.classList.add('open');
    }

    /* ---------------------------------------------------------------------
       Solver
       --------------------------------------------------------------------- */
    function meetingsOf(sec) { return sec.meetings || []; }

    function overlaps(a, b) {
        return a[1] < b[2] && a[2] > b[1] && a[0] === b[0];
    }

    function makeOccupancy() {
        var occ = {};
        DAYS.forEach(function (d) { occ[d] = []; });
        state.custom.forEach(function (c) {
            c.meetings.forEach(function (m) {
                if (occ[m[0]]) occ[m[0]].push({ start: m[1], end: m[2], title: c.title });
            });
        });
        return occ;
    }

    function conflictsWith(occ, sec) {
        if (!occ) return false;
        return meetingsOf(sec).some(function (m) {
            var list = occ[m[0]] || [];
            for (var i = 0; i < list.length; i++) {
                if (m[1] < list[i].end && m[2] > list[i].start) return true;
            }
            return false;
        });
    }

    function scoreSchedule(sections) {
        var byDay = {};
        DAYS.forEach(function (d) { byDay[d] = []; });
        var earliest = 24 * 60, latest = 0, credits = 0, tentative = 0;

        sections.forEach(function (sec) {
            credits += sec.credit || 0;
            if (sec.tentative) tentative++;
            meetingsOf(sec).forEach(function (m) {
                if (!byDay[m[0]]) byDay[m[0]] = [];
                byDay[m[0]].push(m);
                if (m[1] < earliest) earliest = m[1];
                if (m[2] > latest) latest = m[2];
            });
        });

        var gaps = 0, daysUsed = 0, earlyLate = 0;
        DAYS.forEach(function (d) {
            var list = byDay[d] || [];
            if (!list.length) return;
            daysUsed++;
            list.sort(function (a, b) { return a[1] - b[1]; });
            for (var i = 0; i < list.length - 1; i++) {
                var gap = list[i + 1][1] - list[i][2];
                if (gap > 0) gaps += gap;
            }
        });
        sections.forEach(function (sec) {
            meetingsOf(sec).forEach(function (m) {
                if (m[1] <= 510) earlyLate += 10;
                if (m[2] >= 990) earlyLate += 10;
            });
        });
        if (earliest > latest) { earliest = 0; latest = 0; }

        var gapScore = Math.max(0, 100 - Math.round(gaps / 3));
        var dayScore = daysUsed <= 2 ? 100 : daysUsed === 3 ? 85 : daysUsed === 4 ? 60 : 30;
        var timeScore = Math.max(0, 100 - earlyLate);
        var tentativeScore = Math.max(0, 100 - tentative * 35);
        var total = Math.round((gapScore * 35 + dayScore * 30 + timeScore * 20 + tentativeScore * 15) / 100);

        return {
            score: total, credits: credits, daysUsed: daysUsed, gaps: gaps,
            earliest: earliest, latest: latest, tentative: tentative,
            gapScore: gapScore, dayScore: dayScore, timeScore: timeScore
        };
    }

    function mergedStats(sections, includeCustom) {
        var byDay = {};
        DAYS.forEach(function (d) { byDay[d] = []; });
        var credits = 0, earliest = 24 * 60, latest = 0;
        sections.forEach(function (sec) {
            credits += sec.credit || 0;
            meetingsOf(sec).forEach(function (m) { byDay[m[0]].push(m); });
        });
        if (includeCustom) {
            state.custom.forEach(function (c) {
                credits += c.credit || 0;
                c.meetings.forEach(function (m) { byDay[m[0]].push(m); });
            });
        }
        var gaps = 0, daysUsed = 0;
        DAYS.forEach(function (d) {
            var list = byDay[d] || [];
            if (!list.length) return;
            daysUsed++;
            list.sort(function (a, b) { return a[1] - b[1]; });
            for (var i = 0; i < list.length - 1; i++) {
                var gap = list[i + 1][1] - list[i][2];
                if (gap > 0) gaps += gap;
            }
        });
        Object.keys(byDay).forEach(function (d) {
            byDay[d].forEach(function (m) {
                if (m[1] < earliest) earliest = m[1];
                if (m[2] > latest) latest = m[2];
            });
        });
        if (earliest > latest) { earliest = 0; latest = 0; }
        return { credits: credits, daysUsed: daysUsed, gaps: gaps, earliest: earliest, latest: latest };
    }

    function solve() {
        var msg = $('#solverMsg');
        msg.className = 'rt-msg';
        msg.textContent = '';

        if (!state.selected.length) {
            msg.className = 'rt-msg bad';
            msg.textContent = 'Add at least one course before generating a routine.';
            return;
        }

        var earliest = state.earliest ? hhmmToMin(state.earliest) : null;
        var latest = state.latest ? hhmmToMin(state.latest) : null;
        var daysOff = state.daysOff;
        var domains = [];
        var error = null;

        state.selected.forEach(function (sel) {
            var secs = (SECTIONS_BY_CODE[sel.code] || []).slice();
            if (sel.sectionId) {
                var locked = secs.filter(function (s) { return s.id === sel.sectionId; });
                if (locked.length) secs = locked;
            }
            secs = secs.filter(function (s) {
                return meetingsOf(s).every(function (m) {
                    if (daysOff.indexOf(m[0]) !== -1) return false;
                    if (earliest !== null && m[1] < earliest) return false;
                    if (latest !== null && m[2] > latest) return false;
                    return true;
                });
            });
            secs.sort(function (a, b) {
                return (a.tentative ? 1 : 0) - (b.tentative ? 1 : 0) ||
                    (a.meetings[0] ? a.meetings[0][1] - b.meetings[0][1] : 0);
            });
            if (!secs.length) {
                error = sel.code + ' has no section that matches your locked section, free days, or time window.';
                return;
            }
            domains.push({ code: sel.code, secs: secs });
        });

        if (error) {
            msg.className = 'rt-msg bad';
            msg.textContent = error;
            return;
        }

        domains.sort(function (a, b) { return a.secs.length - b.secs.length; });

        var results = [];
        var chosen = [];
        var fixedOcc = makeOccupancy();
        var nodes = 0, valid = 0, truncated = false;
        var t0 = performance.now();
        var MAX_NODES = 220000, TIME_BUDGET = 950, LIMIT = 24;

        function search(depth, occ) {
            nodes++;
            if (nodes > MAX_NODES || ((nodes & 1023) === 0 && performance.now() - t0 > TIME_BUDGET)) {
                truncated = true;
                return;
            }
            if (depth === domains.length) {
                valid++;
                var metrics = scoreSchedule(chosen);
                results.push({ sections: chosen.slice(), metrics: metrics });
                results.sort(function (a, b) { return b.metrics.score - a.metrics.score; });
                if (results.length > LIMIT) results.length = LIMIT;
                return;
            }
            var domain = domains[depth];
            for (var i = 0; i < domain.secs.length; i++) {
                var sec = domain.secs[i];
                if (conflictsWith(fixedOcc, sec) || conflictsWith(occ, sec)) continue;
                chosen.push(sec);
                var added = {};
                meetingsOf(sec).forEach(function (m) {
                    (added[m[0]] = added[m[0]] || []).push({ start: m[1], end: m[2] });
                });
                Object.keys(added).forEach(function (d) {
                    occ[d] = (occ[d] || []).concat(added[d]);
                });
                search(depth + 1, occ);
                Object.keys(added).forEach(function (d) {
                    occ[d].length -= added[d].length;
                });
                chosen.pop();
                if (truncated) return;
            }
        }

        search(0, makeOccupancy());

        var elapsed = Math.round(performance.now() - t0);
        if (!results.length) {
            msg.className = 'rt-msg bad';
            msg.textContent = truncated
                ? 'Search stopped before finding a clash-free combination. Try freeing a day or widening the time window.'
                : 'No clash-free combination exists for these courses. Free a day, widen the time window, or change a locked section.';
            state.options = [];
            state.activeOption = -1;
            renderOptions();
            return;
        }

        state.options = results;
        state.activeOption = 0;
        applyOption(0);

        msg.className = 'rt-msg ok';
        msg.textContent = results.length + ' option(s) found from ' + valid.toLocaleString() + ' valid combination(s)' +
            (truncated ? ' (search cap reached)' : '') + ' in ' + elapsed + ' ms.';
    }

    function applyOption(index) {
        var option = state.options[index];
        if (!option) return;
        state.activeOption = index;
        option.sections.forEach(function (sec) {
            var sel = state.selected.filter(function (c) { return c.code === sec.code; })[0];
            if (sel) sel.sectionId = sec.id;
        });
        save();
        renderCourses();
        renderOptions();
        renderPreview();
    }

    function renderOptions() {
        var box = $('#optionList');
        if (!state.options.length) { box.innerHTML = ''; return; }
        var visible = state.options.slice(0, 8);
        box.innerHTML = visible.map(function (o, i) {
            var m = o.metrics;
            var full = mergedStats(o.sections, true);
            var sectionLine = o.sections.map(function (s) { return s.code + ' · ' + s.section; }).join(' &nbsp;|&nbsp; ');
            return '<button type="button" class="rt-option' + (i === state.activeOption ? ' active' : '') + '" data-index="' + i + '">' +
                '<div class="rt-option-head"><span class="rt-option-rank">Option ' + (i + 1) + (i === 0 ? ' · best fit' : '') + '</span>' +
                '<span class="rt-option-score">' + m.score + '/100</span></div>' +
                '<div class="rt-option-stats">' +
                '<span><b>' + full.credits + '</b> cr</span>' +
                '<span><b>' + full.daysUsed + '</b> day' + (full.daysUsed === 1 ? '' : 's') + '</span>' +
                '<span>' + (full.gaps ? '<b>' + full.gaps + '</b> min gap' : 'no gaps') + '</span>' +
                '<span>' + fmtTime(full.earliest) + '–' + fmtTime(full.latest) + '</span>' +
                (m.tentative ? '<span><b>' + m.tentative + '</b> tentative</span>' : '') +
                '</div>' +
                '<div class="rt-option-sections">' + sectionLine + '</div>' +
                '</button>';
        }).join('') +
            (state.options.length > visible.length ? '<div class="rt-msg" style="align-self:center;">Showing the top 8 of ' + state.options.length + ' ranked options.</div>' : '');
    }

    /* ---------------------------------------------------------------------
       Preview / timetable
       --------------------------------------------------------------------- */
    function currentSections() {
        var out = [];
        state.selected.forEach(function (sel) {
            if (!sel.sectionId) return;
            var sec = SECTION_BY_ID[sel.sectionId];
            if (sec && sec.code === sel.code) out.push(sec);
        });
        return out;
    }

    function allMeetings() {
        var out = [];
        currentSections().forEach(function (sec, idx) {
            meetingsOf(sec).forEach(function (m) {
                out.push({
                    day: m[0], start: m[1], end: m[2], room: m[3] || '',
                    code: sec.code, title: sec.title, section: sec.section,
                    faculty: (sec.faculty || []).join(', '), tentative: sec.tentative,
                    colorKey: sec.code, custom: false
                });
            });
        });
        state.custom.forEach(function (c) {
            c.meetings.forEach(function (m) {
                out.push({
                    day: m[0], start: m[1], end: m[2], room: m[3] || '',
                    code: 'CUSTOM', title: c.title, section: '',
                    faculty: c.faculty || '', tentative: false,
                    colorKey: c.id, custom: true
                });
            });
        });
        return out;
    }

    function colourFor(keyStr) {
        var h = 0;
        for (var i = 0; i < keyStr.length; i++) h = (h * 31 + keyStr.charCodeAt(i)) >>> 0;
        return PALETTE[h % PALETTE.length];
    }

    function renderPreview() {
        var meetings = allMeetings();
        var secs = currentSections();
        var wrap = $('#timetable');
        var note = $('#previewNote');
        var stats = $('#previewStats');
        var legend = $('#legend');
        var clashAlert = $('#clashAlert');

        var totalCourses = secs.length + state.custom.length;

        if (!meetings.length) {
            note.textContent = totalCourses
                ? 'Pick a section for each course (or press Auto-generate) to see your week.'
                : 'Select courses on the left to preview your schedule';
            stats.innerHTML = [
                ['Courses', totalCourses],
                ['Credits', 0],
                ['Class days', 0],
                ['Weekly classes', 0]
            ].map(function (s) {
                return '<div class="rt-kpi"><div class="n">' + esc(s[1]) + '</div><div class="l">' + esc(s[0]) + '</div></div>';
            }).join('');
            legend.innerHTML = '';
            clashAlert.style.display = 'none';

            var minStart = 8 * 60;
            var maxEnd = 17 * 60;
            var span = maxEnd - minStart;
            var height = 480;
            var hourLines = '';
            for (var mins = minStart; mins <= maxEnd; mins += 30) {
                var top = ((mins - minStart) / span) * 100;
                hourLines += '<div class="rt-tt-line' + (mins % 60 ? ' half' : '') + '" style="top:' + top + '%"></div>';
            }
            var times = '';
            for (var h = minStart; h <= maxEnd; h += 60) {
                times += '<span class="rt-tt-hour" style="top:' + (((h - minStart) / span) * 100) + '%">' + fmtTime(h) + '</span>';
            }
            var head = '<div class="rt-tt-corner"></div>' + DAYS.map(function (d) {
                return '<div class="rt-tt-head"><b>' + d + '</b></div>';
            }).join('');
            var cols = DAYS.map(function (d) {
                return '<div class="rt-tt-day">' + hourLines + '</div>';
            }).join('');

            wrap.innerHTML = '<div class="rt-tt-relative-wrap">' +
                '<div class="rt-tt rt-tt-is-empty" style="height:' + height + 'px">' +
                head + '<div class="rt-tt-times">' + times + '</div>' + cols +
                '</div>' +
                '<div class="rt-tt-empty-overlay">' +
                '<div class="rt-tt-empty-card">' +
                '<i class="fas fa-calendar-week"></i>' +
                '<b>Your Weekly Routine Canvas</b>' +
                '<span>Search courses on the left and select sections, or click <b>Auto-generate</b> to find clash-free combinations.</span>' +
                '</div>' +
                '</div>' +
                '</div>';
            return;
        }

        note.textContent = totalCourses + ' course(s) · ' + (state.cal ? state.cal.title : 'calendar not selected') +
            ' · ' + fmtDate(fromKey(state.first)) + ' → ' + fmtDate(fromKey(state.last));

        // conflicts
        var clashIdx = {};
        var clashList = [];
        for (var i = 0; i < meetings.length; i++) {
            for (var j = i + 1; j < meetings.length; j++) {
                if (overlaps(
                    [meetings[i].day, meetings[i].start, meetings[i].end],
                    [meetings[j].day, meetings[j].start, meetings[j].end]
                )) {
                    clashIdx[i] = true; clashIdx[j] = true;
                    if (clashList.length < 4) {
                        clashList.push(meetings[i].code + ' × ' + meetings[j].code + ' on ' +
                            meetings[i].day + ' ' + fmtTime(Math.max(meetings[i].start, meetings[j].start)) +
                            '–' + fmtTime(Math.min(meetings[i].end, meetings[j].end)));
                    }
                }
            }
        }
        if (clashList.length) {
            clashAlert.style.display = '';
            $('#clashText').innerHTML = '<b>Time clash detected.</b> ' + esc(clashList.join(' · ')) +
                (Object.keys(clashIdx).length > 4 ? ' …' : '');
        } else {
            clashAlert.style.display = 'none';
        }

        // stats
        var credits = secs.reduce(function (n, s) { return n + (s.credit || 0); }, 0) +
            state.custom.reduce(function (n, c) { return n + (c.credit || 0); }, 0);
        var daysUsed = DAYS.filter(function (d) {
            return meetings.some(function (m) { return m.day === d; });
        }).length;
        var icsStats = null;
        try { icsStats = buildICS(); state.icsStats = icsStats; } catch (e) { state.icsStats = null; }

        stats.innerHTML = [
            ['Courses', totalCourses],
            ['Credits', credits],
            ['Class days', daysUsed],
            ['Weekly classes', meetings.length],
            ['Term classes', icsStats ? icsStats.classes : '—'],
            ['Last class', fromKey(state.last) ? fmtShort(fromKey(state.last)) : '—']
        ].map(function (s) {
            return '<div class="rt-kpi"><div class="n">' + esc(s[1]) + '</div><div class="l">' + esc(s[0]) + '</div></div>';
        }).join('');

        // timetable geometry
        var minStart = Math.min.apply(null, meetings.map(function (m) { return m.start; }));
        var maxEnd = Math.max.apply(null, meetings.map(function (m) { return m.end; }));
        minStart = Math.floor(Math.min(minStart, 8 * 60) / 60) * 60;
        maxEnd = Math.ceil(Math.max(maxEnd, 17 * 60) / 60) * 60;
        if (maxEnd - minStart < 240) maxEnd = minStart + 240;
        var height = Math.max(420, Math.round((maxEnd - minStart) / 60 * 72));
        var span = maxEnd - minStart;

        // first date of each weekday in the term
        var base = fromKey(state.first) || (state.begin ? state.begin.start : new Date());
        var dayDates = {};
        DAYS.forEach(function (d) {
            var wd = DAYS_WD[DAYS.indexOf(d)];
            var cur = base;
            for (var k = 0; k < 7; k++) {
                if (cur.getUTCDay() === wd) { dayDates[d] = cur; break; }
                cur = addDays(cur, 1);
            }
        });

        var hourLines = '';
        for (var mins = minStart; mins <= maxEnd; mins += 30) {
            var top = ((mins - minStart) / span) * 100;
            hourLines += '<div class="rt-tt-line' + (mins % 60 ? ' half' : '') + '" style="top:' + top + '%"></div>';
        }

        var times = '';
        for (var h = minStart; h <= maxEnd; h += 60) {
            times += '<span class="rt-tt-hour" style="top:' + (((h - minStart) / span) * 100) + '%">' + fmtTime(h) + '</span>';
        }

        var head = '<div class="rt-tt-corner"></div>' + DAYS.map(function (d) {
            return '<div class="rt-tt-head"><b>' + d + '</b><span>' +
                (dayDates[d] ? MONTHS[dayDates[d].getUTCMonth()] + ' ' + dayDates[d].getUTCDate() : '') +
                '</span></div>';
        }).join('');

        var cols = DAYS.map(function (d) {
            var blocks = meetings.map(function (m, idx) {
                if (m.day !== d) return '';
                var top = ((m.start - minStart) / span) * 100;
                var hgt = ((m.end - m.start) / span) * 100;
                var color = colourFor(m.colorKey);
                var soft = 'color-mix(in srgb, ' + color + ' 13%, var(--surface))';
                var border = 'color-mix(in srgb, ' + color + ' 34%, var(--surface))';
                var label = m.custom ? m.title : m.code + (m.section ? ' (' + m.section + ')' : '');
                var tip = label + ' · ' + m.title + '\n' + m.day + ' ' + fmtTime(m.start) + '–' + fmtTime(m.end) +
                    (m.room ? '\nRoom ' + m.room : '') + (m.faculty ? '\n' + m.faculty : '');
                return '<div class="rt-tt-block' + (clashIdx[idx] ? ' conflict' : '') + '"' +
                    ' style="top:' + top + '%;height:' + hgt + '%;--c:' + color + ';--c-soft:' + soft + ';--c-border:' + border + '"' +
                    ' title="' + esc(tip) + '">' +
                    '<b>' + esc(label) + '</b>' +
                    (m.custom ? '' : '<span class="rm">' + esc(m.title) + '</span>') +
                    '<span class="tm">' + fmtTime(m.start) + '–' + fmtTime(m.end) + (m.room ? ' · ' + esc(m.room) : '') + '</span>' +
                    '</div>';
            }).join('');
            return '<div class="rt-tt-day" style="height:' + height + 'px;">' + hourLines + blocks + '</div>';
        }).join('');

        wrap.innerHTML = '<div class="rt-tt">' + head +
            '<div class="rt-tt-times" style="height:' + height + 'px;">' + times + '</div>' +
            cols + '</div>';

        var seen = {};
        legend.innerHTML = meetings.filter(function (m) {
            if (seen[m.colorKey]) return false;
            seen[m.colorKey] = 1;
            return true;
        }).map(function (m) {
            return '<span><i style="background:' + colourFor(m.colorKey) + '"></i>' +
                esc(m.custom ? m.title : m.code + ' — ' + m.title) + '</span>';
        }).join('');
    }

    /* ---------------------------------------------------------------------
       .ics builder (ported from the UIU Routine -> .ics tool)
       --------------------------------------------------------------------- */
    function icsEsc(s) {
        return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    }

    function fold(line) {
        var enc = new TextEncoder(), dec = new TextDecoder();
        var b = enc.encode(line), out = [], first = true;
        while (b.length > (first ? 75 : 74)) {
            var n = first ? 75 : 74;
            while ((b[n] & 0xC0) === 0x80) n--;
            out.push((first ? '' : ' ') + dec.decode(b.slice(0, n)));
            b = b.slice(n);
            first = false;
        }
        out.push((first ? '' : ' ') + dec.decode(b));
        return out.join('\r\n');
    }

    function hash(s) {
        var h = 5381;
        for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        return h.toString(16) + s.length.toString(16);
    }

    function buildICS() {
        if (!state.cal) throw new Error('Choose an academic calendar first.');
        var first = fromKey(state.first), last = fromKey(state.last);
        if (!first || !last) throw new Error('Set the first and last class day.');
        if (last < first) throw new Error('The last class day is before the first class day.');

        var secs = currentSections();
        if (!secs.length && !state.custom.length) throw new Error('Add at least one course first.');

        var entries = [];
        function addEntry(title, meetings, faculty) {
            var groups = {};
            meetings.forEach(function (m) {
                var k = m[1] + '|' + m[2] + '|' + (m[3] || '');
                if (!groups[k]) groups[k] = { start: m[1], end: m[2], room: m[3] || '', days: [] };
                var wd = DAYS_WD[DAYS.indexOf(m[0])];
                if (wd !== undefined) groups[k].days.push(wd);
            });
            Object.keys(groups).forEach(function (k) {
                var g = groups[k];
                entries.push({ title: title, days: g.days, start: g.start, end: g.end, room: g.room, faculty: faculty || '' });
            });
        }

        secs.forEach(function (sec) {
            addEntry(sec.code + ' (' + sec.section + ') - ' + sec.title, sec.meetings, (sec.faculty || []).join(', '));
        });
        state.custom.forEach(function (c) {
            addEntry(c.title, c.meetings, c.faculty || '');
        });

        var evs = state.events;
        var blocked = {};
        evs.filter(function (e) { return ['exam', 'holiday', 'suspend'].indexOf(e.kind) !== -1; }).forEach(function (e) {
            for (var d = e.start; d <= e.end; d = addDays(d, 1)) blocked[key(d)] = 1;
        });
        var makeup = {};
        evs.filter(function (e) { return e.kind === 'makeup'; }).forEach(function (e) {
            for (var d = e.start; d <= e.end; d = addDays(d, 1)) makeup[key(d)] = e.wd;
        });

        var termName = state.cal.title.replace(/\s*Trimester.*$/i, '') || state.cal.title;
        var L = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EZ_UIU Routine Builder//EN',
            'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
            'X-WR-CALNAME:' + icsEsc('UIU ' + termName + ' schedule'),
            'X-WR-TIMEZONE:' + TZ,
            'BEGIN:VTIMEZONE', 'TZID:' + TZ, 'BEGIN:STANDARD', 'DTSTART:19700101T000000',
            'TZOFFSETFROM:+0600', 'TZOFFSETTO:+0600', 'TZNAME:+06', 'END:STANDARD', 'END:VTIMEZONE'
        ];
        var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        function pushEvent(body) { L.push('BEGIN:VEVENT', 'DTSTAMP:' + stamp); L.push.apply(L, body); L.push('END:VEVENT'); }
        var clock = function (m) {
            return pad2(Math.floor(m / 60)) + pad2(m % 60) + '00';
        };
        var alarmMin = +state.alarmMin || 0;
        var classes = 0, lastClass = null, makeupDays = 0, perCourse = {};

        for (var d = first; d <= last; d = addDays(d, 1)) {
            var k = key(d);
            if (blocked[k]) continue;
            var isMk = Object.prototype.hasOwnProperty.call(makeup, k);
            var wd = isMk ? makeup[k] : d.getUTCDay();
            var todays = entries.filter(function (e) { return e.days.indexOf(wd) !== -1; });
            if (isMk) makeupDays++;

            todays.forEach(function (e) {
                var body = [
                    'UID:' + hash(e.title + k + e.start) + '@ez-uiu-routine',
                    'DTSTART;TZID=' + TZ + ':' + ymd(d) + 'T' + clock(e.start),
                    'DTEND;TZID=' + TZ + ':' + ymd(d) + 'T' + clock(e.end),
                    'SUMMARY:' + icsEsc((isMk ? '[Makeup · Online] ' : '') + e.title),
                    'LOCATION:' + icsEsc(isMk ? 'Online' : (e.room ? e.room + ', UIU Campus' : 'UIU Campus')),
                    'DESCRIPTION:' + icsEsc((e.faculty ? 'Faculty: ' + e.faculty + '\n' : '') +
                        (isMk ? 'Online class, follows ' + WD[wd] + ' routine' : '') +
                        (state.cal ? '\nTerm: ' + state.cal.title : ''))
                ];
                if (state.alarm && alarmMin > 0) {
                    body.push('BEGIN:VALARM', 'TRIGGER:-PT' + alarmMin + 'M', 'ACTION:DISPLAY',
                        'DESCRIPTION:Class soon', 'END:VALARM');
                }
                pushEvent(body);
                classes++;
                lastClass = d;
                perCourse[e.title] = (perCourse[e.title] || 0) + 1;
            });
        }

        var allday = 0;
        evs.forEach(function (e) {
            if (e.kind === 'makeup') return;
            if (e.kind === 'info' && !state.includeInfo) return;
            var summary = e.text.length > 90 ? e.text.slice(0, 87) + '…' : e.text;
            var body = [
                'UID:' + hash(e.text + key(e.start)) + '@ez-uiu-calendar',
                'DTSTART;VALUE=DATE:' + ymd(e.start),
                'DTEND;VALUE=DATE:' + ymd(addDays(e.end, 1)),
                'SUMMARY:' + icsEsc(summary),
                'TRANSP:TRANSPARENT'
            ];
            if (e.text.length > 90) body.push('DESCRIPTION:' + icsEsc(e.text));
            pushEvent(body);
            allday++;
        });

        L.push('END:VCALENDAR');
        return {
            ics: L.map(fold).join('\r\n') + '\r\n',
            classes: classes, allday: allday, makeupDays: makeupDays,
            lastClass: lastClass, first: first, last: last, perCourse: perCourse,
            entries: entries
        };
    }

    function downloadICS() {
        try {
            var r = buildICS();
            var blob = new Blob([r.ics], { type: 'text/calendar;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            var term = (state.cal.term || 'term') + '_' + (state.cal.year || '');
            a.href = url;
            a.download = 'UIU_' + term + '_routine.ics';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
            toast('Calendar ready — ' + r.classes + ' class events, ' + r.allday + ' all-day entries.', 'ok');
        } catch (e) {
            toast(e.message, 'bad');
        }
    }

    function buildSummary() {
        var secs = currentSections();
        if (!secs.length && !state.custom.length) throw new Error('Add at least one course first.');
        var lines = [];
        lines.push('UNITED INTERNATIONAL UNIVERSITY (UIU)');
        lines.push((state.cal ? state.cal.title : 'Class routine').toUpperCase());
        if (state.first && state.last) lines.push(fmtDate(fromKey(state.first)) + ' → ' + fmtDate(fromKey(state.last)));
        lines.push('');

        var n = 0;
        secs.forEach(function (sec) {
            n++;
            lines.push('[' + n + '] ' + sec.code + ' (Section: ' + sec.section + ') - ' + sec.title +
                ' · ' + sec.credit + ' credit(s)' + (sec.tentative ? ' · TENTATIVE' : ''));
            if (sec.faculty.length) lines.push('    Faculty: ' + sec.faculty.join(', '));
            sec.meetings.forEach(function (m) {
                lines.push('    ' + m[0] + ' ' + fmtTime(m[1]) + ' - ' + fmtTime(m[2]) + ' | Room: ' + (m[3] || 'TBA'));
            });
            lines.push('');
        });
        state.custom.forEach(function (c) {
            n++;
            lines.push('[' + n + '] ' + c.title + ' · custom');
            if (c.faculty) lines.push('    Faculty: ' + c.faculty);
            c.meetings.forEach(function (m) {
                lines.push('    ' + m[0] + ' ' + fmtTime(m[1]) + ' - ' + fmtTime(m[2]) + ' | Room: ' + (m[3] || 'TBA'));
            });
            lines.push('');
        });
        return lines.join('\n');
    }

    function copySummary() {
        var text;
        try { text = buildSummary(); } catch (e) { toast(e.message, 'bad'); return; }
        function done() { toast('Routine copied to the clipboard.', 'ok'); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); });
        } else {
            fallbackCopy(text);
        }
    }
    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); toast('Routine copied to the clipboard.', 'ok'); }
        catch (e) { toast('Could not copy the routine.', 'bad'); }
        ta.remove();
    }

    /* ---------------------------------------------------------------------
       Calendar fetch / paste
       --------------------------------------------------------------------- */
    var PROXIES = [
        function (u) { return u; },
        function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
        function (u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); }
    ];

    function fetchCalendar() {
        var btn = $('#btnFetchCal');
        var msg = $('#calMsg');
        btn.disabled = true;
        msg.className = 'rt-msg';
        msg.textContent = 'Fetching the latest UIU academic calendar…';

        var url = 'https://www.uiu.ac.bd/academics/calendar/';
        var chain = Promise.resolve(null);
        PROXIES.forEach(function (proxy, i) {
            chain = chain.then(function (ok) {
                if (ok) return ok;
                var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
                var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
                return fetch(proxy(url), { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
                    .then(function (r) {
                        if (!r.ok) throw new Error('HTTP ' + r.status);
                        return r.text();
                    })
                    .then(function (text) {
                        if (timer) clearTimeout(timer);
                        var secs = ingest(text);
                        if (!secs.length) throw new Error('no rows');
                        addParsedCalendars(secs, i ? 'Fetched via public CORS proxy' : 'Fetched directly');
                        return true;
                    })
                    .catch(function () {
                        if (timer) clearTimeout(timer);
                        return null;
                    });
            });
        });

        chain.then(function (ok) {
            btn.disabled = false;
            if (!ok) {
                msg.className = 'rt-msg warn';
                msg.textContent = 'Could not fetch the UIU page (it usually blocks browser requests). The bundled calendar is still selected — or paste the page text below.';
                $('#calPasteWrap').hidden = false;
            }
        });
    }

    /* ---------------------------------------------------------------------
       Custom classes
       --------------------------------------------------------------------- */
    function addCustomCourse() {
        var title = $('#customTitle').value.trim();
        var start = hhmmToMin($('#customStart').value);
        var end = hhmmToMin($('#customEnd').value);
        var days = $$('#customDays input:checked').map(function (i) { return i.value; });
        var msg = $('#customMsg');

        if (!title) { msg.className = 'rt-msg bad'; msg.textContent = 'Give the class a title.'; return; }
        if (!days.length) { msg.className = 'rt-msg bad'; msg.textContent = 'Pick at least one day.'; return; }
        if (start === null || end === null) { msg.className = 'rt-msg bad'; msg.textContent = 'Set a start and end time.'; return; }
        if (end <= start) { msg.className = 'rt-msg bad'; msg.textContent = 'The end time must be after the start time.'; return; }

        var creditRaw = $('#customCredit') ? parseFloat($('#customCredit').value) : 0;
        var room = $('#customRoom').value.trim();
        var faculty = $('#customFaculty').value.trim();

        state.custom.push({
            id: 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            title: title,
            credit: isNaN(creditRaw) ? 0 : creditRaw,
            faculty: faculty,
            meetings: days.map(function (d) { return [d, start, end, room]; })
        });
        state.options = [];
        state.activeOption = -1;

        msg.className = 'rt-msg ok';
        msg.textContent = 'Added.';

        $('#customTitle').value = '';
        $$('#customDays input:checked').forEach(function (i) { i.checked = false; });
        if ($('#customCredit')) $('#customCredit').value = '0';
        save();
        renderCourses();
        renderOptions();
        renderPreview();
    }

    /* ---------------------------------------------------------------------
       Wiring
       --------------------------------------------------------------------- */
    function bind() {
        // calendar
        $('#calSelect').addEventListener('change', function (e) {
            selectCalendar(e.target.value, true);
        });
        $('#calFirst').addEventListener('change', function (e) {
            if (e.target.value) state.first = e.target.value;
            save();
            renderCalendar();
            renderPreview();
        });
        $('#calLast').addEventListener('change', function (e) {
            if (e.target.value) state.last = e.target.value;
            save();
            renderCalendar();
            renderPreview();
        });
        $('#btnFetchCal').addEventListener('click', fetchCalendar);
        var btnToggleDetails = $('#btnToggleCalDetails');
        if (btnToggleDetails) {
            btnToggleDetails.addEventListener('click', function () {
                var wrap = $('#calDetailsWrap');
                if (wrap) wrap.hidden = !wrap.hidden;
            });
        }
        $('#btnPasteCal').addEventListener('click', function () {
            var details = $('#calDetailsWrap');
            if (details) details.hidden = false;
            var box = $('#calPasteWrap');
            box.hidden = !box.hidden;
            if (!box.hidden) $('#pasteArea').focus();
        });
        $('#btnParsePaste').addEventListener('click', function () {
            addParsedCalendars(ingest($('#pasteArea').value), 'Parsed pasted text');
        });
        $('#calFile').addEventListener('change', function (e) {
            var f = e.target.files && e.target.files[0];
            e.target.value = '';
            if (!f) return;
            f.text().then(function (text) {
                addParsedCalendars(ingest(text), 'Loaded ' + f.name);
            });
        });

        // search
        var search = $('#courseSearch');
        search.addEventListener('input', renderSearchResults);
        search.addEventListener('focus', renderSearchResults);
        search.addEventListener('keydown', function (e) {
            var items = $$('#searchResults .rt-search-item');
            if (!items.length) return;
            var active = items.findIndex(function (it) { return it.classList.contains('active'); });
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                active = (active + 1) % items.length;
                items.forEach(function (it, i) { it.classList.toggle('active', i === active); });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                active = active <= 0 ? items.length - 1 : active - 1;
                items.forEach(function (it, i) { it.classList.toggle('active', i === active); });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                var pick = active >= 0 ? items[active] : items[0];
                if (pick) {
                    addCourse(pick.dataset.code);
                    search.value = '';
                    renderSearchResults();
                }
            } else if (e.key === 'Escape') {
                $('#searchResults').classList.remove('open');
            }
        });
        $('#searchResults').addEventListener('click', function (e) {
            var item = e.target.closest('.rt-search-item');
            if (!item) return;
            addCourse(item.dataset.code);
            search.value = '';
            renderSearchResults();
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.rt-search-wrap')) $('#searchResults').classList.remove('open');
        });

        // program filter
        $('#programFilters').addEventListener('click', function (e) {
            var btn = e.target.closest('.ez-filter-btn');
            if (!btn) return;
            state.program = btn.dataset.program;
            $$('#programFilters .ez-filter-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
            renderSearchResults();
            save();
        });

        // course list
        $('#courseList').addEventListener('change', function (e) {
            var select = e.target.closest('select[data-role="section"]');
            if (!select) return;
            var row = e.target.closest('.rt-course');
            var code = row.dataset.code;
            var sel = state.selected.filter(function (c) { return c.code === code; })[0];
            if (!sel) return;
            sel.sectionId = select.value || null;
            state.activeOption = -1;
            save();
            renderCourses();
            renderOptions();
            renderPreview();
        });
        $('#courseList').addEventListener('click', function (e) {
            var remove = e.target.closest('[data-remove]');
            if (remove) { removeCourse(remove.dataset.remove); return; }
            var customBtn = e.target.closest('[data-remove-custom]');
            if (customBtn) { removeCustom(customBtn.dataset.removeCustom); }
        });
        $('#btnClearCourses').addEventListener('click', function () {
            if (!state.selected.length && !state.custom.length) return;
            state.selected = [];
            state.custom = [];
            state.options = [];
            state.activeOption = -1;
            save();
            renderCourses();
            renderOptions();
            renderPreview();
            toast('Course list cleared.', '');
        });

        // custom class
        $('#btnAddCustom').addEventListener('click', addCustomCourse);

        // solver
        $('#btnSolve').addEventListener('click', solve);
        $('#btnSolveTop').addEventListener('click', function () {
            solve();
            var box = $('#optionList');
            if (box && box.children.length) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        $('#optionList').addEventListener('click', function (e) {
            var card = e.target.closest('.rt-option');
            if (card) applyOption(+card.dataset.index);
        });
        $('#daysOff').addEventListener('change', function () {
            state.daysOff = $$('#daysOff input:checked').map(function (i) { return i.value; });
            save();
        });
        $('#optEarliest').addEventListener('change', function (e) { state.earliest = e.target.value; save(); });
        $('#optLatest').addEventListener('change', function (e) { state.latest = e.target.value; save(); });
        $('#optInfo').addEventListener('change', function (e) {
            state.includeInfo = e.target.checked; save(); renderPreview();
        });
        $('#optAlarm').addEventListener('change', function (e) {
            state.alarm = e.target.checked; save(); renderPreview();
        });
        $('#alarmMin').addEventListener('change', function (e) {
            state.alarmMin = Math.max(0, Math.min(120, +e.target.value || 0)); save(); renderPreview();
        });

        // export
        $('#btnDownload').addEventListener('click', downloadICS);
        $('#btnDownload2').addEventListener('click', downloadICS);
        $('#btnCopy').addEventListener('click', copySummary);
        $('#btnPrint').addEventListener('click', function () { window.print(); });
    }

    /* ---------------------------------------------------------------------
       Init
       --------------------------------------------------------------------- */
    function init() {
        restore();
        prepareCalendar(CALS.filter(function (c) { return c.id === state.calId; })[0] || CALS[0]);
        applyCalendarDefaults(false);

        // reflect restored controls
        $('#optInfo').checked = state.includeInfo;
        $('#optAlarm').checked = state.alarm;
        $('#alarmMin').value = state.alarmMin;
        $('#optEarliest').value = state.earliest;
        $('#optLatest').value = state.latest;
        $$('#daysOff input').forEach(function (i) { i.checked = state.daysOff.indexOf(i.value) !== -1; });
        $$('#programFilters .ez-filter-btn').forEach(function (b) {
            b.classList.toggle('active', b.dataset.program === state.program);
        });

        bind();
        renderCalendar();
        renderCourses();
        renderOptions();
        renderPreview();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
