import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getSupabaseEnv } from "./env";

function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-evfakta-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = nextWithPathname(request);

  const env = getSupabaseEnv();
  if (!env) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = nextWithPathname(request);
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    // Refresh the auth token. Prefer getUser() over getSession() on the server.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    if (!user && (pathname.startsWith("/min-side") || pathname.startsWith("/admin"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user && pathname.startsWith("/admin") && !isAdminEmail(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/min-side";
      url.search = "";
      return NextResponse.redirect(url);
    }
  } catch {
    // Never break page/CSS delivery if session refresh fails.
    return supabaseResponse;
  }

  return supabaseResponse;
}
