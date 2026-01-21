import { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../../services/adminService";
import type {IGuest, GuestsQueryParams, IMessage} from "../../types";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import {IUserDetails} from "../../types/users.type.ts";
import {IPagination} from "../../types/common.ts";

export default function HostDetailPage() {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const [host, setHost] = useState<IUserDetails | null>(null);
  const [guests, setGuests] = useState<IGuest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<IGuest | null>(null);
  const [conversation, setConversation] = useState<IMessage[]>([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationPagination, setConversationPagination] = useState<IPagination | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [loading, setLoading] = useState({
    host: false,
    guests: false,
    conversation: false
  });
  const [guestsPage, setGuestsPage] = useState(1);
  const [guestsPagination, setGuestsPagination] = useState<IPagination | null>(null);

  const guestListRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const loadHost = useCallback(async () => {
    setLoading(l => ({ ...l, host: true }));
    try {
      const res = await adminService.getUserDetails(hostId!);
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
        setGuests(prev => append ? [...prev, ...res.data] : res.data);
        setGuestsPagination(res.pagination);
        if (res.data.length > 0 && !selectedGuest && !append) {
          setSelectedGuest(res.data[0]);
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
          selectedGuest!.id,
          { page: conversationPage, limit: 100 }
      );
      if (res.success) {
        setConversation(prev => prepend ? [...res.data, ...prev] : res.data);
        setConversationPagination(res.pagination);
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
  }, [hostId, guestSearch, guestsPage]);

  useEffect(() => {
    if (hostId && selectedGuest) loadConversation();
  }, [hostId, selectedGuest, conversationPage, loadConversation]);

  const handleGuestScroll = () => {
    const el = guestListRef.current;
    if (!el || loading.guests || !guestsPagination) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      if (guestsPagination?.current_page < guestsPagination?.last_page) {
        setGuestsPage(p => p + 1);
      }
    }
  };

  const handleMessageScroll = () => {
    const el = messageListRef.current;
    if (!el || loading.conversation || !conversationPagination) return;
    if (el.scrollTop <= 10) {
      if (conversationPagination.current_page < conversationPagination.last_page) {
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
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Host Info Panel */}
        {host && (
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-1 md:gap-2 bg-gray-100 dark:bg-gray-700 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm md:text-base"
                    >
                      <span>←</span> <span className="hidden sm:inline">Back</span>
                    </button>
                    <div>
                      <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{host.name || 'Host'}</h1>
                      <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">{host.businessName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                    host.aiAutoReplyEnabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                }`}>
                  <span className="hidden sm:inline">{host.aiAutoReplyEnabled ? '🤖 AI Enabled' : '🤖 AI Disabled'}</span>
                  <span className="sm:hidden">{host.aiAutoReplyEnabled ? '🤖 ON' : '🤖 OFF'}</span>
                </span>
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                        host.status === 'approved'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'
                    }`}>
                  {host.status?.toUpperCase()}
                </span>
                  </div>
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
                      ৳{parseFloat(host.hostWallet?.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Available Balance</div>
                  </div>

                  {/* Total Paid */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
                    <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Total Paid</div>
                    <div className="text-xl md:text-3xl font-bold mb-1 text-green-600 dark:text-green-400">
                      ৳{parseFloat(host.hostWallet?.totalPaid || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Lifetime Earnings</div>
                  </div>

                  {/* Commission Rule */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
                    <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Commission Rule</div>
                    {host.commissionRule ? (
                        <>
                          <div className="text-xl md:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                            {host.commissionRule.type === 'percentage'
                                ? `${host.commissionRule.value}%`
                                : `৳${parseFloat(host.commissionRule.value).toFixed(2)}`
                            }
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs truncate">{host.commissionRule.name}</div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          host.commissionRule.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
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
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Guest List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-semibold mb-3">Guests</h2>
              <input
                  type="text"
                  value={guestSearch}
                  onChange={e => setGuestSearch(e.target.value)}
                  placeholder="Search guests..."
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
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
                          key={g.id}
                          onClick={() => {
                            if (selectedGuest?.id !== g.id) {
                              setSelectedGuest(g);
                              setConversationPage(1);
                            }
                          }}
                          className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              selectedGuest?.id === g.id ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
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
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${g.aiAutoReplyEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                                >
                                AI {g.aiAutoReplyEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                              {g.lastMessageAt && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Last: {new Date(g.lastMessageAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              )}
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
            {conversationPagination && conversationPagination.last_page > 1 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-center items-center gap-3">
                  <button
                      onClick={() => setConversationPage(p => Math.max(1, p - 1))}
                      disabled={conversationPage === 1}
                      className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {conversationPage} of {Math.floor(conversationPagination.total/conversationPagination.per_page)}
              </span>
                  <button
                      onClick={() => setConversationPage(p => Math.min(conversationPagination.current_page, p + 1))}
                      disabled={conversationPage === conversationPagination.last_page}
                      className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}