'use client';

import React, { useState } from 'react';
import { useLocalStorage } from './hooks';
import { FINANCAS_CATEGORIES, MONTH_ABBR } from './data';

const COL_HEADERS = ['Base', ...MONTH_ABBR];

type FinancasData = {
  salario: Record<string, string>;
  sorties: Record<string, Record<string, string>>;
};

const EMPTY: FinancasData = { salario: {}, sorties: {} };

export default function Financas() {
  const [data, setData] = useLocalStorage<FinancasData>('financas', EMPTY);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function setSalario(colIdx: number, val: string) {
    setData((prev) => ({ ...prev, salario: { ...prev.salario, [String(colIdx)]: val } }));
  }

  function setSortie(catId: string, item: string, colIdx: number, val: string) {
    const key = `${catId}__${item}`;
    setData((prev) => ({
      ...prev,
      sorties: { ...prev.sorties, [key]: { ...(prev.sorties[key] ?? {}), [String(colIdx)]: val } },
    }));
  }

  function getSortie(catId: string, item: string, colIdx: number): string {
    return data.sorties[`${catId}__${item}`]?.[String(colIdx)] ?? '';
  }

  function getCatTotal(catId: string, colIdx: number): number {
    const cat = FINANCAS_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return 0;
    return cat.items.reduce((sum, item) => {
      return sum + (parseFloat(getSortie(catId, item, colIdx)) || 0);
    }, 0);
  }

  function getMonthTotal(colIdx: number): number {
    return FINANCAS_CATEGORIES.reduce((sum, cat) => sum + getCatTotal(cat.id, colIdx), 0);
  }

  const salarioVals = COL_HEADERS.map((_, i) => parseFloat(data.salario[String(i)] ?? '0') || 0);
  const totalVals = COL_HEADERS.map((_, i) => getMonthTotal(i));
  const sobraVals = COL_HEADERS.map((_, i) => salarioVals[i] - totalVals[i]);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const inputStyle = {
    background: '#1f293760',
    color: '#e5e7eb',
    border: '1px solid #37415140',
    borderRadius: 6,
    width: 64,
    textAlign: 'right' as const,
    padding: '3px 6px',
    fontSize: 12,
    outline: 'none',
  };

  return (
    <div className="py-4">
      <div className="px-4 mb-4 max-w-full">
        <h2 className="text-xl font-bold text-white">Finanças</h2>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Deslize horizontalmente para ver todos os meses →</p>
      </div>

      {/* Entrées */}
      <div className="px-4 mb-4">
        <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1f2937' }}>
          <div className="px-4 py-2.5" style={{ background: '#0f172a', borderBottom: '1px solid #1f2937' }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
              Entrées d&apos;argent
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 860, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 11, color: '#6b7280', position: 'sticky', left: 0, background: '#111118', minWidth: 130 }}>
                    Item
                  </th>
                  {COL_HEADERS.map((h, i) => (
                    <th key={i} style={{ textAlign: 'right', padding: '8px 8px', fontSize: 11, color: '#6b7280', minWidth: 72 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Salario */}
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '8px 16px', fontSize: 13, color: '#e5e7eb', position: 'sticky', left: 0, background: '#111118' }}>Salario</td>
                  {COL_HEADERS.map((_, i) => (
                    <td key={i} style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={data.salario[String(i)] ?? ''}
                        onChange={(e) => setSalario(i, e.target.value)}
                        placeholder="—"
                        style={{ ...inputStyle, color: '#22c55e' }}
                      />
                    </td>
                  ))}
                </tr>
                {/* Gastos mensais (auto) */}
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '8px 16px', fontSize: 13, color: '#9ca3af', position: 'sticky', left: 0, background: '#111118' }}>Gastos mensais</td>
                  {totalVals.map((total, i) => (
                    <td key={i} style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: total > 0 ? '#f97316' : '#4b5563' }}>
                      {total > 0 ? `${total.toFixed(0)} €` : '—'}
                    </td>
                  ))}
                </tr>
                {/* Sobra (auto) */}
                <tr>
                  <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#e5e7eb', position: 'sticky', left: 0, background: '#111118' }}>Sobra</td>
                  {sobraVals.map((sobra, i) => (
                    <td key={i} style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: salarioVals[i] > 0 ? (sobra >= 0 ? '#22c55e' : '#ef4444') : '#4b5563' }}>
                      {salarioVals[i] > 0 ? `${sobra.toFixed(0)} €` : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sorties */}
      <div className="px-4">
        <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1f2937' }}>
          <div className="px-4 py-2.5" style={{ background: '#0f172a', borderBottom: '1px solid #1f2937' }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
              Sorties d&apos;argent
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 860, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 11, color: '#6b7280', position: 'sticky', left: 0, background: '#111118', minWidth: 160 }}>
                    Item
                  </th>
                  {COL_HEADERS.map((h, i) => (
                    <th key={i} style={{ textAlign: 'right', padding: '8px 8px', fontSize: 11, color: '#6b7280', minWidth: 72 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINANCAS_CATEGORIES.map((cat) => (
                  <React.Fragment key={cat.id}>
                    {/* Category header row */}
                    <tr onClick={() => toggleCollapse(cat.id)} style={{ background: '#0f172a', borderTop: '1px solid #1f2937', cursor: 'pointer' }}>
                      <td style={{ padding: '8px 16px', position: 'sticky', left: 0, background: '#0f172a' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>
                          {collapsed[cat.id] ? '▶' : '▼'} {cat.label}
                        </span>
                      </td>
                      {COL_HEADERS.map((_, i) => {
                        const t = getCatTotal(cat.id, i);
                        return (
                          <td key={i} style={{ padding: '6px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: t > 0 ? cat.color : '#374151' }}>
                            {t > 0 ? `${t.toFixed(0)} €` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Item rows */}
                    {!collapsed[cat.id] && cat.items.map((item) => (
                      <tr key={item} style={{ borderBottom: '1px solid #1f293740' }}>
                        <td style={{ padding: '6px 16px 6px 28px', fontSize: 12, color: '#9ca3af', position: 'sticky', left: 0, background: '#111118' }}>
                          {item}
                        </td>
                        {COL_HEADERS.map((_, i) => (
                          <td key={i} style={{ padding: '4px 8px', textAlign: 'right' }}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={getSortie(cat.id, item, i)}
                              onChange={(e) => setSortie(cat.id, item, i, e.target.value)}
                              placeholder="—"
                              style={{ ...inputStyle, color: cat.color }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {/* Total row */}
                <tr style={{ borderTop: '2px solid #374151', background: '#0f172a' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#e5e7eb', position: 'sticky', left: 0, background: '#0f172a' }}>
                    Total sorties
                  </td>
                  {totalVals.map((total, i) => (
                    <td key={i} style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: total > 0 ? '#ef4444' : '#4b5563' }}>
                      {total > 0 ? `${total.toFixed(0)} €` : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
