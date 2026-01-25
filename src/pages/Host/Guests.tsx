import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { hostService } from "../../services/hostService";
import { Modal } from "../../components/ui/modal";
import toast from "react-hot-toast";
import { IGuest } from "../../types";
import { IPagination } from "../../types/common";
import SwitchToggle from '../../components/common/SwitchToggle';
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { ChevronDown, ChevronUp, Pencil, MessageCircle } from "lucide-react";
import CommonPagination from "../../components/common/CommonPagination";

export default function Guests() {
  const [guests, setGuests] = useState<IGuest[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingGuest, setEditingGuest] = useState<IGuest | null>(null);
  const [editForm, setEditForm] = useState({ name: "", originalNumber: "" });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    loadGuests();
  }, [currentPage]);

  const loadGuests = async () => {
    setIsLoading(true);
    try {
      const params: { page: number; limit: number; search?: string } = { page: currentPage, limit: 20 };
      if (search) params.search = search;

      const response = await hostService.getGuests(params);
      if (response.success) {
        setGuests(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to load guests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadGuests();
  };

  const handleToggleAI = async (guest: IGuest) => {
    try {
      const response = await hostService.toggleGuestAI(guest.id, !guest.aiAutoReplyEnabled);
      if (response.success) {
        setGuests(guests.map(g =>
          g.id === guest.id ? { ...g, aiAutoReplyEnabled: !g.aiAutoReplyEnabled } : g
        ));
        toast.success(`AI auto-reply ${!guest.aiAutoReplyEnabled ? 'enabled' : 'disabled'} for this guest`);
      }
    } catch (error) {
      console.error("Failed to toggle AI:", error);
    }
  };

  const handleEditGuest = (guest: IGuest) => {
    setEditingGuest(guest);
    setEditForm({
      name: guest.name || "",
      originalNumber: guest.originalNumber || "",
    });
  };

  const handleSaveGuest = async () => {
    if (!editingGuest) return;
    try {
      const response = await hostService.updateGuest(editingGuest.id, editForm);
      if (response.success) {
        setGuests(guests.map(g =>
          g.id === editingGuest.id ? { ...g, ...editForm } : g
        ));
        setEditingGuest(null);
        toast.success("Guest updated successfully");
      }
    } catch (error) {
      console.error("Failed to update guest:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const handleDropdownToggle = (guestId: string) => {
    setOpenDropdownId(prev => (prev === guestId ? null : guestId));
  };
  const handleDropdownClose = () => {
    setOpenDropdownId(null);
  };

  return (
    <>
      <PageMeta
        title="Guests | WhatsApp AI Bot"
        description="Manage your guests"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            Guests
          </h1>

          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or number..."
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 h-11 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Guests Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
            </div>
          ) : guests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No guests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">WhatsApp Number</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Original Number</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Messages</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">AI Reply</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Last Message</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest, idx) => {
                    const dropUp = idx >= guests.length - 2;
                    return (
                      <tr key={guest.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {guest.name || guest.notifyName || "Unknown"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                            {guest.whatsappNumber}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {guest.originalNumber || "-"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                            {guest.totalMessages}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <SwitchToggle
                            checked={guest.aiAutoReplyEnabled}
                            onChange={() => handleToggleAI(guest)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(guest.lastMessageAt)}
                          </p>
                        </td>
                        <td className="py-3 px-4 relative">
                          <button
                            className="dropdown-toggle px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                            onClick={() => handleDropdownToggle(guest.id)}
                          >
                            Actions
                            {openDropdownId === guest.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <Dropdown isOpen={openDropdownId === guest.id} onClose={handleDropdownClose} dropUp={dropUp}>
                            <button
                              onClick={() => { handleEditGuest(guest); handleDropdownClose(); }}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Pencil size={16} className="inline-block align-middle" />
                              Edit
                            </button>
                            <Link
                              to={`/host/conversation?guestId=${encodeURIComponent(guest.id)}`}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap"
                              onClick={handleDropdownClose}
                            >
                              <MessageCircle size={16} className="inline-block align-middle mr-2" />
                              <span className="inline-block align-middle">View Messages</span>
                            </Link>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <CommonPagination
              pagination={pagination}
              onPageChange={setCurrentPage}
              className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
            />
          )}
        </div>
      </div>

      {/* Edit Guest Modal */}
      <Modal isOpen={!!editingGuest} onClose={() => setEditingGuest(null)} className="max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Edit Guest
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Guest name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Original Phone Number
            </label>
            <input
              type="text"
              value={editForm.originalNumber}
              onChange={(e) => setEditForm({ ...editForm, originalNumber: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="01712345678"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Set the real phone number if WhatsApp provided a temporary one
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEditingGuest(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGuest}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
