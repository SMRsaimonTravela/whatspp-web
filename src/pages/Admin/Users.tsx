import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { adminService } from "../../services/adminService";
import type { User, Pagination } from "../../types";
import { Modal } from "../../components/ui/modal";
import { Drawer } from "../../components/ui/drawer";
import { financeService } from "../../services/financeService";
import { IHostFinancialDetails } from "../../types/finance";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    businessName: "",
    email: "",
    whatsappNumber: "",
    password: "",
    userType: "host" as "host" | "admin",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedHostFinance, setSelectedHostFinance] = useState<IHostFinancialDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [newHostId, setNewHostId] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, userTypeFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params: { page: number; limit: number; status?: string; userType?: string; search?: string } = {
        page: currentPage,
        limit: 20
      };
      if (statusFilter) params.status = statusFilter;
      if (userTypeFilter) params.userType = userTypeFilter;
      if (search) params.search = search;

      const response = await adminService.getUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await adminService.approveUser(userId);
      if (response.success) {
        toast.success("User approved successfully");
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to approve user:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    try {
      const response = await adminService.rejectUser(selectedUser.id, rejectReason);
      if (response.success) {
        toast.success("User rejected");
        setIsRejectModalOpen(false);
        setSelectedUser(null);
        setRejectReason("");
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to reject user:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        toast.success("User deleted");
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error("Email and password are required");
      return;
    }
    try {
      const response = await adminService.createUser(createForm);
      if (response.success) {
        toast.success("User created successfully");
        setIsCreateModalOpen(false);
        setCreateForm({
          name: "",
          businessName: "",
          email: "",
          whatsappNumber: "",
          password: "",
          userType: "host",
        });
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleViewHostDetails = async (user: User) => {
    setIsDetailsLoading(true);
    setIsDrawerOpen(true);
    setSelectedHostFinance(null);
    try {
      const details = await financeService.getAdminHostDetails(user.id);
      setSelectedHostFinance(details);
      setNewHostId(details.host.hostId?.toString() || "");
    } catch (error) {
      console.error("Failed to load host finance details:", error);
      toast.error("Failed to load financial details");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleUpdateHostId = async () => {
    if (!selectedHostFinance) return;
    const hostId = parseInt(newHostId);
    if (isNaN(hostId)) {
      toast.error("Please enter a valid Numeric ID");
      return;
    }
    try {
      await financeService.updateHostId(selectedHostFinance.host.id, hostId);
      toast.success("Host ID updated successfully");
      // Refresh details
      const details = await financeService.getAdminHostDetails(selectedHostFinance.host.id);
      setSelectedHostFinance(details);
    } catch (error) {
      console.error("Failed to update host ID:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400">Approved</span>;
      case 'rejected':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400">Rejected</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">Pending</span>;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    return userType === 'admin'
      ? <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">Admin</span>
      : <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">Host</span>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <PageMeta
        title="User Management | WhatsApp AI Bot"
        description="Manage users"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              User Management
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Create User
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, email..."
              className="h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={userTypeFilter}
              onChange={(e) => {
                setUserTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="host">Host</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleSearch}
              className="h-11 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Search
            </button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div>
                          {user.userType === 'host' ? (
                            <button
                              onClick={() => handleViewHostDetails(user)}
                              className="text-left group"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white group-hover:text-brand-500 transition-colors">{user.name}</p>
                              {user.businessName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.businessName}</p>
                              )}
                            </button>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{user.name}</p>
                              {user.businessName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.businessName}</p>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{user.whatsappNumber || "-"}</td>
                      <td className="py-3 px-4">{getUserTypeBadge(user.userType)}</td>
                      <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(user.id)}
                                className="text-success-500 hover:text-success-600 text-sm font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsRejectModalOpen(true);
                                }}
                                className="text-error-500 hover:text-error-600 text-sm font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-gray-500 hover:text-error-500 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Create User</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
            <select
              value={createForm.userType}
              onChange={(e) => setCreateForm({ ...createForm, userType: e.target.value as "host" | "admin" })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
            >
              <option value="host">Host</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
            />
          </div>
          {createForm.userType === 'host' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={createForm.businessName}
                  onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={createForm.whatsappNumber}
                  onChange={(e) => setCreateForm({ ...createForm, whatsappNumber: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} className="max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Reject User</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to reject <strong>{selectedUser?.name}</strong>?
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (Optional)</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-2 text-sm text-gray-800 dark:text-white"
            rows={3}
            placeholder="Enter rejection reason..."
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsRejectModalOpen(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600"
          >
            Reject
          </button>
        </div>
      </Modal>

      {/* Host Details Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Host Financial Overview"
        className="max-w-4xl mx-auto"
      >
        {isDetailsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
            <p className="text-gray-500 font-medium">Fetching host data...</p>
          </div>
        ) : selectedHostFinance ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Host Info Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20">
                  {selectedHostFinance.host.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedHostFinance.host.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedHostFinance.host.email}</p>
                  <p className="text-xs font-mono text-brand-600 dark:text-brand-400 mt-1">Host ID: {selectedHostFinance.host.hostId || 'Not Linked'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/admin/hosts/${selectedHostFinance.host.id}`)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Full View
                </button>
                <a
                  href={`https://wa.me/${selectedHostFinance.host.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:bg-[#20ba59] transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-brand-500/30 transition-all">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Available Balance</p>
                <div className="text-3xl font-black text-gray-900 dark:text-white">
                  ৳{selectedHostFinance.wallet.balance.toLocaleString()}
                </div>
                <div className="mt-3 flex items-center text-xs text-success-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-success-600 mr-2 animate-pulse"></span>
                  Ready to withdraw
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-brand-500/30 transition-all">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Bookings</p>
                <div className="text-3xl font-black text-gray-900 dark:text-white">
                  {selectedHostFinance.bookings.total}
                </div>
                <div className="mt-3 text-xs text-gray-500">Global bookings across all units</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-brand-500/30 transition-all">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                <div className="text-3xl font-black text-brand-600">
                  ৳{selectedHostFinance.wallet.totalPaid.toLocaleString()}
                </div>
                <div className="mt-3 text-xs text-gray-500">Successfully settled amount</div>
              </div>
            </div>

            {/* Host ID Linking Section */}
            <div className="p-6 bg-brand-50 dark:bg-brand-500/5 rounded-2xl border border-brand-100 dark:border-brand-500/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-brand-900 dark:text-brand-300">Link External Host ID</h4>
                  <p className="text-xs text-brand-700/70 dark:text-brand-400/70 mt-1">Connect this user to their physical Travela Host database entry</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="number"
                    value={newHostId}
                    onChange={(e) => setNewHostId(e.target.value)}
                    placeholder="Enter Numeric ID"
                    className="flex-1 md:w-40 h-11 rounded-xl border-brand-200 dark:border-brand-800 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-brand-900 dark:text-brand-100 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <button
                    onClick={handleUpdateHostId}
                    className="px-6 h-11 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95 whitespace-nowrap"
                  >
                    Update ID
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center pb-6">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-medium transition-colors"
              >
                Close Quick View
              </button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">No data available</div>
        )}
      </Drawer>
    </>
  );
}
