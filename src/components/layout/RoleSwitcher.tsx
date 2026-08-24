'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';

export function RoleSwitcher() {
  const { currentUser } = useExpenses();
  if (!currentUser) return null;

  return null;
}
