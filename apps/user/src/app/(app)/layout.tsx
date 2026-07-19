import { UserShell } from '@/components/UserShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <UserShell>{children}</UserShell>;
}
