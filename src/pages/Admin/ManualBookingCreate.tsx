import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageMeta from "../../components/common/PageMeta";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";
import { DateRangePicker } from "../../components/common/DateRangePicker";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Loader } from "lucide-react";

const manualBookingSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  listing_id: z.string().min(1, "Listing ID is required"),
  guests: z.string().min(1, "At least 1 guest is required"),
  guest_id: z.string().optional(),
});

type ManualBookingFormData = z.infer<typeof manualBookingSchema>;

export default function ManualBookingCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [paymentLink, setPaymentLink] = useState<string>("");
  const [lastPaymentLink, setLastPaymentLink] = useState<boolean>(false);

  // Load last payment link from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("lastBookingPaymentLink");
    if (stored) {
        setPaymentLink(stored);
        setLastPaymentLink(true)
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ManualBookingFormData>({
    resolver: zodResolver(manualBookingSchema),
  });

  const onSubmit = async (data: ManualBookingFormData) => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    setIsLoading(true);
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      // Fix the checkout date issue by adding one day
      const toDate = format(new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000), "yyyy-MM-dd");

      const transformedData = {
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        listing_id: Number(data.listing_id),
        guests: Number(data.guests),
        guest_id: data.guest_id ? Number(data.guest_id) : null,
      };

      const response = await adminService.createManualBooking({
        ...transformedData,
        quantity: 1,
        birthdate: null,
        from: fromDate,
        to: toDate,
      });

      if (response.success) {
        toast.success(response.message);
        const newLink = response.data.paymentLink;
        setPaymentLink(newLink);
        localStorage.setItem("lastBookingPaymentLink", newLink);
        reset();
        setDateRange(undefined);
      }
    } catch (error) {
      console.error("Failed to create manual booking:", error);
      toast.error("Failed to create manual booking");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
    } catch{
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <PageMeta
        title="Manual Booking Create | Travela Admin"
        description="Create a manual booking"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm max-w-2xl">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Manual Booking Create
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create a new booking manually
          </p>

          {paymentLink && (
            <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
                  <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                    { lastPaymentLink ?<p className="font-medium text-success-700 dark:text-success-400">Last Created Booking link</p> : <p className="font-medium text-success-700 dark:text-success-400">Booking Created Successfully!</p>
                    }
                  <p className="text-sm text-success-600 dark:text-success-500 mb-2">
                    Payment Link:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={paymentLink}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(paymentLink)}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="phone" className="mb-2">Phone Number <span className="text-red-500">*</span></Label>
                <input
                  id="phone"
                  type="text"
                  {...register("phone")}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <Label htmlFor="first_name" className="mb-2">First Name <span className="text-red-500">*</span></Label>
                <input
                  id="first_name"
                  type="text"
                  {...register("first_name")}
                  placeholder="Enter first name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
              </div>

              <div>
                <Label htmlFor="last_name" className="mb-2">Last Name <span className="text-red-500">*</span></Label>
                <input
                  id="last_name"
                  type="text"
                  {...register("last_name")}
                  placeholder="Enter last name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
              </div>

              <div>
                <Label htmlFor="listing_id" className="mb-2">Listing ID <span className="text-red-500">*</span></Label>
                <input
                  id="listing_id"
                  type="text"
                  {...register("listing_id")}
                  placeholder="Enter listing ID"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                {errors.listing_id && <p className="text-red-500 text-sm mt-1">{errors.listing_id.message}</p>}
              </div>

              <div>
                <Label htmlFor="guests" className="mb-2">Number of Guests <span className="text-red-500">*</span></Label>
                <input
                  id="guests"
                  type="text"
                  {...register("guests")}
                  placeholder="Enter number of guests"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                {errors.guests && <p className="text-red-500 text-sm mt-1">{errors.guests.message}</p>}
              </div>

              <div>
                <Label htmlFor="guest_id" className="mb-2">Guest ID</Label>
                <input
                  id="guest_id"
                  type="text"
                  {...register("guest_id")}
                  placeholder="Enter guest ID (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                {errors.guest_id && <p className="text-red-500 text-sm mt-1">{errors.guest_id.message}</p>}
              </div>
            </div>

            <div>
              <Label className="mb-2">Select check-in and check-out dates<span className="text-red-500">*</span></Label>
              <DateRangePicker
                onSelect={(range) => setDateRange(range)}
                value={dateRange}
                className="w-full"
                label=''
              />
              {(!dateRange?.from || !dateRange?.to) && (
                <p className="mt-1 text-sm text-red-600">Check-in and check-out dates are required</p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setDateRange(undefined);
                }}
                className="px-6 py-2.5"
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="default"
                className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Booking"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
