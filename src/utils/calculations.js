/**
 * Business logic calculations for strategic management.
 */

/**
 * Calculate objective progress based on feature statuses.
 * Not Started = 0%, On Going = 50%, Done = 100%, Blocked = 0%
 */
export function calculateObjectiveProgress(features) {
    if (!features || features.length === 0) return 0;

    const statusWeight = {
        'Not Started': 0,
        'On Going': 50,
        'Done': 100,
        'Blocked': 0,
    };

    const total = features.reduce((sum, f) => {
        return sum + (statusWeight[f.status] ?? 0);
    }, 0);

    return Math.round(total / features.length);
}

/**
 * Calculate health status based on progress and key results.
 * Returns: { status: 'green' | 'yellow' | 'red', emoji: '🟢' | '🟡' | '🔴', label }
 */
export function calculateHealthStatus(progress, keyResults = []) {
    // If key results exist, weight their completion
    let krProgress = 100;
    if (keyResults.length > 0) {
        krProgress = keyResults.reduce((sum, kr) => {
            const pct = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
            return sum + Math.min(pct, 100);
        }, 0) / keyResults.length;
    }

    const combined = (progress * 0.6) + (krProgress * 0.4);

    if (combined >= 70) return { status: 'green', emoji: '🟢', label: 'On Track' };
    if (combined >= 40) return { status: 'yellow', emoji: '🟡', label: 'At Risk' };
    return { status: 'red', emoji: '🔴', label: 'Off Track' };
}

/**
 * Detect over-allocation for team members in a quarter.
 * Returns array of alerts: { memberId, memberName, allocated, capacity, overBy }
 */
export function detectOverAllocation(members, allocations, quarter, year) {
    const alerts = [];

    for (const member of members) {
        const memberAllocations = allocations.filter(a =>
            a.memberId === member.id &&
            (quarter ? a.quarter === quarter : true) &&
            (year ? a.year === year : true)
        );

        const totalAllocated = memberAllocations.reduce((sum, a) => sum + (a.hoursAllocated || 0), 0);
        const capacity = member.capacityHoursPerQuarter || 480;

        if (totalAllocated > capacity) {
            alerts.push({
                memberId: member.id,
                memberName: member.name,
                allocated: totalAllocated,
                capacity,
                overBy: totalAllocated - capacity,
                percentage: Math.round((totalAllocated / capacity) * 100),
            });
        }
    }

    return alerts;
}

/**
 * Calculate risk score (impact × probability) and classify severity.
 * Impact and Probability: 1-5 scale. Score: 1-25.
 */
export function calculateRiskScore(impact, probability) {
    const score = (impact || 1) * (probability || 1);
    let severity, color;

    if (score >= 15) {
        severity = 'Critical';
        color = '#e74c3c';
    } else if (score >= 10) {
        severity = 'High';
        color = '#f39c12';
    } else if (score >= 5) {
        severity = 'Medium';
        color = '#f1c40f';
    } else {
        severity = 'Low';
        color = '#2ecc71';
    }

    return { score, severity, color };
}

/**
 * Aggregate capacity data for a team across quarters.
 * Returns { [quarter]: { capacity, allocated, available, utilization } }
 */
export function aggregateCapacity(members, allocations, year) {
    const quarters = {};

    for (let q = 1; q <= 4; q++) {
        const totalCapacity = members.reduce((sum, m) => sum + (m.capacityHoursPerQuarter || 480), 0);

        const qAllocations = allocations.filter(a => a.quarter === q && a.year === year);
        const totalAllocated = qAllocations.reduce((sum, a) => sum + (a.hoursAllocated || 0), 0);

        quarters[q] = {
            capacity: totalCapacity,
            allocated: totalAllocated,
            available: totalCapacity - totalAllocated,
            utilization: totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0,
        };
    }

    return quarters;
}
