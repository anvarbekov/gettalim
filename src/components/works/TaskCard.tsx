import { CalendarClock, Pin } from "lucide-react";
import { WorkFiles } from "@/components/works/WorkFiles";
import { uzDateTime } from "@/lib/links";

export interface TaskInfo {
  id: string;
  title: string;
  body: string | null;
  files: { url: string; name: string; size: number; kind: string }[] | null;
  link: string | null;
  due_at: string | null;
}

/** O'qituvchi bergan topshiriq: matn, fayllar (rasm, video, hujjat), havola, muddat. */
export function TaskCard({ task, compact }: { task: TaskInfo; compact?: boolean }) {
  return (
    <div className={compact ? "" : "rounded-xl2 border-2 border-sky-100 bg-sky-50/60 p-3.5"}>
      {!compact ? (
        <>
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-sky-900">
            <Pin className="h-3.5 w-3.5" /> Uy vazifasi
          </p>
          <p className="mt-0.5 font-extrabold text-ink">{task.title}</p>
          {task.due_at ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-mute">
              <CalendarClock className="h-3 w-3" /> Muddat: {uzDateTime(task.due_at)}
            </p>
          ) : null}
        </>
      ) : null}
      {task.body ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">{task.body}</p> : null}
      <WorkFiles files={Array.isArray(task.files) ? task.files : []} link={task.link} />
    </div>
  );
}
