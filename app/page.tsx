import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";

export default function RootPage() {
  redirect(getSessionUserId() ? "/home" : "/login");
}
