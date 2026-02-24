import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../hooks/useBoards';
import { MONTHS } from '../utils/data';
import FeatureBar, { STATUS_COLORS } from '../components/FeatureBar';
import FeatureModal from '../components/FeatureModal';
import ImportModal from '../components/ImportModal';
import { ArrowLeft, Filter, Plus, Share2, Sun, Moon, LogOut, ChevronLeft, ChevronRight, GripVertical, Upload } from 'lucide-react';

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
    const { user, logout } = useAuth();
    const {
        getBoard, getLanes, getFeatures, createLane, updateLane, deleteLane,
        createFeature, updateFeature, deleteFeature, loadBoardData
    } = useBoards(user.id);

    const board = getBoard(boardId);
    const lanes = getLanes(boardId);

    // Load board data from backend on mount
    useEffect(() => {
        if (boardId) {
            loadBoardData(boardId);
        }
    }, [boardId, loadBoardData]);

    const [year, setYear] = useState(new Date().getFullYear());
    const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const [activeLaneId, setActiveLaneId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ statuses: [], tags: [] });
    const [editingLaneId, setEditingLaneId] = useState(null);
    const [editingLaneTitle, setEditingLaneTitle] = useState('');
    const filterRef = useRef(null);

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

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
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
        if (confirm('Excluir este objetivo e todas as iniciativas?')) {
            deleteLane(laneId);
        }
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

    const handleSaveFeature = (featureData) => {
        if (editingFeature && editingFeature.id) {
            updateFeature(editingFeature.id, featureData);
        } else {
            createFeature(activeLaneId, featureData);
        }
        setShowFeatureModal(false);
        setEditingFeature(null);
    };

    const handleDeleteFeature = (featureId) => {
        if (confirm('Excluir esta iniciativa?')) {
            deleteFeature(featureId);
            setShowFeatureModal(false);
        }
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

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copiado para a área de transferência!');
        }).catch(() => {
            prompt('Copie o link:', url);
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Import handler - creates lanes and features from CSV data
    const handleImport = (rows) => {
        const laneMap = {};
        // Map existing lanes by title
        lanes.forEach(l => { laneMap[l.title.toLowerCase()] = l.id; });

        for (const row of rows) {
            let laneId;
            const laneName = row.laneName || `Objetivo ${lanes.length + Object.keys(laneMap).length + 1}`;

            if (laneMap[laneName.toLowerCase()]) {
                laneId = laneMap[laneName.toLowerCase()];
            } else {
                // Create new lane
                const newLaneId = createLane(boardId, laneName);
                laneMap[laneName.toLowerCase()] = newLaneId;
                laneId = newLaneId;
            }

            createFeature(laneId, {
                title: row.title,
                description: row.description,
                status: row.status,
                tags: row.tags,
                startDate: row.startDate,
                endDate: row.endDate,
            });
        }

        setShowImportModal(false);
        // Reload data from backend
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

    return (
        <>
            {/* Header */}
            <header className="app-header">
                <div className="app-header-left">
                    <button
                        className="btn-icon"
                        onClick={() => navigate('/')}
                        title="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{board.title}</h1>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{boardId.slice(0, 6)}</span>
                    </div>
                </div>
                <div className="app-header-right">
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
                    <button className="btn btn-glass" onClick={() => setShowImportModal(true)}>
                        <Upload size={16} /> Importar
                    </button>
                    <button className="btn btn-primary" onClick={handleAddLane}>
                        <Plus size={16} /> Lane
                    </button>
                    <button className="btn btn-glass" onClick={handleShare}>
                        <Share2 size={16} /> Compartilhar
                    </button>
                    <button className="theme-toggle" onClick={toggleTheme} title="Alternar tema">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="btn btn-glass" onClick={handleLogout}>
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </header>

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
                                        <td colSpan={visibleMonths.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            Nenhum objetivo adicionado. Clique em "+ Lane" para começar.
                                        </td>
                                    </tr>
                                ) : (
                                    lanes.map(lane => {
                                        const features = getFilteredFeatures(lane.id);
                                        return (
                                            <tr key={lane.id}>
                                                <td className="timeline-lane-name">
                                                    <div className="lane-name-content">
                                                        <span className="drag-handle" title="Arrastar"><GripVertical size={14} /></span>
                                                        {editingLaneId === lane.id ? (
                                                            <input
                                                                type="text"
                                                                className="glass-input"
                                                                value={editingLaneTitle}
                                                                onChange={(e) => setEditingLaneTitle(e.target.value)}
                                                                onBlur={() => handleLaneTitleSave(lane.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleLaneTitleSave(lane.id);
                                                                    if (e.key === 'Escape') setEditingLaneId(null);
                                                                }}
                                                                autoFocus
                                                                style={{ padding: '2px 4px', fontSize: '0.85rem' }}
                                                            />
                                                        ) : (
                                                            <span
                                                                className="lane-title"
                                                                onDoubleClick={() => handleLaneDoubleClick(lane)}
                                                                title="Duplo clique para editar"
                                                            >
                                                                {lane.title}
                                                            </span>
                                                        )}
                                                        <button
                                                            className="lane-add-btn"
                                                            onClick={() => openCreateFeature(lane.id)}
                                                            title="Adicionar iniciativa"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
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
                                    })
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
        </>
    );
}
