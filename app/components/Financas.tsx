'use client';

/**
 * Financas.tsx — Parte 5
 *
 * Mudanças:
 *  - Dados guardados por ano: { "2025": {...}, "2024": {...} }
 *  - Seletor de ano no cabeçalho (setas ← →)
 *  - Anos passados em modo leitura (badge "Archivé")
 *  - Botão "Arquivar e iniciar XXXX" para fechar o ano atual
 */

import React, { useState, useRef } from 'react';
import { useLocalStorage } from './hooks';
import { FINANCAS_CATEGORIES, MONTH_ABBR } from './data';

const COL_HEADERS = ['Base', ...MONTH_ABBR];
const THIS_YEAR   = new Date().getFullYear();

// ── Types ─────────────────────────────────────────────────────────────────

type FinancasData = {
  salario: Record<string, string>;
  sorties: Record<string, Record<string, string>>;
};

type CatCustom = {
  name: string;
  items: string[];
};

// Todos os anos num único objeto (chave = "2025", "2024", etc.)
type YearlyData = Record<string, FinancasData>;
type YearlyCats = Record<string, Record<string, CatCustom>>;

const EMPTY_DATA: FinancasData = { salario: {}, sorties: {} };

// Categorias padrão (partilhadas entre anos se não houver personalização)
const DEFAULT_CATS: Record<string, CatCustom> = Object.fromEntries(
  FINANCAS_CATEGORIES.map((c) => [c.id, { name: c.label, items: [...c.items] }]),
);

// ─────────────────────────────────────────────────────────────────────────

export default function Financas() {
  // Ano ativo = o ano que o utilizador está a editar (persiste entre sessões)
  const [activeYear, setActiveYear] = useLocalStorage('financas_active_year', THIS_YEAR);

  // Todos os dados financeiros e categorias, agrupados por ano
  const [allData, setAllData]   = useLocalStorage<YearlyData>('financas_all', {});
  const [allCats, setAllCats]   = useLocalStorage<YearlyCats>('financas_cats_all', {});

  // Ano que está a ser VISUALIZADO (pode diferir do ativo se o utilizador navega para trás)
  const [viewYear, setViewYear] = useState(activeYear);

  // O ano visualizado é editável apenas se for o ano ativo
  const isReadOnly = viewYear < activeYear;
  const yearKey    = String(viewYear); // chave para aceder a allData[yearKey]

  // ── Helpers para ler/escrever dados do ano visualizado ────────────────

  const data: FinancasData = allData[yearKey] ?? EMPTY_DATA;

  function setData(updater: (prev: FinancasData) => FinancasData) {
    setAllData((prev) => ({ ...prev, [yearKey]: updater(prev[yearKey] ?? EMPTY_DATA) }));
  }

  const customCats: Record<string, CatCustom> = allCats[yearKey] ?? DEFAULT_CATS;

  function setCustomCats(updater: (prev: Record<string, CatCustom>) => Record<string, CatCustom>) {
    setAllCats((prev) => ({ ...prev, [yearKey]: updater(prev[yearKey] ?? DEFAULT_CATS) }));
  }

  // ── Estado de UI ──────────────────────────────────────────────────────

  const [collapsed,   setCollapsed]   = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<{ catId: string; idx: number; val: string } | null>(null);
  const [editingCat,  setEditingCat]  = useState<{ catId: string; val: string } | null>(null);
  const [addingTo,    setAddingTo]    = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers de leitura ────────────────────────────────────────────────

  function getItems(catId: string): string[] {
    return customCats[catId]?.items ?? FINANCAS_CATEGORIES.find((c) => c.id === catId)!.items;
  }

  function getCatName(catId: string): string {
    return customCats[catId]?.name ?? FINANCAS_CATEGORIES.find((c) => c.id === catId)!.label;
  }

  function getSortie(catId: string, item: string, col: number): string {
    return data.sorties[`${catId}__${item}`]?.[String(col)] ?? '';
  }

  function getCatTotal(catId: string, col: number): number {
    return getItems(catId).reduce((sum, item) => sum + (parseFloat(getSortie(catId, item, col)) || 0), 0);
  }

  function getMonthTotal(col: number): number {
    return FINANCAS_CATEGORIES.reduce((sum, c) => sum + getCatTotal(c.id, col), 0);
  }

  // ── Escrita de dados (bloqueada em modo leitura) ──────────────────────

  function setSalario(col: number, val: string) {
    if (isReadOnly) return;
    setData((prev) => ({ ...prev, salario: { ...prev.salario, [String(col)]: val } }));
  }

  function setSortie(catId: string, item: string, col: number, val: string) {
    if (isReadOnly) return;
    const key = `${catId}__${item}`;
    setData((prev) => ({
      ...prev,
      sorties: { ...prev.sorties, [key]: { ...(prev.sorties[key] ?? {}), [String(col)]: val } },
    }));
  }

  // ── Edição de nomes (bloqueada em modo leitura) ───────────────────────

  function saveItemName() {
    if (!editingItem || isReadOnly) return;
    const { catId, idx, val } = editingItem;
    if (!val.trim()) { setEditingItem(null); return; }
    setCustomCats((prev) => {
      const items = [...(prev[catId]?.items ?? getItems(catId))];
      items[idx] = val.trim();
      return { ...prev, [catId]: { ...(prev[catId] ?? { name: getCatName(catId), items }), items } };
    });
    setEditingItem(null);
  }

  function saveCatName() {
    if (!editingCat || isReadOnly) return;
    const { catId, val } = editingCat;
    if (!val.trim()) { setEditingCat(null); return; }
    setCustomCats((prev) => ({
      ...prev,
      [catId]: { ...(prev[catId] ?? { name: val, items: getItems(catId) }), name: val.trim() },
    }));
    setEditingCat(null);
  }

  function deleteItem(catId: string, idx: number) {
    if (isReadOnly) return;
    const item = getItems(catId)[idx];
    setCustomCats((prev) => {
      const items = (prev[catId]?.items ?? getItems(catId)).filter((_, i) => i !== idx);
      return { ...prev, [catId]: { ...(prev[catId] ?? { name: getCatName(catId), items }), items } };
    });
    const key = `${catId}__${item}`;
    setData((prev) => {
      const { [key]: _, ...rest } = prev.sorties;
      return { ...prev, sorties: rest };
    });
  }

  function addItem(catId: string) {
    if (isReadOnly || !newItemName.trim()) { setAddingTo(null); return; }
    setCustomCats((prev) => {
      const items = [...(prev[catId]?.items ?? getItems(catId)), newItemName.trim()];
      return { ...prev, [catId]: { ...(prev[catId] ?? { name: getCatName(catId), items }), items } };
    });
    setNewItemName('');
    setAddingTo(null);
  }

  // ── Arquivo do ano ────────────────────────────────────────────────────

  /**
   * Arquiva o ano atual e avança para o próximo.
   * Os dados do ano atual ficam guardados em allData e allCats (em modo leitura).
   * As categorias do ano novo herdam as do ano atual.
   */
  function archiveAndStartNew() {
    const nextYear = activeYear + 1;
    const nextKey  = String(nextYear);
    // Copia as categorias customizadas para o novo ano (boa base de partida)
    setAllCats((prev) => ({
      ...prev,
      [nextKey]: { ...(prev[yearKey] ?? DEFAULT_CATS) },
    }));
    setActiveYear(nextYear);
    setViewYear(nextYear);
  }

  // ── Totais calculados ─────────────────────────────────────────────────

  const salarioVals = COL_HEADERS.map((_, i) => parseFloat(data.salario[String(i)] ?? '0') || 0);
  const totalVals   = COL_HEADERS.map((_, i) => getMonthTotal(i));
  const sobraVals   = COL_HEADERS.map((_, i) => salarioVals[i] - totalVals[i]);

  // ── Estilos ───────────────────────────────────────────────────────────

  const cellInput = (color: string): React.CSSProperties => ({
    width: 66, textAlign: 'right', padding: '4px 6px',
    background: isReadOnly ? 'rgba(31,41,55,0.2)' : 'rgba(31,41,55,0.5)',
    color: isReadOnly ? '#6b7280' : color,
    border: '1px solid rgba(55,65,81,0.4)',
    borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none',
    cursor: isReadOnly ? 'default' : 'text',
  });

  const catColor = (catId: string) =>
    FINANCAS_CATEGORIES.find((c) => c.id === catId)?.color ?? '#60a5fa';

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingTop: 16, paddingBottom: 24 }}>

      {/* ── Cabeçalho com seletor de ano ───────────────────────────── */}
      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Finanças</h2>
            {/* Badge: ano ativo vs. arquivado */}
            {isReadOnly ? (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', background: '#1f2937', padding: '2px 8px', borderRadius: 6 }}>
                Archivé
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(6,78,59,0.2)', padding: '2px 8px', borderRadius: 6 }}>
                Ano ativo
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, marginBottom: 0 }}>
            {isReadOnly ? 'Modo leitura — dados arquivados' : 'Toque no nome para editar · deslize → para os meses'}
          </p>
        </div>

        {/* Navegação entre anos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Só mostra ← se houver anos anteriores (mínimo = 2024) */}
          {viewYear > 2024 && (
            <button onClick={() => setViewYear((y) => y - 1)}
              style={yearNavBtn}>
              ←
            </button>
          )}
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', minWidth: 44, textAlign: 'center' }}>
            {viewYear}
          </span>
          {/* Só mostra → até o ano ativo */}
          {viewYear < activeYear && (
            <button onClick={() => setViewYear((y) => y + 1)}
              style={yearNavBtn}>
              →
            </button>
          )}
        </div>
      </div>

      {/* ── Botão de arquivo (só visível no ano ativo) ─────────────── */}
      {!isReadOnly && (
        <div style={{ padding: '0 16px 14px' }}>
          <button onClick={archiveAndStartNew}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '10px 16px', borderRadius: 12,
              background: 'transparent', border: '1px dashed #374151',
              color: '#6b7280', fontSize: 12, fontWeight: 600,
            }}>
            <span>📦</span>
            Arquivar {viewYear} e iniciar {activeYear + 1}
          </button>
        </div>
      )}

      {/* ── ENTRÉES ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px' }}>
        <TableBlock header="Entrées d'argent" headerColor="#60a5fa">
          <TableHead cols={COL_HEADERS} />
          <tbody>
            {/* Salario */}
            <tr>
              <Td sticky style={{ color: '#e5e7eb', fontWeight: 600 }}>Salario</Td>
              {COL_HEADERS.map((_, i) => (
                <td key={i} style={{ padding: '5px 6px', textAlign: 'right' }}>
                  <input type="text" inputMode="decimal" value={data.salario[String(i)] ?? ''}
                    onChange={(e) => setSalario(i, e.target.value)}
                    readOnly={isReadOnly}
                    placeholder="—" style={{ ...cellInput('#22c55e') }} />
                </td>
              ))}
            </tr>
            {/* Gastos mensais (calculado) */}
            <tr>
              <Td sticky style={{ color: '#9ca3af' }}>Gastos mensais</Td>
              {totalVals.map((t, i) => (
                <td key={i} style={{ padding: '5px 6px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: t > 0 ? '#f97316' : '#4b5563' }}>
                  {t > 0 ? `${t.toFixed(0)} €` : '—'}
                </td>
              ))}
            </tr>
            {/* Sobra (calculado, verde/vermelho) */}
            <tr>
              <Td sticky style={{ color: '#e5e7eb', fontWeight: 700 }}>Sobra</Td>
              {sobraVals.map((s, i) => (
                <td key={i} style={{ padding: '5px 6px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: salarioVals[i] > 0 ? (s >= 0 ? '#22c55e' : '#ef4444') : '#4b5563' }}>
                  {salarioVals[i] > 0 ? `${s.toFixed(0)} €` : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </TableBlock>
      </div>

      {/* ── SORTIES ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px' }}>
        <TableBlock header="Sorties d'argent" headerColor="#ef4444">
          <TableHead cols={COL_HEADERS} />
          <tbody>
            {FINANCAS_CATEGORIES.map((cat) => {
              const items      = getItems(cat.id);
              const isCollapsed = collapsed[cat.id];
              const color      = catColor(cat.id);

              return (
                <React.Fragment key={cat.id}>
                  {/* Linha da categoria (toggle + nome editável) */}
                  <tr style={{ background: '#0f172a', borderTop: '1px solid #1f2937' }}>
                    <td style={{ padding: '8px 6px 8px 14px', position: 'sticky', left: 0, background: '#0f172a', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => setCollapsed((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color, padding: '2px 0', flexShrink: 0 }}>
                          {isCollapsed ? '▶' : '▼'}
                        </button>
                        {/* Nome editável (só em modo edição) */}
                        {!isReadOnly && editingCat?.catId === cat.id ? (
                          <input autoFocus value={editingCat.val}
                            onChange={(e) => setEditingCat({ catId: cat.id, val: e.target.value })}
                            onBlur={saveCatName}
                            onKeyDown={(e) => e.key === 'Enter' && saveCatName()}
                            style={{ fontSize: 12, fontWeight: 700, color, background: '#1f2937', border: `1px solid ${color}50`, borderRadius: 6, padding: '2px 6px', width: 110, outline: 'none' }} />
                        ) : (
                          <span
                            onClick={() => !isReadOnly && setEditingCat({ catId: cat.id, val: getCatName(cat.id) })}
                            style={{ fontSize: 12, fontWeight: 700, color, cursor: isReadOnly ? 'default' : 'text' }}>
                            {getCatName(cat.id)}
                          </span>
                        )}
                      </div>
                    </td>
                    {COL_HEADERS.map((_, i) => {
                      const t = getCatTotal(cat.id, i);
                      return (
                        <td key={i} style={{ padding: '5px 6px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: t > 0 ? color : '#374151' }}>
                          {t > 0 ? `${t.toFixed(0)} €` : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Linhas dos itens */}
                  {!isCollapsed && items.map((item, idx) => (
                    <tr key={`${cat.id}-${idx}`} style={{ borderBottom: '1px solid rgba(31,41,55,0.5)' }}>
                      <td style={{ padding: '5px 6px 5px 30px', position: 'sticky', left: 0, background: '#111118', minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {!isReadOnly && editingItem?.catId === cat.id && editingItem.idx === idx ? (
                            <input autoFocus value={editingItem.val}
                              onChange={(e) => setEditingItem({ ...editingItem, val: e.target.value })}
                              onBlur={saveItemName}
                              onKeyDown={(e) => e.key === 'Enter' && saveItemName()}
                              style={{ fontSize: 12, color, background: '#1f2937', border: `1px solid ${color}50`, borderRadius: 6, padding: '2px 6px', width: 100, outline: 'none' }} />
                          ) : (
                            <span
                              onClick={() => !isReadOnly && setEditingItem({ catId: cat.id, idx, val: item })}
                              style={{ fontSize: 12, color: '#9ca3af', cursor: isReadOnly ? 'default' : 'text', flex: 1 }}>
                              {item}
                            </span>
                          )}
                          {/* Botão × — escondido em modo leitura */}
                          {!isReadOnly && (
                            <button onClick={() => deleteItem(cat.id, idx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: 13, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                              title="Supprimer">
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                      {COL_HEADERS.map((_, i) => (
                        <td key={i} style={{ padding: '4px 6px', textAlign: 'right' }}>
                          <input type="text" inputMode="decimal"
                            value={getSortie(cat.id, item, i)}
                            onChange={(e) => setSortie(cat.id, item, i, e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="—"
                            style={cellInput(color)} />
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Linha "Adicionar item" — escondida em modo leitura */}
                  {!isCollapsed && !isReadOnly && (
                    <tr style={{ borderBottom: '1px solid #1f2937' }}>
                      <td colSpan={COL_HEADERS.length + 1} style={{ padding: '6px 14px 6px 30px', background: '#0c0c14' }}>
                        {addingTo === cat.id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input ref={addInputRef} autoFocus value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addItem(cat.id);
                                if (e.key === 'Escape') { setAddingTo(null); setNewItemName(''); }
                              }}
                              placeholder="Nom du nouveau poste..."
                              style={{ flex: 1, fontSize: 12, padding: '6px 10px', background: '#1f2937', color: '#fff', border: `1px solid ${color}50`, borderRadius: 8, outline: 'none' }} />
                            <button onClick={() => addItem(cat.id)}
                              style={{ height: 32, padding: '0 12px', borderRadius: 8, background: color, border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                              ✓
                            </button>
                            <button onClick={() => { setAddingTo(null); setNewItemName(''); }}
                              style={{ height: 32, padding: '0 10px', borderRadius: 8, background: '#1f2937', border: 'none', color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingTo(cat.id); setNewItemName(''); setTimeout(() => addInputRef.current?.focus(), 50); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: `${color}80`, padding: '2px 0' }}>
                            <span style={{ fontSize: 16 }}>+</span> Ajouter un poste
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Total geral */}
            <tr style={{ borderTop: '2px solid #374151', background: '#0f172a' }}>
              <Td sticky style={{ color: '#e5e7eb', fontWeight: 800, background: '#0f172a' }}>Total sorties</Td>
              {totalVals.map((t, i) => (
                <td key={i} style={{ padding: '10px 6px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: t > 0 ? '#ef4444' : '#4b5563' }}>
                  {t > 0 ? `${t.toFixed(0)} €` : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </TableBlock>
      </div>

      {/* Hint */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#374151', marginTop: 16, padding: '0 16px' }}>
        {isReadOnly
          ? `Visualizando dados de ${viewYear} — somente leitura`
          : 'Toque no nome de uma categoria ou item para renomear · × para apagar · + para adicionar'}
      </p>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

const yearNavBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, background: '#1f2937',
  border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function TableBlock({ children, header, headerColor }: { children: React.ReactNode; header: string; headerColor: string }) {
  return (
    <div style={{ background: '#111118', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #1f2937' }}>
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: headerColor }}>{header}</span>
      </div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: 900, width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </table>
      </div>
    </div>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ borderBottom: '1px solid #1f2937' }}>
        <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, color: '#6b7280', position: 'sticky', left: 0, background: '#111118', minWidth: 160 }}>Item</th>
        {cols.map((h, i) => (
          <th key={i} style={{ textAlign: 'right', padding: '8px 6px', fontSize: 11, color: '#6b7280', minWidth: 74 }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

function Td({ children, sticky, style }: { children: React.ReactNode; sticky?: boolean; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: '8px 14px', fontSize: 13, ...(sticky ? { position: 'sticky', left: 0, background: '#111118' } : {}), ...style }}>
      {children}
    </td>
  );
}
