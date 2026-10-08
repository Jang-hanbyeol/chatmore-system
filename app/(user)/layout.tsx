import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { UserShell } from "@/components/navigation/UserShell";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOnboardedUser();
  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });
  return (
    <UserShell
      userName={user.name}
      unreadCount={unreadCount}
      fontSize={user.fontSize}
      highContrast={user.highContrast}
      reduceMotion={user.reduceMotion}
    >
      {children}
    </UserShell>
  );
}
