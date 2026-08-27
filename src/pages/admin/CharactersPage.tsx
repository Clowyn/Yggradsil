import { useState, useEffect } from 'react';
import {
  Trash2,
  Edit2,
  ArrowRightLeft,
  Shield,
  AlertCircle,
  Plus,
  Minus,
  Loader2,
} from 'lucide-react';
import { useAdminCharacters } from '../../hooks/useAdminCharacters';
import { AdminTable, type AdminColumn } from '../../components/admin/AdminTable';
import { AdminSearchBar } from '../../components/admin/AdminSearchBar';
import { ConfirmDeleteModal } from '../../components/admin/ConfirmDeleteModal';
import { supabase } from '../../lib/supabase';
import type { Character, Profile, Campaign } from '../../lib/types';

export function CharactersPage() {
  const {
    characters,
    loading,
    totalCount,
    totalPages,
    page,
    pageSize,
    search,
    campaignFilter,
    profileFilter,
    setPage,
    setPageSize,
    setSearch,
    setCampaignFilter,
    setProfileFilter,
    updateCharacter,
    transferCharacter,
    getCharacterDeleteImpact,
    deleteCharacter,
    bulkDeleteCharacters,
    bulkUpdateLevel,
  } = useAdminCharacters(20);

  // Auxiliary data for dropdown filters and transfers
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);
  const [impacts, setImpacts] = useState<{ label: string; count: number }[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editTarget, setEditTarget] = useState<Character | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    level: number;
    xp_total: number;
    xp_available: number;
  }>({ name: '', level: 1, xp_total: 0, xp_available: 0 });
  const [isUpdating, setIsUpdating] = useState(false);

  const [transferTarget, setTransferTarget] = useState<Character | null>(null);
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch campaign and profile lists for filters
  useEffect(() => {
    const fetchAux = async () => {
      const { data: camps } = await supabase.from('campaigns').select('id, name');
      if (camps) setAllCampaigns(camps as Campaign[]);

      const { data: profs } = await supabase.from('profiles').select('id, username, role');
      if (profs) setAllProfiles(profs as Profile[]);
    };
    fetchAux();
  }, []);

  // Handle single delete
  const handleOpenDelete = async (char: Character) => {
    setDeleteTarget(char);
    setActionError(null);
    const impactData = await getCharacterDeleteImpact(char.id);
    setImpacts(impactData);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteCharacter(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete character');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit
  const handleOpenEdit = (char: Character) => {
    setEditTarget(char);
    setEditForm({
      name: char.name,
      level: char.level,
      xp_total: char.xp_total,
      xp_available: char.xp_available,
    });
    setActionError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsUpdating(true);
    setActionError(null);
    try {
      await updateCharacter(editTarget.id, editForm);
      setEditTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update character');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle transfer
  const handleOpenTransfer = (char: Character) => {
    setTransferTarget(char);
    setNewOwnerId(char.profile_id);
    setActionError(null);
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !newOwnerId) return;
    setIsTransferring(true);
    setActionError(null);
    try {
      await transferCharacter(transferTarget.id, newOwnerId);
      setTransferTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to transfer character');
    } finally {
      setIsTransferring(false);
    }
  };

  // Bulk operations
  const handleToggleSelectAll = () => {
    if (selectedIds.length === characters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(characters.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} characters?`)) return;
    setActionError(null);
    try {
      await bulkDeleteCharacters(selectedIds);
      setSelectedIds([]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to bulk delete');
    }
  };

  const handleBulkLevel = async (delta: number) => {
    setActionError(null);
    try {
      await bulkUpdateLevel(selectedIds, delta);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update bulk levels');
    }
  };

  const columns: AdminColumn<Character>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={characters.length > 0 && selectedIds.length === characters.length}
          onChange={handleToggleSelectAll}
          className="rounded border-neutral-700 bg-neutral-900 text-red-500 focus:ring-0 cursor-pointer"
        />
      ) as unknown as string,
      accessor: (c) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(c.id)}
          onChange={() => handleToggleSelect(c.id)}
          className="rounded border-neutral-700 bg-neutral-900 text-red-500 focus:ring-0 cursor-pointer"
        />
      ),
      align: 'center',
    },
    {
      header: 'Character',
      accessor: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-300 overflow-hidden shrink-0">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <Shield size={16} className="text-neutral-400" />
            )}
          </div>
          <div>
            <span className="font-semibold text-neutral-100 block">{c.name}</span>
            <span className="text-[10px] font-mono text-neutral-400 select-all">{c.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Player / Owner',
      accessor: (c) => (
        <span className="font-medium text-neutral-300">
          {c.profile?.username || 'Unknown'}
        </span>
      ),
    },
    {
      header: 'Campaign',
      accessor: (c) => (
        <span className="text-neutral-300">
          {c.campaign?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Race & Class',
      accessor: (c) => (
        <div className="text-xs">
          <span className="text-neutral-200 block font-medium">{c.subclass?.name_en || 'Class'}</span>
          <span className="text-[11px] text-neutral-400 font-mono">{c.race?.name || 'Race'}</span>
        </div>
      ),
    },
    {
      header: 'Level / XP',
      accessor: (c) => (
        <div className="text-xs font-mono">
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 font-bold">
            Lv. {c.level}
          </span>
          <span className="text-[11px] text-neutral-400 ml-1.5">
            {c.xp_available} / {c.xp_total} XP
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(c)}
            title="Edit Character"
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleOpenTransfer(c)}
            title="Transfer Ownership"
            className="p-1.5 rounded-md hover:bg-blue-950/50 text-neutral-400 hover:text-blue-400 transition-colors"
          >
            <ArrowRightLeft size={14} />
          </button>
          <button
            onClick={() => handleOpenDelete(c)}
            title="Delete Character"
            className="p-1.5 rounded-md hover:bg-red-950/50 text-neutral-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Character Control</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Inspect and modify character attributes, level progression, and hero ownership across all campaigns.
        </p>
      </div>

      {actionError && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle size={15} className="shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Characters Table */}
      <AdminTable
        columns={columns}
        data={characters}
        keyExtractor={(c) => c.id}
        loading={loading}
        title="All Heroes"
        count={totalCount}
        selectedCount={selectedIds.length}
        bulkActionsSlot={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleBulkLevel(1)}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-emerald-400 rounded transition-colors"
            >
              <Plus size={12} /> Level +1
            </button>
            <button
              onClick={() => handleBulkLevel(-1)}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-amber-400 rounded transition-colors"
            >
              <Minus size={12} /> Level -1
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-[11px] font-medium text-red-300 rounded transition-colors ml-1"
            >
              <Trash2 size={12} /> Delete Selected
            </button>
          </div>
        }
        searchSlot={
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search character..."
            className="w-44 sm:w-56"
          />
        }
        filterSlot={
          <div className="flex items-center gap-2">
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50"
            >
              <option value="all">All Campaigns</option>
              {allCampaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50"
            >
              <option value="all">All Players</option>
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username}
                </option>
              ))}
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

      {/* Edit Character Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-neutral-200">
            <h3 className="text-base font-semibold text-neutral-100">Edit Hero Attributes</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Character Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Level (1-20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={editForm.level}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, level: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">XP Total</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editForm.xp_total}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, xp_total: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">XP Available</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editForm.xp_available}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, xp_available: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isUpdating && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-neutral-200">
            <h3 className="text-base font-semibold text-neutral-100">Transfer Character Ownership</h3>
            <p className="text-xs text-neutral-400">
              Reassign <span className="font-bold text-white">{transferTarget.name}</span> to another player account.
            </p>

            <form onSubmit={handleSaveTransfer} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Target Player Account</label>
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                >
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  disabled={isTransferring}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isTransferring && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirm Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Hero Character"
        entityName={deleteTarget?.name || ''}
        entityType="Character"
        impacts={impacts}
        isDeleting={isDeleting}
        dangerMessage="Deleting this character will permanently destroy all unlocked skills, equipped items, spell progression, and map tokens."
      />
    </div>
  );
}
