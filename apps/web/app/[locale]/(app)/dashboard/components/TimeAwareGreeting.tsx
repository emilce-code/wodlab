'use client';

import {
  useEffect,
  useState,
} from 'react';
import {
  useTranslations,
} from 'next-intl';

type Props = {
  name: string;
};

type DayPart =
  | 'morning'
  | 'afternoon'
  | 'evening';

function getDayPart(
  hour: number,
): DayPart {
  if (hour < 12) {
    return 'morning';
  }

  if (hour < 18) {
    return 'afternoon';
  }

  return 'evening';
}

export default function TimeAwareGreeting({
  name,
}: Props) {
  const t =
    useTranslations(
      'dashboard.greeting',
    );

  const [
    dayPart,
    setDayPart,
  ] = useState<
    DayPart | null
  >(null);

  useEffect(() => {
    setDayPart(
      getDayPart(
        new Date().getHours(),
      ),
    );
  }, []);

  if (!dayPart) {
    return (
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        {t(
          'default',
          {
            name,
          },
        )}
      </h1>
    );
  }

  return (
    <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
      {t(
        dayPart,
        {
          name,
        },
      )}
    </h1>
  );
}