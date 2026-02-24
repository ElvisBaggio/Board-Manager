import { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { calculateBarPosition, formatDate } from '../utils/data';

const STATUS_COLORS = {
    'Not Started': { bg: 'rgba(149, 165, 166, 0.35)', border: 'rgba(149, 165, 166, 0.5)', dot: '#95a5a6' },
    'On Going': { bg: 'rgba(52, 152, 219, 0.35)', border: 'rgba(52, 152, 219, 0.5)', dot: '#3498db' },
    'Done': { bg: 'rgba(46, 204, 113, 0.35)', border: 'rgba(46, 204, 113, 0.5)', dot: '#2ecc71' },
    'Blocked': { bg: 'rgba(231, 76, 60, 0.35)', border: 'rgba(231, 76, 60, 0.5)', dot: '#e74c3c' },
};

const STATUS_CLASSES = {
    'Not Started': 'status-not-started',
    'On Going': 'status-on-going',
    'Done': 'status-done',
    'Blocked': 'status-blocked',
};

// Add delta days to a YYYY-MM-DD string
function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

export default function FeatureBar({ feature, year, onClick, onUpdateFeature, visibleMonths }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState(null);
    const [previewPos, setPreviewPos] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const barRef = useRef(null);
    const tooltipTimer = useRef(null);
    const wasDragging = useRef(false);

    const pos = calculateBarPosition(feature.startDate, feature.endDate, year, visibleMonths);
    const displayPos = previewPos || pos;
    const colors = STATUS_COLORS[feature.status] || STATUS_COLORS['Not Started'];

    const handleMouseDown = (e, type) => {
        e.stopPropagation();
        e.preventDefault();
        setShowTooltip(false);

        if (!barRef.current) return;
        const container = barRef.current.parentElement;
        const containerWidth = container.getBoundingClientRect().width;

        setDragState({
            type,
            startX: e.clientX,
            containerWidth,
            initialStart: feature.startDate,
            initialEnd: feature.endDate,
            currentStart: feature.startDate,
            currentEnd: feature.endDate
        });
        setIsDragging(true);
    };

    const handleMouseEnter = () => {
        if (isDragging) return;
        tooltipTimer.current = setTimeout(() => setShowTooltip(true), 400);
    };

    const handleMouseLeave = () => {
        clearTimeout(tooltipTimer.current);
        setShowTooltip(false);
    };

    useEffect(() => {
        if (!isDragging) return;

        // Calculate how many days are visible in the current zoom
        const totalVisibleMonths = visibleMonths ? visibleMonths.length : 12;
        const approxDays = totalVisibleMonths * 30.44;

        const handleMouseMove = (e) => {
            if (!dragState) return;
            const deltaX = e.clientX - dragState.startX;
            const deltaDays = Math.round((deltaX / dragState.containerWidth) * approxDays);

            let newStart = dragState.initialStart;
            let newEnd = dragState.initialEnd;

            if (dragState.type === 'move') {
                newStart = addDays(dragState.initialStart, deltaDays);
                newEnd = addDays(dragState.initialEnd, deltaDays);
            } else if (dragState.type === 'resize-left') {
                newStart = addDays(dragState.initialStart, deltaDays);
                if (newStart > newEnd) newStart = newEnd;
            } else if (dragState.type === 'resize-right') {
                newEnd = addDays(dragState.initialEnd, deltaDays);
                if (newEnd < newStart) newEnd = newStart;
            }

            const p = calculateBarPosition(newStart, newEnd, year, visibleMonths);
            if (p) {
                setPreviewPos(p);
                setDragState(prev => ({ ...prev, currentStart: newStart, currentEnd: newEnd }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            wasDragging.current = true;
            setTimeout(() => { wasDragging.current = false; }, 200);
            if (dragState) {
                if (dragState.currentStart !== feature.startDate || dragState.currentEnd !== feature.endDate) {
                    onUpdateFeature(feature.id, {
                        startDate: dragState.currentStart,
                        endDate: dragState.currentEnd
                    });
                }
            }
            setPreviewPos(null);
            setDragState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragState, feature, year, onUpdateFeature, visibleMonths]);

    if (!displayPos) return null;

    const startFormatted = formatDate(feature.startDate);
    const endFormatted = formatDate(feature.endDate);

    return (
        <div
            ref={barRef}
            className={`feature-bar ${STATUS_CLASSES[feature.status] || 'status-not-started'} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: displayPos.left,
                width: displayPos.width,
                cursor: dragState?.type === 'move' ? 'grabbing' : 'pointer',
                opacity: isDragging ? 0.8 : 1,
                zIndex: isDragging ? 20 : (showTooltip ? 15 : 10),
                borderLeftColor: colors.dot,
                borderLeftWidth: '3px',
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDragging && !wasDragging.current) {
                    onClick(feature);
                }
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="resize-handle left"
                onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            />

            <div className="feature-bar-content">
                <span
                    className="drag-handle"
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('featureId', feature.id);
                        e.dataTransfer.setData('sourceLaneId', feature.laneId);
                    }}
                    title="Mover para outro objetivo"
                    style={{ cursor: 'grab', marginRight: '4px', opacity: 0.7 }}
                >⠿</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{feature.title}</span>
            </div>

            <div
                className="resize-handle right"
                onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            />

            {/* Hover Tooltip */}
            {showTooltip && !isDragging && (
                <div className="feature-tooltip">
                    <div className="feature-tooltip-title">{feature.title}</div>
                    {feature.description && (
                        <div className="feature-tooltip-desc">{feature.description}</div>
                    )}
                    <div className="feature-tooltip-meta">
                        <span className="feature-tooltip-status">
                            <span className="feature-tooltip-dot" style={{ background: colors.dot }} />
                            {feature.status}
                        </span>
                        <span className="feature-tooltip-dates">
                            {startFormatted} → {endFormatted}
                        </span>
                    </div>
                    {feature.tags && feature.tags.length > 0 && (
                        <div className="feature-tooltip-tags">
                            {feature.tags.map((tag, i) => (
                                <span key={i} className="feature-tooltip-tag" style={{ background: tag.color || 'var(--accent)' }}>
                                    {tag.name || tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export { STATUS_COLORS };
