import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download } from 'lucide-react';

/**
 * Expected CSV format (semicolon-separated):
 * titulo;descricao;status;data_inicio;data_fim;lane;tags
 *
 * - titulo (required): Name of the initiative
 * - descricao: Description text
 * - status: Not Started | On Going | Done | Blocked
 * - data_inicio (required): YYYY-MM-DD
 * - data_fim (required): YYYY-MM-DD
 * - lane: Name of the lane/objective (auto-created if not exists)
 * - tags: Comma-separated tag names (e.g. "Backend,Urgente")
 */

const TEMPLATE_CSV = `titulo;descricao;status;data_inicio;data_fim;lane;tags
Redesign da Home;Refazer a página principal;On Going;2026-03-01;2026-05-15;UX;Frontend,Design
API de Pagamentos;Integrar gateway de pagamento;Not Started;2026-04-01;2026-06-30;Backend;API,Pagamentos
App Mobile;Versão mobile do produto;Not Started;2026-06-01;2026-09-30;Mobile;React Native`;

const VALID_STATUSES = ['Not Started', 'On Going', 'Done', 'Blocked'];
const TAG_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

function parseCSV(text) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return { error: 'O arquivo precisa ter pelo menos 1 linha de dados além do cabeçalho.' };

    const header = lines[0].toLowerCase().split(';').map(h => h.trim());
    const requiredCols = ['titulo', 'data_inicio', 'data_fim'];
    for (const col of requiredCols) {
        if (!header.includes(col)) {
            return { error: `Coluna obrigatória "${col}" não encontrada no cabeçalho.` };
        }
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim());
        const row = {};
        header.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });

        if (!row.titulo) continue; // skip empty rows

        const status = row.status && VALID_STATUSES.includes(row.status) ? row.status : 'Not Started';
        const tags = row.tags
            ? row.tags.split(',').map((t, idx) => ({
                name: t.trim(),
                color: TAG_COLORS[idx % TAG_COLORS.length]
            })).filter(t => t.name)
            : [];

        rows.push({
            title: row.titulo,
            description: row.descricao || '',
            status,
            startDate: row.data_inicio,
            endDate: row.data_fim,
            laneName: row.lane || '',
            tags,
        });
    }

    if (rows.length === 0) return { error: 'Nenhuma linha válida encontrada.' };

    // Validate dates
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.startDate)) {
            return { error: `Linha ${i + 2}: data_inicio "${r.startDate}" inválida. Use YYYY-MM-DD.` };
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.endDate)) {
            return { error: `Linha ${i + 2}: data_fim "${r.endDate}" inválida. Use YYYY-MM-DD.` };
        }
    }

    return { rows };
}

export default function ImportModal({ onImport, onClose, existingLanes }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [importing, setImporting] = useState(false);
    const fileRef = useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;

        setFile(f);
        setError('');
        setPreview(null);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const result = parseCSV(text);
            if (result.error) {
                setError(result.error);
            } else {
                setPreview(result.rows);
            }
        };
        reader.readAsText(f);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_iniciativas.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        if (!preview || preview.length === 0) return;
        setImporting(true);
        onImport(preview);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2><FileSpreadsheet size={20} style={{ marginRight: 8 }} /> Importar Iniciativas</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="import-info">
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '12px' }}>
                            Importe suas iniciativas de um arquivo <strong>CSV</strong> (separado por ponto e vírgula).
                        </p>
                        <button className="btn btn-glass" onClick={handleDownloadTemplate} style={{ fontSize: '0.82rem' }}>
                            <Download size={14} /> Baixar Template CSV
                        </button>
                    </div>

                    <div className="import-format" style={{ marginTop: '16px' }}>
                        <div className="filter-section-title">Formato esperado</div>
                        <code style={{
                            display: 'block',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            overflowX: 'auto',
                            whiteSpace: 'pre',
                            lineHeight: 1.5
                        }}>
                            {`titulo;descricao;status;data_inicio;data_fim;lane;tags
Minha Iniciativa;Descrição aqui;On Going;2026-03-01;2026-06-30;UX;Tag1,Tag2`}
                        </code>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Arquivo CSV</label>
                        <div
                            className="import-drop-zone"
                            onClick={() => fileRef.current?.click()}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            {file ? (
                                <span style={{ color: 'var(--accent)' }}>📄 {file.name}</span>
                            ) : (
                                <span>
                                    <Upload size={20} style={{ marginRight: 8, opacity: 0.5 }} />
                                    Clique para selecionar um arquivo CSV
                                </span>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(231, 76, 60, 0.15)',
                            border: '1px solid rgba(231, 76, 60, 0.3)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '0.82rem',
                            color: '#e74c3c',
                            marginTop: '12px'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {preview && (
                        <div style={{ marginTop: '16px' }}>
                            <div className="filter-section-title">
                                Pré-visualização ({preview.length} iniciativa{preview.length > 1 ? 's' : ''})
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <table className="import-preview-table">
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Status</th>
                                            <th>Início</th>
                                            <th>Fim</th>
                                            <th>Lane</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.title}</td>
                                                <td>{row.status}</td>
                                                <td>{row.startDate}</td>
                                                <td>{row.endDate}</td>
                                                <td>{row.laneName || '(padrão)'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <div />
                    <div className="modal-footer-right">
                        <button className="btn btn-glass" onClick={onClose}>Cancelar</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleImport}
                            disabled={!preview || preview.length === 0 || importing}
                        >
                            <Upload size={16} /> {importing ? 'Importando...' : `Importar ${preview ? preview.length : 0} iniciativa${preview && preview.length > 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
