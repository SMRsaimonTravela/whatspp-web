import { useState } from "react";
import { useForm } from "react-hook-form";
import PageMeta from "../../components/common/PageMeta";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

interface CreateAdminFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  whatsappNumber: string;
}

export default function CreateAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{ name: string; email: string; whatsappNumber: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAdminFormData>();

  const password = watch("password");

  const onSubmit = async (data: CreateAdminFormData) => {
    setIsLoading(true);
    try {
      const response = await adminService.createAdmin({
        name: data.name || undefined,
        email: data.email,
        password: data.password,
        whatsappNumber: data.whatsappNumber,
      });
      if (response.success) {
        toast.success("Admin created successfully");
        setCreatedAdmin({
          name: response.data.name || data.email,
          email: response.data.email,
          whatsappNumber: response.data.whatsappNumber || data.whatsappNumber,
        });
        reset();
      }
    } catch (error) {
      console.error("Failed to create admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Admin | WhatsApp AI Bot"
        description="Create a new admin user"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm max-w-xl">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Create Admin
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add a new administrator to the system
          </p>

          {createdAdmin && (
            <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
                  <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-success-700 dark:text-success-400">Admin Created Successfully!</p>
                  <p className="text-sm text-success-600 dark:text-success-500">
                    {createdAdmin.name} ({createdAdmin.email})
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Admin Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-error-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={`w-full h-11 rounded-lg border ${
                    errors.email ? "border-error-500" : "border-gray-300 dark:border-gray-600"
                  } bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                  placeholder="admin@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-error-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Number <span className="text-error-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register("whatsappNumber", {
                    required: "WhatsApp number is required",
                    pattern: {
                      value: /^\+?[0-9]{7,15}$/,
                      message: "Invalid WhatsApp number",
                    },
                  })}
                  className={`w-full h-11 rounded-lg border ${
                    errors.whatsappNumber ? "border-error-500" : "border-gray-300 dark:border-gray-600"
                  } bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                  placeholder="e.g. +12345678901"
                />
                {errors.whatsappNumber && (
                  <p className="text-xs text-error-500 mt-1">{errors.whatsappNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-error-500">*</span>
                </label>
                <input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className={`w-full h-11 rounded-lg border ${
                    errors.password ? "border-error-500" : "border-gray-300 dark:border-gray-600"
                  } bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-xs text-error-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password <span className="text-error-500">*</span>
                </label>
                <input
                  type="password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                  className={`w-full h-11 rounded-lg border ${
                    errors.confirmPassword ? "border-error-500" : "border-gray-300 dark:border-gray-600"
                  } bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-error-500 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
