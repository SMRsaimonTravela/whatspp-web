import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { IHostUser } from "../../types/users.type";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { adminService } from "../../services/adminService";
import CommonDialog from "../../components/common/CommonDialog.tsx";
import toast from "react-hot-toast";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import CommonPagination from "../../components/common/CommonPagination";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function HostUsersPage() {
  const [users, setUsers] = useState<IHostUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IHostUser | null>(null);
  const [hostIdInput, setHostIdInput] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    fetchHostUsers(currentPage);
  }, [currentPage]);

  const fetchHostUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminService.getHostUsers({ page, limit: 10 });
      setUsers(res.data || []);
      setPagination(res.pagination || null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUpdateHostId = (user: IHostUser) => {
    setSelectedUser(user);
    setHostIdInput(user.hostId ? String(user.hostId) : "");
    setDialogOpen(true);
  };

  const handleUpdateHostId = async () => {
    if (!selectedUser) return;
    setUpdateLoading(true);
    try {
      await adminService.updateUserHostId(selectedUser.id, hostIdInput);
      toast.success("Host ID updated successfully.");
      setDialogOpen(false);
      fetchHostUsers(currentPage); // refetch current page
    } catch (e) {
      toast.error("Failed to update Host ID.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDropdownToggle = (userId: string) => {
    setOpenDropdownId(prev => (prev === userId ? null : userId));
  };
  const handleDropdownClose = () => {
    setOpenDropdownId(null);
  };

  return (
    <>
      <PageMeta title="Host Users | Admin Dashboard" description="List of all host users" />
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Host Users</h1>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-gray-500 dark:text-gray-400">No host users found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <TableRow>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Name</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Email (Host ID)</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">B. Name</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Status</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">C. Rule</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">C. Value</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">C. Type</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Action</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, idx) => {
                    const dropUp = idx >= users.length - 2;
                    return (
                      <TableRow key={user.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <TableCell className="px-6 py-4 text-sm">
                          <Link
                            to={`/admin/hosts/${user.id}`}
                            className="hover:underline cursor-pointer text-brand-600 dark:text-brand-400 transition-colors"
                            style={{ textDecoration: 'none' }}
                          >
                            {user.name}
                          </Link>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm">
                          {user.email} {user.hostId ? `(${user.hostId})` : ""}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm">{user.businessName || '-'}</TableCell>
                        <TableCell className="px-6 py-4 text-xs">
                          <span className={`px-2 py-1 rounded-full font-medium ${user.status === 'approved' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'}`}>{user.status}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm">{user.commissionRule ? user.commissionRule.name : '-'}</TableCell>
                        <TableCell className="px-6 py-4 text-sm">{user.commissionRule ? user.commissionRule.value : '-'}</TableCell>
                        <TableCell className="px-6 py-4 text-sm">{user.commissionRule ? user.commissionRule.type : '-'}</TableCell>
                        <TableCell className="px-6 py-4 text-sm relative">
                          <button
                            className="dropdown-toggle px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                            onClick={() => handleDropdownToggle(user.id)}
                          >
                            Actions
                            {openDropdownId === user.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <Dropdown isOpen={openDropdownId === user.id} onClose={handleDropdownClose} dropUp={dropUp}>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => { handleOpenUpdateHostId(user); handleDropdownClose(); }}
                            >
                              Update Host ID
                            </button>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Pagination */}
          {pagination && (
            <CommonPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
            />
          )}
        </div>
      </div>
      <CommonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Update Host ID"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60"
              onClick={() => setDialogOpen(false)}
              disabled={updateLoading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-60"
              onClick={handleUpdateHostId}
              disabled={updateLoading || !hostIdInput}
            >
              {updateLoading ? "Updating..." : "Update"}
            </button>
          </div>
        }
      >
        <div className="mb-4">
          <label htmlFor="hostId" className="block text-sm font-medium mb-2">Host ID</label>
          <input
            id="hostId"
            type="text"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-brand-500 dark:bg-gray-800 dark:text-white"
            value={hostIdInput}
            onChange={e => setHostIdInput(e.target.value)}
            disabled={updateLoading}
            placeholder="Enter new Host ID"
          />
        </div>
      </CommonDialog>
    </>
  );
}
