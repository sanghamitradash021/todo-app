import { motion } from 'framer-motion';

function ShimmerBar({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-gray-200 ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/** Shimmer placeholder matching approximate TodoItem card height — AC-D09.1/2/4 */
export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-lg shadow overflow-hidden flex"
    >
      {/* Priority bar placeholder */}
      <div className="w-1 shrink-0 bg-gray-200" />

      <div className="flex-1 p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox placeholder */}
          <div className="mt-0.5 w-5 h-5 rounded bg-gray-200 shrink-0" />

          <div className="flex-1 space-y-2">
            {/* Title row */}
            <div className="flex items-center gap-2">
              <ShimmerBar className="h-4 w-2/5" />
              <ShimmerBar className="h-5 w-14" />
              <ShimmerBar className="h-5 w-14" />
            </div>
            {/* Due date placeholder */}
            <ShimmerBar className="h-3 w-24" />
          </div>

          {/* Action buttons placeholder */}
          <div className="flex gap-2 shrink-0">
            <ShimmerBar className="h-4 w-8" />
            <ShimmerBar className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
