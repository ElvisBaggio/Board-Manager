import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Shield, ShieldCheck, Trash2, Sun, Moon, LogOut, UserPlus, X } from 'lucide-react';

export default function AdminPanel() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
    const [createError, setCreateError] = useState('');

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users', {
                headers: {
                    'x-user-role': user.role,
                    'x-user-id': user.id,
                },
            });
            if (!res.ok) {
                navigate('/');
                return;
            }
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchUsers();
    }, [user]);

    const handleCreateUser = async () => {
        setCreateError('');
        if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
            setCreateError('Preencha todos os campos.');
            return;
        }

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role,
                },
                body: JSON.stringify(newUser),
            });
            const data = await res.json();
            if (!res.ok) {
                setCreateError(data.error || 'Erro ao criar usuário.');
                return;
            }
            setNewUser({ name: '', email: '', password: '', role: 'user' });
            setShowCreateForm(false);
            fetchUsers();
        } catch (e) {
            setCreateError('Erro de conexão.');
        }
    };

    const handleToggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            const res = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role,
                },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) fetchUsers();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (userId === user.id) return;
        if (!confirm(`Excluir o usuário "${userName}"? Todos os dados serão removidos.`)) return;

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-role': user.role,
                    'x-user-id': user.id,
                },
            });
            if (res.ok) fetchUsers();
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR');
    };

    return (
        <>
            <header className="app-header">
                <div className="app-header-left">
                    <button className="btn-icon" onClick={() => navigate('/')} title="Voltar">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
                            <ShieldCheck size={20} style={{ marginRight: 6 }} />
                            Painel de Administração
                        </h1>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Gestão de Usuários
                        </span>
                    </div>
                </div>
                <div className="app-header-right">
                    <button className="theme-toggle" onClick={toggleTheme} title="Alternar tema">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="btn btn-glass" onClick={handleLogout}>
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </header>

            <div className="dashboard-container animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div className="glass-surface" style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            Usuários ({users.length})
                        </h2>
                        <button
                            className="btn btn-primary"
                            onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(''); }}
                        >
                            <UserPlus size={16} /> Novo Usuário
                        </button>
                    </div>

                    {/* Create user form */}
                    {showCreateForm && (
                        <div className="glass-surface" style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '16px',
                            border: '1px solid rgba(52, 152, 219, 0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                                    <UserPlus size={16} style={{ marginRight: 6 }} /> Criar Novo Usuário
                                </span>
                                <button className="btn-icon" onClick={() => setShowCreateForm(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.78rem' }}>Nome</label>
                                    <input
                                        className="glass-input"
                                        type="text"
                                        placeholder="Nome completo"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.78rem' }}>Email</label>
                                    <input
                                        className="glass-input"
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.78rem' }}>Senha</label>
                                    <input
                                        className="glass-input"
                                        type="password"
                                        placeholder="Senha"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.78rem' }}>Papel</label>
                                    <select
                                        className="glass-input"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                                    >
                                        <option value="user">Usuário</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            {createError && (
                                <div style={{
                                    background: 'rgba(231, 76, 60, 0.15)',
                                    border: '1px solid rgba(231, 76, 60, 0.3)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '0.82rem',
                                    color: '#e74c3c',
                                    marginTop: '10px'
                                }}>
                                    ⚠️ {createError}
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                                <button className="btn btn-glass" onClick={() => setShowCreateForm(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleCreateUser}>
                                    <UserPlus size={14} /> Criar Usuário
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            Carregando...
                        </div>
                    ) : (
                        <div className="admin-users-list">
                            {users.map(u => (
                                <div key={u.id} className="admin-user-row">
                                    <div className="admin-user-info">
                                        <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                                                {u.name}
                                                {u.id === user.id && (
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>(você)</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {u.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="admin-user-meta">
                                        <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                            {u.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {formatDate(u.createdAt)}
                                        </span>
                                    </div>
                                    <div className="admin-user-actions">
                                        <button
                                            className="btn btn-glass"
                                            style={{ fontSize: '0.78rem' }}
                                            onClick={() => handleToggleRole(u.id, u.role)}
                                            title={u.role === 'admin' ? 'Rebaixar para Usuário' : 'Promover a Admin'}
                                        >
                                            {u.role === 'admin' ? 'Rebaixar' : 'Promover'}
                                        </button>
                                        {u.id !== user.id && (
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDelete(u.id, u.name)}
                                                title="Excluir usuário"
                                                style={{ color: 'var(--danger)' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
