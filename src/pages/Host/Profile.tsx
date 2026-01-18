import { useState } from "react";
import { useForm } from "react-hook-form";
import PageMeta from "../../components/common/PageMeta";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

interface ProfileFormData {
  name: string;
  businessName: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      businessName: user?.businessName || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>();

  const handleUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const response = await authService.updateProfile(data);
      if (response.success) {
        updateUser(response.data);
        toast.success("Profile updated successfully");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
      console.error("Failed to update profile:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (response.success) {
        toast.success("Password changed successfully");
        passwordForm.reset();
      }
    } catch (error) {
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Profile | WhatsApp AI Bot"
        description="Manage your profile"
      />
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Profile Information
          </h2>
          <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  {...profileForm.register("name", { required: "Name is required" })}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-error-500 mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name
                </label>
                <input
                  {...profileForm.register("businessName")}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={user?.whatsappNumber || ""}
                  disabled
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact admin to change phone number</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Account Status */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Account Status
          </h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              user?.status === 'approved' 
                ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
                : user?.status === 'pending'
                ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400'
                : 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400'
            }`}>
              {user?.status?.charAt(0).toUpperCase()}{user?.status?.slice(1)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Account Type: {user?.userType === 'admin' ? 'Administrator' : 'Host'}
            </span>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Change Password
          </h2>
          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register("currentPassword", { required: "Current password is required" })}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-error-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register("newPassword", {
                    required: "New password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-error-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register("confirmPassword", { required: "Please confirm your password" })}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-error-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isChangingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
