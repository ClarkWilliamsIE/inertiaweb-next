'use client';

import type { ReactNode } from 'react';

import { MemberGate } from '@/components/winnerland/AuthProvider';
import Shell from '@/components/winnerland/Shell';

export default function MembersLayout({ children }: { children: ReactNode }) {
  return (
    <MemberGate>
      <Shell>{children}</Shell>
    </MemberGate>
  );
}
