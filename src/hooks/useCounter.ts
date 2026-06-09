import { useState, useEffect } from 'react';

interface CounterValue {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

function calcDiff(startDate: Date): CounterValue {
  const diff = Math.max(0, Date.now() - startDate.getTime());
  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    mins: Math.floor((totalSec % 3600) / 60),
    secs: totalSec % 60,
  };
}

export function useCounter(startDate: Date | string | null) {
  const date = startDate ? new Date(startDate) : null;
  const [value, setValue] = useState<CounterValue>(() =>
    date ? calcDiff(date) : { days: 0, hours: 0, mins: 0, secs: 0 }
  );

  useEffect(() => {
    if (!date) return;
    setValue(calcDiff(date));
    const id = setInterval(() => setValue(calcDiff(date)), 1000);
    return () => clearInterval(id);
  }, [date?.getTime()]);

  return value;
}

export function pad(n: number) {
  return String(n).padStart(2, '0');
}
