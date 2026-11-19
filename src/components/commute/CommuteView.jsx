import React, { useState, useMemo, useEffect } from 'react';
import {
  Bus,
  Clock,
  MapPin,
  Search,
  Navigation,
  ShieldCheck,
  Building2,
  Mail,
  Compass,
  ChevronRight,
  Zap,
} from 'lucide-react';
import Surface from '../ui/Surface';
import Tabs from '../ui/Tabs';
import Badge from '../ui/Badge';
import Segmented from '../ui/Segmented';
import Input from '../ui/Input';
import {
  SHUTTLE_SCHEDULE,
  KURIL_SHUTTLE_SCHEDULE,
  EWU_SHUTTLE_SCHEDULE,
  BUS_ROUTES,
  CAMPUS_OFFICE_DIRECTORY,
} from '../../data/commuteData';

/* ---------- Dhaka clock helper ---------- */
function dhakaNow(date) {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function dhakaMinutes(date) {
  const [h, m] = dhakaNow(date).split(':').map(Number);
  return h * 60 + m;
}

/* ---------- Find the next departure in a timetable ---------- */
function nextDeparture(list, now) {
  const nowMin = dhakaMinutes(now);
  for (const item of list) {
    const [h, m] = item.departure.split(':').map(Number);
    const total = h * 60 + m;
    if (total > nowMin) {
      const diff = total - nowMin;
      return { upcoming: item, minutesAway: diff, status: diff <= 15 ? 'soon' : 'scheduled' };
    }
  }
  return { upcoming: null, minutesAway: null, status: 'done' };
}

/* ---------- The "next departure" hero used by both shuttle tabs ---------- */
function NextDepartureCard({ caption, info, tone = 'accent' }) {
  const toneRing =
    tone === 'accent'
      ? 'border-accent/25 bg-accentSoft/50'
      : 'border-ok/25 bg-ok/[0.07]';

  return (
    <div className={`mt-4 rounded-2xl border p-4 ${toneRing}`}>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
        {caption}
      </span>
      {info.upcoming ? (
        <>
          <div className="num mt-1.5 text-[24px] font-bold leading-none tracking-tight text-ink">
            {info.upcoming.period}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={info.status === 'soon' ? 'warn' : 'accent'}>
              {info.status === 'soon' ? 'Departing soon' : 'Scheduled'}
            </Badge>
            <span className="text-xs font-medium text-ink-2">
              in ≈ {info.minutesAway} min
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="mt-1.5 text-[19px] font-bold leading-none tracking-tight text-ink-3">
            Done for the day
          </div>
          <p className="mt-2 text-xs text-ink-3">
            All scheduled shifts for today have concluded.
          </p>
        </>
      )}
    </div>
  );
}

/* ---------- Numbered stoppage rail ---------- */
function StoppageRail({ stoppages, lastCaption = 'Destination' }) {
  return (
    <ol className="relative mt-3 space-y-2.5 border-l-2 border-accent/40 pl-5">
      {stoppages.map((stop, i) => (
        <li key={stop} className="relative flex items-center justify-between text-xs">
          <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent bg-surface text-[10px] font-bold text-accent">
            {i + 1}
          </span>
          <span className="truncate font-semibold text-ink text-[12.5px]">{stop}</span>
          <span className="rounded bg-surface2 px-2 py-0.5 text-[10px] text-ink-3">
            {i === 0 ? 'Origin' : i === stoppages.length - 1 ? lastCaption : 'Pickup / Drop'}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Departure list row ---------- */
function DepartureRow({ index, period, tag, tagTone = 'neutral' }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface2/40 px-3 py-2.5">
      <span className="flex items-center gap-2.5">
        <span className="num flex h-5 w-5 items-center justify-center rounded-full bg-accentSoft text-[10px] font-bold text-accent">
          {index + 1}
        </span>
        <span className="num font-mono text-[13px] font-bold text-ink">{period}</span>
      </span>
      <Badge tone={tagTone}>{tag}</Badge>
    </li>
  );
}

/* ---------- One shuttle tab, used for both Notun Bazar and Kuril ---------- */
function ShuttleTab({
  title,
  icon: Icon,
  badge,
  badgeTone = 'accent',
  direction,
  onDirectionChange,
  schedules,
  directionOptions,
  now,
  routeCaption,
  lastCaption,
  note,
  tag,
  tagTone,
}) {
  const info = useMemo(() => nextDeparture(schedules.list, now), [schedules.list, now]);
  const heroCaption =
    direction === 'toCampus' ? routeCaption.from : routeCaption.to;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Surface pad="lg">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
              <Icon className="h-4 w-4 text-accent" />
              {title}
            </h3>
            <Badge tone={badgeTone}>{badge}</Badge>
          </div>

          <Segmented
            block
            className="mt-4"
            value={direction}
            onChange={onDirectionChange}
            options={directionOptions}
          />

          <NextDepartureCard caption={heroCaption} info={info} />

          <div className="mt-5 border-t border-line pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
              Route sequence ({schedules.stoppages.length} points)
            </span>
            <StoppageRail stoppages={schedules.stoppages} lastCaption={lastCaption} />
          </div>
        </Surface>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-7">
        <Surface pad="lg">
          <h3 className="text-[15px] font-bold text-ink">All scheduled departures</h3>
          <p className="mt-1 text-xs text-ink-3">{note}</p>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {schedules.list.map((item, idx) => (
              <DepartureRow
                key={`${item.period}-${idx}`}
                index={idx}
                period={item.period}
                tag={tag}
                tagTone={tagTone}
              />
            ))}
          </ul>
        </Surface>
      </div>
    </div>
  );
}

export default function CommuteView() {
  const [activeSubTab, setActiveSubTab] = useState('shuttle');
  const [shuttleDirection, setShuttleDirection] = useState('toCampus');
  const [kurilDirection, setKurilDirection] = useState('toCampus');
  const [routeSearch, setRouteSearch] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('r1');

  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

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
    { value: 'shuttle', label: 'Notun Bazar', icon: Navigation },
    { value: 'kuril', label: 'Kuril Express', icon: Zap },
    { value: 'routes', label: 'Student AC Buses', icon: Bus },
    { value: 'ewu', label: 'EWU Shuttle', icon: Compass },
    { value: 'directory', label: 'Campus Help', icon: Building2 },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Shuttle &amp; Campus Commute
          </h1>
          <p className="mt-0.5 text-xs text-ink-3">
            Notun Bazar &amp; Kuril shuttles, route navigation, and campus contacts
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-card">
          <Clock className="h-3.5 w-3.5 text-accent" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            Dhaka Time
          </span>
          <span className="num font-mono text-sm font-bold text-ink">
            {dhakaNow(currentTime)}
          </span>
        </div>
      </header>

      <Tabs
        tabs={subTabs}
        value={activeSubTab}
        onChange={setActiveSubTab}
        layoutId="commute-subtabs"
      />

      {/* ---------- Notun Bazar ---------- */}
      {activeSubTab === 'shuttle' && (
        <ShuttleTab
          title="Notun Bazar shuttle"
          icon={Navigation}
          badge="Daily service"
          badgeTone="ok"
          direction={shuttleDirection}
          onDirectionChange={setShuttleDirection}
          schedules={{
            list:
              shuttleDirection === 'toCampus'
                ? SHUTTLE_SCHEDULE.notunBazarToUiu
                : SHUTTLE_SCHEDULE.uiuToNotunBazar,
            stoppages: SHUTTLE_SCHEDULE.stoppages,
          }}
          directionOptions={[
            { value: 'toCampus', label: 'Notun Bazar → UIU' },
            { value: 'fromCampus', label: 'UIU → Notun Bazar' },
          ]}
          now={currentTime}
          routeCaption={{
            from: 'Next from Notun Bazar',
            to: 'Next from UIU campus',
          }}
          lastCaption="Destination"
          note="Dynamic headway during the peak morning rush (07:30 AM – 08:45 AM)."
          tag="Standard"
          tagTone="neutral"
        />
      )}

      {/* ---------- Kuril Express ---------- */}
      {activeSubTab === 'kuril' && (
        <ShuttleTab
          title="Kuril express shuttle"
          icon={Zap}
          badge="300 Ft express"
          direction={kurilDirection}
          onDirectionChange={setKurilDirection}
          schedules={{
            list:
              kurilDirection === 'toCampus'
                ? KURIL_SHUTTLE_SCHEDULE.kurilToUiu
                : KURIL_SHUTTLE_SCHEDULE.uiuToKuril,
            stoppages: KURIL_SHUTTLE_SCHEDULE.stoppages,
          }}
          directionOptions={[
            { value: 'toCampus', label: 'Kuril → UIU' },
            { value: 'fromCampus', label: 'UIU → Kuril' },
          ]}
          now={currentTime}
          routeCaption={{
            from: 'Next from Kuril (Biswa Road)',
            to: 'Next from UIU campus',
          }}
          lastCaption="Destination"
          note={KURIL_SHUTTLE_SCHEDULE.description}
          tag="300ft route"
          tagTone="accent"
        />
      )}

      {/* ---------- Student AC buses ---------- */}
      {activeSubTab === 'routes' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface pad="lg">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                Find my student bus
              </h3>
              <p className="mt-1 text-xs text-ink-3">
                Type your area (Dhanmondi, Mirpur 10, Uttara, Farmgate, Rampura…) to find the route
                that stops near you.
              </p>

              <div className="mt-4">
                <Input
                  type="text"
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  placeholder="Search stoppage or area…"
                  icon={Search}
                  onClear={() => setRouteSearch('')}
                />
              </div>

              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  Select Route ({filteredRoutes.length}):
                </span>
                <div className="mt-2 space-y-1.5">
                  {filteredRoutes.map((r) => {
                    const isActive = selectedRouteId === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRouteId(r.id)}
                        aria-pressed={isActive}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? 'border-accent/40 bg-accentSoft'
                            : 'border-line bg-surface hover:border-line-strong hover:bg-surface2'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                            {r.name}
                            {r.expressway && <Badge tone="ok">Expressway</Badge>}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-ink-3">
                            {r.title}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
                      </button>
                    );
                  })}
                  {filteredRoutes.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-xs text-ink-3">
                      No route matches “{routeSearch}”.
                    </p>
                  )}
                </div>
              </div>
            </Surface>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface pad="lg">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-accent">
                      {activeRoute.name}
                    </span>
                    {activeRoute.expressway && (
                      <Badge tone="ok">Elevated expressway on return</Badge>
                    )}
                  </div>
                  <h3 className="text-[15px] font-bold text-ink mt-0.5">{activeRoute.title}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                    Campus Return Slots
                  </span>
                  <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                    {activeRoute.returnTimes.map((slot) => (
                      <span
                        key={slot}
                        className="num rounded bg-surface px-2 py-0.5 font-mono text-[10px] font-bold text-ink border border-line"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="my-3 rounded-xl border border-line bg-surface2/40 p-3 text-xs text-ink-2">
                <b className="text-ink">Transit policy:</b> {activeRoute.notes}
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">
                  Stoppage Sequence ({activeRoute.stoppages.length} Stops):
                </h4>
                <StoppageRail
                  stoppages={activeRoute.stoppages}
                  lastCaption="Arrival campus"
                />
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ---------- EWU shuttle ---------- */}
      {activeSubTab === 'ewu' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            {
              title: 'EWU gate → UIU',
              sub: 'Departs from the EWU Aftabnagar gate via Swadesh Property Road.',
              list: EWU_SHUTTLE_SCHEDULE.fromEwu,
              tag: 'Direct shuttle',
              tone: 'ok',
            },
            {
              title: 'UIU campus → EWU gate',
              sub: 'Afternoon return shuttles to the Aftabnagar / Rampura Bridge connection.',
              list: EWU_SHUTTLE_SCHEDULE.fromUiu,
              tag: 'Return shift',
              tone: 'accent',
            },
          ].map((block) => (
            <Surface pad="lg" key={block.title}>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Compass className="h-4 w-4 text-accent" />
                {block.title}
              </h3>
              <p className="mt-1 text-xs text-ink-3">{block.sub}</p>
              <ul className="mt-4 space-y-2">
                {block.list.map((slot, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface2/50 p-3 text-xs"
                  >
                    <span className="num font-mono font-bold text-ink">
                      {slot.period}
                    </span>
                    <Badge tone={block.tone}>{block.tag}</Badge>
                  </li>
                ))}
              </ul>
            </Surface>
          ))}
        </div>
      )}

      {/* ---------- Campus directory ---------- */}
      {activeSubTab === 'directory' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAMPUS_OFFICE_DIRECTORY.map((office) => (
            <Surface hover key={office.name} className="flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 shrink-0 text-accent" />
                  {office.name}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                  {office.location}
                </div>
                <p className="mt-2 text-xs text-ink-3 leading-relaxed">{office.desc}</p>
              </div>
              <div className="mt-4 border-t border-line pt-3">
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
