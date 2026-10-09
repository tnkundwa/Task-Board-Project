'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function TeamRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const teamId = pathname.split('/')[2] ?? '';
    router.replace(`/teams/${teamId}/tasks`);
  }, [pathname, router]);

  return null;
}
