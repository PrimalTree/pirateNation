/* @ts-nocheck */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flag, Ticket, Clock, Megaphone, Sparkles, HandCoins, BellRing, ArrowRight, Info, Trophy, X, Map, MessagesSquare, ShoppingBag, DollarSign, UploadCloud } from "lucide-react";

/**
 * Pirate Nation — MVP Frontend Mockup (Feature Scaffolding)
 * -----------------------------------------------------
 * Add scaffolding for requested features:
 * - Live Score Hub (scores, play-by-play, season schedule)
 * - Interactive Stadium Map (parking, seating, concessions, restrooms)
 * - Parking & Shuttle Info
 * - Fan Polls & Quizzes
 * - Merch Portal
 * - Donation Integration (Pirate Club)
 * - Sponsor Directory
 * - Section Chat (basic stub)
 * - UGC Upload Queue (stub)
 * - Push Notifications settings (kickoff, weather, No Quarter)
 *
 * Note: This is UI/UX scaffolding with mocked data and placeholders where
 * integrations will be wired (CFBD/ESPN, map provider, chat backend, etc.).
 */

// ===================== Helpers =====================
const formatTimeLeft = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// No Quarter trigger helper
const shouldTriggerNoQuarter = (newPeriod: unknown, hasFired: boolean): boolean => {
  if (hasFired) return false;
  const p = Number(newPeriod);
  return Number.isFinite(p) && p >= 4;
};

const nextGameDefault = new Date("2025-09-21T23:00:00Z"); // 7:00 PM ET

// ===================== App Shell =====================
export default function MockupApp() {
  const [tab, setTab] = useState("home"); // home | map | scores | tickets | more
  const [nextGameTime, setNextGameTime] = useState(nextGameDefault);
  const [countdown, setCountdown] = useState(0);
  const [flagOpen, setFlagOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(Math.max(0, nextGameTime.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [nextGameTime]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopBar onOpenFlag={() => setFlagOpen(true)} />
      <SponsorBanner />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6">
        {tab === "home" && (
          <Home
            onOpenFlag={() => setFlagOpen(true)}
            countdown={countdown}
            nextGameTime={nextGameTime}
            setNextGameTime={setNextGameTime}
            goSchedule={() => setTab("scores")}
            goTickets={() => setTab("tickets")}
            goSponsors={() => setTab("more")}
            setToast={setToast}
          />
        )}
        {tab === "map" && <StadiumMap />}
        {tab === "scores" && <ScoresHub setToast={setToast} />}
        {tab === "tickets" && <Tickets />}
        {tab === "more" && <MorePage setToast={setToast} />}
      </main>
      <BottomNav tab={tab} setTab={setTab} openFlag={() => setFlagOpen(true)} />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      {flagOpen && <FlagModal onClose={() => setFlagOpen(false)} />}
    </div>
  );
}

// ===================== UI: Top Bar =====================
function TopBar({ onOpenFlag }: { onOpenFlag: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 via-purple-400 to-yellow-400" />
          <span className="font-semibold tracking-wide">Pirate Nation</span>
          <span className="ml-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-300">Beta</span>
        </div>
        <button
          onClick={onOpenFlag}
          className="inline-flex items-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-sm font-medium text-purple-200 hover:bg-purple-500/20"
        >
          <Flag className="h-4 w-4" /> Raise Flag
        </button>
      </div>
    </header>
  );
}

// ===================== UI: Sponsor Banner (Static) =====================
function SponsorBanner() {
  const sponsors = [
    { name: "Sup Dogs", logo: "SD" },
    { name: "Pirate Coffee Co.", logo: "PC" },
    { name: "Downtown Deli", logo: "DD" },
    { name: "Greenville Fitness", logo: "GF" },
    { name: "Uptown Pub", logo: "UP" },
  ];
  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
        <div className="shrink-0 text-xs uppercase tracking-widest text-zinc-400">
          Pirate Nation 2025 — <span className="text-zinc-200">Sponsored by</span>:
        </div>
        <div className="flex flex-wrap gap-3">
          {sponsors.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1" title={s.name}>
              <div className="grid h-6 w-6 place-items-center rounded-full bg-zinc-800 text-xs text-zinc-200 ring-1 ring-zinc-700">{s.logo}</div>
              <span className="text-xs text-zinc-300">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== UI: Bottom Nav =====================
function BottomNav({ tab, setTab, openFlag }: { tab: string; setTab: (t: string) => void; openFlag: () => void }) {
  const item = (key: string, label: string, Icon: any) => (
    <button
      onClick={() => setTab(key)}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 ${
        tab === key ? "text-yellow-300" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </button>
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-5 px-2">
        {item("home", "Home", Megaphone)}
        {item("map", "Map", Map)}
        <button onClick={openFlag} className="-mt-5 flex flex-col items-center justify-center" aria-label="Raise Flag">
          <motion.div className="flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/20 bg-purple-600/30 shadow-lg" whileTap={{ scale: 0.95 }}>
            <Flag className="h-6 w-6 text-purple-200" />
          </motion.div>
          <span className="mt-1 text-xs text-purple-200">Flag</span>
        </button>
        {item("scores", "Scores", Trophy)}
        {item("tickets", "More", HandCoins)}
      </div>
    </nav>
  );
}

// ===================== UI: Home =====================
function Home({ onOpenFlag, countdown, nextGameTime, setNextGameTime, goSchedule, goTickets, goSponsors: _goSponsors, setToast }: any) {
  const timeLeft = useMemo(() => formatTimeLeft(countdown), [countdown]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <Glow />
        <div className="relative z-10 grid items-center gap-6 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Raise the <span className="text-yellow-300">No Quarter</span> Flag
            </h1>
            <p className="mt-2 max-w-prose text-zinc-300">
              Never miss the tradition. Tap the button and wave your phone — your digital flag will do the rest.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={onOpenFlag} className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-4 py-2 font-semibold text-zinc-900 hover:bg-yellow-300">
                <Flag className="h-5 w-5" /> Raise Flag
              </button>
              <button onClick={() => (window.location.hash = "#scores") || goSchedule()} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-2 text-zinc-200 hover:bg-zinc-900">
                <Clock className="h-5 w-5" /> Game-Day Schedule
              </button>
            </div>
          </div>
          <FlagPreviewCard />
        </div>
      </section>

      {/* Countdown + Quick actions + Score */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Kickoff Countdown</h3>
            <Info className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-3 text-3xl font-mono tabular-nums text-yellow-200">{timeLeft}</p>
          <p className="mt-1 text-xs text-zinc-400">Next game: {nextGameTime.toLocaleString()}</p>
          <div className="mt-3 flex gap-2 text-xs text-zinc-400">
            <span>Change date:</span>
            <input className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-100" type="datetime-local" onChange={(e) => setNextGameTime(new Date(e.target.value))} />
          </div>
        </div>
        <QuickCard title="Tickets" desc="Add or open your tickets in one tap." icon={<Ticket className="h-5 w-5" />} cta="Open Tickets" onClick={goTickets} />
        <ScoreCard setToast={setToast} />
      </section>

      {/* Announcements */}
      <section className="space-y-3">
        <h3 className="text-sm uppercase tracking-widest text-zinc-400">Announcements</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "No Quarter at start of 4th", body: "We’ll ping you right when Q4 begins so the whole stadium raises the flag together." },
            { title: "Tailgate Map", body: "Preview the tailgate lots & shuttle routes. Stadium map coming in Phase 2." },
            { title: "Sponsor Perk", body: "Show the app at participating locations for game-day discounts." },
          ].map((a, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 text-yellow-300">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">{a.title}</span>
              </div>
              <p className="mt-1 text-zinc-300">{a.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickCard({ title, desc, icon, cta, onClick }: any) {
  return (
    <button onClick={onClick} className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-300">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-2">{icon}</div>
          <span className="font-semibold text-zinc-100">{title}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
      </div>
      <p className="mt-2 text-sm text-zinc-400">{desc}</p>
      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-xs text-yellow-200">
        <BellRing className="h-3.5 w-3.5" /> {cta}
      </div>
    </button>
  );
}

// ===================== Score Hub =====================
function ScoresHub({ setToast }: any) {
  return (
    <section id="scores" className="space-y-6">
      <h2 className="text-2xl font-semibold">Live Score Hub</h2>
      <ScoreCard setToast={setToast} />
      <SeasonSchedule />
      <PlayByPlay />
    </section>
  );
}

function SeasonSchedule() {
  // Placeholder season list
  const games = [
    { date: "Aug 31", opp: "NC State", home: true, result: "W 24-17" },
    { date: "Sep 07", opp: "App State", home: false, result: "L 21-28" },
    { date: "Sep 21", opp: "UCF", home: true, result: "—" },
  ];
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="font-semibold">Season Schedule</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {games.map((g, i) => (
          <div key={i} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
            <div className="text-xs text-zinc-400">{g.date} • {g.home ? "vs" : "@"} {g.opp}</div>
            <div className="text-sm">{g.result}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayByPlay() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="font-semibold">Play-by-Play (WIP)</h3>
      <p className="mt-2 text-sm text-zinc-400">Wire to CFBD drives/plays or ESPN pbp. Showing last 5 events here.</p>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        <li>Q1 12:35 — ECU kickoff to Opp 25.</li>
        <li>Q1 10:02 — ECU TD pass, +6.</li>
        <li>Q2 05:11 — Opp field goal is good.</li>
        <li>Q3 03:22 — ECU INT at Opp 40.</li>
        <li>Q4 14:59 — Start of quarter.</li>
      </ul>
    </div>
  );
}

// ===================== Stadium Map =====================
function StadiumMap() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Interactive Stadium Map</h2>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="aspect-[16/9] w-full rounded-xl border border-zinc-700 bg-zinc-800 grid place-items-center text-zinc-400">Map placeholder (plug Mapbox/Leaflet)
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { name: "Seating", desc: "Tap section to view." },
            { name: "Concessions", desc: "Find nearest stands." },
            { name: "Restrooms", desc: "Nearest facilities." },
            { name: "First Aid", desc: "Medical tent." },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-zinc-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <ParkingShuttle />
    </section>
  );
}

function ParkingShuttle() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="font-semibold">Parking & Shuttle Info</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {[
          { title: "Gold Lot", detail: "Open 1:00 PM • $20" },
          { title: "Purple Lot", detail: "Pass holders only" },
          { title: "Shuttle A", detail: "Every 10 min from Downtown" },
        ].map((p, i) => (
          <div key={i} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
            <div className="font-medium">{p.title}</div>
            <div className="text-xs text-zinc-400">{p.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== More Page (Polls, Merch, Donate, Sponsors, Chat, UGC, Notifications) =====================
function MorePage({ setToast }: any) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Game Day Tools</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <PollsTrivia />
        <MerchPortal />
        <DonateCard />
        <SponsorsDirectory />
        <SectionChat />
        <UGCUpload />
        <NotificationSettings onTest={() => setToast("(Test) Kickoff reminder scheduled")} />
      </div>
    </section>
  );
}

function PollsTrivia() {
  const [choice, setChoice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-yellow-300" /><h3 className="font-semibold">Fan Polls & Quizzes</h3></div>
      <p className="mt-2 text-sm text-zinc-400">Who is your MVP of the half?</p>
      <div className="mt-2 grid gap-2">
        {["QB1", "RB22", "WR7", "LB5"].map((opt) => (
          <label key={opt} className={`rounded-xl border px-3 py-2 ${choice===opt?"border-yellow-400 bg-yellow-400/10":"border-zinc-700 bg-zinc-800"}`}>
            <input type="radio" name="mvp" className="mr-2" checked={choice===opt} onChange={()=>setChoice(opt)} />{opt}
          </label>
        ))}
      </div>
      <button disabled={!choice} onClick={()=>setSubmitted(true)} className="mt-3 rounded-xl bg-yellow-400 px-3 py-2 font-semibold text-zinc-900 disabled:opacity-50">Submit</button>
      {submitted && <div className="mt-2 text-sm text-green-300">Thanks! Your vote was recorded.</div>}
    </div>
  );
}

function MerchPortal() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-yellow-300" /><h3 className="font-semibold">Merch Portal</h3></div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {["Official Jersey", "No Quarter Tee", "Stadium Hat", "Scarf"].map((item) => (
          <button key={item} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 text-left hover:border-zinc-600">
            <div className="font-medium">{item}</div>
            <div className="text-xs text-zinc-400">Tap to purchase (MVP link)</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DonateCard() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-yellow-300" /><h3 className="font-semibold">Pirate Club Donation</h3></div>
      <p className="mt-2 text-sm text-zinc-400">Support the program directly. 100% of donations go to Pirate Club.</p>
      <button className="mt-3 rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-zinc-900">Donate</button>
    </div>
  );
}

function SponsorsDirectory() {
  const sponsors = [
    { name: "Sup Dogs", perk: "10% off on game day", url: "#" },
    { name: "Pirate Coffee Co.", perk: "BOGO cold brew", url: "#" },
    { name: "Downtown Deli", perk: "Free chips with sandwich", url: "#" },
    { name: "Greenville Fitness", perk: "$5 day pass", url: "#" },
  ];
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2"><HandCoins className="h-5 w-5 text-yellow-300" /><h3 className="font-semibold">Sponsor Directory</h3></div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {sponsors.map((s, i) => (
          <a key={i} href={s.url} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 hover:border-zinc-600">
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-zinc-400">{s.perk}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function SectionChat() {
  const [messages, setMessages] = useState(["Welcome to Section 102 chat! Be respectful and have fun."]);
  const [text, setText] = useState("");
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-yellow-300" /><h3 className="font-semibold">Section Chat (Stub)</h3></div>
      <div className="mt-3 h-40 overflow-auto rounded-lg border border-zinc-700 bg-zinc-800/60 p-2 text-sm">
        {messages.map((m, i) => (<div key={i} className="mb-1">{m}</div>))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Say something…" className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1" />
        <button onClick={()=>{ if(text.trim()) { setMessages([...messages, text.trim()]); setText(""); } }} className="rounded-md bg-yellow-400 px-3 py-1 font-semibold text-zinc-900">Send</button>
      </div>
    </div>
  );
}

function UGCUpload() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2"><UploadCloud className="h-5 w-5 text-yellow-300" /><h3 className="font-semibold">Fan Uploads (UGC Queue)</h3></div>
      <p className="mt-2 text-sm text-zinc-400">Submit your photos/videos. Content will appear after moderation.</p>
      <input multiple type="file" onChange={(e)=>setFiles(Array.from(e.target.files||[]))} className="mt-3 block text-sm" />
      {files.length>0 && (
        <ul className="mt-2 list-disc pl-5 text-xs text-zinc-400">
          {files.map((f,i)=>(<li key={i}>{f.name}</li>))}
        </ul>
      )}
      <button className="mt-3 rounded-md bg-yellow-400 px-3 py-1 font-semibold text-zinc-900">Submit</button>
    </div>
  );
}

function NotificationSettings({ onTest }: any) {
  const [kickoff, setKickoff] = useState(true);
  const [weather, setWeather] = useState(false);
  const [noQuarter, setNoQuarter] = useState(true);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="font-semibold">Push Notifications</h3>
      <div className="mt-2 space-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={kickoff} onChange={()=>setKickoff(v=>!v)} /> Kickoff reminder</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={weather} onChange={()=>setWeather(v=>!v)} /> Weather alerts</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={noQuarter} onChange={()=>setNoQuarter(v=>!v)} /> "No Quarter" (start of Q4)</label>
      </div>
      <button onClick={onTest} className="mt-3 rounded-md border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-yellow-200">Test notification</button>
      <p className="mt-2 text-xs text-zinc-500">MVP uses in-app toasts; production should use Web Push / FCM.</p>
    </div>
  );
}

// ===================== Score Card (with No Quarter trigger) =====================
function ScoreCard({ setToast }: any) {
  const [source, setSource] = useState("OFFLINE");
  const [hasFiredNoQuarter, setHasFiredNoQuarter] = useState(false);
  const [live, setLive] = useState({ opponent: "—", home: "Pirates", away: "Opponents", homeScore: 0, awayScore: 0, phase: "Pre", period: 0 });

  useEffect(() => {
    let cancelled = false;
    async function fetchCFBD() {
      const key = (window as any).__CFBD_API_KEY;
      if (!key) return null;
      const year = new Date().getFullYear();
      const resp = await fetch(`https://api.collegefootballdata.com/games?year=${year}&team=East%20Carolina`, { headers: { Authorization: `Bearer ${key}` } });
      if (!resp.ok) throw new Error("CFBD error");
      const games = await resp.json();
      if (!Array.isArray(games) || games.length === 0) return null;
      const latest = games[games.length - 1];
      return {
        source: "CFBD",
        home: latest.home_team,
        away: latest.away_team,
        homeScore: latest.home_points ?? 0,
        awayScore: latest.away_points ?? 0,
        phase: latest.status || "",
        period: latest.period ?? 0,
        opponent: latest.home_team === "East Carolina" ? latest.away_team : latest.home_team,
        completed: !!latest.completed,
      };
    }

    async function fetchESPN() {
      const resp = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard");
      if (!resp.ok) throw new Error("ESPN error");
      const data = await resp.json();
      const events = data?.events || [];
      const ecu = events.find((e: any) => (e?.name || "").toLowerCase().includes("east carolina"));
      if (!ecu) return null;
      const comp = ecu.competitions?.[0];
      const competitors = comp?.competitors || [];
      const home = competitors.find((t: any) => t.homeAway === "home");
      const away = competitors.find((t: any) => t.homeAway === "away");
      return {
        source: "ESPN",
        home: home?.team?.shortDisplayName || "Home",
        away: away?.team?.shortDisplayName || "Away",
        homeScore: Number(home?.score || 0),
        awayScore: Number(away?.score || 0),
        phase: comp?.status?.type?.detail || comp?.status?.type?.shortDetail || "",
        period: Number(comp?.status?.period || 0),
        opponent: (home?.team?.displayName || "Home").toLowerCase().includes("east carolina") ? (away?.team?.displayName || "Opponent") : (home?.team?.displayName || "Opponent"),
        completed: comp?.status?.type?.completed || false,
      };
    }

    async function fetchScores() {
      try {
        let info = null;
        try { info = await fetchCFBD(); if (info) setSource("CFBD"); } catch (_) {}
        if (!info) { try { info = await fetchESPN(); if (info) setSource("ESPN"); } catch (_) {} }
        if (!info) { if (!cancelled) setSource("OFFLINE"); return; }
        if (cancelled) return;
        setLive({ opponent: info.opponent, home: info.home, away: info.away, homeScore: info.homeScore, awayScore: info.awayScore, phase: info.phase, period: info.period || 0 });
        if (shouldTriggerNoQuarter(info.period, hasFiredNoQuarter)) { setHasFiredNoQuarter(true); setToast("No Quarter time! Raise your flag."); }
      } catch (e) { if (!cancelled) setSource("OFFLINE"); }
    }

    fetchScores();
    const id = setInterval(fetchScores, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [hasFiredNoQuarter, setToast]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-300"><Trophy className="h-5 w-5" /><h3 className="font-semibold">Score</h3></div>
        <div className="text-xs text-zinc-500">Source: {source}</div>
      </div>
      <div className="mt-3 grid grid-cols-3 items-center text-center">
        <div className="text-zinc-300">{live.away}<div className="text-3xl font-bold">{live.awayScore}</div></div>
        <div className="text-xs text-zinc-500">{live.phase || "—"}</div>
        <div className="text-zinc-300">{live.home}<div className="text-3xl font-bold">{live.homeScore}</div></div>
      </div>
      <div className="mt-2 text-center text-xs text-zinc-500">Opponent: {live.opponent}</div>
    </div>
  );
}

// ===================== Schedule (kept as part of ScoresHub via SeasonSchedule) =====================

// ===================== Tickets =====================
function Tickets() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Tickets & More</h2>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-zinc-300">Link your digital tickets or add shortcuts to your wallet app. Explore more tools in the More tab.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {["Add Wallet Pass", "Link Ticket Portal"].map((label) => (
            <button key={label} className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-left hover:border-zinc-600">
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-yellow-300" />
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-zinc-400">MVP links only. Native wallet coming soon.</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===================== Flag Modal (red flag + skull & bones) =====================
function FlagModal({ onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-yellow-300" />
            <span className="font-semibold">Virtual No Quarter Flag</span>
          </div>
          <button onClick={onClose} className="rounded-xl p-1 hover:bg-zinc-800" aria-label="Close">
            <X className="h-5 w-5 text-zinc-300" />
          </button>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <h3 className="font-semibold">How it works</h3>
            <ol className="mt-2 space-y-2 text-sm text-zinc-300">
              <li>1) Tap <b>Start Waving</b> and hold your phone up.</li>
              <li>2) Move your arm — the flag will ripple on screen.</li>
              <li>3) We’ll ping you when Q4 starts: <em>No Quarter!</em></li>
            </ol>
            <div className="mt-4 flex items-center gap-2">
              <button className="rounded-2xl bg-yellow-400 px-4 py-2 font-semibold text-zinc-900 hover:bg-yellow-300">Start Waving</button>
              <button className="rounded-2xl border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-purple-200 hover:bg-purple-500/20">Download Flag</button>
            </div>
            <p className="mt-3 text-xs text-zinc-400">Brand-safe MVP. Swap to official assets if ECU approves.</p>
          </div>
          <div className="order-1 md:order-2">
            <FlagPreviewCanvas />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkullAndBones({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <path d="M32 8c-9.941 0-18 7.163-18 16 0 4.418 2.015 8.41 5.316 11.313C16.486 36.19 14 39.834 14 44c0 6.627 6.268 12 14 12s14-5.373 14-12c0-4.166-2.486-7.81-5.316-8.687C47.985 32.41 50 28.418 50 24c0-8.837-8.059-16-18-16z" />
      <circle cx="24" cy="24" r="4" fill="#000" />
      <circle cx="40" cy="24" r="4" fill="#000" />
      <rect x="20" y="44" width="24" height="4" rx="2" />
      <rect x="12" y="54" width="14" height="4" rx="2" />
      <rect x="38" y="54" width="14" height="4" rx="2" />
    </svg>
  );
}

function FlagPreviewCard() {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <motion.div className="absolute inset-0" animate={{ backgroundPositionX: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} style={{ backgroundImage: "radial-gradient(1000px 300px at 0% 50%, rgba(168,85,247,0.15), transparent)", backgroundRepeat: "no-repeat" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div className="relative h-40 w-64 overflow-hidden rounded-md bg-red-700 shadow-2xl ring-1 ring-red-900" animate={{ rotateZ: [0, 1.5, 0, -1.5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <SkullAndBones className="h-16 w-16 text-zinc-200" />
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] uppercase tracking-widest text-zinc-200">No Quarter</div>
        </motion.div>
      </div>
    </div>
  );
}

function FlagPreviewCanvas() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(500px_200px_at_20%_30%,rgba(168,85,247,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(500px_200px_at_80%_70%,rgba(234,179,8,0.1),transparent)]" />
      <motion.div className="absolute inset-8 flex items-center justify-start">
        <motion.div className="relative h-48 w-72 overflow-hidden rounded-md bg-red-700 shadow-2xl ring-1 ring-red-900" animate={{ skewY: [0, -3, 2, -2, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_45%,transparent_55%,rgba(255,255,255,0.06)_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <SkullAndBones className="h-20 w-20 text-zinc-200" />
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] uppercase tracking-widest text-zinc-200">No Quarter</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ===================== Toast =====================
function Toast({ message, onClose }: any) {
  useEffect(() => {
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-fit max-w-full rounded-2xl border border-yellow-400/30 bg-yellow-400 text-zinc-900 px-4 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4" />
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
}

// ===================== Decorative Glow =====================
function Glow() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
    </>
  );
}

// ===================== Lightweight Runtime Tests =====================
(function runSelfTests() {
  try {
    if (typeof window === "undefined") return; // browser only
    const expect = (name: string, cond: boolean) => { if (!cond) console.error(`[TEST FAIL] ${name}`); };

    // formatTimeLeft tests
    expect("format 0 => 00:00:00", formatTimeLeft(0) === "00:00:00");
    expect("format 1s => 00:00:01", formatTimeLeft(1000) === "00:00:01");
    expect("format 1h1m1s", formatTimeLeft((1 * 3600 + 61) * 1000) === "01:01:01");

    // shouldTriggerNoQuarter tests
    expect("No trigger if already fired", shouldTriggerNoQuarter(4, true) === false);
    expect("Trigger at 4", shouldTriggerNoQuarter(4, false) === true);
    expect("Trigger at 5", shouldTriggerNoQuarter(5, false) === true);
    expect("No trigger at 3", shouldTriggerNoQuarter(3, false) === false);
    expect("Graceful string input", shouldTriggerNoQuarter("4", false) === true);
  } catch (e) {
    console.warn("Self-tests error (ignored):", e);
  }
})();
// End of mockup module
