"use client";

import { useEffect, useState } from "react";

const TRANSITION_MS = 460;

type AnimatedValueProps = {
  value: string;
  ariaLabel: string;
  className?: string;
};

type DisplayState = {
  current: string;
  previous: string | null;
};

export function AnimatedValue({
  value,
  ariaLabel,
  className = "",
}: AnimatedValueProps) {
  const [display, setDisplay] = useState<DisplayState>({
    current: value,
    previous: null,
  });

  if (display.current !== value) {
    setDisplay({ current: value, previous: display.current });
  }

  useEffect(() => {
    if (display.previous === null) return;
    const timer = window.setTimeout(() => {
      setDisplay((active) =>
        active.current === display.current
          ? { ...active, previous: null }
          : active,
      );
    }, TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [display]);

  return (
    <span
      className={`animated-value ${className}`.trim()}
      aria-label={ariaLabel}
      data-length={
        Math.max(display.current.length, display.previous?.length ?? 0) > 9
          ? "long"
          : "standard"
      }
    >
      {display.previous !== null && (
        <span
          key={`previous-${display.previous}`}
          className="animated-value__face animated-value__face--leaving"
          aria-hidden="true"
        >
          {display.previous}
        </span>
      )}
      <span
        key={`current-${display.current}`}
        className={`animated-value__face ${
          display.previous === null
            ? "animated-value__face--settled"
            : "animated-value__face--entering"
        }`}
        aria-hidden="true"
      >
        {display.current}
      </span>
    </span>
  );
}
