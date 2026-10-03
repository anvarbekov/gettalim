"use client";

import { useEffect, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { getMusicPrefs, music, saveMusicPrefs, TRACKS, type TrackId } from "@/lib/music";
import { cn } from "@/lib/utils";

export function MusicPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [track, setTrack] = useState<TrackId>("off");
  const [volume, setVolume] = useState(0.3);

  useEffect(() => {
    const prefs = getMusicPrefs();
    setTrack(prefs.track);
    setVolume(prefs.volume);
  }, []);

  const apply = (nextTrack: TrackId, nextVolume = volume) => {
    setTrack(nextTrack);
    setVolume(nextVolume);
    music.setVolume(nextVolume);
    if (nextTrack === "off") music.stop();
    else music.play(nextTrack);
    saveMusicPrefs({ track: nextTrack, volume: nextVolume });
  };

  if (!open) return null;

  const currentName = track === "off" ? t("music.off") : TRACKS.find((x) => x.id === track)?.name[lang];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md animate-pop-in flex-col overflow-y-auto bg-white p-6 shadow-lift scroll-slim"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
              <Music className="h-6 w-6 text-teamA" /> {t("music.title")}
            </h2>
            <p className="mt-1 text-sm text-ink-mute">{t("music.sub")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-paper"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-xl2 border-2 border-paper-line bg-paper/60 p-4">
          <p className="eyebrow">{t("music.current")}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-lg font-extrabold text-ink">{currentName}</p>
            {track !== "off" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-teamA-soft px-3 py-1 text-xs font-extrabold text-teamA-deep">
                <Volume2 className="h-4 w-4" /> {t("music.playing")}
              </span>
            ) : null}
          </div>
        </div>

        <ul className="mt-4 grid gap-2.5">
          {TRACKS.map((item, index) => {
            const active = track === item.id;
            return (
              <li key={item.id}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl2 border-2 p-3 transition",
                    active ? "border-emerald-400 bg-emerald-50/60" : "border-paper-line bg-white",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper font-mono text-sm font-bold text-ink-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold leading-tight text-ink">{item.name[lang]}</p>
                    <p className="mt-0.5 text-xs leading-snug text-ink-mute">{item.description[lang]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => apply(active ? "off" : item.id)}
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white transition",
                      active ? "bg-emerald-600 hover:bg-emerald-700" : "bg-ink hover:bg-ink-soft",
                    )}
                    aria-label={active ? t("music.stop") : t("music.play")}
                  >
                    {active ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
                  </button>
                </div>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => apply("off")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl2 border-2 p-3 text-left transition",
                track === "off" ? "border-ink bg-paper" : "border-paper-line bg-white hover:bg-paper",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper text-ink-soft">
                <VolumeX className="h-5 w-5" />
              </span>
              <span className="font-extrabold text-ink">{t("music.off")}</span>
            </button>
          </li>
        </ul>

        <div className="mt-6">
          <label className="eyebrow mb-2 block" htmlFor="music-volume">
            {t("music.volume")} — {Math.round(volume * 100)}%
          </label>
          <input
            id="music-volume"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => apply(track, Number(e.target.value) / 100)}
            className="w-full accent-teamA"
          />
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-mute">{t("music.note")}</p>
      </aside>
    </div>
  );
}
