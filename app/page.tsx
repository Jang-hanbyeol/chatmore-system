import { redirect } from "next/navigation";
import { getActiveUser } from "@/lib/auth/guards";

export default async function RootPage() {
  redirect((await getActiveUser()) ? "/home" : "/login");
}
