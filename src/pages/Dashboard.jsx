import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../hooks/useBoards';
import { formatCreatedDate } from '../utils/data';
import { Sun, Moon, LogOut, Plus, ClipboardList, Lock, Edit2, Globe, ShieldCheck, Trash2, X } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const {
        boards, createBoard, updateBoard, deleteBoard, getBoardByNumericId,
    } = useBoards(user.id);

    const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
    const [searchId, setSearchId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalVisibility, setModalVisibility] = useState('Privado');
    const [confirmDelete, setConfirmDelete] = useState(null); // board id to confirm delete

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
    };

    const handleSearch = () => {
        if (!searchId) return;
        const idx = parseInt(searchId, 10) - 1;
        if (idx >= 0 && idx < boards.length) {
            navigate(`/board/${boards[idx].id}`);
        }
    };

    const openCreate = () => {
        setEditingBoard(null);
        setModalTitle('');
        setModalVisibility('Privado');
        setShowModal(true);
    };

    const openEdit = (e, board) => {
        e.stopPropagation();
        setEditingBoard(board);
        setModalTitle(board.title);
        setModalVisibility(board.visibility);
        setShowModal(true);
    };

    const handleSave = () => {
        if (!modalTitle.trim()) return;
        if (editingBoard) {
            updateBoard(editingBoard.id, { title: modalTitle.trim(), visibility: modalVisibility });
        } else {
            createBoard(modalTitle.trim(), modalVisibility);
        }
        setShowModal(false);
    };

    const handleDeleteFromModal = () => {
        if (editingBoard) {
            setConfirmDelete(editingBoard.id);
        }
    };

    const executeDelete = () => {
        if (confirmDelete) {
            deleteBoard(confirmDelete);
            setConfirmDelete(null);
            setShowModal(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Header */}
            <header className="app-header">
                <div className="app-header-left">
                    <div className="app-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Meus Boards
                    </div>
                </div>
                <div className="app-header-right">
                    <div className="user-badge">
                        <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                        <span>{user.name}</span>
                    </div>
                    {user.role === 'admin' && (
                        <button className="btn btn-glass" onClick={() => navigate('/admin')}>
                            <ShieldCheck size={16} /> Admin
                        </button>
                    )}
                    <button className="theme-toggle" onClick={toggleTheme} title="Alternar tema">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="btn btn-glass" onClick={handleLogout}>
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="dashboard-container animate-fade-in">
                <div className="dashboard-toolbar">
                    <div className="dashboard-search">
                        <input
                            type="number"
                            className="glass-input"
                            placeholder="Buscar por ID..."
                            min="1"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className="btn btn-glass" onClick={handleSearch}>Acessar</button>
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}>
                        <Plus size={16} /> Novo Board
                    </button>
                </div>

                {boards.length === 0 ? (
                    <div className="empty-state glass-surface" style={{ padding: '64px 32px' }}>
                        <div className="empty-state-icon"><ClipboardList size={48} /></div>
                        <p>Nenhum board criado ainda</p>
                        <button className="btn btn-primary" onClick={openCreate}>
                            <Plus size={16} /> Criar primeiro board
                        </button>
                    </div>
                ) : (
                    <div className="boards-grid">
                        {boards.map((board, idx) => (
                            <div
                                key={board.id}
                                className="glass-card board-card animate-fade-in-up"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                                onClick={() => navigate(`/board/${board.id}`)}
                            >
                                <div className="board-card-header">
                                    <div>
                                        <div className="board-card-title">{board.title}</div>
                                        <div className="board-card-meta">
                                            <span>ID: #{idx + 1}</span>
                                            <span className="visibility-badge">
                                                {board.visibility === 'Privado' ? <Lock size={12} /> : <Globe size={12} />} {board.visibility}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="board-card-actions">
                                        <button className="btn-icon" onClick={(e) => openEdit(e, board)} title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="board-card-date">
                                    Criado em {formatCreatedDate(board.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Board Edit/Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingBoard ? 'Editar Board' : 'Novo Board'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Título *</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Nome do board"
                                    value={modalTitle}
                                    onChange={(e) => setModalTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Visibilidade</label>
                                <select
                                    className="glass-select"
                                    value={modalVisibility}
                                    onChange={(e) => setModalVisibility(e.target.value)}
                                >
                                    <option value="Privado">Privado</option>
                                    <option value="Público">Público</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div>
                                {editingBoard && (
                                    <button className="btn btn-danger" onClick={handleDeleteFromModal}>
                                        <Trash2 size={16} /> Excluir
                                    </button>
                                )}
                            </div>
                            <div className="modal-footer-right">
                                <button className="btn btn-glass" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)} style={{ zIndex: 1001 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Confirmar Exclusão</h2>
                            <button className="modal-close" onClick={() => setConfirmDelete(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                                Tem certeza que deseja excluir este board? Todos os objetivos e iniciativas serão removidos permanentemente.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <div />
                            <div className="modal-footer-right">
                                <button className="btn btn-glass" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                                <button className="btn btn-danger" onClick={executeDelete}>
                                    <Trash2 size={16} /> Excluir Board
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
