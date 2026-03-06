import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const MIN_DRAG_DISTANCE = 5; // Minimum pixels to move before considering it a drag

function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function FeatureTooltip({ feature, barRef, colors }) {
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (barRef.current) {
            const rect = barRef.current.getBoundingClientRect();
            setPos({
                top: rect.top - 10 + window.scrollY,
                left: rect.left + rect.width / 2 + window.scrollX,
            });
        }
    }, [barRef]);

    const startFormatted = formatDate(feature.startDate);
    const endFormatted = formatDate(feature.endDate);

    return createPortal(
        <div
            className="feature-tooltip"
            style={{
                position: 'absolute',
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                transform: 'translate(-50%, -100%)',
                bottom: 'auto',
            }}
        >
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
        </div>,
        document.body
    );
}

export default function FeatureBar({ feature, year, onClick, onUpdateFeature, visibleMonths }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState(null);
    const [previewPos, setPreviewPos] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const barRef = useRef(null);
    const tooltipTimer = useRef(null);
    const didDrag = useRef(false);
    const pendingDrag = useRef(null);

    const pos = calculateBarPosition(feature.startDate, feature.endDate, year, visibleMonths);
    const displayPos = previewPos || pos;
    const colors = STATUS_COLORS[feature.status] || STATUS_COLORS['Not Started'];

    const startDrag = (e, type) => {
        e.stopPropagation();
        setShowTooltip(false);

        if (!barRef.current) return;
        const container = barRef.current.parentElement;
        const containerWidth = container.getBoundingClientRect().width;

        // For resize handles, start drag immediately
        if (type !== 'move') {
            e.preventDefault();
            didDrag.current = true;
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
            return;
        }

        // For move, defer drag until minimum distance is reached
        pendingDrag.current = {
            type,
            startX: e.clientX,
            containerWidth,
            initialStart: feature.startDate,
            initialEnd: feature.endDate,
            currentStart: feature.startDate,
            currentEnd: feature.endDate
        };
        didDrag.current = false;

        const onMove = (me) => {
            const dist = Math.abs(me.clientX - pendingDrag.current.startX);
            if (dist >= MIN_DRAG_DISTANCE && !didDrag.current) {
                didDrag.current = true;
                setDragState({ ...pendingDrag.current });
                setIsDragging(true);
            }
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            pendingDrag.current = null;
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
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

    return (
        <div
            ref={barRef}
            className={`feature-bar ${STATUS_CLASSES[feature.status] || 'status-not-started'} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: displayPos.left,
                width: displayPos.width,
                cursor: isDragging ? 'grabbing' : 'pointer',
                opacity: isDragging ? 0.8 : 1,
                zIndex: isDragging ? 20 : (showTooltip ? 15 : 10),
                borderLeftColor: colors.dot,
                borderLeftWidth: '3px',
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (!didDrag.current) {
                    onClick(feature);
                }
            }}
            onMouseDown={(e) => startDrag(e, 'move')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="resize-handle left"
                onMouseDown={(e) => startDrag(e, 'resize-left')}
                title="Arraste para ajustar data de início"
            />

            <div className="feature-bar-content">
                <span
                    className="drag-handle"
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('featureId', feature.id);
                        e.dataTransfer.setData('sourceLaneId', feature.laneId);
                    }}
                    title="Arraste para mover entre objetivos"
                    style={{ cursor: 'grab', marginRight: '2px', opacity: 0.45, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                >
                    <GripVertical size={12} />
                </span>
                <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                    title={feature.title}
                >
                    {feature.title}
                </span>
            </div>

            <div
                className="resize-handle right"
                onMouseDown={(e) => startDrag(e, 'resize-right')}
                title="Arraste para ajustar data de fim"
            />

            {/* Tooltip rendered via portal to avoid overflow clipping */}
            {showTooltip && !isDragging && (
                <FeatureTooltip feature={feature} barRef={barRef} colors={colors} />
            )}
        </div>
    );
}

export { STATUS_COLORS };
