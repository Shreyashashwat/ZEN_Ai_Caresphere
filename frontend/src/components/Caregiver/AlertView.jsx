import React, { useEffect, useState } from 'react';
import { Info, Check, X, Heart, RefreshCw } from 'lucide-react';
import { getPendingInvites, respondToInvite } from '../../api';

const AlertsView = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInvites = async () => {
        try {
            setError(null);
            setLoading(true);
            const res = await getPendingInvites();
            setInvites(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch invites", error);
            setError(error.message || "Failed to load invites");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleResponse = async (id, action) => {
        try {
            await respondToInvite(id, action);
            fetchInvites(); // Refresh list
        } catch (error) {
            console.error("Failed to respond", error);
        }
    };

    return (
        <div className="divide-y divide-slate-100">
            {loading && (
                <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading invites...
                </div>
            )}

            {error && <p className="p-6 text-center text-red-500">{error}</p>}

            {!loading && !error && invites.length === 0 && (
                <div className="p-8 text-center">
                    <div className="bg-green-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check size={24} className="text-green-500" />
                    </div>
                    <p className="text-slate-600 font-medium">All caught up!</p>
                    <p className="text-slate-400 text-sm">No pending family invites</p>
                </div>
            )}

            {invites.map((invite) => (
                <div key={invite.id} className="p-5 flex items-start bg-white hover:bg-rose-50/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mr-4 text-rose-600">
                        <Heart size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-bold text-slate-900">
                                    {invite.patientName}
                                </h4>
                                {invite.relationship && (
                                    <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                                        {invite.relationship}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                {new Date(invite.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm">
                            wants you to join their family health circle
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{invite.patientEmail}</p>

                        {invite.message && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-lg border-l-4 border-rose-300">
                                <p className="text-sm text-slate-600 italic">"{invite.message}"</p>
                            </div>
                        )}

                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={() => handleResponse(invite.id, 'accept')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-200 cursor-pointer"
                            >
                                <Check size={16} /> Accept
                            </button>
                            <button
                                onClick={() => handleResponse(invite.id, 'reject')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                <X size={16} /> Decline
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AlertsView;
