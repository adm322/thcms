import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

function getDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN": return "/admin";
    case "TRAINER": return "/trainer";
    case "HR": return "/hr";
    default: return "/login";
  }
}

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect(getDashboardPath(session.role));
  }
  redirect("/login");
}
