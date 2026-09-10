"use client";

import { Card, CardBody, Field, Select } from "@/components/ui/card";

const COUNTS = [10, 15, 20, 30, 40, 60];
const MINUTES = [3, 5, 7, 10, 15, 20];

export interface LiveConfig {
  questionCount: number;
  minutes: number;
}

/**
 * Ulangan rejimda o'qituvchi ikki narsani belgilaydi: savollar banki qancha
 * bo'ladi va test necha daqiqa davom etadi. Har bir o'quvchi shu bankdan
 * o'z tezligida yuradi, shuning uchun savol soni sinfdagi eng tez bolaga
 * yetadigan qilib olinadi.
 */
export function LiveOptions({ value, onChange }: { value: LiveConfig; onChange: (next: LiveConfig) => void }) {
  return (
    <Card className="mt-4">
      <CardBody>
        <h2 className="eyebrow mb-1">Test sozlamalari</h2>
        <p className="mb-3 text-sm text-ink-mute">
          Belgilangan vaqt tugaguncha har bir o'quvchi o'z tezligida yechadi. Kim ko'p to'g'ri javob bersa —
          o'sha yuqorida turadi.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Savollar soni" hint="Tez o'quvchilarga yetishi uchun zaxira bilan oling">
            <Select
              value={value.questionCount}
              onChange={(e) => onChange({ ...value, questionCount: Number(e.target.value) })}
            >
              {COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n} ta
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Test vaqti" hint="Vaqt tugagach natijalar avtomatik yakunlanadi">
            <Select value={value.minutes} onChange={(e) => onChange({ ...value, minutes: Number(e.target.value) })}>
              {MINUTES.map((n) => (
                <option key={n} value={n}>
                  {n} daqiqa
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </CardBody>
    </Card>
  );
}
