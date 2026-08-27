import { useState } from 'react';
import { Clock, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { useAdminLogs } from '../../hooks/useAdminLogs';
import { AdminTable, type AdminColumn } from '../../components/admin/AdminTable';
import type { AdminLog } from '../../lib/types';

export function LogsPage() {
  const {
    logs,
    loading,
    totalCount,
    totalPages,
    page,
    pageSize,
    actionFilter,
    targetTypeFilter,
    setPage,
    setPageSize,
    setActionFilter,
    setTargetTypeFilter,
  } = useAdminLogs(25);

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const columns: AdminColumn<AdminLog>[] = [
    {
      header: 'Timestamp',
      accessor: (l) => (
        <div className="flex items-center gap-2 text-neutral-300 font-mono text-[11px]">
          <Clock size={13} className="text-neutral-400 shrink-0" />
          <span>{new Date(l.created_at).toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Admin Actor',
      accessor: (l) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[10px] text-neutral-300 overflow-hidden shrink-0">
            {l.admin?.avatar_url ? (
              <img src={l.admin.avatar_url} alt={l.admin.username} className="w-full h-full object-cover" />
            ) : (
              (l.admin?.username?.[0] || 'A').toUpperCase()
            )}
          </div>
          <span className="font-semibold text-neutral-200 text-xs">
            {l.admin?.username || 'Domain Admin'}
          </span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: (l) => {
        let colorClass = 'bg-neutral-800 text-neutral-300 border-neutral-700';
        if (l.action.includes('delete')) {
          colorClass = 'bg-red-950/70 text-red-300 border-red-500/30';
        } else if (l.action.includes('create')) {
          colorClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
        } else if (l.action.includes('edit') || l.action.includes('role') || l.action.includes('transfer')) {
          colorClass = 'bg-blue-950/70 text-blue-300 border-blue-500/30';
        }

        return (
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${colorClass}`}>
            {l.action}
          </span>
        );
      },
    },
    {
      header: 'Target Entity',
      accessor: (l) => (
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-950 text-neutral-400 border border-neutral-800 mr-2">
            {l.target_type}
          </span>
          {l.target_id && (
            <span className="font-mono text-[10px] text-neutral-400 select-all truncate max-w-[120px] inline-block align-middle">
              {l.target_id}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Details',
      accessor: (l) => (
        <div>
          <button
            onClick={() => toggleExpand(l.id)}
            className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {expandedLogId === l.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Code size={13} />
            <span>{expandedLogId === l.id ? 'Hide JSON' : 'Inspect Details'}</span>
          </button>
          {expandedLogId === l.id && (
            <pre className="mt-2 p-2 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-red-200/90 overflow-x-auto max-w-sm">
              {JSON.stringify(l.details || {}, null, 2)}
            </pre>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Audit Logs</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Immutable audit trail of domain administrative operations, security actions, and data changes.
        </p>
      </div>

      {/* Logs Table */}
      <AdminTable
        columns={columns}
        data={logs}
        keyExtractor={(l) => l.id}
        loading={loading}
        title="Recorded Activity"
        count={totalCount}
        filterSlot={
          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50"
            >
              <option value="all">All Actions</option>
              <option value="user.delete">user.delete</option>
              <option value="user.role_change">user.role_change</option>
              <option value="character.edit">character.edit</option>
              <option value="character.transfer">character.transfer</option>
              <option value="character.delete">character.delete</option>
              <option value="campaign.create">campaign.create</option>
              <option value="campaign.edit">campaign.edit</option>
              <option value="campaign.delete">campaign.delete</option>
              <option value="item.create">item.create</option>
              <option value="item.edit">item.edit</option>
              <option value="item.delete">item.delete</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50"
            >
              <option value="all">All Targets</option>
              <option value="profile">Profile</option>
              <option value="character">Character</option>
              <option value="campaign">Campaign</option>
              <option value="item_definition">Item Definition</option>
            </select>
          </div>
        }
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </div>
  );
}
