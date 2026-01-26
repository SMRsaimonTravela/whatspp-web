import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router";
import {Calendar, Mail, MessageSquare, Phone, TrendingUp, Users, UserX, Zap} from "lucide-react";
import {hostService} from "../../services/hostService";
import {useAuthStore} from "../../store/authStore";
import type {IAnalyticsData} from "../../types";

export default function HostDashboard() {
    const {user} = useAuthStore();
    const [analytics, setAnalytics] = useState<IAnalyticsData | null>(null);
    const [aiEnabled, setAiEnabled] = useState(user?.aiAutoReplyEnabled ?? false);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const analytics = await hostService.getAnalytics();
            console.log(analytics, "analytics");
            if (analytics.success) {
                setAnalytics(analytics.data);
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAI = async () => {
        setIsToggling(true);
        try {
            const response = await hostService.toggleAI(!aiEnabled);
            if (response.success) {
                setAiEnabled(!aiEnabled);
            }
        } catch (error) {
            console.error("Failed to toggle AI:", error);
        } finally {
            setIsToggling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div
                        className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-lg font-medium text-slate-700">Loading your dashboard...</div>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Messages",
            value: analytics?.totalMessages ?? 0,
            icon: MessageSquare,
            gradient: "from-blue-500 via-blue-600 to-indigo-600",
            shadowColor: "shadow-blue-500/50",
            iconBg: "bg-blue-400/20",
            to: "/host/conversation"
        },
        {
            title: "Today's Messages",
            value: analytics?.todayMessages ?? 0,
            icon: Mail,
            gradient: "from-emerald-500 via-green-600 to-teal-600",
            shadowColor: "shadow-emerald-500/50",
            iconBg: "bg-emerald-400/20",
            to: "/host/conversation"
        },
        {
            title: "Total Guests",
            value: analytics?.totalGuests ?? 0,
            icon: Users,
            gradient: "from-purple-500 via-purple-600 to-pink-600",
            shadowColor: "shadow-purple-500/50",
            iconBg: "bg-purple-400/20",
            to: "/host/guests"
        },
        {
            title: "Total Bookings",
            value: analytics?.totalBookings || 0,
            icon: Calendar,
            gradient: "from-orange-500 via-orange-600 to-red-600",
            shadowColor: "shadow-orange-500/50",
            iconBg: "bg-orange-400/20",
            to: "/host/bookings"
        }
    ];

    const quickActions = [
        {
            to: "/host/whatsapp",
            icon: Phone,
            title: "WhatsApp",
            description: "Connection Status",
            color: "text-green-600",
            bgColor: "bg-green-50",
            hoverBg: "hover:bg-green-100",
            borderColor: "border-green-200"
        },
        {
            to: "/host/conversation",
            icon: MessageSquare,
            title: "Messages",
            description: "View All Messages",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            hoverBg: "hover:bg-blue-100",
            borderColor: "border-blue-200"
        },
        {
            to: "/host/guests",
            icon: Users,
            title: "Guests",
            description: "Manage Guests",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            hoverBg: "hover:bg-purple-100",
            borderColor: "border-purple-200"
        },
        {
            to: "/host/blocked-numbers",
            icon: UserX,
            title: "Blocked",
            description: "Blocked Numbers",
            color: "text-red-600",
            bgColor: "bg-red-50",
            hoverBg: "hover:bg-red-100",
            borderColor: "border-red-200"
        }
    ];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div
                        className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 mb-8 border border-slate-100 overflow-hidden relative">
                        <div
                            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>

                        <div className="relative">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                                <div>
                                    <h1 className="text-lg  md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                                        Welcome back, {user?.name}! 👋
                                    </h1>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <p className="text-slate-600 font-medium">{user?.businessName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Toggle Section */}
                            <div
                                className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm">
                                            <Zap
                                                className={`h-6 w-6 ${aiEnabled ? 'text-blue-600' : 'text-slate-400'}`}/>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                AI Auto-Reply
                                                {aiEnabled && (
                                                    <span
                                                        className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Active
                          </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-slate-600 mt-0.5">
                                                {aiEnabled
                                                    ? "Automatically responding to guest messages"
                                                    : "Manual responses only"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleToggleAI}
                                        disabled={isToggling}
                                        className={`group relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                                            aiEnabled ? "bg-blue-600" : "bg-slate-300"
                                        } ${isToggling ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg cursor-pointer"}`}
                                    >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                            aiEnabled ? "translate-x-7" : "translate-x-1"
                        } group-hover:scale-110`}
                    />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {statCards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={index}
                                    className={`group relative bg-gradient-to-br ${card.gradient} rounded-2xl shadow-lg ${card.shadowColor} p-6 text-white transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden`}
                                    style={{animationDelay: `${index * 100}ms`}}
                                    onClick={() => navigate(card.to)}
                                >
                                    {/* Animated background effect */}
                                    <div
                                        className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-sm font-medium opacity-90 mb-1">
                                                    {card.title}
                                                </p>
                                                <p className="text-3xl font-bold tracking-tight">
                                                    {card.value.toLocaleString()}
                                                </p>
                                            </div>
                                            <div
                                                className={`${card.iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="h-6 w-6" strokeWidth={2.5}/>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs opacity-90">
                                            <TrendingUp className="h-3 w-3"/>
                                            <span>View details</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
                            <p className="text-slate-600 mt-1">Access your most used features</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={index}
                                        to={action.to}
                                        className="group relative flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <div
                                            className={`${action.bgColor} p-4 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className={`h-6 w-6 ${action.color}`} strokeWidth={2}/>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 text-base mb-0.5">
                                                {action.title}
                                            </h3>
                                            <p className="text-sm text-slate-600">
                                                {action.description}
                                            </p>
                                        </div>

                                        <svg
                                            className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}