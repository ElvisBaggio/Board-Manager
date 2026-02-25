import { useMemo } from 'react';
import { calculateObjectiveProgress, calculateHealthStatus } from '../utils/calculations';

/**
 * Health traffic light indicator shown next to each lane/objective name.
 * Shows 🟢 On Track, 🟡 At Risk, or 🔴 Off Track based on feature status progress.
 */
export default function HealthIndicator({ features = [], keyResults = [] }) {
    const { emoji, label, status } = useMemo(() => {
        const progress = calculateObjectiveProgress(features);
        return calculateHealthStatus(progress, keyResults);
    }, [features, keyResults]);

    return (
        <span
            className={`health-indicator health-${status}`}
            title={`${label} — ${calculateObjectiveProgress(features)}% progresso`}
        >
            {emoji}
        </span>
    );
}
