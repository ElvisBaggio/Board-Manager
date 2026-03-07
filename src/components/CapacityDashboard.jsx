import { useMemo } from 'react';
import { X, Users, AlertTriangle } from 'lucide-react';
import { useTeamMembers, useAllocations } from '../hooks/useResources';
import { aggregateCapacity, detectOverAllocation } from '../utils/calculations';

/**
 * Capacity Dashboard — shows allocated vs. available hours per quarter per member.
 */
export default function CapacityDashboard({ planId, year, onClose }) {
    const { members } = useTeamMembers(planId);
    const { allocations } = useAllocations(planId);

    const quarterData = useMemo(() =>
        aggregateCapacity(members, allocations, year),
        [members, allocations, year]
    );

    const alerts = useMemo(() =>
        detectOverAllocation(members, allocations, null, year),
        [members, allocations, year]
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="capacity-dashboard glass-surface" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Users size={20} /> Capacidade — {year}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                {members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        <Users size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                        <p>Nenhum membro cadastrado. Adicione membros no Gerenciador de Time.</p>
                    </div>
                ) : (
                    <>
                        {/* Quarter overview */}
                        <div className="capacity-quarters">
                            {[1, 2, 3, 4].map(q => {
                                const d = quarterData[q];
                                const isOver = d.utilization > 100;
                                return (
                                    <div key={q} className={`capacity-quarter-card glass-surface ${isOver ? 'capacity-over' : ''}`}>
                                        <div className="capacity-quarter-label">Q{q}</div>
                                        <div className="capacity-bar-container">
                                            <div className="capacity-bar">
                                                <div
                                                    className="capacity-bar-fill"
                                                    style={{
                                                        width: `${Math.min(d.utilization, 100)}%`,
                                                        background: isOver ? 'var(--danger)' : d.utilization > 80 ? '#f39c12' : 'var(--success)',
                                                    }}
                                                />
                                            </div>
                                            <span className="capacity-utilization">{d.utilization}%</span>
                                        </div>
                                        <div className="capacity-details">
                                            <span>{d.allocated}h alocadas</span>
                                            <span>{d.capacity}h capacidade</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Over-allocation alerts */}
                        {alerts.length > 0 && (
                            <div className="capacity-alerts">
                                <h3><AlertTriangle size={16} /> Alertas de Sobre-alocação</h3>
                                {alerts.map(alert => (
                                    <div key={alert.memberId} className="capacity-alert-item">
                                        <strong>{alert.memberName}</strong>
                                        <span className="capacity-alert-detail">
                                            {alert.allocated}h / {alert.capacity}h ({alert.percentage}%) — excede em {alert.overBy}h
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Per-member breakdown */}
                        <div className="capacity-members">
                            <h3>Por Membro</h3>
                            {members.map(m => {
                                const memberAllocs = allocations.filter(a => (a.memberId || a.member_id) === m.id);
                                const totalHours = memberAllocs.reduce((s, a) => s + (a.hoursAllocated || a.hours_allocated || 0), 0);
                                const capacity = m.capacityHoursPerQuarter || m.capacity_hours_per_quarter || 480;
                                const pct = Math.round((totalHours / capacity) * 100);

                                return (
                                    <div key={m.id} className="capacity-member-row">
                                        <div className="capacity-member-info">
                                            <div
                                                className="capacity-member-avatar"
                                                style={{ background: m.avatarColor || m.avatar_color || '#3498db' }}
                                            >
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="capacity-member-name">{m.name}</div>
                                                <div className="capacity-member-role">{m.roleTitle || m.role_title || 'Membro'}</div>
                                            </div>
                                        </div>
                                        <div className="capacity-member-bar">
                                            <div className="capacity-bar">
                                                <div
                                                    className="capacity-bar-fill"
                                                    style={{
                                                        width: `${Math.min(pct, 100)}%`,
                                                        background: pct > 100 ? 'var(--danger)' : pct > 80 ? '#f39c12' : 'var(--success)',
                                                    }}
                                                />
                                            </div>
                                            <span className="capacity-member-hours">{totalHours}h / {capacity}h</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
