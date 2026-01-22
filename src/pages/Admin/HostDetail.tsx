import { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../../services/adminService";
import type { IGuest, GuestsQueryParams, IMessage } from "../../types";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { IUserDetails } from "../../types/users.type.ts";
import { IPagination } from "../../types/common.ts";
import { ChatGuestList } from "../../components/chat/ChatGuestList";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatMessages } from "../../components/chat/ChatMessages";

export default function HostDetailPage() {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const [host, setHost] = useState<IUserDetails | null>(null);
  const [guests, setGuests] = useState<IGuest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<IGuest | null>(null);
  const [conversation, setConversation] = useState<IMessage[]>([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationPagination, setConversationPagination] = useState<IPagination | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [loading, setLoading] = useState({
    host: false,
    guests: false,
    conversation: false,
  });
  const [guestsPage, setGuestsPage] = useState(1);
  const [guestsPagination, setGuestsPagination] = useState<IPagination | null>(null);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMobileView, setShowMobileView] = useState<"guests" | "conversation">("guests");

  const guestListRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottom = useRef(false);
  const previousScrollHeight = useRef<number>(0);

  const loadHost = useCallback(async () => {
    setLoading((l) => ({ ...l, host: true }));
    try {
      const res = await adminService.getUserDetails(hostId!);
      if (res.success) setHost(res.data);
    } catch {
      toast.error("Failed to load host");
    }
    setLoading((l) => ({ ...l, host: false }));
  }, [hostId]);

  const loadGuests = useCallback(
    async (append = false) => {
      setLoading((l) => ({ ...l, guests: true }));
      try {
        const params: GuestsQueryParams = {
          page: guestsPage,
          limit: 100,
          search: guestSearch,
        };
        const res = await adminService.getHostGuests(hostId!, params);
        if (res.success) {
          setGuests((prev) => (append ? [...prev, ...res.data] : res.data));
          setGuestsPagination(res.pagination);
          if (res.data.length > 0 && !selectedGuest && !append) {
            setSelectedGuest(res.data[0]);
            setConversationPage(1);
            shouldScrollToBottom.current = true;
          }
        }
      } catch {
        toast.error("Failed to load guests");
      }
      setLoading((l) => ({ ...l, guests: false }));
    },
    [hostId, guestSearch, guestsPage, selectedGuest]
  );

  const loadConversation = useCallback(
    async (prepend = false) => {
      if (!selectedGuest) return;

      if (prepend) {
        setIsLoadingMore(true);
      } else {
        setLoading((l) => ({ ...l, conversation: true }));
      }

      try {
        const res = await adminService.getHostGuestMessages(selectedGuest.id, {
          page: conversationPage,
          limit: 50,
        });
        if (res.success) {
          const messagesData = Array.isArray(res.data) ? res.data : [res.data];
          const normalized = messagesData;

          if (prepend) {
            setConversation((prev) => [...normalized.reverse(), ...prev]);
          } else {
            setConversation(normalized.reverse());
            shouldScrollToBottom.current = true;
          }
          setConversationPagination(res.pagination);
        }
      } catch {
        toast.error("Failed to load conversation");
      }

      if (prepend) {
        setIsLoadingMore(false);
      } else {
        setLoading((l) => ({ ...l, conversation: false }));
      }
    },
    [selectedGuest, conversationPage]
  );

  useEffect(() => {
    if (hostId) loadHost();
  }, [hostId, loadHost]);

  useEffect(() => {
    if (hostId) loadGuests(guestsPage > 1);
  }, [hostId, guestSearch, guestsPage]);

  useEffect(() => {
    if (hostId && selectedGuest) {
      setConversation([]);
      setConversationPage(1);
      shouldScrollToBottom.current = true;
      loadConversation();
    }
  }, [hostId, selectedGuest]);

  useEffect(() => {
    if (conversationPage > 1 && selectedGuest) {
      loadConversation(true);
    }
  }, [conversationPage]);

  // Auto-scroll to bottom when needed
  useEffect(() => {
    if (shouldScrollToBottom.current && messageListRef.current && conversation.length > 0) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      shouldScrollToBottom.current = false;
    }
  }, [conversation]);



  const handleMessageScroll = () => {
    const el = messageListRef.current;
    if (!el || isLoadingMore || !conversationPagination) return;

    if (el.scrollTop <= 100) {
      if (conversationPagination.current_page < conversationPagination.last_page) {
        previousScrollHeight.current = el.scrollHeight;
        setConversationPage((p) => p + 1);
      }
    }
  };

  // Restore scroll position after prepending messages
  useEffect(() => {
    const el = messageListRef.current;
    if (el && isLoadingMore && previousScrollHeight.current > 0) {
      const newScrollHeight = el.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      el.scrollTop = scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [conversation, isLoadingMore]);

  const handleSelectGuest = (guest: IGuest | any) => {
    if (selectedGuest?.id === guest.id) return;
    setSelectedGuest(guest);
    setConversationPage(1);
    shouldScrollToBottom.current = true;
    setShowMobileView("conversation");
  };

  const handleFeedback = async (
    messageId: string,
    feedback: "positive" | "negative" | "neutral",
    note?: string
  ) => {
    try {
      toast.loading("Submitting feedback...", { id: "feedback-submit" });
      const response = await adminService.addFeedback(hostId!, messageId, feedback, note);
      toast.remove("feedback-submit");

      if (response.success) {
        setConversation((prev) =>
          prev.map((m: any) => (m.id === messageId ? { ...m, feedback, feedbackNote: note || m.feedbackNote } : m))
        );
        toast.success("Feedback submitted");
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      toast.remove("feedback-submit");
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Collapsible Host Info Panel */}
      {host && (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out">
          {/* Minimal Header Bar (always visible) */}
          <div className="px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-1 md:gap-2 bg-gray-100 dark:bg-gray-700 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm md:text-base"
              >
                <span>←</span> <span className="hidden sm:inline">Back</span>
              </button>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{host.name || "Host"}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">{host.businessName}</p>
              </div>
            </div>
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isHeaderExpanded ? "Collapse details" : "Expand details"}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isHeaderExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Expandable Details Section */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isHeaderExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="px-4 md:px-6 pb-3 md:pb-4">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span
                  className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${host.aiAutoReplyEnabled
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700"
                    }`}
                >
                  <span className="hidden sm:inline">
                    {host.aiAutoReplyEnabled ? "🤖 AI Enabled" : "🤖 AI Disabled"}
                  </span>
                  <span className="sm:hidden">{host.aiAutoReplyEnabled ? "🤖 ON" : "🤖 OFF"}</span>
                </span>
                <span
                  className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${host.status === "approved"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700"
                    }`}
                >
                  {host.status?.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* Contact Info */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Contact Information</div>
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">📧</span>
                      <span className="font-medium truncate">{host.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">📱</span>
                      <span className="font-medium">{host.whatsappNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">🆔</span>
                      <span className="font-medium">Host #{host.hostId}</span>
                    </div>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Wallet Balance</div>
                  <div className="text-xl md:text-3xl font-bold mb-1 text-gray-900 dark:text-white">
                    ৳{parseFloat(host.hostWallet?.balance || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">Available Balance</div>
                </div>

                {/* Total Paid */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Total Paid</div>
                  <div className="text-xl md:text-3xl font-bold mb-1 text-green-600 dark:text-green-400">
                    ৳{parseFloat(host.hostWallet?.totalPaid || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">Lifetime Earnings</div>
                </div>

                {/* Commission Rule */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Commission Rule</div>
                  {host.commissionRule ? (
                    <>
                      <div className="text-xl md:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                        {host.commissionRule.type === "percentage"
                          ? `${host.commissionRule.value}%`
                          : `৳${parseFloat(host.commissionRule.value).toFixed(2)}`}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                        {host.commissionRule.name}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${host.commissionRule.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {host.commissionRule.status}
                        </span>
                        {host.commissionRule.maxAmount && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Max: ৳{parseFloat(host.commissionRule.maxAmount).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">No rule assigned</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Guest List */}
        <div
          className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 ${showMobileView === "guests" ? "block" : "hidden md:block"
            }`}
        >
          <ChatGuestList
            guests={guests}
            selectedGuestId={selectedGuest?.id}
            search={guestSearch}
            onSearchChange={(value) => {
              setGuestSearch(value);
              setGuestsPage(1);
            }}
            onSearchSubmit={() => {
              setGuestsPage(1);
              loadGuests();
            }}
            onSelectGuest={handleSelectGuest}
            loading={loading.guests}
            pagination={guestsPagination}
            onLoadMore={() => {
              if (guestsPagination && guestsPagination.current_page < guestsPagination.last_page) {
                setGuestsPage((p) => p + 1);
              }
            }}
            listRef={guestListRef as React.RefObject<HTMLDivElement>}
            header={<h2 className="text-xl font-semibold">Guests</h2>}
          />
        </div>

        {/* Right: Conversation */}
        <div
          className={`flex-1 flex flex-col bg-[#efeae2] dark:bg-gray-900 ${showMobileView === "conversation" ? "block" : "hidden md:flex"
            }`}
        >
          <ChatHeader
            guest={selectedGuest}
            onBack={() => setShowMobileView("guests")}
          />

          <ChatMessages
            messages={conversation}
            onFeedback={handleFeedback}
            isLoading={loading.conversation}
            isLoadingMore={isLoadingMore}
            onScroll={handleMessageScroll}
            listRef={messageListRef as React.RefObject<HTMLDivElement>}
          />
        </div>
      </div>
    </div>
  );
}
