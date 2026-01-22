import { useEffect, useRef } from "react";
import type { IGuest } from "../../types";

type GuestListItem = Pick<
  IGuest,
  | "id"
  | "name"
  | "notifyName"
  | "originalNumber"
  | "whatsappNumber"
  | "totalMessages"
  | "aiAutoReplyEnabled"
  | "lastMessageAt"
> & {
  _id?: string;
};

type PaginationLike = {
  current_page?: number;
  last_page?: number;
  totalPages?: number;
};

interface ChatGuestListProps {
  guests: (GuestListItem | IGuest)[];
  selectedGuestId?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSelectGuest: (guest: GuestListItem | IGuest) => void;
  loading?: boolean;
  pagination?: PaginationLike | null;
  onLoadMore?: () => void;
  listRef?: React.RefObject<HTMLDivElement>;
  header?: React.ReactNode;
  showMobile?: boolean;
  onBackToGuests?: () => void;
}

function getAvatarColor(str: string) {
  const colors = [
    "#25D366",
    "#34B7F1",
    "#A259D9",
    "#FDCB58",
    "#FF8A65",
    "#4CAF50",
    "#039BE5",
    "#F4B400",
    "#FF7043",
    "#8D6E63",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
}

export function ChatGuestList({
  guests,
  selectedGuestId,
  search,
  onSearchChange,
  onSearchSubmit,
  onSelectGuest,
  loading = false,
  pagination,
  onLoadMore,
  listRef,
  header,
}: ChatGuestListProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = listRef || internalRef;

  useEffect(() => {
    if (!scrollRef.current || !onLoadMore || !pagination) return;
    const el = scrollRef.current;
    const handler = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 10 &&
        pagination.current_page &&
        pagination.last_page &&
        pagination.current_page < pagination.last_page
      ) {
        onLoadMore();
      }
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [scrollRef, onLoadMore, pagination]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="w-full h-full border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
        {header}
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            placeholder="Search guests..."
            className="flex-1 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          />
          <button
            onClick={onSearchSubmit}
            className="px-3 h-10 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600"
          >
            Search
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#9ca3af transparent",
        }}
      >
        {loading && guests.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">Loading...</div>
        ) : guests.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">No guests found</div>
        ) : (
          guests.map((g) => {
            const id = g.id;
            return (
              <div
                key={id}
                onClick={() => onSelectGuest(g)}
                className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedGuestId === id
                    ? "bg-gray-100 dark:bg-gray-700"
                    : "bg-white dark:bg-gray-800"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: getAvatarColor(
                        g.name || g.notifyName || g.originalNumber || "U"
                      ),
                    }}
                  >
                    {(g.name?.[0] ||
                      g.notifyName?.[0] ||
                      g.originalNumber?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-gray-900 dark:text-white">
                      {g.name || g.notifyName || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {g.originalNumber || g.whatsappNumber}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${g.aiAutoReplyEnabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                          }`}
                      >
                        AI {g.aiAutoReplyEnabled ? "Enabled" : "Disabled"}
                      </span>
                      {g.lastMessageAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Last: {formatDate(g.lastMessageAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {typeof g.totalMessages !== "undefined" && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {g.totalMessages}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {loading && guests.length > 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatGuestList;

