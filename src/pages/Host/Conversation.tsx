import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { hostService } from "../../services/hostService";
import toast from "react-hot-toast";
import { IGuest, IMessage } from "../../types";
import { ChatGuestList } from "../../components/chat/ChatGuestList";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { Modal } from "../../components/ui/modal";
import { IPagination } from "../../types/common";
import SwitchToggle from '../../components/common/SwitchToggle';

export default function Conversation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const guestIdFromQuery = searchParams.get("guestId");

  const [guests, setGuests] = useState<IGuest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<IGuest | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [guestSearch, setGuestSearch] = useState("");
  const [loading, setLoading] = useState({
    guests: false,
    conversation: false,
  });
  const [guestsPage, setGuestsPage] = useState(1);
  const [guestsPagination, setGuestsPagination] = useState<IPagination | null>(null);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationPagination, setConversationPagination] = useState<IPagination | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMobileView, setShowMobileView] = useState<"guests" | "conversation">("guests");
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ phoneNumber: "", name: "", reason: "" });

  const guestListRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottom = useRef(false);
  const previousScrollHeight = useRef<number>(0);

  const loadingGuestsRef = useRef(false);

  const loadGuests = useCallback(
    async (append = false) => {
      // Prevent loading if already loading guests using Ref for immediate check
      if (loadingGuestsRef.current) return;

      loadingGuestsRef.current = true;
      setLoading((l) => ({ ...l, guests: true }));
      try {
        const params: { page: number; limit: number; search?: string; id?: string } = {
          page: guestsPage,
          limit: 100,
        };

        if (guestSearch) {
          params.search = guestSearch;
        } else if (!append && guestIdFromQuery && guestsPage === 1) {
          // Only filter by ID on initial load/first page if provided and no search
          params.id = guestIdFromQuery;
        }

        const response = await hostService.getGuests(params);

        if (response.success) {
          const guestsData = (response.data as any).guests || response.data;

          setGuests((prev) => {
            // If appending, combine. If reloading (page 1), replace.
            if (append) return [...prev, ...guestsData];
            return guestsData;
          });

          setGuestsPagination(response.pagination);

          // Auto-select logic
          if (!append && guestsData.length > 0) {
            // If we filtered by ID, select that guest
            if (params.id) {
              const match = guestsData.find((g: IGuest) => g.id === params.id);
              if (match) setSelectedGuest(match);
            } else if (!selectedGuest) {
              // Otherwise select first if none selected
              setSelectedGuest(guestsData[0]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load guests:", error);
        toast.error("Failed to load guests");
      }
      loadingGuestsRef.current = false;
      setLoading((l) => ({ ...l, guests: false }));
    },
    [guestSearch, guestsPage, guestIdFromQuery]
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
        const guestId = selectedGuest.id;
        const response = await hostService.getConversation(guestId, {
          page: conversationPage,
          limit: 50,
        });

        if (response.success) {
          const messagesData = Array.isArray(response.data) ? response.data : [response.data];
          const normalized = messagesData;

          if (prepend) {
            setMessages((prev) => [...normalized.reverse(), ...prev]);
          } else {
            setMessages(normalized.reverse());
            shouldScrollToBottom.current = true;
          }
          setConversationPagination(response.pagination);
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
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

  // Load guests list
  useEffect(() => {
    // If guestIdFromQuery exists, we might want to load differently or just load once
    // But `loadGuests` handles the param logic.
    // We should reset to page 1 if query param changes or search changes
    loadGuests(guestsPage > 1);
  }, [guestSearch, guestsPage, loadGuests]); // removed guestIdFromQuery to avoid loop, handled in initial mount via page reset if needed? 
  // Actually guestIdFromQuery is stable usually.

  // Initial setup for guestIdFromQuery
  useEffect(() => {
    if (guestIdFromQuery) {
      // Ensure we are at page 1 to trigger the ID filter logic in loadGuests
      setGuestsPage(1);
    }
  }, [guestIdFromQuery]);


  useEffect(() => {
    if (selectedGuest) {
      setMessages([]);
      setConversationPage(1);
      shouldScrollToBottom.current = true;
      loadConversation();
    }
  }, [selectedGuest]);

  useEffect(() => {
    if (conversationPage > 1 && selectedGuest) {
      loadConversation(true);
    }
  }, [conversationPage]);

  // Auto-scroll to bottom when needed
  useEffect(() => {
    if (shouldScrollToBottom.current && messageListRef.current && messages.length > 0) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      shouldScrollToBottom.current = false;
    }
  }, [messages]);

  const handleMessageScroll = () => {
    const el = messageListRef.current;
    if (!el || isLoadingMore || !conversationPagination) return;

    if (el.scrollTop <= 100) {
      if (conversationPagination.current_page < conversationPagination.last_page) {
        const prevHeight = el.scrollHeight;
        setConversationPage((p) => p + 1);
        previousScrollHeight.current = prevHeight;
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
  }, [messages, isLoadingMore]);

  const handleSelectGuest = (guest: IGuest | any) => {
    if (selectedGuest && selectedGuest.id === guest.id) {
      return;
    }
    setSelectedGuest(guest);
    setConversationPage(1);
    shouldScrollToBottom.current = true;
    setShowMobileView("conversation");
    // DO NOT update URL with guestId query param as requested
    // setSearchParams({ guestId: guest.id }); 
  };

  const handleSeeAllGuests = () => {
    // Clear query params to see all
    setSearchParams({});
    setGuestSearch("");
    setGuestsPage(1);
    // After clearing params, loadGuests will be called by useEffect or we can force it
    // The useEffect on searchParams/guestIdFromQuery change (if we added it) would trigger, 
    // but simplified:
    // loadGuests() is dependent on guestsPage. 
    // We rely on the state update to trigger re-load or manually call if needed?
    // We need to ensure next loadGuests call DOES NOT have the ID.
    // Setting searchParams({}) removes `guestIdFromQuery`.
    // But `guestIdFromQuery` const is from the hook, so it will update on next render.
  };

  const handleToggleGuestAI = async () => {
    if (!selectedGuest) return;
    try {
      const guestId = selectedGuest.id;
      const response = await hostService.toggleGuestAI(guestId, !selectedGuest.aiAutoReplyEnabled);
      if (response.success) {
        setSelectedGuest({ ...selectedGuest, aiAutoReplyEnabled: !selectedGuest.aiAutoReplyEnabled });
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, aiAutoReplyEnabled: !g.aiAutoReplyEnabled } : g))
        );
        toast.success(`AI auto-reply ${!selectedGuest.aiAutoReplyEnabled ? "enabled" : "disabled"}`);
      }
    } catch (error) {
      console.error("Failed to toggle AI:", error);
      toast.error("Failed to toggle AI");
    }
  };

  const handleOpenBlockModal = () => {
    if (selectedGuest) {
      setBlockForm({
        phoneNumber: selectedGuest.whatsappNumber || "",
        name: selectedGuest.name || selectedGuest.notifyName || "",
        reason: "",
      });
    }
    setIsBlockModalOpen(true);
  };

  const handleBlockRequest = async () => {
    if (!blockForm.phoneNumber) {
      toast.error("Phone number is required");
      return;
    }
    try {
      const response = await hostService.requestBlock(blockForm);
      if (response.success) {
        toast.success("Block request submitted. Waiting for admin approval.");
        setIsBlockModalOpen(false);
        setBlockForm({ phoneNumber: "", name: "", reason: "" });
      }
    } catch (error) {
      console.error("Failed to submit block request:", error);
      toast.error("Failed to submit block request");
    }
  };

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative" | "neutral", note?: string) => {
    try {
      toast.loading("Submitting feedback...", { id: "feedback-submit" });
      const response = await hostService.addFeedback(messageId, feedback, note);
      toast.remove("feedback-submit");

      if (response.success) {
        setMessages((prev) =>
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
    <>
      <PageMeta title="Conversation | WhatsApp AI Bot" description="View conversation with guest" />

      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Guest List */}
          <div
            className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col ${showMobileView === "guests" ? "block" : "hidden md:flex"
              }`}
          >
            <ChatGuestList
              guests={guests}
              selectedGuestId={selectedGuest?.id}
              search={guestSearch}
              onSearchChange={setGuestSearch}
              onSearchSubmit={() => {
                setGuestsPage(1);
                loadGuests();
              }}
              onSelectGuest={handleSelectGuest}
              loading={loading.guests}
              pagination={guestsPagination}
              onLoadMore={() => {
                if (
                  !loadingGuestsRef.current &&
                  guestsPagination &&
                  guestsPagination.current_page < guestsPagination.last_page
                ) {
                  setGuestsPage((p) => p + 1);
                }
              }}
              listRef={guestListRef as React.RefObject<HTMLDivElement>}
              header={
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Guests</h2>
                    {guestIdFromQuery && (
                      <button
                        onClick={handleSeeAllGuests}
                        className="text-sm text-brand-500 hover:text-brand-600 font-medium whitespace-nowrap"
                      >
                        See all
                      </button>
                    )}
                  </div>
                </div>
              }
            />
          </div>

          {/* Right: Conversation */}
          <div
            className={`flex-1 flex flex-col bg-[#efeae2] dark:bg-gray-900 ${showMobileView === "conversation" ? "block" : "hidden md:flex"
              }`}
          >
            {selectedGuest ? (
              <>
                <ChatHeader
                  guest={selectedGuest}
                  onBack={() => setShowMobileView("guests")}
                  actions={
                    <div className="flex items-center gap-2">
                      <SwitchToggle
                        checked={selectedGuest.aiAutoReplyEnabled}
                        onChange={handleToggleGuestAI}
                        className="h-7 w-12"
                      />
                      <button
                        onClick={handleOpenBlockModal}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        title="Request block"
                      >
                        🚫 Block Request
                      </button>
                    </div>
                  }
                />

                <ChatMessages
                  messages={messages}
                  onFeedback={handleFeedback}
                  isLoading={loading.conversation}
                  isLoadingMore={isLoadingMore}
                  onScroll={handleMessageScroll}
                  listRef={messageListRef as React.RefObject<HTMLDivElement>}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                  Select a Conversation
                </h3>
                <p className="max-w-md">
                  Choose a guest from the list to start chatting or view their message history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Request Modal */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} className="max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Request Block</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={blockForm.phoneNumber}
              onChange={(e) => setBlockForm({ ...blockForm, phoneNumber: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
              placeholder="01712345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (Optional)</label>
            <input
              type="text"
              value={blockForm.name}
              onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
              placeholder="Contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (Optional)</label>
            <textarea
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
              rows={3}
              placeholder="Why should this number be blocked?"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsBlockModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleBlockRequest}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
