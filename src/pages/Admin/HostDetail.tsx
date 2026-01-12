import { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../../services/adminService";
import type { Host, Guest, Message, GuestsQueryParams } from "../../types";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";

export default function HostDetailPage() {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();

  const [host, setHost] = useState<Host | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationPagination, setConversationPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [loading, setLoading] = useState({
    host: false,
    guests: false,
    conversation: false
  });
  const [guestsPage, setGuestsPage] = useState(1);
  const [guestsPagination, setGuestsPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const guestListRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const loadHost = useCallback(async () => {
    setLoading(l => ({ ...l, host: true }));
    try {
      const res = await adminService.getHostDetails(hostId!);
      if (res.success) setHost(res.data);
    } catch {
      toast.error('Failed to load host');
    }
    setLoading(l => ({ ...l, host: false }));
  }, [hostId]);

  const loadGuests = useCallback(async (append = false) => {
    setLoading(l => ({ ...l, guests: true }));
    try {
      const params: GuestsQueryParams = {
        page: guestsPage,
        limit: 100,
        search: guestSearch
      };
      const res = await adminService.getHostGuests(hostId!, params);
      if (res.success) {
        setGuests(prev => append ? [...prev, ...res.data.guests] : res.data.guests);
        setGuestsPagination(res.data.pagination);
        if (res.data.guests.length > 0 && !selectedGuest && !append) {
          setSelectedGuest(res.data.guests[0]);
          setConversationPage(1);
        }
      }
    } catch {
      toast.error('Failed to load guests');
    }
    setLoading(l => ({ ...l, guests: false }));
  }, [hostId, guestSearch, guestsPage, selectedGuest]);

  const loadConversation = useCallback(async (prepend = false) => {
    setLoading(l => ({ ...l, conversation: true }));
    try {
      const res = await adminService.getHostGuestMessages(
          hostId!,
          selectedGuest!._id,
          { page: conversationPage, limit: 100 }
      );
      if (res.success) {
        setConversation(prev => prepend ? [...res.data.messages, ...prev] : res.data.messages);
        setConversationPagination(res.data.pagination);
      }
    } catch {
      toast.error('Failed to load conversation');
    }
    setLoading(l => ({ ...l, conversation: false }));
  }, [hostId, selectedGuest, conversationPage]);

  useEffect(() => {
    if (hostId) loadHost();
  }, [hostId, loadHost]);

  useEffect(() => {
    if (hostId) loadGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId, guestSearch, guestsPage]);

  useEffect(() => {
    if (hostId && selectedGuest) loadConversation();
  }, [hostId, selectedGuest, conversationPage, loadConversation]);

  const handleGuestScroll = () => {
    const el = guestListRef.current;
    if (!el || loading.guests || !guestsPagination) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      if (guestsPagination.page < guestsPagination.totalPages) {
        setGuestsPage(p => p + 1);
      }
    }
  };

  const handleMessageScroll = () => {
    const el = messageListRef.current;
    if (!el || loading.conversation || !conversationPagination) return;
    if (el.scrollTop <= 10) {
      if (conversationPagination.page < conversationPagination.totalPages) {
        setConversationPage(p => p + 1);
        loadConversation(true);
      }
    }
  };

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

  return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Left: Guest List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
                onClick={() => navigate(-1)}
                className="mb-3 text-brand-500 hover:text-brand-600 font-medium"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold mb-3">{host?.name || 'Host'}'s Guests</h2>
            <input
                type="text"
                value={guestSearch}
                onChange={e => setGuestSearch(e.target.value)}
                placeholder="Search guests..."
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div
              ref={guestListRef}
              onScroll={handleGuestScroll}
              className="flex-1 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9ca3af transparent'
              }}
          >
            {loading.guests ? (
                <div className="p-4 text-gray-500">Loading...</div>
            ) : guests.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">No guests found</div>
            ) : (
                guests.map(g => (
                    <div
                        key={g._id}
                        onClick={() => {
                          if (selectedGuest?._id !== g._id) {
                            setSelectedGuest(g);
                            setConversationPage(1);
                          }
                        }}
                        className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            selectedGuest?._id === g._id ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ backgroundColor: getAvatarColor(g.name || g.notifyName || g.originalNumber || 'U') }}
                        >
                          {(g.name?.[0] || g.notifyName?.[0] || g.originalNumber?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-gray-900 dark:text-white">
                            {g.name || g.notifyName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {g?.originalNumber || g?.whatsappNumber}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {g.totalMessages}
                        </div>
                      </div>
                    </div>
                ))
            )}
          </div>
        </div>

        {/* Right: Conversation */}
        <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-gray-900">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: selectedGuest
                        ? getAvatarColor(selectedGuest.name || selectedGuest.notifyName || selectedGuest.originalNumber || 'U')
                        : '#9ca3af'
                  }}
              >
                {selectedGuest
                    ? (selectedGuest.name?.[0] || selectedGuest.notifyName?.[0] || selectedGuest.originalNumber?.[0] || 'U').toUpperCase()
                    : '?'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedGuest ? (selectedGuest.name || selectedGuest.notifyName || 'Unknown') : 'Select a guest'}
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedGuest?.originalNumber || selectedGuest?.whatsappNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
              ref={messageListRef}
              onScroll={handleMessageScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9ca3af transparent',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\' fill-opacity=\'.05\'/%3E%3C/svg%3E")',
              }}
          >
            {loading.conversation ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : conversation.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No conversation found</div>
            ) : (
                <>
                  {conversation.map(m => (
                      <div key={m._id} className="space-y-2">
                        {/* Guest message (left) */}
                        <div className="flex justify-start">
                          <div className="max-w-[75%] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                            <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                              {m.prompt}
                            </div>
                            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 text-right">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* AI reply (right) */}
                        {m.reply && (
                            <div className="flex justify-end">
                              <div className="max-w-[75%]">
                                <div className="bg-[#dcf8c6] dark:bg-[#056162] p-3 rounded-lg shadow-sm">
                                  <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                                    {m.reply}
                                  </div>
                                  <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 text-right">
                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>

                                {/* Feedback indicator */}
                                {m.feedback && (
                                    <div className="mt-1 px-3 py-1.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                      <div className="flex items-center gap-1">
                              <span className={m.feedback === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {m.feedback === 'positive' ? '👍' : '👎'}
                              </span>
                                        <span className="font-medium capitalize">{m.feedback}</span>
                                      </div>
                                      {m.feedbackNote && (
                                          <div className="mt-1 text-gray-500 dark:text-gray-400 italic">"{m.feedbackNote}"</div>
                                      )}
                                    </div>
                                )}
                              </div>
                            </div>
                        )}
                      </div>
                  ))}
                </>
            )}
          </div>

          {/* Pagination footer */}
          {conversationPagination && conversationPagination.totalPages > 1 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-center items-center gap-3">
                <button
                    onClick={() => setConversationPage(p => Math.max(1, p - 1))}
                    disabled={conversationPage === 1}
                    className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {conversationPage} of {conversationPagination.totalPages}
            </span>
                <button
                    onClick={() => setConversationPage(p => Math.min(conversationPagination.totalPages, p + 1))}
                    disabled={conversationPage === conversationPagination.totalPages}
                    className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
          )}
        </div>
      </div>
  );
}