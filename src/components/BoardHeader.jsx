import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Compass, Target, Map, GitMerge, BarChart3, Sun, Moon, LogOut, Settings, Users, Tag, Share2 } from 'lucide-react';
import TeamManager from './TeamManager';
import TagManager from './TagManager';

export default function BoardHeader({ board, boardId, currentView, children }) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { addToast } = useToast();

    // Theme logic
    const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
    };

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const currentObjTheme = document.documentElement.getAttribute('data-theme');
            if (currentObjTheme && currentObjTheme !== theme) {
                setTheme(currentObjTheme);
            }
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, [theme]);

    // Settings dropdown
    const [showSettings, setShowSettings] = useState(false);
    const [showTeamManager, setShowTeamManager] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const settingsRef = useRef(null);

    useEffect(() => {
        if (!showSettings) return;
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            addToast('Link copiado para a área de transferência!', 'success');
        }).catch(() => {
            addToast('Não foi possível copiar automaticamente. URL: ' + url, 'info');
        });
        setShowSettings(false);
    };

    const tabs = [
        { id: 'canvas', label: 'Estratégia', icon: Compass },
        { id: 'choices', label: 'Escolhas', icon: Target },
        { id: 'roadmap', label: 'Roadmap', icon: Map },
        { id: 'metrics', label: 'Métricas', icon: GitMerge },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    if (!board) return null;

    return (
        <>
            <header className="app-header" style={{ padding: '0 24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                    <button
                        className="btn btn-glass flex items-center gap-1.5 px-3 py-1.5 text-sm"
                        onClick={() => navigate('/')}
                        title="Voltar ao Dashboard"
                        style={{ fontSize: '0.8rem' }}
                    >
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/</span>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', color: 'var(--accent)', margin: 0, lineHeight: 1.2 }}>{board.title}</h1>
                    </div>
                </div>

                <div className="flex-1 flex justify-center">
                    <div className="bg-black/20 rounded-lg p-1 flex gap-1 border border-white/5">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = currentView === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all cursor-pointer ${isActive ? 'text-white' : 'text-muted hover:text-white hover:bg-white/10'}`}
                                    style={{
                                        background: isActive ? 'var(--accent)' : 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        ...(isActive ? { boxShadow: '0 4px 16px rgba(0,134,255,0.3)' } : {}),
                                    }}
                                    onClick={() => navigate(`/board/${boardId}/${tab.id}`)}
                                >
                                    <Icon size={16} />
                                    <span className="font-medium hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                    {children}

                    <button
                        className="btn btn-glass flex items-center gap-1.5 px-3 py-1.5 text-sm"
                        onClick={() => setShowTeamManager(true)}
                        title="Gerenciar Time"
                        style={{ fontSize: '0.8rem' }}
                    >
                        <Users size={14} />
                        <span className="hidden md:inline">Time</span>
                    </button>
                    <button
                        className="btn btn-glass flex items-center gap-1.5 px-3 py-1.5 text-sm"
                        onClick={() => setShowTagManager(true)}
                        title="Gerenciar Tags"
                        style={{ fontSize: '0.8rem' }}
                    >
                        <Tag size={14} />
                        <span className="hidden md:inline">Tags</span>
                    </button>

                    {/* Settings Dropdown */}
                    <div style={{ position: 'relative' }} ref={settingsRef}>
                        <button
                            className="btn-icon"
                            onClick={() => setShowSettings(!showSettings)}
                            title="Configurações"
                            style={{ background: 'transparent', border: 'none', outline: 'none' }}
                        >
                            <Settings size={18} />
                        </button>
                        {showSettings && (
                            <div className="settings-dropdown">
                                <button
                                    className="settings-dropdown-item"
                                    onClick={handleShare}
                                >
                                    <Share2 size={16} /> Compartilhar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <button className="theme-toggle" onClick={toggleTheme} title="Alternar tema">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="btn btn-glass" onClick={handleLogout} title="Sair">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {showTeamManager && (
                <TeamManager
                    boardId={boardId}
                    onClose={() => setShowTeamManager(false)}
                />
            )}

            {showTagManager && (
                <TagManager
                    boardId={boardId}
                    onClose={() => setShowTagManager(false)}
                />
            )}
        </>
    );
}
