import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bus,
  Clock,
  MapPin,
  Search,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  Compass,
  AlertCircle,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import Surface, { SurfaceHeader } from '../ui/Surface';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import {
  SHUTTLE_SCHEDULE,
  KURIL_SHUTTLE_SCHEDULE,
  EWU_SHUTTLE_SCHEDULE,
  BUS_ROUTES,
  CAMPUS_OFFICE_DIRECTORY,
} from '../../data/commuteData';
import { Zap } from 'lucide-react';

export default function CommuteView() {
  const [activeSubTab, setActiveSubTab] = useState('shuttle');
  const [shuttleDirection, setShuttleDirection] = useState('toCampus'); // 'toCampus' or 'fromCampus'
  const [kurilDirection, setKurilDirection] = useState('toCampus'); // 'toCampus' (Kuril -> UIU) or 'fromCampus' (UIU -> Kuril)
  const [routeSearch, setRouteSearch] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('r1');

  // Compute live current time in Bangladesh (GMT+6)
  const [currentTime, setCurrentTime] = useState(() => {
    return new Date();
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute next upcoming Notun Bazar shuttle departure
  const nextShuttleInfo = useMemo(() => {
    const activeList =
      shuttleDirection === 'toCampus'
        ? SHUTTLE_SCHEDULE.notunBazarToUiu
        : SHUTTLE_SCHEDULE.uiuToNotunBazar;

    // Get current time in Dhaka
    const dhakaString = currentTime.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [currentHour, currentMin] = dhakaString.split(':').map(Number);
    const currentTotalMin = currentHour * 60 + currentMin;

    for (const item of activeList) {
      const [h, m] = item.departure.split(':').map(Number);
      const totalMin = h * 60 + m;
      if (totalMin > currentTotalMin) {
        const diffMin = totalMin - currentTotalMin;
        return {
          upcoming: item,
          minutesAway: diffMin,
          status: diffMin <= 15 ? 'DEPARTING_SOON' : 'SCHEDULED',
        };
      }
    }

    return {
      upcoming: null,
      minutesAway: null,
      status: 'DONE_FOR_DAY',
    };
  }, [shuttleDirection, currentTime]);

  // Compute next upcoming Kuril shuttle departure
  const nextKurilShuttleInfo = useMemo(() => {
    const activeList =
      kurilDirection === 'toCampus'
        ? KURIL_SHUTTLE_SCHEDULE.kurilToUiu
        : KURIL_SHUTTLE_SCHEDULE.uiuToKuril;

    const dhakaString = currentTime.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [currentHour, currentMin] = dhakaString.split(':').map(Number);
    const currentTotalMin = currentHour * 60 + currentMin;

    for (const item of activeList) {
      const [h, m] = item.departure.split(':').map(Number);
      const totalMin = h * 60 + m;
      if (totalMin > currentTotalMin) {
        const diffMin = totalMin - currentTotalMin;
        return {
          upcoming: item,
          minutesAway: diffMin,
          status: diffMin <= 15 ? 'DEPARTING_SOON' : 'SCHEDULED',
        };
      }
    }

    return {
      upcoming: null,
      minutesAway: null,
      status: 'DONE_FOR_DAY',
    };
  }, [kurilDirection, currentTime]);

  const filteredRoutes = useMemo(() => {
    const q = routeSearch.toLowerCase().trim();
    if (!q) return BUS_ROUTES;
    return BUS_ROUTES.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.stoppages.some((s) => s.toLowerCase().includes(q))
    );
  }, [routeSearch]);

  const activeRoute = useMemo(
    () => BUS_ROUTES.find((r) => r.id === selectedRouteId) || BUS_ROUTES[0],
    [selectedRouteId]
  );

  const subTabs = [
    { value: 'shuttle', label: 'Notun Bazar Shuttle', icon: Navigation },
    { value: 'kuril', label: 'Kuril Shuttle (Express)', icon: Zap },
    { value: 'routes', label: 'Student AC Buses (6 Routes)', icon: Bus },
    { value: 'ewu', label: 'EWU Shuttle', icon: Compass },
    { value: 'directory', label: 'Campus Help & CITS', icon: Building2 },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            Campus Logistics & Commute Navigator
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-3xl">
            UIU Transport & Shuttle Hub
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-card">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Dhaka Time</span>
            <span className="num font-mono text-sm font-bold text-ink">
              {currentTime.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Dhaka',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      <Tabs tabs={subTabs} value={activeSubTab} onChange={setActiveSubTab} layoutId="commute-subtabs" />

      {/* ================= TAB 1: NOTUN BAZAR SHUTTLE ================= */}
      {activeSubTab === 'shuttle' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          {/* Left Panel: Live Departure Countdown */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface className="p-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-accent" />
                  Live Shuttle Status
                </h3>
                <span className="rounded-full bg-ok/15 text-ok border border-ok/30 px-2.5 py-0.5 text-[10px] font-bold">
                  Daily Service
                </span>
              </div>

              {/* Direction Toggle */}
              <div className="grid grid-cols-2 gap-1.5 mt-4 p-1 rounded-xl bg-surface2/60 border border-line">
                <button
                  onClick={() => setShuttleDirection('toCampus')}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                    shuttleDirection === 'toCampus'
                      ? 'bg-surface text-accent shadow-sm'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  Notun Bazar ➔ UIU
                </button>
                <button
                  onClick={() => setShuttleDirection('fromCampus')}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                    shuttleDirection === 'fromCampus'
                      ? 'bg-surface text-accent shadow-sm'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  UIU ➔ Notun Bazar
                </button>
              </div>

              {/* Next Departure Hero Card */}
              <div className="mt-4 rounded-2xl border border-accent/30 bg-accentSoft p-4 text-center">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-accent">
                  {shuttleDirection === 'toCampus' ? 'Next from Notun Bazar' : 'Next from UIU Campus'}
                </span>
                <div className="mt-2 text-2xl font-extrabold text-ink font-mono">
                  {nextShuttleInfo.upcoming
                    ? nextShuttleInfo.upcoming.period
                    : 'Done for the Day'}
                </div>
                <div className="mt-1.5 text-xs font-medium text-ink-2">
                  {nextShuttleInfo.minutesAway != null ? (
                    <span className="inline-flex items-center gap-1 text-accent font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      Departs in ≈ {nextShuttleInfo.minutesAway} minutes
                    </span>
                  ) : (
                    'All scheduled shifts for today have concluded'
                  )}
                </div>
              </div>

              {/* Stoppage Route Points */}
              <div className="mt-5 border-t border-line pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  Shuttle Route Sequence (5 Points):
                </span>
                <div className="mt-3 relative pl-4 border-l-2 border-accent/40 space-y-3">
                  {SHUTTLE_SCHEDULE.stoppages.map((stop, i) => (
                    <div key={stop} className="relative flex items-center justify-between text-xs">
                      <span className="absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-surface border-2 border-accent text-[9px] font-bold text-accent">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-ink">{stop}</span>
                      <span className="text-[10px] text-ink-3">
                        {i === 0 ? 'Origin' : i === 4 ? 'Destination' : 'Pickup / Drop'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Surface>
          </div>

          {/* Right Panel: Complete Today's Departures Timeline */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface className="p-5">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">
                All Scheduled Departures ({shuttleDirection === 'toCampus' ? 'Notun Bazar ➔ UIU' : 'UIU ➔ Notun Bazar'})
              </h3>
              <p className="text-xs text-ink-3 mt-0.5">
                Shuttles run on dynamic headway during peak morning rush (07:30 AM – 08:45 AM).
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(shuttleDirection === 'toCampus'
                  ? SHUTTLE_SCHEDULE.notunBazarToUiu
                  : SHUTTLE_SCHEDULE.uiuToNotunBazar
                ).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface2/50 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accentSoft text-accent font-bold text-[11px]">
                        #{idx + 1}
                      </span>
                      <span className="font-mono font-bold text-ink">{item.period}</span>
                    </div>
                    <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold text-ink-3 border border-line">
                      Standard
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ================= TAB 2: KURIL SHUTTLE (EXPRESS) ================= */}
      {activeSubTab === 'kuril' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          {/* Left Panel: Live Departure Countdown */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface className="p-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Kuril Express Shuttle
                </h3>
                <span className="rounded-full bg-accentSoft text-accent border border-accent/30 px-2.5 py-0.5 text-[10px] font-bold">
                  300 Ft Express
                </span>
              </div>

              {/* Direction Toggle */}
              <div className="grid grid-cols-2 gap-1.5 mt-4 p-1 rounded-xl bg-surface2/60 border border-line">
                <button
                  onClick={() => setKurilDirection('toCampus')}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                    kurilDirection === 'toCampus'
                      ? 'bg-surface text-accent shadow-sm'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  Kuril BRTC ➔ UIU
                </button>
                <button
                  onClick={() => setKurilDirection('fromCampus')}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                    kurilDirection === 'fromCampus'
                      ? 'bg-surface text-accent shadow-sm'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  UIU ➔ Kuril BRTC
                </button>
              </div>

              {/* Next Departure Hero Card */}
              <div className="mt-4 rounded-2xl border border-accent/30 bg-accentSoft p-4 text-center">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-accent">
                  {kurilDirection === 'toCampus' ? 'Next from Kuril BRTC Stand' : 'Next from UIU Campus'}
                </span>
                <div className="mt-2 text-2xl font-extrabold text-ink font-mono">
                  {nextKurilShuttleInfo.upcoming
                    ? nextKurilShuttleInfo.upcoming.period
                    : 'Done for the Day'}
                </div>
                <div className="mt-1.5 text-xs font-medium text-ink-2">
                  {nextKurilShuttleInfo.minutesAway != null ? (
                    <span className="inline-flex items-center gap-1 text-accent font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      Departs in ≈ {nextKurilShuttleInfo.minutesAway} minutes
                    </span>
                  ) : (
                    'All scheduled shifts for today have concluded'
                  )}
                </div>
              </div>

              {/* Stoppage Route Points */}
              <div className="mt-5 border-t border-line pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  Kuril Route Stoppages (5 Points):
                </span>
                <div className="mt-3 relative pl-4 border-l-2 border-accent/40 space-y-3">
                  {KURIL_SHUTTLE_SCHEDULE.stoppages.map((stop, i) => (
                    <div key={stop} className="relative flex items-center justify-between text-xs">
                      <span className="absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-surface border-2 border-accent text-[9px] font-bold text-accent">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-ink">{stop}</span>
                      <span className="text-[10px] text-ink-3">
                        {i === 0 ? 'Origin' : i === 4 ? 'Destination' : '300ft Transit'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Surface>
          </div>

          {/* Right Panel: Complete Kuril Departures Timeline */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface className="p-5">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">
                All Scheduled Departures ({kurilDirection === 'toCampus' ? 'Kuril BRTC ➔ UIU' : 'UIU ➔ Kuril BRTC'})
              </h3>
              <p className="text-xs text-ink-3 mt-0.5">
                {KURIL_SHUTTLE_SCHEDULE.description}
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(kurilDirection === 'toCampus'
                  ? KURIL_SHUTTLE_SCHEDULE.kurilToUiu
                  : KURIL_SHUTTLE_SCHEDULE.uiuToKuril
                ).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface2/50 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accentSoft text-accent font-bold text-[11px]">
                        #{idx + 1}
                      </span>
                      <span className="font-mono font-bold text-ink">{item.period}</span>
                    </div>
                    <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold text-ink-3 border border-line">
                      300ft Route
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ================= TAB 3: STUDENT AC BUS ROUTES ================= */}
      {activeSubTab === 'routes' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          {/* Route Selector & Search */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface className="p-5">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                Find My Student Bus
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                Type your area (e.g. Dhanmondi, Mirpur 10, Uttara, Farmgate, Rampura) to find which route stops near you.
              </p>

              <div className="mt-3 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-3" />
                <input
                  type="text"
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  placeholder="Search stoppage or area..."
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 pl-9 pr-3 text-xs text-ink outline-none focus:border-accent"
                />
              </div>

              {/* Route List Chips */}
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  Select Route ({filteredRoutes.length}):
                </span>
                <div className="space-y-1.5">
                  {filteredRoutes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRouteId(r.id)}
                      className={`flex w-full items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedRouteId === r.id
                          ? 'border-accent bg-accentSoft shadow-sm'
                          : 'border-line bg-surface2/50 hover:bg-surface2'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-ink flex items-center gap-1.5">
                          <span>{r.name}</span>
                          {r.expressway && (
                            <span className="rounded bg-ok/15 text-ok px-1.5 py-0.5 text-[9px] font-bold">
                              Expressway
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-3 mt-0.5">{r.title}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-3" />
                    </button>
                  ))}
                </div>
              </div>
            </Surface>
          </div>

          {/* Active Route Detailed Stoppages */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-accent">
                      {activeRoute.name}
                    </span>
                    {activeRoute.expressway && (
                      <span className="rounded-md bg-ok/15 text-ok border border-ok/30 px-2 py-0.5 text-[10px] font-bold">
                        Elevated Expressway on Return
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-ink mt-0.5">{activeRoute.title}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3 block">
                    Campus Return Slots
                  </span>
                  <div className="flex gap-1.5 mt-1">
                    {activeRoute.returnTimes.map((slot) => (
                      <span
                        key={slot}
                        className="rounded-md bg-surface2 px-2 py-0.5 font-mono text-[10.5px] font-bold text-ink"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="my-3 rounded-xl border border-line bg-surface2/40 p-3 text-xs text-ink-2">
                ℹ️ <b>Transit Policy:</b> {activeRoute.notes}
              </div>

              {/* Complete Stoppage Sequence */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">
                  Stoppage Sequence ({activeRoute.stoppages.length} Stops):
                </h4>

                <div className="relative pl-5 border-l-2 border-accent/40 space-y-2.5">
                  {activeRoute.stoppages.map((stop, idx) => (
                    <div key={stop} className="relative flex items-center justify-between text-xs">
                      <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-surface border-2 border-accent text-[10px] font-bold text-accent">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-ink text-[12.5px]">{stop}</span>
                      <span className="rounded bg-surface2 px-2 py-0.5 text-[10px] text-ink-3">
                        {idx === 0
                          ? 'Starting Stoppage'
                          : idx === activeRoute.stoppages.length - 1
                            ? 'Arrival Campus'
                            : 'Boarding Point'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ================= TAB 3: EWU SHUTTLE ================= */}
      {activeSubTab === 'ewu' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          <div className="flex flex-col gap-4 lg:col-span-6">
            <Surface className="p-5">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Compass className="h-4 w-4 text-accent" />
                From East West University (EWU) Gate ➔ UIU
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                Departs from EWU Aftabnagar gate via Swadesh Property Road.
              </p>

              <div className="mt-4 space-y-2">
                {EWU_SHUTTLE_SCHEDULE.fromEwu.map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface2/50 p-3 text-xs"
                  >
                    <span className="font-mono font-bold text-ink">{slot.period}</span>
                    <span className="rounded bg-ok/15 text-ok px-2 py-0.5 text-[10px] font-bold">
                      Direct Shuttle
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-6">
            <Surface className="p-5">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Compass className="h-4 w-4 text-accent" />
                From UIU Campus ➔ EWU Gate (Return)
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                Afternoon return shuttles back to Aftabnagar / Rampura Bridge connection.
              </p>

              <div className="mt-4 space-y-2">
                {EWU_SHUTTLE_SCHEDULE.fromUiu.map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface2/50 p-3 text-xs"
                  >
                    <span className="font-mono font-bold text-ink">{slot.period}</span>
                    <span className="rounded bg-accentSoft text-accent px-2 py-0.5 text-[10px] font-bold">
                      Return Shift
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ================= TAB 4: CAMPUS DIRECTORY & CITS ================= */}
      {activeSubTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pop-in">
          {CAMPUS_OFFICE_DIRECTORY.map((office) => (
            <Surface hover key={office.name} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-accent" />
                    {office.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {office.location}
                </div>
                <p className="mt-2 text-xs text-ink-3 leading-relaxed">{office.desc}</p>
              </div>

              <div className="mt-4 border-t border-line pt-3 flex items-center justify-between">
                <a
                  href={`mailto:${office.email}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {office.email}
                </a>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
