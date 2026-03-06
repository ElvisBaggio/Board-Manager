/**
 * Central label registry for all user-facing strings.
 * UI convention: Portuguese for business concepts, English for technical market terms (OKR, KPI, Roadmap, Analytics).
 * Code/API convention: English (do not change DB/API values).
 */

// Execution item types — keys match DB values, labels are what the user sees
export const ITEM_TYPE_LABELS = {
    'Epic': 'Épico',
    'Story': 'História',
    'Feature': 'Feature',
    'Tech Story': 'Tech',
};

// Feature/initiative status — keys match DB values, labels are what the user sees
export const STATUS_LABELS = {
    'Not Started': 'Não Iniciado',
    'On Going': 'Em Andamento',
    'Done': 'Concluído',
    'Blocked': 'Bloqueado',
};

// Navigation tab labels
export const TAB_LABELS = {
    canvas: 'Estratégia',
    choices: 'Escolhas',
    roadmap: 'Roadmap',
    metrics: 'Métricas',
    analytics: 'Analytics',
};

// Common UI actions
export const ACTION_LABELS = {
    save: 'Salvar',
    saving: 'Salvando...',
    cancel: 'Cancelar',
    close: 'Fechar',
    delete: 'Excluir',
    deleting: 'Excluindo...',
    create: 'Criar',
    creating: 'Criando...',
    edit: 'Editar',
    confirm: 'Confirmar',
};

// Section headers
export const SECTION_LABELS = {
    goals: 'Goals / KPIs',
    okrs: 'OKRs',
    keyResults: 'Key Results',
    indicators: 'Indicadores de Produto',
};
