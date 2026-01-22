import type { IGuest } from "../../types";

interface ChatHeaderProps {
  guest: IGuest | null;
  onBack?: () => void;
  actions?: React.ReactNode;
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

export function ChatHeader({ guest, onBack, actions }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-[#f0f2f5] dark:bg-gray-800 shadow-sm">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 -ml-2"
              aria-label="Back to guest list"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
            style={{
              backgroundColor: guest
                ? getAvatarColor(
                    guest.name || guest.notifyName || guest.originalNumber || "U"
                  )
                : "#9ca3af",
            }}
          >
            {guest
              ? (
                  guest.name?.[0] ||
                  guest.notifyName?.[0] ||
                  guest.originalNumber?.[0] ||
                  "U"
                ).toUpperCase()
              : "?"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {guest ? guest.name || guest.notifyName || "Unknown" : "Select a guest"}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {guest?.originalNumber || guest?.whatsappNumber}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default ChatHeader;

