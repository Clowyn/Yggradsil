import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  Compass,
  AlertCircle,
  Loader2,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useAdminCampaigns, type AdminCampaignRecord } from '../../hooks/useAdminCampaigns';
import { AdminTable, type AdminColumn } from '../../components/admin/AdminTable';
import { AdminSearchBar } from '../../components/admin/AdminSearchBar';
import { ConfirmDeleteModal } from '../../components/admin/ConfirmDeleteModal';
import { supabase } from '../../lib/supabase';
import type { Profile, CampaignMember } from '../../lib/types';

export function CampaignsPage() {
  const {
    campaigns,
    loading,
    totalCount,
    totalPages,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    createCampaign,
    updateCampaign,
    getCampaignDeleteImpact,
    deleteCampaign,
    getCampaignMembers,
    addMember,
    removeMember,
    updateMemberRole,
  } = useAdminCampaigns(20);

  // Auxiliary data
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', gm_id: '', fog_radius: 80 });
  const [isCreating, setIsCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<AdminCampaignRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: '', gm_id: '', fog_radius: 80 });
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminCampaignRecord | null>(null);
  const [impacts, setImpacts] = useState<{ label: string; count: number }[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Members management modal
  const [membersTarget, setMembersTarget] = useState<AdminCampaignRecord | null>(null);
  const [membersList, setMembersList] = useState<CampaignMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedNewProfileId, setSelectedNewProfileId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'gm' | 'player'>('player');

  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, username, role');
      if (data) setAllProfiles(data as Profile[]);
    };
    fetchProfiles();
  }, []);

  // Handle create
  const handleOpenCreate = () => {
    const defaultGM = allProfiles.find((p) => p.role === 'gm' || p.role === 'admin') || allProfiles[0];
    setCreateForm({
      name: '',
      gm_id: defaultGM?.id || '',
      fog_radius: 80,
    });
    setIsCreateOpen(true);
    setActionError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.gm_id) return;
    setIsCreating(true);
    setActionError(null);
    try {
      await createCampaign(createForm.name.trim(), createForm.gm_id, createForm.fog_radius);
      setIsCreateOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle edit
  const handleOpenEdit = (camp: AdminCampaignRecord) => {
    setEditTarget(camp);
    setEditForm({
      name: camp.name,
      gm_id: camp.gm_id,
      fog_radius: camp.settings?.fog_radius || 80,
    });
    setActionError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editForm.name.trim()) return;
    setIsUpdating(true);
    setActionError(null);
    try {
      await updateCampaign(editTarget.id, {
        name: editForm.name.trim(),
        gm_id: editForm.gm_id,
        settings: { fog_radius: editForm.fog_radius },
      });
      setEditTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update campaign');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete
  const handleOpenDelete = async (camp: AdminCampaignRecord) => {
    setDeleteTarget(camp);
    setActionError(null);
    const impactData = await getCampaignDeleteImpact(camp.id);
    setImpacts(impactData);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteCampaign(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle members
  const handleOpenMembers = async (camp: AdminCampaignRecord) => {
    setMembersTarget(camp);
    setLoadingMembers(true);
    setActionError(null);
    try {
      const list = await getCampaignMembers(camp.id);
      setMembersList(list);
      setSelectedNewProfileId(allProfiles[0]?.id || '');
    } catch (err: any) {
      setActionError(err.message || 'Failed to load campaign members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membersTarget || !selectedNewProfileId) return;
    try {
      await addMember(membersTarget.id, selectedNewProfileId, newMemberRole);
      const updated = await getCampaignMembers(membersTarget.id);
      setMembersList(updated);
    } catch (err: any) {
      setActionError(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!membersTarget) return;
    try {
      await removeMember(memberId, membersTarget.id);
      setMembersList((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove member');
    }
  };

  const handleMemberRoleChange = async (memberId: string, role: 'gm' | 'player') => {
    if (!membersTarget) return;
    try {
      await updateMemberRole(memberId, role, membersTarget.id);
      setMembersList((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      );
    } catch (err: any) {
      setActionError(err.message || 'Failed to update member role');
    }
  };

  const columns: AdminColumn<AdminCampaignRecord>[] = [
    {
      header: 'Campaign Name',
      accessor: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-400 shrink-0">
            <Compass size={16} />
          </div>
          <div>
            <span className="font-semibold text-neutral-100 block">{c.name}</span>
            <span className="text-[10px] font-mono text-neutral-400 select-all">{c.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Game Master',
      accessor: (c) => (
        <span className="font-medium text-neutral-200">
          {c.gm?.username || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Members',
      accessor: (c) => (
        <span className="font-mono text-xs text-neutral-300">
          {c.membersCount ?? 0}
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Heroes / Characters',
      accessor: (c) => (
        <span className="font-mono text-xs text-neutral-300">
          {c.charactersCount ?? 0}
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Created At',
      accessor: (c) => (
        <span className="text-neutral-400 font-mono text-[11px]">
          {new Date(c.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenMembers(c)}
            title="Manage Members"
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 transition-colors"
          >
            <Users size={14} />
          </button>
          <button
            onClick={() => handleOpenEdit(c)}
            title="Edit Campaign"
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleOpenDelete(c)}
            title="Delete Campaign"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Campaign Realms</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Oversee active game worlds, reassign Campaign GMs, and regulate party rosters.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Campaign</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle size={15} className="shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Campaigns Table */}
      <AdminTable
        columns={columns}
        data={campaigns}
        keyExtractor={(c) => c.id}
        loading={loading}
        title="All Campaigns"
        count={totalCount}
        searchSlot={
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search campaign name..."
            className="w-48 sm:w-64"
          />
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

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-neutral-200">
            <h3 className="text-base font-semibold text-neutral-100">Create New Campaign</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chronicles of Eldoria"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Assigned Game Master</label>
                <select
                  value={createForm.gm_id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, gm_id: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                >
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Default Fog Radius (px)</label>
                <input
                  type="number"
                  min={20}
                  max={500}
                  value={createForm.fog_radius}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, fog_radius: Number(e.target.value) }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isCreating && <Loader2 size={13} className="animate-spin" />}
                  <span>Create Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-neutral-200">
            <h3 className="text-base font-semibold text-neutral-100">Edit Campaign Settings</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Assigned Game Master</label>
                <select
                  value={editForm.gm_id}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, gm_id: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                >
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Default Fog Radius (px)</label>
                <input
                  type="number"
                  min={20}
                  max={500}
                  value={editForm.fog_radius}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fog_radius: Number(e.target.value) }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500/50"
                />
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

      {/* Manage Members Modal */}
      {membersTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-100">
                Campaign Members: {membersTarget.name}
              </h3>
              <span className="text-xs font-mono text-neutral-400">{membersList.length} members</span>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMemberSubmit} className="flex items-center gap-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
              <select
                value={selectedNewProfileId}
                onChange={(e) => setSelectedNewProfileId(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500/50"
              >
                {allProfiles
                  .filter((p) => !membersList.some((m) => m.profile_id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username}
                    </option>
                  ))}
              </select>

              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as 'gm' | 'player')}
                className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500/50"
              >
                <option value="player">Player</option>
                <option value="gm">GM</option>
              </select>

              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded transition-colors"
              >
                <UserPlus size={14} /> Add
              </button>
            </form>

            {/* Members List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-800/80 border border-neutral-800 rounded-lg bg-neutral-950/40">
              {loadingMembers ? (
                <div className="py-8 text-center text-xs text-neutral-400 font-mono">
                  Loading members...
                </div>
              ) : membersList.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 font-mono">
                  No members in this campaign yet.
                </div>
              ) : (
                membersList.map((m) => (
                  <div key={m.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-300">
                        {m.profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-200 block">{m.profile?.username}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Joined {new Date(m.joined_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        onChange={(e) => handleMemberRoleChange(m.id, e.target.value as 'gm' | 'player')}
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-[11px] text-neutral-300"
                      >
                        <option value="player">Player</option>
                        <option value="gm">GM</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        title="Remove member"
                        className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMembersTarget(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Campaign Realm"
        entityName={deleteTarget?.name || ''}
        entityType="Campaign"
        impacts={impacts}
        isDeleting={isDeleting}
        dangerMessage="Deleting this campaign will permanently destroy all campaign memberships, characters assigned to this campaign, map tokens, and map state."
      />
    </div>
  );
}
