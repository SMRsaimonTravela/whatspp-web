import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { financeService } from "../../services/financeService";
import { ICommissionRule } from "../../types/finance";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import toast from "react-hot-toast";

export default function CommissionRulesPage() {
    const [rules, setRules] = useState<ICommissionRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState<Partial<ICommissionRule>>({
        name: "",
        scope: "global",
        type: "percentage",
        value: 0,
        priority: 0,
        status: "active",
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setIsLoading(true);
        try {
            const res = await financeService.getCommissionRules();
            setRules(res);
        } catch (error) {
            console.error("Failed to load rules:", error);
            toast.error("Failed to load commission rules");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name || form.value === undefined) {
            toast.error("Name and value are required");
            return;
        }
        setIsSubmitting(true);
        try {
            await financeService.createCommissionRule(form);
            toast.success(form._id ? "Rule updated" : "Rule created");
            setIsModalOpen(false);
            setForm({
                name: "",
                scope: "global",
                type: "percentage",
                value: 0,
                priority: 0,
                status: "active",
            });
            loadRules();
        } catch (error) {
            console.error("Failed to save rule:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (rule: ICommissionRule) => {
        setForm(rule);
        setIsModalOpen(true);
    };

    return (
        <>
            <PageMeta title="Commission Rules | Admin Dashboard" description="Configure system commission rates" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Commission Rules</h1>
                    <button
                        onClick={() => {
                            setForm({ name: "", scope: "global", type: "percentage", value: 0, priority: 0, status: "active" });
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                    >
                        Create New Rule
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
                            No functional commission rules found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                                    <TableRow>
                                        <TableCell isHeader className="px-6 py-4">Rule Name</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Scope</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Rate</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-center">Priority</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-center">Status</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-right">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rules.map((rule) => (
                                        <TableRow key={rule._id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{rule.name}</div>
                                                {rule.hostId && <div className="text-[10px] text-brand-500 font-bold uppercase">Host ID: {rule.hostId}</div>}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 capitalize text-sm text-gray-600 dark:text-gray-400">
                                                {rule.scope}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                {rule.type === 'percentage' ? `${rule.value}%` : `৳${rule.value}`}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center text-sm">
                                                {rule.priority}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${rule.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {rule.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEdit(rule)}
                                                    className="text-brand-500 hover:text-brand-600 text-sm font-medium mr-4"
                                                >
                                                    Edit
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                    {form._id ? 'Edit Commission Rule' : 'Create Commission Rule'}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rule Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Standard 10% Global"
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Scope</label>
                        <select
                            value={form.scope}
                            onChange={(e) => setForm({ ...form, scope: e.target.value as any, hostId: undefined })}
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="global">Global</option>
                            <option value="host">Specific Host</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rule Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (৳)</option>
                        </select>
                    </div>

                    {form.scope === 'host' && (
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Host ID (External)</label>
                            <input
                                type="number"
                                value={form.hostId || ""}
                                onChange={(e) => setForm({ ...form, hostId: parseInt(e.target.value) })}
                                placeholder="Target Host Numeric ID"
                                className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Value</label>
                        <input
                            type="number"
                            value={form.value}
                            onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) })}
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                        <input
                            type="number"
                            value={form.priority}
                            onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 h-12 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Rule"}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 h-12 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </Modal>
        </>
    );
}
