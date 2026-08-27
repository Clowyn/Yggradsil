import { useState } from 'react';
import { Trash2, Shield, User, Sparkles, AlertCircle } from 'lucide-react';
import { useAdminUsers, type AdminUserRecord } from '../../hooks/useAdminUsers';
import { AdminTable, type AdminColumn } from '../../components/admin/AdminTable';
import { AdminSearchBar } from '../../components/admin/AdminSearchBar';
import { ConfirmDeleteModal } from '../../components/admin/ConfirmDeleteModal';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../lib/types';

export function UsersPage() {
  const { user: currentAuthUser } = useAuth();
  const {
    users,
    loading,
    totalCount,
    totalPages,
    page,
    pageSize,
    search,
    roleFilter,
    setPage,
    setPageSize,
    setSearch,
    setRoleFilter,
    updateUserRole,
    getUserDeleteImpact,
    deleteUser,
  } = useAdminUsers(20);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);
  const [impacts, setImpacts] = useState<{ label: string; count: number }[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Open delete modal & compute cascade impact
  const handleOpenDelete = async (targetUser: AdminUserRecord) => {
    setDeleteTarget(targetUser);
    setActionError(null);
    const impactData = await getUserDeleteImpact(targetUser.id);
    setImpacts(impactData);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'gm' | 'player') => {
    setActionError(null);
    try {
      await updateUserRole(userId, newRole);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update role');
    }
  };

  const columns: AdminColumn<AdminUserRecord>[] = [
    {
      header: 'User',
      accessor: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-300 overflow-hidden shrink-0">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
            ) : (
              (u.username?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div>
            <span className="font-semibold text-neutral-100 block">{u.username}</span>
            <span className="text-[10px] font-mono text-neutral-400 select-all">{u.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (u) => {
        if (u.role === 'admin') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-red-950/80 text-red-300 border border-red-500/30">
              <Sparkles size={11} className="text-red-400" />
              Admin
            </span>
          );
        }

        return (
          <select
            value={u.role}
            onChange={(e) => handleRoleChange(u.id, e.target.value as 'gm' | 'player')}
            disabled={u.id === currentAuthUser?.id}
            className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-red-500/50 cursor-pointer disabled:opacity-50"
          >
            <option value="player">⚔️ Player</option>
            <option value="gm">⚜️ Game Master</option>
          </select>
        );
      },
    },
    {
      header: 'Characters',
      accessor: (u) => (
        <span className="font-mono text-xs text-neutral-300">
          {u.charactersCount ?? 0}
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Registered At',
      accessor: (u) => (
        <span className="text-neutral-400 font-mono text-[11px]">
          {new Date(u.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (u) => {
        const isSelf = u.id === currentAuthUser?.id;
        const isAdmin = u.role === 'admin';

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenDelete(u)}
              disabled={isSelf || isAdmin}
              title={isSelf ? 'Cannot delete self' : isAdmin ? 'Cannot delete admin directly' : 'Delete user'}
              className="p-1.5 rounded-md hover:bg-red-950/50 text-neutral-400 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Users & Profiles</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Manage system accounts, elevate Game Masters, and clean up test or inactive player profiles with cascade deletion.
        </p>
      </div>

      {actionError && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle size={15} className="shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Users Table */}
      <AdminTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        loading={loading}
        title="All Accounts"
        count={totalCount}
        searchSlot={
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search username..."
            className="w-48 sm:w-64"
          />
        }
        filterSlot={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="gm">Game Master</option>
            <option value="player">Player</option>
          </select>
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

      {/* Confirm Cascade Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        entityName={deleteTarget?.username || ''}
        entityType="User Profile"
        impacts={impacts}
        isDeleting={isDeleting}
        dangerMessage="Deleting this user will permanently remove their authentication credentials, profile, characters, equipment, skills, and campaign memberships."
      />
    </div>
  );
}
