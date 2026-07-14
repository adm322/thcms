import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesInbox from "@/components/MessagesInbox";

export default async function AdminMessages() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return <MessagesInbox role="ADMIN" />;
}
