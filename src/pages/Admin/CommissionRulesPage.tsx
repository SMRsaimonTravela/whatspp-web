import {useEffect, useState} from "react";
import PageMeta from "../../components/common/PageMeta";
import {financeService} from "../../services/financeService";
import {adminService} from "../../services/adminService";
import {ICommissionRule} from "../../types/commission.ts";
import {IAssignedUser, IHostUser} from "../../types/users.type";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../components/ui/table";
import {Modal} from "../../components/ui/modal";
import toast from "react-hot-toast";
import MultiSelect from "../../components/form/MultiSelect";
import {Controller, useForm} from "react-hook-form";
import {Dropdown} from "../../components/ui/dropdown/Dropdown";
import {DropdownItem} from "../../components/ui/dropdown/DropdownItem";
import Switch from "../../components/form/switch/Switch";

export default function CommissionRulesPage() {
    const [rules, setRules] = useState<ICommissionRule[]>([] as ICommissionRule[]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState<Partial<ICommissionRule>>({
        name: "",
        scope: "global",
        type: "percentage",
        value: 0,
        maxAmount: 0,
        priority: 0,
        status: "active",
    });

    const [hostUsers, setHostUsers] = useState<IHostUser[]>([]);
    const [assignModal, setAssignModal] = useState<{ open: boolean; ruleId: string | null }>({
        open: false,
        ruleId: null
    });
    const [assigning, setAssigning] = useState(false);
    const [selectedAssignUsers, setSelectedAssignUsers] = useState<string[]>([]);

    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [userListModal, setUserListModal] = useState<{ open: boolean; users: IAssignedUser[] }>({
        open: false,
        users: []
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

    const fetchHostUsers = async () => {
        try {
            const res = await adminService.getHostUsers();
            setHostUsers(res.data || []);
        } catch{
            toast.error("Failed to load host users");
        }
    };

    const {
        control,
        handleSubmit: rhfHandleSubmit,
        reset,
        watch,
        formState: {errors}
    } = useForm({
        defaultValues: {
            name: "",
            scope: "global",
            type: "percentage",
            value: 0, // number
            maxAmount: 0, // number
            priority: 1, // number
            status: "active",
            assignedUsers: [] as string[],
        },
    });

    // When opening modal, reset form with current data
    useEffect(() => {
        if (isModalOpen) {
            reset({
                name: form.name || "",
                scope: form.scope || "global",
                type: form.type || "percentage",
                value: typeof form.value === 'number' ? form.value : Number(form.value) || 0,
                maxAmount: typeof form.maxAmount === 'number' ? form.maxAmount : Number(form.maxAmount) || 0,
                priority: typeof form.priority === 'number' ? form.priority : Number(form.priority) || 0,
                status: form.status || "active",
                assignedUsers: form.assignedUsers?.map((u: IAssignedUser) => u.id) || [],
            });
        }
    }, [isModalOpen, form, reset]);

    const onSubmit = async (data: Partial<ICommissionRule>) => {
        const payload = {
            ...data,
            value: typeof data.value === 'number' ? data.value : Number(data.value) || 0,
            maxAmount: typeof data.maxAmount === 'number' ? data.maxAmount : Number(data.maxAmount) || 0,
            priority: typeof data.priority === 'number' ? data.priority : Number(data.priority) || 0,
        };
        setIsSubmitting(true);
        try {
            if (form.id) {
                // Update: only send changed fields except status/assignedUsers
                const updatePayload: Partial<ICommissionRule> = {};
                ["name", "scope", "type", "value", "priority", "maxAmount"].forEach(key => {
                    if ((payload as any)[key] !== (form as any)[key]) (updatePayload as any)[key] = (payload as any)[key];
                });
                if (Object.keys(updatePayload).length > 0) {
                    await financeService.updateCommissionRule(form.id, updatePayload);
                }
                toast.success("Rule updated");
            } else {
                // Create: send all fields, including assigned users
                const createPayload = {
                    ...payload,
                    assignedUsers: undefined,
                };
                const created  = await financeService.createCommissionRule(createPayload);
                // Assign users if any selected
                if (data.assignedUsers && data.assignedUsers.length > 0 && created?.id) {
                    await financeService.assignCommissionRuleUsers(created.id, data.assignedUsers.map(x=>x.id));
                }
                toast.success("Rule created");
            }
            setIsModalOpen(false);
            loadRules();
        } catch{
            toast.error("Failed to save rule");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (rule: ICommissionRule) => {
        setForm(rule);
        setIsModalOpen(true);
    };

    const handleStatusToggle = async (rule: ICommissionRule, checked:boolean) => {
        try {
            await financeService.updateCommissionRuleStatus(rule.id, !checked ? "inactive" : "active");
            toast.success("Status updated");
            loadRules();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleAssignUsers = async () => {
        if (!assignModal.ruleId) return;
        setAssigning(true);
        try {
            await financeService.assignCommissionRuleUsers(assignModal.ruleId, selectedAssignUsers);
            toast.success("Users assigned");
            setAssignModal({open: false, ruleId: null});
            setSelectedAssignUsers([]);
            loadRules();
        } catch (e) {
            toast.error("Failed to assign users");
        } finally {
            setAssigning(false);
        }
    };

    // Only fetch host users when assign modal is opened
    useEffect(() => {
        if (assignModal.open) {
            fetchHostUsers();
        }
    }, [assignModal.open]);

    return (
        <>
            <PageMeta title="Commission Rules | Admin Dashboard" description="Configure system commission rates"/>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Commission Rules</h1>
                    <button
                        onClick={() => {
                            setForm({
                                name: "",
                                scope: "global",
                                type: "percentage",
                                value: 0,
                                priority: 0,
                                status: "active"
                            });
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                    >
                        Create New Rule
                    </button>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                                <TableHeader
                                    className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                                    <TableRow>
                                        <TableCell isHeader className="px-6 py-4 dark:text-gray-200">Rule Name</TableCell>
                                        <TableCell isHeader className="px-6 py-4 dark:text-gray-200">Scope</TableCell>
                                        <TableCell isHeader className="px-6 py-4 dark:text-gray-200">Rate</TableCell>
                                        <TableCell isHeader className="px-6 py-4 dark:text-gray-200">Created By</TableCell>
                                        <TableCell isHeader className="px-6 py-4 dark:text-gray-200">Assigned Users</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-center dark:text-gray-200">Status</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-right dark:text-gray-200">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...rules].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map((rule, idx) => (
                                        <TableRow key={rule.id}
                                                  className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">{rule.name}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 capitalize text-sm text-gray-600 dark:text-gray-400">{rule.scope}</TableCell>
                                            <TableCell className="px-6 py-4 text-gray-900 dark:text-white text-sm">{rule.type === 'percentage' ? `${rule.value}%` : `৳${rule.value}`}</TableCell>
                                            <TableCell className="px-6 py-4 text-sm">
                                                <div className="text-gray-900 dark:text-white">{rule.user?.email}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm">
                                                {rule.assignedUsers && rule.assignedUsers.length > 0 ? (
                                                    <button onClick={() => setUserListModal({
                                                        open: true,
                                                        users: rule.assignedUsers
                                                    })} className="text-blue-500 hover:underline focus:outline-none">
                                                        {rule.assignedUsers.length} user{rule.assignedUsers.length > 1 ? 's' : ''}
                                                    </button>
                                                ) : <span className="text-gray-400 text-xs">None</span>}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <Switch
                                                    label=""
                                                    defaultChecked={rule.status === 'active'}
                                                    color="blue"
                                                    onChange={checked => handleStatusToggle({
                                                        ...rule
                                                    }, checked)}
                                                />
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right space-x-2 relative">
                                                <div className="inline-block text-left">
                                                    <button
                                                        className="dropdown-toggle text-brand-500 hover:text-brand-600 text-sm font-medium focus:outline-none"
                                                        onClick={() => setDropdownOpen(dropdownOpen === rule.id ? null : rule.id)}
                                                        type="button"
                                                    >
                                                        Actions ▾
                                                    </button>
                                                    <Dropdown
                                                        isOpen={dropdownOpen === rule.id}
                                                        onClose={() => setDropdownOpen(null)}
                                                        dropUp={idx === rules.length - 1}
                                                    >
                                                        <DropdownItem onClick={() => {
                                                            handleEdit(rule);
                                                            setDropdownOpen(null);
                                                        }}>
                                                            Edit
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => {
                                                            setAssignModal({open: true, ruleId: rule.id});
                                                            setDropdownOpen(null);
                                                        }}>
                                                            Assign Users
                                                        </DropdownItem>
                                                    </Dropdown>
                                                </div>
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
            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {form.id ? 'Edit Commission Rule' : 'Create Commission Rule'}
                        </h2>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Rule Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Rule Name <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                name="name"
                                control={control}
                                rules={{required: "Rule name is required"}}
                                render={({field}) => (
                                    <input
                                        {...field}
                                        type="text"
                                        placeholder="Enter rule name"
                                        className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                    />
                                )}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Scope */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Scope <span className="text-red-500">*</span>
                            </label>
                            {form.id ? (
                                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                                        <input type="radio" checked={form.scope === 'global'} disabled
                                               className="w-4 h-4"/>
                                        <span
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300">Global</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                                        <input type="radio" checked={form.scope === 'host'} disabled
                                               className="w-4 h-4"/>
                                        <span
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300">Host</span>
                                    </label>
                                </div>
                            ) : (
                                <Controller
                                    name="scope"
                                    control={control}
                                    render={({field}) => (
                                        <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value="global"
                                                    checked={field.value === 'global'}
                                                    onChange={() => field.onChange('global')}
                                                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                                                />
                                                <span
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300">Global</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value="host"
                                                    checked={field.value === 'host'}
                                                    onChange={() => field.onChange('host')}
                                                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                                                />
                                                <span
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300">Host</span>
                                            </label>
                                        </div>
                                    )}
                                />
                            )}
                        </div>

                        {/* Rule Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Rule Type <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                name="type"
                                control={control}
                                render={({field}) => (
                                    <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="percentage"
                                                checked={field.value === 'percentage'}
                                                onChange={() => field.onChange('percentage')}
                                                className="w-4 h-4 accent-brand-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Percentage (%)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="fixed"
                                                checked={field.value === 'fixed'}
                                                onChange={() => field.onChange('fixed')}
                                                className="w-4 h-4 accent-brand-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fixed Amount</span>
                                        </label>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    name="priority"
                                    control={control}
                                    rules={{
                                        required: "Priority is required",
                                        min: {value: 0, message: "Must be 0 or greater"}
                                    }}
                                    render={({field}) => (
                                        <input
                                            {...field}
                                            type="number"
                                            placeholder="e.g., 1"
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                        />
                                    )}
                                />
                                {errors.priority &&
                                    <p className="mt-1 text-sm text-red-500">{errors.priority.message}</p>}
                            </div>

                            {/* Value */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Value <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    name="value"
                                    control={control}
                                    rules={{
                                        required: "Value is required",
                                        min: {value: 0, message: "Must be 0 or greater"}
                                    }}
                                    render={({field}) => (
                                        <input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            placeholder={watch("type") === "percentage" ? "e.g., 5.5" : "e.g., 100"}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                        />
                                    )}
                                />
                                {errors.value && <p className="mt-1 text-sm text-red-500">{errors.value.message}</p>}
                            </div>

                            {/* Max Amount */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Max Amount (Optional)
                                </label>
                                <Controller
                                    name="maxAmount"
                                    control={control}
                                    render={({field}) => (
                                        <input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g., 1000"
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                        />
                                    )}
                                />
                                {errors.maxAmount &&
                                    <p className="mt-1 text-sm text-red-500">{errors.maxAmount.message}</p>}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={rhfHandleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="flex-1 h-12 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                              </span>
                                ) : (
                                    form.id ? "Update Rule" : "Create Rule"
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-12 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            {/* Assign Users Modal */}
            <Modal isOpen={assignModal.open} onClose={() => setAssignModal({open: false, ruleId: null})}
                   className="max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">Assign Users</h2>
                <MultiSelect
                    label="Select Host Users"
                    options={hostUsers.map(u => ({value: u.id, text: `${u.name} (${u.email})`}))}
                    defaultSelected={selectedAssignUsers}
                    onChange={setSelectedAssignUsers}
                />
                <div className="flex justify-end mt-4 space-x-2">
                    <button onClick={() => setAssignModal({open: false, ruleId: null})}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-700">Cancel
                    </button>
                    <button onClick={handleAssignUsers} disabled={assigning}
                            className="px-4 py-2 rounded bg-brand-500 text-white font-semibold hover:bg-brand-600">{assigning ? 'Assigning...' : 'Assign'}</button>
                </div>
            </Modal>

            {/* User List Modal */}
            <Modal isOpen={userListModal.open} onClose={() => setUserListModal({open: false, users: []})}
                   className="max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">Assigned Users</h2>
                <ul className="space-y-2">
                    {userListModal.users.map(u => (
                        <li key={u.id} className="flex flex-col text-xs">
                            <span className="font-medium text-gray-800 dark:text-white">{u.name}</span>
                            <span className="text-gray-400 text-[10px]">{u.email}</span>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-end mt-4">
                    <button onClick={() => setUserListModal({open: false, users: []})}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-700">Close
                    </button>
                </div>
            </Modal>
        </>
    );
}
