import { redirect } from "next/navigation";
import { getSession } from "@/auth/session";
import { portalHome } from "@/services/portal-access";

export default async function Home() {
  const session = await getSession();
  if (!session?.user.isActive) redirect("/login");
  redirect(portalHome(session.user.role));
}
