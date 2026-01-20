import React from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    action: "approve" | "reject" | null;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                                 isOpen,
                                                                 action,
                                                                 loading,
                                                                 onCancel,
                                                                 onConfirm,
                                                             }) => {
    if (!action) return null;

    // Determine label and color based on action
    const actionLabel = action;
    const actionColor = action === "approve" ? "text-green-600" : "text-red-600";
    const buttonBg = action === "approve"
        ? "bg-green-600 hover:bg-green-700"
        : "bg-red-600 hover:bg-red-700";

    return (
        <div
            className={`fixed inset-0 z-[99999999999] flex items-center justify-center transition-all duration-300 ${
                isOpen
                    ? "backdrop-blur-[2px] bg-black/10 opacity-100"
                    : "backdrop-blur-0 bg-black/0 opacity-0 pointer-events-none"
            }`}
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm transition-all duration-300 ${
                    isOpen
                        ? "scale-100 opacity-100 translate-y-0"
                        : "scale-95 opacity-0 -translate-y-4"
                }`}
            >
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                    Confirm Action
                </h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    Are you sure you want to{" "}
                    <span className={actionColor}>{actionLabel}</span> this request?
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded flex items-center justify-center min-w-[90px] ${buttonBg} text-white disabled:opacity-60`}
                    >
                        {loading ? (
                            <svg
                                className="animate-spin h-4 w-4 mr-2 text-white"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        ) : null}
                        {loading ? "Processing..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;