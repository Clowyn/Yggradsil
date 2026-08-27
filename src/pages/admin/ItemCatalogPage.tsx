import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Package,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAdminItems } from '../../hooks/useAdminItems';
import { AdminTable, type AdminColumn } from '../../components/admin/AdminTable';
import { AdminSearchBar } from '../../components/admin/AdminSearchBar';
import { ConfirmDeleteModal } from '../../components/admin/ConfirmDeleteModal';
import type { ItemDefinition, ItemRarity, ItemType } from '../../lib/types';
import { RARITY_COLORS } from '../../lib/types';

export function ItemCatalogPage() {
  const {
    items,
    loading,
    totalCount,
    totalPages,
    page,
    pageSize,
    search,
    rarityFilter,
    typeFilter,
    setPage,
    setPageSize,
    setSearch,
    setRarityFilter,
    setTypeFilter,
    createItem,
    updateItem,
    getItemDeleteImpact,
    deleteItem,
  } = useAdminItems(20);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name_en: string;
    name_tr: string;
    description_en: string;
    description_tr: string;
    rarity: ItemRarity;
    type: ItemType;
    icon_url: string;
    propertiesJson: string;
  }>({
    name_en: '',
    name_tr: '',
    description_en: '',
    description_tr: '',
    rarity: 'common',
    type: 'misc',
    icon_url: '🗡️',
    propertiesJson: '{\n  "damage": "1d8",\n  "weight": 2\n}',
  });
  const [isCreating, setIsCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<ItemDefinition | null>(null);
  const [editForm, setEditForm] = useState<{
    name_en: string;
    name_tr: string;
    description_en: string;
    description_tr: string;
    rarity: ItemRarity;
    type: ItemType;
    icon_url: string;
    propertiesJson: string;
  }>({
    name_en: '',
    name_tr: '',
    description_en: '',
    description_tr: '',
    rarity: 'common',
    type: 'misc',
    icon_url: '',
    propertiesJson: '{}',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ItemDefinition | null>(null);
  const [impacts, setImpacts] = useState<{ label: string; count: number }[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  // Open create
  const handleOpenCreate = () => {
    setCreateForm({
      name_en: '',
      name_tr: '',
      description_en: '',
      description_tr: '',
      rarity: 'common',
      type: 'misc',
      icon_url: '🗡️',
      propertiesJson: '{\n  "weight": 1\n}',
    });
    setIsCreateOpen(true);
    setActionError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    let parsedProps = {};
    try {
      parsedProps = JSON.parse(createForm.propertiesJson || '{}');
    } catch {
      setActionError('Properties must be a valid JSON object.');
      return;
    }

    setIsCreating(true);
    try {
      await createItem({
        name_en: createForm.name_en.trim(),
        name_tr: createForm.name_tr.trim() || createForm.name_en.trim(),
        description_en: createForm.description_en.trim(),
        description_tr: createForm.description_tr.trim() || createForm.description_en.trim(),
        rarity: createForm.rarity,
        type: createForm.type,
        icon_url: createForm.icon_url.trim() || null,
        properties: parsedProps,
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create item definition');
    } finally {
      setIsCreating(false);
    }
  };

  // Open edit
  const handleOpenEdit = (item: ItemDefinition) => {
    setEditTarget(item);
    setEditForm({
      name_en: item.name_en,
      name_tr: item.name_tr,
      description_en: item.description_en || '',
      description_tr: item.description_tr || '',
      rarity: item.rarity,
      type: item.type,
      icon_url: item.icon_url || '',
      propertiesJson: JSON.stringify(item.properties || {}, null, 2),
    });
    setActionError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setActionError(null);
    let parsedProps = {};
    try {
      parsedProps = JSON.parse(editForm.propertiesJson || '{}');
    } catch {
      setActionError('Properties must be a valid JSON object.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateItem(editTarget.id, {
        name_en: editForm.name_en.trim(),
        name_tr: editForm.name_tr.trim() || editForm.name_en.trim(),
        description_en: editForm.description_en.trim(),
        description_tr: editForm.description_tr.trim() || editForm.description_en.trim(),
        rarity: editForm.rarity,
        type: editForm.type,
        icon_url: editForm.icon_url.trim() || null,
        properties: parsedProps,
      });
      setEditTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update item definition');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open delete
  const handleOpenDelete = async (item: ItemDefinition) => {
    setDeleteTarget(item);
    setActionError(null);
    const impactData = await getItemDeleteImpact(item.id);
    setImpacts(impactData);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete item definition');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: AdminColumn<ItemDefinition>[] = [
    {
      header: 'Item',
      accessor: (i) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm overflow-hidden shrink-0">
            {i.icon_url ? (
              i.icon_url.startsWith('http') ? (
                <img src={i.icon_url} alt={i.name_en} className="w-full h-full object-cover" />
              ) : (
                <span>{i.icon_url}</span>
              )
            ) : (
              <Package size={16} className="text-neutral-400" />
            )}
          </div>
          <div>
            <span className="font-semibold text-neutral-100 block">{i.name_en}</span>
            <span className="text-[11px] text-neutral-400 block">{i.name_tr}</span>
            <span className="text-[10px] font-mono text-neutral-400 select-all">{i.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Rarity',
      accessor: (i) => (
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider"
          style={{
            color: RARITY_COLORS[i.rarity],
            backgroundColor: `${RARITY_COLORS[i.rarity]}15`,
            borderColor: `${RARITY_COLORS[i.rarity]}30`,
            borderWidth: 1,
          }}
        >
          {i.rarity}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: (i) => (
        <span className="px-2 py-0.5 rounded text-xs font-mono bg-neutral-800 text-neutral-300 border border-neutral-700 uppercase">
          {i.type}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: (i) => (
        <p className="text-xs text-neutral-400 max-w-xs truncate" title={i.description_en}>
          {i.description_en || 'No description'}
        </p>
      ),
    },
    {
      header: 'Properties',
      accessor: (i) => (
        <span className="text-[11px] font-mono text-neutral-400">
          {Object.keys(i.properties || {}).length} props
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Actions',
      accessor: (i) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(i)}
            title="Edit Item Definition"
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleOpenDelete(i)}
            title="Delete Item Definition"
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
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Item Catalog</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Global catalog of equipment, magical artifacts, weapons, and consumables available in the game database.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Item Definition</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle size={15} className="shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Table */}
      <AdminTable
        columns={columns}
        data={items}
        keyExtractor={(i) => i.id}
        loading={loading}
        title="All Catalog Items"
        count={totalCount}
        searchSlot={
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search items..."
            className="w-44 sm:w-56"
          />
        }
        filterSlot={
          <div className="flex items-center gap-2">
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value as 'all' | ItemRarity)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | ItemType)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50"
            >
              <option value="all">All Types</option>
              <option value="weapon">Weapon</option>
              <option value="armor">Armor</option>
              <option value="consumable">Consumable</option>
              <option value="quest">Quest</option>
              <option value="misc">Misc</option>
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

      {/* Create Item Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-neutral-200">
            <h3 className="text-base font-semibold text-neutral-100">Add Item to Catalog</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Name (English)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flame Tongue Sword"
                    value={createForm.name_en}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name_en: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Name (Turkish)</label>
                  <input
                    type="text"
                    placeholder="e.g. Alev Dili Kılıcı"
                    value={createForm.name_tr}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name_tr: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Rarity</label>
                  <select
                    value={createForm.rarity}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, rarity: e.target.value as ItemRarity }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value as ItemType }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="consumable">Consumable</option>
                    <option value="quest">Quest</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Icon Emoji / URL</label>
                  <input
                    type="text"
                    value={createForm.icon_url}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, icon_url: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={createForm.description_en}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description_en: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Properties (JSON)</label>
                <textarea
                  rows={3}
                  value={createForm.propertiesJson}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, propertiesJson: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  <span>Save to Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-neutral-200">
            <h3 className="text-base font-semibold text-neutral-100">Edit Catalog Item</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Name (English)</label>
                  <input
                    type="text"
                    required
                    value={editForm.name_en}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name_en: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Name (Turkish)</label>
                  <input
                    type="text"
                    value={editForm.name_tr}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name_tr: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Rarity</label>
                  <select
                    value={editForm.rarity}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, rarity: e.target.value as ItemRarity }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value as ItemType }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="consumable">Consumable</option>
                    <option value="quest">Quest</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Icon Emoji / URL</label>
                  <input
                    type="text"
                    value={editForm.icon_url}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, icon_url: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={editForm.description_en}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description_en: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Properties (JSON)</label>
                <textarea
                  rows={3}
                  value={editForm.propertiesJson}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, propertiesJson: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Item Definition"
        entityName={deleteTarget?.name_en || ''}
        entityType="Item Definition"
        impacts={impacts}
        isDeleting={isDeleting}
        dangerMessage="Deleting this item definition will cascade delete every instance of this item across all player inventories."
      />
    </div>
  );
}
