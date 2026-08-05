import { auth } from "@/lib/auth";

export default auth((req) => {
  // Add custom middleware logic if needed
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
