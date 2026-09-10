import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Hisob talab qiladigan sahifalar. Doska rejimi bu ro'yxatga kirmaydi. */
const PROTECTED = ["/dashboard", "/talaba"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase sozlanmagan bo'lsa — hech narsa qilmaymiz, doska rejimi ishlayveradi
  if (!url || !key || url.includes("xxxxxxxx")) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Sessiyani yangilaydi (token muddati tugagan bo'lsa)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

  if (needsAuth && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/kirish";
    login.searchParams.set("keyin", path);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|img|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
