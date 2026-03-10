export const SPRING_DEFAULT = { type: 'spring', damping: 25, stiffness: 300 } as const;
export const SPRING_GENTLE  = { type: 'spring', damping: 30, stiffness: 200 } as const;
export const FADE_FAST      = { duration: 0.15 } as const;
export const FADE_NORMAL    = { duration: 0.2 } as const;
export const STAGGER_DELAY  = 0.04;  // 40ms between list items
export const STAGGER_CARD   = 0.08;  // 80ms between stat cards
export const COUNT_DURATION = 0.8;   // seconds for number count-up
export const BAR_DURATION   = 0.6;   // seconds for priority bar grow
