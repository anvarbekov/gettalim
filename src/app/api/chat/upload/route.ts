import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Cloudinary'ga yuklash uchun imzo beradi.
 *
 * Nega imzo kerak
 * ---------------
 * Cloudinary «imzosiz» yuklashni ham qo'llab-quvvatlaydi va u soddaroq. Lekin
 * unda havolani bilgan har kim sizning hisobingizga fayl tashlay oladi — 25 GB
 * bir kechada to'lib qolishi mumkin.
 *
 * Imzo bilan esa yuklash faqat shu yerdan ruxsat olgandan keyin bo'ladi.
 * Cloudinary siri brauzerga chiqmaydi.
 *
 * Fayl **to'g'ridan-to'g'ri** brauzerdan Cloudinary'ga ketadi — bizning
 * serverimiz orqali o'tmaydi. Shuning uchun katta fayl ham tez yuklanadi.
 */

export const dynamic = "force-dynamic";

/** Bitta faylning eng katta hajmi (bayt). */
const MAX_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !key || !secret) {
    return NextResponse.json(
      {
        error:
          "Fayl yuklash sozlanmagan. .env.local ga CLOUDINARY kalitlarini qo'shing.",
      },
      { status: 503 },
    );
  }

  let body: { folder?: string; size?: number; resourceType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  if ((body.size ?? 0) > MAX_SIZE) {
    return NextResponse.json(
      { error: `Fayl juda katta. Eng ko'pi ${MAX_SIZE / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  // O'quvchi ishlari va uy vazifasi materiallari — faqat hisobga kirgan foydalanuvchi
  const base = (body.folder ?? "").split("/")[0];
  if (base === "ishlar" || base === "vazifalar") {
    const supabase = getServerClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (!user) return NextResponse.json({ error: "Avval hisobga kiring." }, { status: 401 });
    body.folder = `${base}/${user.id}`;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `gettalim/${(body.folder ?? "chat").replace(/[^a-z0-9/_-]/gi, "")}`;

  // Cloudinary imzosi: parametrlar alifbo tartibida, keyin sir qo'shiladi
  const params: Record<string, string> = { folder, timestamp: String(timestamp) };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = crypto.createHash("sha1").update(toSign + secret).digest("hex");

  return NextResponse.json({
    cloud,
    apiKey: key,
    timestamp,
    folder,
    signature,
    resourceType: body.resourceType === "raw" ? "raw" : "auto",
  });
}
