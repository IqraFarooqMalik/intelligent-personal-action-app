import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Settings, ShoppingBag, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { BudgetSummary } from '../../types';

export const BudgetView: React.FC = () => {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form states
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Shopping');
  const [newBudgetCap, setNewBudgetCap] = useState('');

  const loadBudget = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgetSummary();
      setSummary(data);
      if (data?.monthly_budget) {
        setNewBudgetCap(data.monthly_budget.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;
    try {
      await api.logExpense(expenseTitle, parseFloat(expenseAmount), expenseCategory);
      setExpenseTitle('');
      setExpenseAmount('');
      setShowLogModal(false);
      loadBudget();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCap) return;
    try {
      await api.updateBudgetSettings(parseFloat(newBudgetCap), summary?.currency || 'EUR');
      setShowSettingsModal(false);
      loadBudget();
    } catch (err) {
      console.error(err);
    }
  };

  const spentPercent = summary?.monthly_budget && summary.monthly_budget > 0
    ? Math.min(100, Math.round((summary.spent_this_month / summary.monthly_budget) * 100))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Settings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Monthly Budget</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Financial mindfulness connected to your actions
          </p>
        </div>
        <button
          onClick={() => setShowSettingsModal(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px',
          }}
          title="Edit budget cap"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Main Budget Card */}
      <section
        className="glass-panel"
        style={{
          padding: '24px',
          border: '1px solid var(--border-glow)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Remaining This Month
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#34d399' }}>
              {summary?.currency === 'EUR' ? '€' : '$'}{summary?.remaining_budget ?? 0}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Limit: {summary?.currency === 'EUR' ? '€' : '$'}{summary?.monthly_budget ?? 0}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${spentPercent}%`,
              background: spentPercent > 85 ? 'var(--energy-high)' : 'var(--accent-gradient)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* Stat Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Spent So Far</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              {summary?.currency === 'EUR' ? '€' : '$'}{summary?.spent_this_month ?? 0}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planned Purchases</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fbbf24' }}>
              {summary?.currency === 'EUR' ? '€' : '$'}{summary?.planned_purchases_total ?? 0}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowLogModal(true)}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <Plus size={16} /> Log an Expense
          </button>
        </div>
      </section>

      {/* Recent Expenses List */}
      <section className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '14px' }}>Recent Expenses</h3>
        {summary?.recent_expenses && summary.recent_expenses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {summary.recent_expenses.map((exp) => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>{exp.title}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.category}</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f43f5e' }}>
                  -{summary.currency === 'EUR' ? '€' : '$'}{exp.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No expenses logged yet this month.
          </p>
        )}
      </section>

      {/* Log Expense Modal */}
      {showLogModal && (
        <div className="bottom-sheet-overlay" onClick={() => setShowLogModal(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Log Expense</h3>
            <form onSubmit={handleLogExpense}>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Expense description (e.g. Groceries, New shoes)"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount (€)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                  }}
                />
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#0d121f',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                  }}
                >
                  <option value="Shopping">Shopping</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Leisure">Leisure</option>
                  <option value="Work">Work</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowLogModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="bottom-sheet-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Monthly Budget Cap</h3>
            <form onSubmit={handleUpdateCap}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="number"
                  placeholder="Monthly cap amount"
                  value={newBudgetCap}
                  onChange={(e) => setNewBudgetCap(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Update Cap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
