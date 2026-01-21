import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { IHostUser } from "../../types/users.type";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { adminService } from "../../services/adminService";

export default function HostUsersPage() {
  const [users, setUsers] = useState<IHostUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHostUsers();
  }, []);

  const fetchHostUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getHostUsers();
      setUsers(res.data || []);
    } finally {
      setIsLoading(false);
    }
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
                    <TableCell isHeader className="px-6 py-4 font-semibold">Email</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Business Name</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Status</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Commission Rule</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Commission Value</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold">Commission Type</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
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
                      <TableCell className="px-6 py-4 text-sm">{user.email}</TableCell>
                      <TableCell className="px-6 py-4 text-sm">{user.businessName || '-'}</TableCell>
                      <TableCell className="px-6 py-4 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${user.status === 'approved' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'}`}>{user.status}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm">{user.commissionRule ? user.commissionRule.name : '-'}</TableCell>
                      <TableCell className="px-6 py-4 text-sm">{user.commissionRule ? user.commissionRule.value : '-'}</TableCell>
                      <TableCell className="px-6 py-4 text-sm">{user.commissionRule ? user.commissionRule.type : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
