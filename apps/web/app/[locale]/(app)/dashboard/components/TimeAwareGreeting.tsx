'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type DayPart =
  | 'morning'
  | 'afternoon'
  | 'evening';

type Props = {
  name: string;
};

function getDayPart(hour: number): DayPart {
  if (hour < 12) {
    return 'morning';
  }

  if (hour < 18) {
    return 'afternoon';
  }

  return 'evening';
}

function subscribeToDayPart(
  onChange: (dayPart: DayPart) => void,
) {
  const updateDayPart = () => {
    onChange(getDayPart(new Date().getHours()));
  };

  const timeoutId = window.setTimeout(
    updateDayPart,
    0,
  );

  const intervalId = window.setInterval(
    updateDayPart,
    60_000,
  );

  return () => {
    window.clearTimeout(timeoutId);
    window.clearInterval(intervalId);
  };
}

export default function TimeAwareGreeting({
  name,
}: Props) {
  const t = useTranslations('dashboard');

  const [dayPart, setDayPart] =
    useState<DayPart>('morning');

  useEffect(
    () => subscribeToDayPart(setDayPart),
    [],
  );

  return (
    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
      {t(`greeting.${dayPart}`, {
        name,
      })}
    </h1>
  );
}