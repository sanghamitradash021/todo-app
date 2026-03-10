import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { COUNT_DURATION, SPRING_DEFAULT, STAGGER_CARD } from '../../config/animations';

interface StatCardProps {
  label:  string;
  value:  number;
  accent: 'blue' | 'yellow' | 'green' | 'red';
  index:  number;
}

const ACCENT: Record<StatCardProps['accent'], { bg: string; text: string; ring: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   ring: 'ring-blue-200'   },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', ring: 'ring-yellow-200' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  ring: 'ring-green-200'  },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    ring: 'ring-red-200'    },
};

export function StatCard({ label, value, accent, index }: StatCardProps) {
  const [displayVal, setDisplayVal] = useState(0);
  const scale       = useMotionValue(1);
  const isFirstRender = useRef(true);
  const prevValue     = useRef(0);
  const { bg, text, ring } = ACCENT[accent];

  // Count-up: 0 → value on mount; old → new on change. Scale pulse on change.
  useEffect(() => {
    const from = isFirstRender.current ? 0 : prevValue.current;
    const isMount = isFirstRender.current;
    isFirstRender.current = false;
    prevValue.current = value;

    const countControls = animate(from, value, {
      duration: COUNT_DURATION,
      onUpdate: (v) => setDisplayVal(Math.round(v)),
    });

    // Scale pulse only on value change (not mount) — AC-D01.5
    let scaleControls: ReturnType<typeof animate> | undefined;
    if (!isMount) {
      scaleControls = animate(scale, [1, 1.15, 1], { duration: 0.3 });
    }

    return () => {
      countControls.stop();
      scaleControls?.stop();
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_DEFAULT, delay: index * STAGGER_CARD }}
      className={`rounded-xl p-5 shadow-sm ring-1 ${bg} ${ring}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${text} mb-2`}>{label}</p>
      <motion.span
        style={{ scale, display: 'block' }}
        className={`text-3xl font-bold ${text}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {displayVal}
      </motion.span>
    </motion.div>
  );
}
