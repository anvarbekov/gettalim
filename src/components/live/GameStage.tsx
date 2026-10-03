"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Flag, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O'quvchi qurilmasidagi **katta** o'yin sahnasi.
 *
 * Musobaqada bola quruq test emas, o'yinni ko'radi: qaysi o'yin tanlangan
 * bo'lsa, uning ko'rinishi haqiqiy rasmlar bilan chiziladi. Sahna ekranning
 * yuqori qismini egallaydi, savol va javob tugmalari pastda turadi.
 */

export interface StageProps {
  gameId: string;
  correct: number;
  wrong: number;
  rank: number;
  total: number;
  /** Sinfdagi eng yaxshi natija — masofani solishtirish uchun. */
  leaderCorrect: number;
  teamNo: number;
  teamColor: string;
  teamPoints: number[];
  teamNames: string[];
  nickname: string;
  /** XP do'konidan sotib olingan poyga ko'rinishi (emoji). Bo'lmasa — mashina rasmi. */
  racer?: string | null;
}

const ASSET = "?v=5";

/**
 * Sahna `memo` bilan o'raladi: o'quvchi ekranidagi taymer har 250 ms da
 * yangilanadi va usiz butun sahna (rasmlar, SVG) har safar qaytadan
 * chizilardi. Endi faqat ball yoki o'rin o'zgarganda qayta chiziladi —
 * eski telefonlarda sezilarli farq.
 */
export const GameStage = memo(GameStageInner);

function GameStageInner(props: StageProps) {
  switch (props.gameId) {
    case "arqon":
      return <RopeStage {...props} />;
    case "poyga":
      return <RaceStage {...props} />;
    case "millioner":
      return <LadderStage {...props} />;
    case "xazina":
      return <PathStage {...props} />;
    default:
      return <RainStage {...props} />;
  }
}

/**
 * Sahna ramkasi — barcha o'yinlar uchun bir xil o'lcham va sarlavha.
 *
 * `render` funksiyasiga ramkaning **nisbati** beriladi. Arqon sahnasi shundan
 * foydalanib `viewBox` ini kengaytiradi: aks holda keng monitorda SVG kesilib,
 * personajlarning boshi qirqilib qolardi.
 */
function Stage({
  title,
  right,
  children,
  sky,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode | ((ratio: number) => React.ReactNode);
  sky: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(1.9);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setRatio(width / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl shadow-lift" style={{ background: sky }}>
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">{title}</span>
        <span className="text-xs font-extrabold text-white/90">{right}</span>
      </div>
      <div ref={box} className="relative" style={{ height: "clamp(190px, 34vh, 470px)" }}>
        {typeof children === "function" ? children(ratio) : children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Arqon tortish                                                      */
/* ------------------------------------------------------------------ */

/**
 * Arqon sahnasi bitta SVG ichida chiziladi.
 *
 * Nega SVG: arqon personajlarning **mushtiga** aniq tegishi kerak. HTML
 * qatlamlari bilan bu o'lcham o'zgarganda buziladi — SVG `viewBox` esa
 * koordinatalarni qat'iy saqlaydi, ya'ni telefonda ham, katta monitorda ham
 * arqon aynan qo'lda turadi.
 *
 * Rasmlardagi arqon qoldiqlari tozalangan (yarim shaffof piksellar olib
 * tashlangan), shuning uchun endi bitta uzluksiz arqon chiziladi.
 */

/** Sahna koordinatalari. Balandlik doim 420, kenglik ekranga qarab o'zgaradi. */
const VB = { h: 420 };
/**
 * Sahna kengligi ramkaning nisbatiga qarab hisoblanadi. Shu sababli hech
 * qachon kesilmaydi: keng ekranda arqon uzayadi, personajlar chetga suriladi.
 */
const stageWidth = (ratio: number) => Math.round(Math.max(620, Math.min(2400, VB.h * ratio)));
/** Personaj balandligi va oyoq sathi. */
const CH_H = 268;
const FEET = 372;
const TOP = FEET - CH_H;

/** Rasm: eni/bo'yi nisbati va musht joyi (rasm ichidagi ulush). */
const FIG = {
  leftBack: { src: "puller-left-back", aspect: 346 / 360, gx: 0.997, gy: 0.444 },
  leftFront: { src: "puller-left", aspect: 328 / 360, gx: 0.774, gy: 0.443 },
  rightFront: { src: "girl-right", aspect: 292 / 360, gx: 0.202, gy: 0.443 },
  rightBack: { src: "girl-right-back", aspect: 297 / 360, gx: 0.0, gy: 0.428 },
};

/**
 * Personajni joylash: chapdan yoki o'ngdan boshlab.
 * `scale` — orqa qatordagi bola bir oz kichikroq bo'ladi, shunda chuqurlik
 * seziladi va u oldingisi ortidan ko'rinib turadi.
 */
function place(
  fig: (typeof FIG)[keyof typeof FIG],
  from: "left" | "right",
  inset: number,
  vbw: number,
  scale = 1,
) {
  const h = CH_H * scale;
  const w = h * fig.aspect;
  const y = FEET - h;
  const x = from === "left" ? inset : vbw - inset - w;
  return { x, y, w, h, gripX: x + w * fig.gx, gripY: y + h * fig.gy, src: fig.src };
}

function RopeStage({ teamPoints, teamNames, teamNo, nickname }: StageProps) {
  const a = teamPoints[0] ?? 0;
  const b = teamPoints[1] ?? 0;
  const diff = a - b;
  // Butun guruh birga suriladi. Yutayotgan jamoa arqonni **o'z tomoniga**
  // tortadi, shuning uchun 1-jamoa oldinda bo'lsa guruh chapga siljiydi.
  const shift = Math.max(-26, Math.min(26, -diff * 5));
  const winning = diff > 0 ? 1 : diff < 0 ? 2 : 0;

  return (
    <Stage
      title="Arqon tortish"
      sky="linear-gradient(180deg,#16305e 0%,#27528f 52%,#7ba0d4 100%)"
      right={winning === 0 ? "Teng!" : winning === teamNo ? "Jamoangiz oldinda 💪" : "Jamoangiz orqada"}
    >
      {(ratio) => {
      const vbw = stageWidth(ratio);
      // Chetdan qoldiriladigan joy kenglikka **mutanosib**: keng ekranda
      // personajlar chekkaga yopishib qolmaydi, arqon ham cheksiz uzaymaydi.
      const front = Math.round(vbw * 0.14);
      const back = Math.max(2, front - 96);
      const lb = place(FIG.leftBack, "left", back, vbw, 0.86);
      const lf = place(FIG.leftFront, "left", front, vbw);
      const rf = place(FIG.rightFront, "right", front, vbw);
      const rb = place(FIG.rightBack, "right", back, vbw, 0.86);

      // Arqon: ikki oldingi musht orasida osiladi. Farq katta bo'lsa taranglashadi.
      const sag = Math.max(3, 18 - Math.abs(diff) * 1.8);
      const cx = (lf.gripX + rf.gripX) / 2;
      const cy = (lf.gripY + rf.gripY) / 2 + sag * 2;
      const midX = (lf.gripX + 2 * cx + rf.gripX) / 4;
      const midY = (lf.gripY + 2 * cy + rf.gripY) / 4;

      const d = `M -60 ${lb.gripY + 4} L ${lb.gripX} ${lb.gripY} L ${lf.gripX} ${lf.gripY} Q ${cx} ${cy} ${rf.gripX} ${rf.gripY} L ${rb.gripX} ${rb.gripY} L ${vbw + 60} ${rb.gripY + 4}`;

      return (
      <>
      {/* Jamoa nomlari — ortida quyuq gradient, aks holda personaj ustiga tushardi */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10"
        style={{ background: "linear-gradient(180deg,rgba(9,20,45,.75),transparent)" }}
        aria-hidden
      />
      <span className="absolute left-3 top-1 z-20 text-sm font-extrabold text-[#8fc0ff]">
        {teamNames[0] ?? "1-jamoa"} · {a}
      </span>
      <span className="absolute right-3 top-1 z-20 text-sm font-extrabold text-[#ffab9c]">
        {b} · {teamNames[1] ?? "2-jamoa"}
      </span>

      <svg
        viewBox={`0 0 ${vbw} ${VB.h}`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="rope-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8c79a" />
            <stop offset="0.45" stopColor="#c99a63" />
            <stop offset="1" stopColor="#8d6436" />
          </linearGradient>
          <linearGradient id="rope-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8814f" />
            <stop offset="1" stopColor="#5f4527" />
          </linearGradient>
          <radialGradient id="rope-sun" cx="0.5" cy="0" r="0.9">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Yorug'lik */}
        <rect x="0" y="0" width={vbw} height={VB.h} fill="url(#rope-sun)" />

        {/* Uzoqdagi tepaliklar — sahnaga chuqurlik beradi */}
        <path
          d={`M0 ${FEET - 48} Q ${vbw * 0.19} ${FEET - 92} ${vbw * 0.38} ${FEET - 42} T ${vbw * 0.78} ${FEET - 56} T ${vbw} ${FEET - 36} L${vbw} ${VB.h} L0 ${VB.h} Z`}
          fill="#2f4f83"
          opacity="0.55"
        />

        {/* Yer */}
        <rect x="0" y={FEET} width={vbw} height={VB.h - FEET} fill="url(#rope-ground)" />
        <rect x="0" y={FEET} width={vbw} height="3" fill="#c79a5f" opacity="0.6" />

        {/* Markaz chizig'i — yerda */}
        <rect x={vbw / 2 - 2} y={FEET - 2} width="4" height={VB.h - FEET} fill="#fff" opacity="0.7" />
        <rect x={vbw / 2 - 1} y="60" width="2" height={FEET - 66} fill="#fff" opacity="0.18" />

        {/* Butun guruh: personajlar + arqon birga suriladi */}
        <g
          style={{ transform: `translateX(${shift}px)`, transition: "transform .7s cubic-bezier(.22,1,.36,1)" }}
        >
          {/* Soyalar */}
          {[lb, lf, rf, rb].map((p, i) => (
            <ellipse
              key={`sh-${i}`}
              cx={p.x + p.w / 2}
              cy={FEET + 4}
              rx={p.w * 0.34}
              ry="7"
              fill="#000"
              opacity="0.28"
            />
          ))}

          {/* Orqa qator */}
          <image href={`/img/${lb.src}.webp${ASSET}`} x={lb.x} y={lb.y} width={lb.w} height={lb.h} opacity="0.92" />
          <image href={`/img/${rb.src}.webp${ASSET}`} x={rb.x} y={rb.y} width={rb.w} height={rb.h} opacity="0.92" />

          {/* Arqon — orqa qator bilan oldingi qator orasida */}
          <g strokeLinecap="round" fill="none">
            <path d={d} stroke="#3d2a15" strokeWidth="13" opacity="0.45" transform="translate(0,3)" />
            <path d={d} stroke="#6d4c27" strokeWidth="12" />
            <path d={d} stroke="url(#rope-body)" strokeWidth="9.5" />
            {/* Eshilgan tolalar */}
            <path
              d={d}
              stroke="#f6dfba"
              strokeWidth="9.5"
              strokeLinecap="butt"
              strokeDasharray="3.5 7"
              opacity="0.5"
            />
            <path
              d={d}
              stroke="#6b4a24"
              strokeWidth="9.5"
              strokeLinecap="butt"
              strokeDasharray="2 8.5"
              strokeDashoffset="5.5"
              opacity="0.4"
            />
            {/* Yuqori yorug'lik */}
            <path d={d} stroke="#fff3dd" strokeWidth="2" opacity="0.45" transform="translate(0,-2.6)" />
          </g>

          {/* Oldingi qator */}
          <image href={`/img/${lf.src}.webp${ASSET}`} x={lf.x} y={lf.y} width={lf.w} height={lf.h} />
          <image href={`/img/${rf.src}.webp${ASSET}`} x={rf.x} y={rf.y} width={rf.w} height={rf.h} />

          {/* Qizil popuk — arqonning o'rtasi */}
          <g transform={`translate(${midX},${midY})`}>
            <rect x="-4" y="-13" width="8" height="26" rx="3" fill="#e11d48" />
            <rect x="-4" y="-13" width="8" height="9" rx="3" fill="#fb7185" />
          </g>
        </g>

        {/* Oyoq ostidagi chang — kim tortayotganini ko'rsatadi */}
        {winning !== 0 ? (
          <g opacity="0.5">
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={(winning === 1 ? lf.x + lf.w * 0.4 : rf.x + rf.w * 0.6) + i * (winning === 1 ? 16 : -16)}
                cy={FEET - 2 - i * 3}
                r={5 + i * 2}
                fill="#d9c3a2"
                opacity={0.5 - i * 0.12}
              />
            ))}
          </g>
        ) : null}
      </svg>

      {/* Men qaysi tomondaman */}
      <span
        className={cn(
          "absolute bottom-1.5 z-20 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-extrabold text-white backdrop-blur",
          teamNo === 1 ? "left-3" : "right-3",
        )}
      >
        {nickname}
      </span>
      </>
      );
      }}
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/*  Poyga                                                              */
/* ------------------------------------------------------------------ */

function RaceStage({ correct, leaderCorrect, rank, total, nickname, racer }: StageProps) {
  const goal = Math.max(10, leaderCorrect + 2);
  const me = Math.min(1, correct / goal);
  const leader = Math.min(1, leaderCorrect / goal);
  const behind = leaderCorrect - correct;

  return (
    <Stage
      title="Poyga"
      sky="linear-gradient(180deg,#7fb2e8 0%,#b9d6f2 45%,#5c5f66 46%,#3c3f45 100%)"
      right={behind > 0 ? `Yetakchidan ${behind} qadam orqada` : "Siz oldindasiz!"}
    >
      {/* Yo'lak chiziqlari */}
      {[36, 62].map((top) => (
        <span
          key={top}
          className="absolute inset-x-0 h-0.5 opacity-60"
          style={{
            top: `${top}%`,
            backgroundImage: "repeating-linear-gradient(90deg,#fff 0 22px,transparent 22px 44px)",
          }}
          aria-hidden
        />
      ))}

      {/* Marra */}
      <span className="absolute bottom-2 right-3 z-20 flex flex-col items-center text-white/85">
        <Flag className="h-6 w-6" />
        <span className="text-[10px] font-extrabold">MARRA</span>
      </span>

      {/* Yetakchi — orqa yo'lakda, xira */}
      {leaderCorrect > correct ? (
        <span
          className="absolute top-[24%] z-10 transition-[left] duration-700 ease-out"
          style={{ left: `calc(${4 + leader * 76}%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/img/supercar-2.webp${ASSET}`} alt="" className="h-9 w-auto opacity-45 sm:h-12" />
        </span>
      ) : null}

      {/* Men */}
      <span
        className="absolute top-[48%] z-10 transition-[left] duration-700 ease-out"
        style={{ left: `calc(${4 + me * 76}%)` }}
      >
        {racer ? (
          // Do'kondan olingan ko'rinish — mashina o'rniga
          <span
            className="block text-center text-[2.75rem] leading-none sm:text-6xl"
            style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,.5))" }}
            aria-hidden
          >
            {racer}
          </span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/img/supercar-1.webp${ASSET}`}
            alt=""
            className="h-14 w-auto sm:h-20"
            style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,.5))" }}
          />
        )}
        <span className="mt-0.5 block rounded-full bg-black/45 px-2 py-0.5 text-center text-[10px] font-extrabold text-white backdrop-blur">
          {nickname}
        </span>
      </span>

      <span className="absolute bottom-2 left-3 z-20 text-xs font-extrabold text-white/90">
        {correct} qadam {rank > 0 ? `· ${rank}/${total} o'rin` : ""}
      </span>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/*  Kim millioner                                                      */
/* ------------------------------------------------------------------ */

const PRIZES = [1, 2, 3, 5, 10, 15, 25, 50, 100, 200, 400, 800, 1500, 3000, 5000];

function LadderStage({ correct, wrong }: StageProps) {
  const step = Math.min(PRIZES.length, correct);
  const prize = step > 0 ? PRIZES[step - 1] : 0;

  return (
    <Stage
      title="Kim millioner"
      sky="linear-gradient(180deg,#0d1b3e 0%,#1a2f5e 60%,#0a1330 100%)"
      right={prize > 0 ? `${prize.toLocaleString("uz-UZ")} 000 so'm` : "Boshlanish"}
    >
      <div className="absolute inset-0 flex flex-col-reverse justify-center gap-[3px] px-5 py-3">
        {PRIZES.map((value, i) => {
          const passed = i < correct;
          const here = i === correct;
          const safe = i === 4 || i === 9;
          return (
            <span
              key={i}
              className={cn(
                "flex items-center justify-between rounded-md px-3 text-[11px] font-extrabold transition",
                here && "bg-amber-400 text-[#0d1b3e]",
                !here && passed && "bg-emerald-500/25 text-emerald-200",
                !here && !passed && (safe ? "bg-white/10 text-white/80" : "bg-white/5 text-white/45"),
              )}
              style={{ height: "calc((100% - 42px) / 15)" }}
            >
              <span>{i + 1}</span>
              <span className="font-mono">{value.toLocaleString("uz-UZ")} 000</span>
              {safe ? <span className="text-amber-300">◆</span> : <span className="w-2" />}
            </span>
          );
        })}
      </div>

      <span className="absolute bottom-1 right-3 text-[11px] font-bold text-white/60">
        {correct} bosqich · {wrong} xato
      </span>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/*  Xazina xaritasi                                                    */
/* ------------------------------------------------------------------ */

function PathStage({ correct, leaderCorrect, nickname }: StageProps) {
  const tiles = Math.max(12, leaderCorrect + 3);
  const position = Math.min(tiles - 1, correct);

  return (
    <Stage
      title="Xazina xaritasi"
      sky="linear-gradient(180deg,#3d7a5a 0%,#5fa87a 50%,#c9a86a 100%)"
      right={`${position + 1}/${tiles} katak`}
    >
      <div className="absolute inset-0 flex flex-wrap content-center items-center justify-center gap-1.5 px-4">
        {Array.from({ length: tiles }, (_, i) => {
          const last = i === tiles - 1;
          const here = i === position;
          const passed = i < position;
          return (
            <span
              key={i}
              className={cn(
                "relative grid h-9 w-9 place-items-center rounded-lg border-2 text-xs font-extrabold transition sm:h-11 sm:w-11",
                last && "border-amber-300 bg-amber-400/40 text-amber-100",
                !last && passed && "border-white/40 bg-white/25 text-white/80",
                !last && !passed && "border-white/25 bg-black/15 text-white/50",
              )}
            >
              {last ? <Gem className="h-5 w-5" /> : i + 1}
              {here ? (
                <span className="absolute -top-6 flex flex-col items-center">
                  <span className="text-xl">🧍</span>
                  <span className="rounded-full bg-black/45 px-1.5 text-[9px] font-extrabold text-white backdrop-blur">
                    {nickname}
                  </span>
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/*  Savol yomg'iri                                                     */
/* ------------------------------------------------------------------ */

function RainStage({ correct, wrong, rank, total }: StageProps) {
  const drops = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: (i * 31 + (i % 5) * 9) % 100,
        delay: (i % 11) * 0.22,
        duration: 0.9 + ((i * 7) % 9) * 0.12,
        height: 14 + ((i * 5) % 5) * 9,
      })),
    [],
  );

  const clouds = [
    { left: 8, top: 6, w: 92, h: 26 },
    { left: 48, top: 14, w: 66, h: 20 },
    { left: 74, top: 4, w: 58, h: 18 },
  ];

  return (
    <Stage
      title="Savol yomg'iri"
      sky="linear-gradient(180deg,#5b8ec4 0%,#9cc0e0 55%,#3f7f76 100%)"
      right={rank > 0 ? `${rank}/${total} o'rin` : ""}
    >
      {/* Bulutlar */}
      {clouds.map((cloud, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/85"
          style={{ left: `${cloud.left}%`, top: cloud.top, width: cloud.w, height: cloud.h }}
          aria-hidden
        />
      ))}

      {/* Yomg'ir */}
      {drops.map((drop, i) => (
        <span
          key={i}
          className="absolute w-px animate-rain-fall rounded-full bg-white/55"
          style={{
            left: `${drop.left}%`,
            height: drop.height,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          }}
          aria-hidden
        />
      ))}

      {/* Ko'lmak */}
      <span
        className="absolute inset-x-0 bottom-0 h-8 rounded-t-[50%] bg-white/20 backdrop-blur-sm"
        aria-hidden
      />

      <span className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/35 px-4 py-1.5 text-sm font-extrabold text-white backdrop-blur">
        <span className="text-emerald-300">{correct} ✓</span>
        <span className="text-rose-300">{wrong} ✕</span>
      </span>
    </Stage>
  );
}
