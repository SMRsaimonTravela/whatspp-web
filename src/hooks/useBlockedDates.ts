import { useQuery } from "@tanstack/react-query";
import { travelaApiService } from "../services/travelaApiService";
import { BlockedDate } from "../types/BlockedDate";
import { TravelaRestriction, TravelaRestrictionResponse } from "../types/travela.type";

function processBlockedDates(dates: BlockedDate[]): {
  blockedDates: BlockedDate[];
  checkoutOnlyDates: string[];
} {
  if (!dates.length) return { blockedDates: [], checkoutOnlyDates: [] };

  // Remove duplicates (keep last occurrence)
  const uniqueDates = Array.from(
      new Map(dates.map((d) => [d.date, d])).values()
  );

  // Sort ascending
  const sorted = [...uniqueDates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const blocked: BlockedDate[] = [];
  const checkoutOnly: string[] = [];

  let range: BlockedDate[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];

    const isConsecutive =
        prev &&
        new Date(current.date).getTime() - new Date(prev.date).getTime() ===
        24 * 60 * 60 * 1000;

    if (i === 0 || isConsecutive) {
      range.push(current);
    } else {
      processRange(range);
      range = [current];
    }
  }

  // process last range
  processRange(range);

  function processRange(range: BlockedDate[]) {
    if (range.length === 1) {
      // single date → both blocked and checkout
      checkoutOnly.push(range[0].date);
      blocked.push(range[0]);
      return;
    }

    // first → checkout only
    checkoutOnly.push(range[0].date);

    // all remaining → blocked
    blocked.push(...range.slice(1));
  }

  return { blockedDates: blocked, checkoutOnlyDates: checkoutOnly };
}


export function useBlockedDates(listingId: number | string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<TravelaRestrictionResponse, Error>({
    queryKey: ["travela-restrictions", listingId],
    queryFn: () =>
      listingId
        ? travelaApiService.getRestrictions(listingId)
        : Promise.resolve({ success: true, message: "", data: [] } as TravelaRestrictionResponse),
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });

  // Convert TravelaRestriction[] to BlockedDate[]
  const dates: BlockedDate[] = (data?.data || []).map((d: TravelaRestriction) => ({
    date: d.date,
    id: d.id,
    count: d.count,
  }));
  const processed = processBlockedDates(dates);

  return {
    blockedDates: processed.blockedDates,
    checkoutOnlyDates: processed.checkoutOnlyDates,
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}
