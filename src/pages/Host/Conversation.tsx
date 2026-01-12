import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { hostService } from "../../services/hostService";
import type { Message, Guest } from "../../types";
import toast from "react-hot-toast";

export default function Conversation() {
  const { guestId } = useParams<{ guestId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackTooltip, setShowFeedbackTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [pendingFeedbackId, setPendingFeedbackId] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  useEffect(() => {
    if (guestId) {
      loadConversation();
    }
  }, [guestId, page]);

  const loadConversation = async (prepend = false) => {
    if (!guestId) return;

    if (prepend) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await hostService.getConversation(guestId, {
        page,
        limit: 100
      });

      if (response.success) {
        const normalized = response.data.messages.map((m: any) => ({
          ...m,
          _id: m._id || m.id
        }));

        if (prepend) {
          // Prepend older messages
          setMessages(prev => [...normalized, ...prev]);
        } else {
          setMessages(normalized);
        }

        setGuest(response.data.guest);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll handler - load older messages when scrolling to top
  const handleMessageScroll = () => {
    const el = messageListRef.current;
    if (!el || isLoadingMore || !pagination) return;

    // Check if scrolled near the top
    if (el.scrollTop <= 50) {
      if (pagination.page < pagination.totalPages) {
        // Store current scroll height before loading
        previousScrollHeight.current = el.scrollHeight;
        setPage(p => p + 1);
      }
    }
  };

  // Restore scroll position after prepending messages
  useEffect(() => {
    const el = messageListRef.current;
    if (el && isLoadingMore && previousScrollHeight.current > 0) {
      // Maintain scroll position by calculating the difference
      const newScrollHeight = el.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      el.scrollTop = scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [messages, isLoadingMore]);

  const handleFeedback = async (
      messageId: string,
      feedback: "positive" | "negative" | "neutral"
  ) => {
    const message = messages.find(m => (m as any)._id === messageId);
    if (!message) return;

    if (feedback === "negative") {
      openFeedbackTooltip(messageId, message.feedbackNote || "");
      return;
    }

    if (message.feedback === feedback) {
      return;
    }

    try {
      console.log('Submitting feedback', { messageId, feedback });
      toast.loading('Submitting feedback...', { id: 'feedback-submit' });
      const response = await hostService.addFeedback(messageId, feedback);
      toast.remove('feedback-submit');
      console.log('Feedback response', response);
      if (response.success) {
        // Update local state instead of refetching
        setMessages(prev => prev.map(m =>
            (m as any)._id === messageId
                ? { ...m, feedback }
                : m
        ));
        toast.success("Feedback submitted");
      } else {
        toast.error(response?.message || 'Failed to submit feedback');
      }
    } catch (error) {
      toast.remove('feedback-submit');
      console.error("Failed to submit feedback:", error);
      toast.error('Failed to submit feedback');
    }
  };

  const handleSubmitNegativeFeedback = async () => {
    if (!pendingFeedbackId) return;
    setIsSubmittingFeedback(true);

    try {
      toast.loading('Submitting feedback...', { id: 'feedback-submit' });
      const response = await hostService.addFeedback(
          pendingFeedbackId,
          "negative",
          feedbackNote.trim() || undefined
      );
      toast.remove('feedback-submit');

      if (response.success) {
        // Update local state
        setMessages(prev => prev.map(m =>
            (m as any)._id === pendingFeedbackId
                ? { ...m, feedback: 'negative', feedbackNote: feedbackNote.trim() }
                : m
        ));
        toast.success("Feedback submitted");
      }

      setShowFeedbackTooltip(false);
      setFeedbackNote("");
      setPendingFeedbackId(null);
    } catch (error) {
      toast.remove('feedback-submit');
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const openFeedbackTooltip = (messageId: string, note?: string) => {
    const button = document.getElementById(`feedback-negative-${messageId}`);
    if (!button) {
      setPendingFeedbackId(messageId);
      setFeedbackNote(note || "");
      setTooltipPosition({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 150 });
      setShowFeedbackTooltip(true);
      return;
    }

    try {
      const scrollable = messageListRef.current;
      if (scrollable) {
        const btnRect = button.getBoundingClientRect();
        const scrollRect = scrollable.getBoundingClientRect();
        const offset = btnRect.top - (scrollRect.top + scrollRect.height / 2) + scrollable.scrollTop;
        scrollable.scrollTo({ top: offset, behavior: 'smooth' });
      } else {
        button.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } catch (err) {
      console.warn('Tooltip scroll failed', err);
    }

    setTimeout(() => {
      const rect = button.getBoundingClientRect();
      const tooltipWidth = 300;
      const tooltipHeight = 200;

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top: number;

      if (spaceAbove > tooltipHeight + 20) {
        top = rect.top + window.scrollY - tooltipHeight - 12;
      } else if (spaceBelow > tooltipHeight + 20) {
        top = rect.bottom + window.scrollY + 12;
      } else {
        top = Math.max(10, (window.innerHeight - tooltipHeight) / 2 + window.scrollY);
      }

      let left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
      const minLeft = 8 + window.scrollX;
      const maxLeft = window.scrollX + window.innerWidth - tooltipWidth - 8;
      left = Math.min(Math.max(left, minLeft), maxLeft);

      setPendingFeedbackId(messageId);
      setFeedbackNote(note || "");
      setTooltipPosition({ top, left });
      setShowFeedbackTooltip(true);
    }, 120);
  };

  useEffect(() => {
    if (!showFeedbackTooltip) return;

    const onDocClick = (e: MouseEvent) => {
      const el = tooltipRef.current;
      if (!el) return;
      if (!(e.target instanceof Node)) return;
      if (!el.contains(e.target as Node)) {
        setShowFeedbackTooltip(false);
        setPendingFeedbackId(null);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFeedbackTooltip(false);
        setPendingFeedbackId(null);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showFeedbackTooltip]);

  function getAvatarColor(str: string) {
    const colors = [
      '#25D366', '#34B7F1', '#A259D9', '#FDCB58', '#FF8A65',
      '#4CAF50', '#039BE5', '#F4B400', '#FF7043', '#8D6E63',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }

  if (isLoading && page === 1) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
        </div>
    );
  }

  return (
      <>
        <PageMeta
            title="Conversation | WhatsApp AI Bot"
            description="View conversation with guest"
        />

        <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <Link
                to="/host/messages"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-3"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Messages
            </Link>

            {guest && (
                <div className="flex items-center gap-3">
                  <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ backgroundColor: getAvatarColor(guest.name || guest.notifyName || guest.whatsappNumber || 'G') }}
                  >
                    {(guest.name || guest.notifyName || "G")[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {guest.name || guest.notifyName || "Unknown Guest"}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {guest.whatsappNumber}
                      {guest.originalNumber && ` (${guest.originalNumber})`}
                    </p>
                  </div>
                </div>
            )}
          </div>

          {/* Messages Container */}
          <div
              ref={messageListRef}
              onScroll={handleMessageScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9ca3af transparent',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\' fill-opacity=\'.05\'/%3E%3C/svg%3E")',
                backgroundColor: '#efeae2'
              }}
          >
            {/* Loading indicator for pagination */}
            {isLoadingMore && (
                <div className="text-center py-3">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-500"></div>
                </div>
            )}

            {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No messages in this conversation</p>
                </div>
            ) : (
                messages.map((message) => (
                    <div key={message._id} className="space-y-2">
                      {/* Guest Message (left) */}
                      <div className="flex justify-start">
                        <div className="max-w-[75%] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                          <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                            {message.prompt}
                          </div>
                          {message.messageType === 'audio' && message.audioTranscription && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                🎵 Transcription: {message.audioTranscription}
                              </p>
                          )}
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 text-right">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* AI Reply (right) */}
                      {message.reply && (
                          <div className="flex justify-end">
                            <div className="max-w-[75%]">
                              <div className="bg-[#dcf8c6] dark:bg-[#056162] p-3 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                                  {message.reply}
                                </div>
                                <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 text-right">
                                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>

                              {/* Feedback Section */}
                              <div className="mt-2 flex items-center justify-end gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Rate response:</span>
                                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                                  <button
                                      onClick={() => handleFeedback(message._id, "positive")}
                                      className={`p-1.5 rounded transition-all ${
                                          message.feedback === "positive"
                                              ? "bg-green-100 dark:bg-green-900/30 scale-110"
                                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                      }`}
                                      title="Good response"
                                  >
                                    <span className={message.feedback === "positive" ? "text-base" : "text-sm"}>👍</span>
                                  </button>
                                  <button
                                      id={`feedback-negative-${message._id}`}
                                      onClick={() => handleFeedback(message._id, "negative")}
                                      className={`p-1.5 rounded transition-all ${
                                          message.feedback === "negative"
                                              ? "bg-red-100 dark:bg-red-900/30 scale-110"
                                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                      }`}
                                      title="Bad response"
                                  >
                                    <span className={message.feedback === "negative" ? "text-base" : "text-sm"}>👎</span>
                                  </button>
                                  <button
                                      onClick={() => handleFeedback(message._id, "neutral")}
                                      className={`p-1.5 rounded transition-all ${
                                          message.feedback === "neutral"
                                              ? "bg-gray-200 dark:bg-gray-600 scale-110"
                                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                      }`}
                                      title="Neutral"
                                  >
                                    <span className={message.feedback === "neutral" ? "text-base" : "text-sm"}>😐</span>
                                  </button>
                                </div>
                              </div>

                              {/* Feedback Note Display */}
                              {message.feedbackNote && (
                                  <div className="mt-1 px-3 py-1.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500 dark:text-gray-400">📝</span>
                                      <span className="italic">"{message.feedbackNote}"</span>
                                    </div>
                                  </div>
                              )}
                            </div>
                          </div>
                      )}
                    </div>
                ))
            )}

            {/* Pagination info */}
            {pagination && pagination.totalPages > 1 && (
                <div className="text-center py-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
                </div>
            )}
          </div>

          {/* Feedback Tooltip */}
          {showFeedbackTooltip && (
              <div
                  ref={tooltipRef}
                  className="fixed z-50 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  style={{
                    top: `${tooltipPosition.top}px`,
                    left: `${tooltipPosition.left}px`,
                    width: 300
                  }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Negative feedback dialog"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Negative Feedback
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Tell us why the AI response wasn't helpful (optional)
                      </p>
                    </div>
                    <button
                        aria-label="Close feedback"
                        onClick={() => {
                          setShowFeedbackTooltip(false);
                          setPendingFeedbackId(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  <textarea
                      className="w-full min-h-[100px] rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={feedbackNote}
                      onChange={e => setFeedbackNote(e.target.value)}
                      placeholder="What went wrong? (optional)"
                      autoFocus
                      disabled={isSubmittingFeedback}
                      maxLength={500}
                  />

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-500">{feedbackNote.length}/500</div>
                    <div className="flex items-center gap-2">
                      <button
                          className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => {
                            setShowFeedbackTooltip(false);
                            setFeedbackNote('');
                            setPendingFeedbackId(null);
                          }}
                          disabled={isSubmittingFeedback}
                      >
                        Cancel
                      </button>
                      <button
                          className={`px-3 py-1.5 rounded bg-red-600 text-white text-sm flex items-center gap-2 hover:bg-red-700 transition-colors ${
                              isSubmittingFeedback ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          onClick={handleSubmitNegativeFeedback}
                          disabled={isSubmittingFeedback}
                      >
                        {isSubmittingFeedback && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </>
  );
}