import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../hooks/useBoards';
import { useStrategicChoices } from '../hooks/useStrategicChoices';
import { MONTHS } from '../utils/data';
import FeatureBar, { STATUS_COLORS } from '../components/FeatureBar';
import FeatureModal from '../components/FeatureModal';
import ImportModal from '../components/ImportModal';
import HealthIndicator from '../components/HealthIndicator';
import BoardHeader from '../components/BoardHeader';
import { useToast } from '../context/ToastContext';
import { Filter, Plus, ChevronLeft, ChevronRight, GripVertical, Upload, Trash2, X, Target, MoreHorizontal } from 'lucide-react';

const QUARTERS = [
    { label: 'Q1', months: [0, 1, 2] },
    { label: 'Q2', months: [3, 4, 5] },
    { label: 'Q3', months: [6, 7, 8] },
    { label: 'Q4', months: [9, 10, 11] },
];

const ZOOM_LEVELS = [
    { label: '1Q', quarters: 1 },
    { label: '2Q', quarters: 2 },
    { label: 'Ano', quarters: 4 },
];

const STATUS_LABELS = {
    'Not Started': 'Não Iniciado',
    'On Going': 'Em Andamento',
    'Done': 'Concluído',
    'Blocked': 'Bloqueado',
};

export default function Roadmap() {
    const { id: boardId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        getBoard, getLanes, getFeatures, createLane, updateLane, deleteLane,
        createFeature, updateFeature, deleteFeature, loadBoardData
    } = useBoards(user?.id);
    const { choices, fetchChoices } = useStrategicChoices(boardId);

    const { addToast } = useToast();
    const board = getBoard(boardId);
    const lanes = getLanes(boardId);

    // Load board data from backend on mount
    useEffect(() => {
        if (boardId) {
            loadBoardData(boardId);
            fetchChoices();
        }
    }, [boardId, loadBoardData, fetchChoices]);

    const [year, setYear] = useState(new Date().getFullYear());
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showOverflow, setShowOverflow] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const [activeLaneId, setActiveLaneId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ statuses: [], tags: [] });
    const [editingLaneId, setEditingLaneId] = useState(null);
    const [editingLaneTitle, setEditingLaneTitle] = useState('');
    const [boardTags, setBoardTags] = useState([]);
    const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }
    const [draggingLaneId, setDraggingLaneId] = useState(null);
    const [dragOverLaneId, setDragOverLaneId] = useState(null);
    const filterRef = useRef(null);
    const overflowRef = useRef(null);

    // Load board tags
    const fetchBoardTags = useCallback(async () => {
        if (!boardId) return;
        try {
            const res = await fetch(`/api/tags?boardId=${boardId}`);
            const data = await res.json();
            setBoardTags(data);
        } catch (e) { console.error(e); }
    }, [boardId]);

    useEffect(() => { fetchBoardTags(); }, [fetchBoardTags]);

    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(2);
    const [startQuarter, setStartQuarter] = useState(0);

    // Close filter panel when clicking outside
    useEffect(() => {
        if (!showFilters) return;
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        // Use setTimeout to avoid closing immediately on the same click that opened it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    // Close overflow menu when clicking outside
    useEffect(() => {
        if (!showOverflow) return;
        const handleClickOutside = (e) => {
            if (overflowRef.current && !overflowRef.current.contains(e.target)) {
                setShowOverflow(false);
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOverflow]);

    // Calculate visible months and quarters based on zoom
    const { visibleQuarters, visibleMonths } = useMemo(() => {
        const zoom = ZOOM_LEVELS[zoomLevel];
        const numQ = zoom.quarters;
        const actualStart = Math.min(startQuarter, 4 - numQ);
        const vQuarters = QUARTERS.slice(actualStart, actualStart + numQ);
        const vMonths = vQuarters.flatMap(q => q.months);
        return { visibleQuarters: vQuarters, visibleMonths: vMonths };
    }, [zoomLevel, startQuarter]);

    // Navigation for zoomed view
    const canNavPrev = startQuarter > 0 && zoomLevel < 2;
    const canNavNext = startQuarter + ZOOM_LEVELS[zoomLevel].quarters < 4 && zoomLevel < 2;

    const navPrevQuarter = () => {
        if (canNavPrev) setStartQuarter(s => s - 1);
    };

    const navNextQuarter = () => {
        if (canNavNext) setStartQuarter(s => s + 1);
    };

    const handleAddLane = () => {
        const title = `Objetivo ${lanes.length + 1}`;
        createLane(boardId, title);
    };

    const handleLaneDoubleClick = (lane) => {
        setEditingLaneId(lane.id);
        setEditingLaneTitle(lane.title);
    };

    const handleLaneTitleSave = (laneId) => {
        if (editingLaneTitle.trim()) {
            updateLane(laneId, { title: editingLaneTitle.trim() });
        }
        setEditingLaneId(null);
    };

    const handleDeleteLane = (laneId) => {
        setConfirmAction({
            message: 'Excluir este objetivo e todas as iniciativas?',
            onConfirm: () => { deleteLane(laneId); setConfirmAction(null); }
        });
    };

    const handleLaneDragOver = (e, laneId) => {
        e.preventDefault();
        if (draggingLaneId && draggingLaneId !== laneId) {
            setDragOverLaneId(laneId);
        }
    };

    const handleLaneDrop = async (e, targetLaneId) => {
        e.preventDefault();
        setDragOverLaneId(null);
        const sourceLaneId = e.dataTransfer.getData('laneId');
        if (!sourceLaneId || sourceLaneId === targetLaneId) return;

        const sourceIdx = lanes.findIndex(l => l.id === sourceLaneId);
        const targetIdx = lanes.findIndex(l => l.id === targetLaneId);
        if (sourceIdx === -1 || targetIdx === -1) return;

        const reordered = [...lanes];
        const [moved] = reordered.splice(sourceIdx, 1);
        reordered.splice(targetIdx, 0, moved);

        for (let i = 0; i < reordered.length; i++) {
            await fetch(`/api/lanes/${reordered[i].id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sort_order: i })
            });
        }
        loadBoardData(boardId);
        setDraggingLaneId(null);
    };

    const openCreateFeature = (laneId) => {
        setActiveLaneId(laneId);
        setEditingFeature(null);
        setShowFeatureModal(true);
    };

    const openEditFeature = (feature) => {
        setActiveLaneId(feature.laneId);
        setEditingFeature(feature);
        setShowFeatureModal(true);
    };

    const handleSaveFeature = async (featureData) => {
        // Sync any new tags to the board tags table
        if (featureData.tags && featureData.tags.length > 0) {
            for (const tag of featureData.tags) {
                const exists = boardTags.find(bt => bt.name.toLowerCase() === tag.name.toLowerCase());
                if (!exists) {
                    try {
                        await fetch('/api/tags', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ boardId, name: tag.name, color: tag.color }),
                        });
                    } catch (e) {
                        // Ignore duplicates
                    }
                }
            }
            fetchBoardTags(); // Refresh board tags
        }

        if (editingFeature && editingFeature.id) {
            updateFeature(editingFeature.id, featureData);
        } else {
            createFeature(activeLaneId, featureData);
        }
        setShowFeatureModal(false);
        setEditingFeature(null);
    };

    const handleDeleteFeature = (featureId) => {
        setConfirmAction({
            message: 'Excluir esta iniciativa permanentemente?',
            onConfirm: () => {
                deleteFeature(featureId);
                setShowFeatureModal(false);
                setConfirmAction(null);
            }
        });
    };

    // Click on timeline to create a feature at that position
    const handleTimelineClick = (e, laneId) => {
        // Don't create if clicking on a feature bar
        if (e.target.closest('.feature-bar')) return;

        const td = e.currentTarget;
        const rect = td.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = clickX / rect.width;

        // Calculate the date from the clicked position
        const firstMonth = Math.min(...visibleMonths);
        const lastMonth = Math.max(...visibleMonths);
        const rangeStart = new Date(year, firstMonth, 1);
        const rangeEnd = new Date(year, lastMonth + 1, 0);
        const totalDays = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24) + 1;

        const clickDay = Math.floor(ratio * totalDays);
        const startDate = new Date(rangeStart.getTime() + clickDay * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days

        const fmt = (d) => d.toISOString().split('T')[0];

        setActiveLaneId(laneId);
        setEditingFeature({
            startDate: fmt(startDate),
            endDate: fmt(endDate),
        });
        setShowFeatureModal(true);
    };

    const handleDrop = useCallback((e, targetLaneId) => {
        e.preventDefault();
        const featureId = e.dataTransfer.getData('featureId');
        const sourceLaneId = e.dataTransfer.getData('sourceLaneId');
        if (featureId && sourceLaneId !== targetLaneId) {
            updateFeature(featureId, { laneId: targetLaneId });
        }
    }, [updateFeature]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const toggleStatusFilter = (status) => {
        setFilters(prev => ({
            ...prev,
            statuses: prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status],
        }));
    };

    const getFilteredFeatures = (laneId) => {
        let features = getFeatures(laneId);
        if (filters.statuses.length > 0) {
            features = features.filter(f => filters.statuses.includes(f.status));
        }
        return features;
    };

    // Import handler - creates lanes and features from CSV data
    const handleImport = async (rows) => {
        const laneMap = {};
        // Map existing lanes by title
        lanes.forEach(l => { laneMap[l.title.toLowerCase()] = l.id; });

        for (const row of rows) {
            let laneId;
            const laneName = row.laneName || `Objetivo ${lanes.length + Object.keys(laneMap).length + 1}`;

            if (laneMap[laneName.toLowerCase()]) {
                laneId = laneMap[laneName.toLowerCase()];
            } else {
                // Create new lane (createLane is async and returns a lane object)
                const newLane = await createLane(boardId, laneName);
                laneMap[laneName.toLowerCase()] = newLane.id;
                laneId = newLane.id;
            }

            // Sync tags to board-level tags table
            if (row.tags && row.tags.length > 0) {
                for (const tag of row.tags) {
                    try {
                        await fetch('/api/tags', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ boardId, name: tag.name, color: tag.color }),
                        });
                    } catch (e) {
                        // Ignore duplicates
                    }
                }
            }

            await createFeature(laneId, {
                title: row.title,
                description: row.description,
                status: row.status,
                tags: row.tags,
                startDate: row.startDate,
                endDate: row.endDate,
            });
        }

        setShowImportModal(false);
        fetchBoardTags();
        addToast(`${rows.length} iniciativa${rows.length > 1 ? 's' : ''} importada${rows.length > 1 ? 's' : ''} com sucesso!`, 'success');
        setTimeout(() => loadBoardData(boardId), 500);
    };

    if (!board) {
        return (
            <div className="auth-container">
                <div className="glass-surface auth-card" style={{ textAlign: 'center' }}>
                    <h2>Board não encontrado</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
                        O board que você está procurando não existe.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Voltar para Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const renderLaneRow = (lane) => {
        const features = getFilteredFeatures(lane.id);
        return (
            <tr
                key={lane.id}
                className={`lane-row ${dragOverLaneId === lane.id ? 'lane-drag-over' : ''} ${draggingLaneId === lane.id ? 'lane-dragging' : ''}`}
                onDragOver={(e) => handleLaneDragOver(e, lane.id)}
                onDragLeave={() => setDragOverLaneId(null)}
                onDrop={(e) => handleLaneDrop(e, lane.id)}
            >
                <td className="timeline-lane-name">
                    <div className="lane-name-content">
                        <div className="lane-header-row">
                            <span
                                className="lane-drag-handle"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('laneId', lane.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                    setDraggingLaneId(lane.id);
                                }}
                                onDragEnd={() => setDraggingLaneId(null)}
                                title="Arrastar para reordenar"
                            >
                                <GripVertical size={14} />
                            </span>
                            {editingLaneId === lane.id ? (
                                <input
                                    type="text"
                                    className="glass-input lane-edit-input"
                                    value={editingLaneTitle}
                                    onChange={(e) => setEditingLaneTitle(e.target.value)}
                                    onBlur={() => handleLaneTitleSave(lane.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleLaneTitleSave(lane.id);
                                        if (e.key === 'Escape') setEditingLaneId(null);
                                    }}
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className="lane-title"
                                    onDoubleClick={() => handleLaneDoubleClick(lane)}
                                    title="Duplo clique para editar"
                                >
                                    <HealthIndicator features={getFeatures(lane.id)} />
                                    {lane.title}
                                </span>
                            )}
                        </div>
                        <div className="lane-actions">
                            <button
                                className="lane-action-btn lane-action-add"
                                onClick={() => openCreateFeature(lane.id)}
                                title="Adicionar iniciativa"
                            >
                                <Plus size={13} /> Iniciativa
                            </button>
                            <button
                                className="lane-action-btn lane-action-danger"
                                onClick={() => handleDeleteLane(lane.id)}
                                title="Excluir objetivo"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                </td>
                <td
                    colSpan={visibleMonths.length}
                    className="timeline-lane-content"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, lane.id)}
                    onClick={(e) => handleTimelineClick(e, lane.id)}
                    title="Clique para criar uma iniciativa"
                    style={{ cursor: 'crosshair' }}
                >
                    {features.map(feature => (
                        <FeatureBar
                            key={feature.id}
                            feature={feature}
                            year={year}
                            onClick={openEditFeature}
                            onUpdateFeature={updateFeature}
                            visibleMonths={visibleMonths}
                        />
                    ))}
                </td>
            </tr>
        );
    };

    return (
        <>
            {/* Header */}
            <BoardHeader board={board} boardId={boardId} currentView="roadmap">
                <div style={{ position: 'relative' }} ref={filterRef}>
                    <button className="btn btn-glass" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={16} /> Filtros
                        {filters.statuses.length > 0 && (
                            <span className="filter-badge">{filters.statuses.length}</span>
                        )}
                    </button>
                    {showFilters && (
                        <div className="filter-panel glass-surface">
                            <div className="filter-section">
                                <div className="filter-section-title">Status</div>
                                {['Not Started', 'On Going', 'Done', 'Blocked'].map(status => (
                                    <label key={status} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.statuses.includes(status)}
                                            onChange={() => toggleStatusFilter(status)}
                                        />
                                        <span className="filter-status-dot" style={{ background: STATUS_COLORS[status].dot }} />
                                        {STATUS_LABELS[status]}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button className="btn btn-primary" onClick={handleAddLane} title="Novo Objetivo">
                    <Plus size={16} /> Objetivo
                </button>
                <div style={{ position: 'relative' }} ref={overflowRef}>
                    <button
                        className="btn btn-glass"
                        onClick={() => setShowOverflow(!showOverflow)}
                        title="Mais opções"
                        style={{ padding: '6px 8px' }}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                    {showOverflow && (
                        <div className="overflow-menu">
                            <button
                                className="settings-dropdown-item"
                                onClick={() => { setShowImportModal(true); setShowOverflow(false); }}
                            >
                                <Upload size={16} /> Importar CSV
                            </button>
                        </div>
                    )}
                </div>
            </BoardHeader>

            {/* Roadmap Content */}
            <div className="roadmap-container animate-fade-in">
                <div className="timeline-wrapper glass-surface">
                    {/* Year navigation + Zoom Controls */}
                    <div className="timeline-nav">
                        <div className="timeline-nav-group">
                            <button onClick={() => setYear(y => y - 1)}><ChevronLeft size={20} /> Anterior</button>
                            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>{year}</div>
                            <button onClick={() => setYear(y => y + 1)}>Próximo <ChevronRight size={20} /></button>
                        </div>

                        <div className="timeline-zoom-controls">
                            {zoomLevel < 2 && (
                                <button
                                    className="btn-icon-sm"
                                    onClick={navPrevQuarter}
                                    disabled={!canNavPrev}
                                    title="Quarter anterior"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            )}

                            {ZOOM_LEVELS.map((z, i) => (
                                <button
                                    key={z.label}
                                    className={`zoom-btn ${zoomLevel === i ? 'active' : ''}`}
                                    onClick={() => {
                                        setZoomLevel(i);
                                        const maxStart = 4 - z.quarters;
                                        if (startQuarter > maxStart) setStartQuarter(maxStart);
                                    }}
                                    title={`Visualizar ${z.label}`}
                                >
                                    {z.label}
                                </button>
                            ))}

                            {zoomLevel < 2 && (
                                <button
                                    className="btn-icon-sm"
                                    onClick={navNextQuarter}
                                    disabled={!canNavNext}
                                    title="Próximo quarter"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="timeline-table" style={{ minWidth: zoomLevel === 2 ? '1000px' : '600px' }}>
                            <thead>
                                {/* Quarters row */}
                                <tr>
                                    <th className="timeline-lane-name" style={{ background: 'var(--glass-bg)' }}>
                                        <strong style={{ fontSize: '0.9rem' }}>Objetivos</strong>
                                    </th>
                                    {visibleQuarters.map(q => (
                                        <th key={q.label} colSpan={3} className="timeline-quarter-header">
                                            {q.label}
                                        </th>
                                    ))}
                                </tr>
                                {/* Months row */}
                                <tr>
                                    <th className="timeline-lane-name" style={{ border: 'none', background: 'transparent' }}></th>
                                    {visibleMonths.map((mIdx) => (
                                        <th key={mIdx} className="timeline-month-header">{MONTHS[mIdx]}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {lanes.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleMonths.length + 1} className="py-20 text-center text-muted animate-fade-in-up relative">
                                            <div className="flex flex-col items-center justify-center p-8 bg-black/10 rounded-lg mx-auto w-fit border border-white/5 shadow-inner mt-8 max-w-md">
                                                <Target size={48} className="mb-4 opacity-50" />
                                                <p className="text-lg mb-4 text-white font-medium">Nenhum objetivo definido</p>
                                                <p className="text-sm mb-6 max-w-sm">
                                                    Crie um objetivo para organizar suas iniciativas no Roadmap. Cada objetivo agrupa as iniciativas necessárias para alcançá-lo.
                                                </p>
                                                <div className="flex gap-3">
                                                    <button className="btn btn-primary" onClick={handleAddLane}>
                                                        <Plus size={16} /> Criar Primeiro Objetivo
                                                    </button>
                                                    {choices.length === 0 && (
                                                        <button className="btn btn-glass" onClick={() => navigate(`/board/${boardId}/choices`)}>
                                                            <Target size={16} /> Definir Escolhas Estratégicas
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {/* Render Grouped by Choice */}
                                        {choices.map(choice => {
                                            const choiceLanes = lanes.filter(l => l.strategicChoiceId === choice.id);
                                            if (choiceLanes.length === 0) return null;

                                            return (
                                                <React.Fragment key={`choice-${choice.id}`}>
                                                    <tr className="choice-separator-row border-y border-[var(--border-color)] bg-black/20">
                                                        <td colSpan={visibleMonths.length + 1} className="py-2 px-4 shadow-sm relative overflow-hidden">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: choice.color }}></div>
                                                            <div className="flex items-center gap-2 pl-2">
                                                                <span className="w-2 h-2 rounded-full" style={{ background: choice.color }} />
                                                                <strong className="text-[var(--accent)] tracking-wide">{choice.title}</strong>
                                                                <span className="text-xs text-secondary ml-4 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 hidden md:inline-block">
                                                                    {choiceLanes.length} Objetivo{choiceLanes.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {choiceLanes.map(lane => renderLaneRow(lane))}
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Render Unassigned Lanes */}
                                        {(() => {
                                            const unassignedLanes = lanes.filter(l => !l.strategicChoiceId);
                                            if (unassignedLanes.length === 0) return null;
                                            return (
                                                <React.Fragment key="unassigned">
                                                    {choices.length > 0 && (
                                                        <tr className="choice-separator-row border-y border-[var(--border-color)] bg-black/10">
                                                            <td colSpan={visibleMonths.length + 1} className="py-2 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <strong className="text-secondary tracking-wide">Outros Objetivos</strong>
                                                                    <span className="text-xs text-muted italic" title="Objetivos não vinculados a nenhuma Escolha Estratégica">(sem escolha estratégica)</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {unassignedLanes.map(lane => renderLaneRow(lane))}
                                                </React.Fragment>
                                            );
                                        })()}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Status Legend */}
                    <div className="status-legend">
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <div key={key} className="status-legend-item">
                                <span className="status-legend-dot" style={{ background: STATUS_COLORS[key].dot }} />
                                <span className="status-legend-label">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feature Modal */}
            {showFeatureModal && (
                <FeatureModal
                    feature={editingFeature}
                    onSave={handleSaveFeature}
                    onDelete={handleDeleteFeature}
                    onClose={() => { setShowFeatureModal(false); setEditingFeature(null); }}
                    boardTags={boardTags}
                    boardId={boardId}
                    user={user}
                />
            )}

            {/* Import Modal */}
            {showImportModal && (
                <ImportModal
                    onImport={handleImport}
                    onClose={() => setShowImportModal(false)}
                    existingLanes={lanes}
                />
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="modal-overlay" onClick={() => setConfirmAction(null)} style={{ zIndex: 1001 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Confirmar Exclusão</h2>
                            <button className="modal-close" onClick={() => setConfirmAction(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                                {confirmAction.message}
                            </p>
                        </div>
                        <div className="modal-footer">
                            <div />
                            <div className="modal-footer-right">
                                <button className="btn btn-glass" onClick={() => setConfirmAction(null)}>Cancelar</button>
                                <button className="btn btn-danger" onClick={confirmAction.onConfirm}>
                                    <Trash2 size={16} /> Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
