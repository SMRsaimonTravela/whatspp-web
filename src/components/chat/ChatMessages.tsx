import { useEffect, useRef, useState } from "react";
import type { IMessage } from "../../types";

type FeedbackType = "positive" | "negative" | "neutral";

interface ChatMessagesProps {
  messages: IMessage[];
  onFeedback?: (messageId: string, feedback: FeedbackType, note?: string) => Promise<void> | void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onScroll?: () => void;
  listRef?: React.RefObject<HTMLDivElement>;
}

export function ChatMessages({
  messages,
  onFeedback,
  isLoading = false,
  isLoadingMore = false,
  onScroll,
  listRef,
}: ChatMessagesProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = listRef || internalRef;

  const [showFeedbackTooltip, setShowFeedbackTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [pendingFeedbackId, setPendingFeedbackId] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const tooltipRef = useRef<HTMLDivElement>(null);

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
      if (e.key === "Escape") {
        setShowFeedbackTooltip(false);
        setPendingFeedbackId(null);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showFeedbackTooltip]);

  const openFeedbackTooltip = (messageId: string, note?: string) => {
    const button = document.getElementById(`feedback-negative-${messageId}`);
    setPendingFeedbackId(messageId);
    setFeedbackNote(note || "");

    if (!button) {
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
      });
      setShowFeedbackTooltip(true);
      return;
    }

    setTimeout(() => {
      const rect = button.getBoundingClientRect();
      const tooltipWidth = 300;
      const tooltipHeight = 250; // Increased estimate to be safe

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top: number;

      // Prioritize bottom placement, switch to top if not enough space below
      if (spaceBelow > tooltipHeight + 20) {
        // Show below
        top = rect.bottom + 12;
      } else if (spaceAbove > tooltipHeight + 20) {
        // Show above (e.g. last message)
        top = rect.top - tooltipHeight - 12;
      } else {
        // Center if tight
        top = Math.max(10, (window.innerHeight - tooltipHeight) / 2);
      }

      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      const minLeft = 8;
      const maxLeft = window.innerWidth - tooltipWidth - 8;
      left = Math.min(Math.max(left, minLeft), maxLeft);

      setTooltipPosition({ top, left });
      setShowFeedbackTooltip(true);
    }, 50);
  };

  const handleFeedback = async (messageId: string, feedback: FeedbackType) => {
    if (!onFeedback) return;
    const message = messages.find((m: any) => m.id === messageId);
    if (!message) return;

    if (feedback === "negative") {
      openFeedbackTooltip(messageId, (message as any).feedbackNote || "");
      return;
    }

    if ((message as any).feedback === feedback) {
      return;
    }

    await onFeedback(messageId, feedback);
  };

  const submitNegativeFeedback = async () => {
    if (!pendingFeedbackId || !onFeedback) return;
    await onFeedback(pendingFeedbackId, "negative", feedbackNote.trim() || undefined);
    setShowFeedbackTooltip(false);
    setFeedbackNote("");
    setPendingFeedbackId(null);
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3 relative"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#9ca3af transparent",
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.50), rgba(0, 0, 0, 0.15)), url(/whatsappchatbg.png)',
        backgroundSize: "auto",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {isLoadingMore && (
        <div className="text-center py-2">
          <div className="inline-block px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm">
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading more messages...</span>
          </div>
        </div>
      )}

      {isLoading && messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No conversation found</div>
      ) : (
        <>
          {messages.map((m: any) => {
            const id = m.id;
            return (
              <div key={id} className="space-y-2">
                <div className="flex justify-start">
                  <div className="max-w-[75%] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                      {m.prompt}
                    </div>
                    {m.messageType === "audio" && m.audioTranscription && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                        🎵 Transcription: {m.audioTranscription}
                      </p>
                    )}
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 text-right">
                      {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>

                {m.reply && (
                  <div className="flex justify-end">
                    <div className="max-w-[75%]">
                      <div className="bg-[#dcf8c6] dark:bg-[#056162] p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                          {m.reply}
                        </div>
                        <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 text-right">
                          {formatTime(m.createdAt)}
                        </div>
                      </div>

                      {onFeedback && (
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Rate response:</span>
                          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                            <button
                              onClick={() => handleFeedback(id, "positive")}
                              className={`p-1.5 rounded transition-all ${m.feedback === "positive"
                                ? "bg-green-100 dark:bg-green-900/30 scale-110"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              title="Good response"
                            >
                              <span className={m.feedback === "positive" ? "text-base" : "text-sm"}>👍</span>
                            </button>
                            <button
                              id={`feedback-negative-${id}`}
                              onClick={() => handleFeedback(id, "negative")}
                              className={`p-1.5 rounded transition-all ${m.feedback === "negative"
                                ? "bg-red-100 dark:bg-red-900/30 scale-110"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              title="Bad response"
                            >
                              <span className={m.feedback === "negative" ? "text-base" : "text-sm"}>👎</span>
                            </button>
                            <button
                              onClick={() => handleFeedback(id, "neutral")}
                              className={`p-1.5 rounded transition-all ${m.feedback === "neutral"
                                ? "bg-gray-100 dark:bg-gray-700 scale-110"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              title="Neutral response"
                            >
                              <span className={m.feedback === "neutral" ? "text-base" : "text-sm"}>😐</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {m.feedback && (
                        <div className="mt-1 px-3 py-1.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <span
                              className={
                                m.feedback === "positive"
                                  ? "text-green-600 dark:text-green-400"
                                  : m.feedback === "negative"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-600 dark:text-gray-300"
                              }
                            >
                              {m.feedback === "positive" ? "👍" : m.feedback === "negative" ? "👎" : "😐"}
                            </span>
                            <span className="font-medium capitalize">{m.feedback}</span>
                          </div>
                          {m.feedbackNote && (
                            <div className="mt-1 text-gray-500 dark:text-gray-400 italic">
                              "{m.feedbackNote}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {showFeedbackTooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-[60] bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 p-4 w-[300px]"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Tell us more</h4>
            <button
              onClick={() => {
                setShowFeedbackTooltip(false);
                setPendingFeedbackId(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <textarea
            value={feedbackNote}
            onChange={(e) => setFeedbackNote(e.target.value)}
            className="w-full h-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Why was this response bad?"
          />
          <button
            onClick={submitNegativeFeedback}
            className="w-full mt-3 bg-brand-500 text-white rounded-lg py-2 text-sm hover:bg-brand-600"
          >
            Submit feedback
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatMessages;

