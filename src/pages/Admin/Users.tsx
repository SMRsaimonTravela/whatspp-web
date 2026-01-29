import {useEffect, useRef, useState} from "react";
import PageMeta from "../../components/common/PageMeta";
import {adminService} from "../../services/adminService";
import {IUser} from "../../types";
import {Modal} from "../../components/ui/modal";
import toast from "react-hot-toast";
import {IPagination} from "../../types/common";
import CommonPagination from "../../components/common/CommonPagination";
import {Dropdown} from "../../components/ui/dropdown/Dropdown";
import {ChevronDown, ChevronUp} from "lucide-react";
import CommonDialog from "../../components/common/CommonDialog";

export default function Users() {
    const [users, setUsers] = useState<IUser[]>([]);
    const [pagination, setPagination] = useState<IPagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [userTypeFilter, setUserTypeFilter] = useState("");
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [createForm, setCreateForm] = useState({
        name: "",
        businessName: "",
        email: "",
        whatsappNumber: "",
        password: "",
        userType: "host" as "host" | "admin",
    });

    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState<IUser | null>(null);
    const [resetPassword, setResetPassword] = useState("");
    const [resetPasswordError, setResetPasswordError] = useState("");
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const resetPasswordInputRef = useRef<HTMLInputElement>(null);

    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);


    useEffect(() => {
        loadUsers();
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
                setUsers(response.data);
                setPagination(response.pagination);
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

    // const handleDelete = async (userId: string) => {
    //     if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    //     try {
    //         const response = await adminService.deleteUser(userId);
    //         if (response.success) {
    //             toast.success("User deleted");
    //             loadUsers();
    //         }
    //     } catch (error) {
    //         console.error("Failed to delete user:", error);
    //     }
    // };

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


    const openResetPasswordModal = (user: IUser) => {
        setResetPasswordUser(user);
        setResetPassword("");
        setResetPasswordError("");
        setIsResetPasswordModalOpen(true);
        setTimeout(() => {
            resetPasswordInputRef.current?.focus();
        }, 100);
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUser) return;
        setResetPasswordError("");
        if (!resetPassword || resetPassword.length < 6) {
            setResetPasswordError("Password must be at least 6 characters long");
            return;
        }
        setIsResettingPassword(true);
        try {
            const response = await adminService.resetUserPassword(resetPasswordUser.id, resetPassword);
            if (response.success) {
                toast.success("Password reset successfully");
                setIsResetPasswordModalOpen(false);
                setResetPasswordUser(null);
                setResetPassword("");
            } else {
                setResetPasswordError(response.message || "Failed to reset password");
            }
        } catch (error: any) {
            setResetPasswordError(error?.response?.data?.message || "Failed to reset password");
        } finally {
            setIsResettingPassword(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400">Approved</span>;
            case 'rejected':
                return <span
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400">Rejected</span>;
            default:
                return <span
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">Pending</span>;
        }
    };

    const getUserTypeBadge = (userType: string) => {
        return userType === 'admin'
            ? <span
                className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">Admin</span>
            : <span
                className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">Host</span>;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const handleDropdownToggle = (userId: string) => {
        setOpenDropdownId(prev => (prev === userId ? null : userId));
    };
    const handleDropdownClose = () => {
        setOpenDropdownId(null);
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
                            Create Host User
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
                            <div
                                className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
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
                                {users.map((user, idx) => {
                                    const dropUp = idx >= users.length - 2;
                                    return (
                                        <tr key={user.id}
                                            className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    {user.userType === 'host' ? (
                                                        <button
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
                                            <td className="py-3 px-4 text-sm relative">
                                                <button
                                                    className="dropdown-toggle px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                                                    onClick={() => handleDropdownToggle(user.id)}
                                                >
                                                    Actions
                                                    {openDropdownId === user.id ? <ChevronUp size={16}/> :
                                                        <ChevronDown size={16}/>}
                                                </button>
                                                <Dropdown isOpen={openDropdownId === user.id}
                                                          onClose={handleDropdownClose} dropUp={dropUp}>
                                                    {user.status === 'pending' && (
                                                        <button
                                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-success-600"
                                                            onClick={() => {
                                                                handleApprove(user.id);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {user.status === 'pending' && (
                                                        <button
                                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-error-600"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setIsRejectModalOpen(true);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    <button
                                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        onClick={() => {
                                                            openResetPasswordModal(user);
                                                            handleDropdownClose();
                                                        }}
                                                    >
                                                        Reset Password
                                                    </button>
                                                    {/*<button*/}
                                                    {/*    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-error-600"*/}
                                                    {/*    onClick={() => {*/}
                                                    {/*        handleDelete(user.id);*/}
                                                    {/*        handleDropdownClose();*/}
                                                    {/*    }}*/}
                                                    {/*>*/}
                                                    {/*    Delete*/}
                                                    {/*</button>*/}
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
                    {pagination && pagination.total > pagination.per_page && (
                        <CommonPagination
                            pagination={pagination}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="max-w-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Create User</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User
                            Type</label>
                        <select
                            value={createForm.userType}
                            onChange={(e) => setCreateForm({
                                ...createForm,
                                userType: e.target.value as "host" | "admin"
                            })}
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
                            onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                            className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
                        />
                    </div>
                    {createForm.userType === 'host' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business
                                    Name</label>
                                <input
                                    type="text"
                                    value={createForm.businessName}
                                    onChange={(e) => setCreateForm({...createForm, businessName: e.target.value})}
                                    className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp
                                    Number</label>
                                <input
                                    type="text"
                                    value={createForm.whatsappNumber}
                                    onChange={(e) => setCreateForm({...createForm, whatsappNumber: e.target.value})}
                                    className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email
                            *</label>
                        <input
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                            className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password
                            *</label>
                        <input
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason
                        (Optional)</label>
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
            {/* Reset Password Modal */}
            <CommonDialog
                open={isResetPasswordModalOpen}
                onOpenChange={setIsResetPasswordModalOpen}
                title={`Reset Password for ${resetPasswordUser?.name}`}
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                            onClick={() => setIsResetPasswordModalOpen(false)}
                            disabled={isResettingPassword}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                            onClick={handleResetPassword}
                            disabled={isResettingPassword}
                        >
                            {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                }
            >
                <input
                    ref={resetPasswordInputRef}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand-500 ${resetPasswordError ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="New password"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    disabled={isResettingPassword}
                />
                {resetPasswordError && <p className="text-red-500 text-xs mt-1">{resetPasswordError}</p>}
            </CommonDialog>
        </>
    );
}
