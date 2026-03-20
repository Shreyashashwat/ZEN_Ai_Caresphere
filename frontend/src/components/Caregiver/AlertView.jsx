import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, Clock, Check, X, UserPlus } from 'lucide-react';
import { getPendingInvites, respondToInvite } from '../../api';

const AlertsView = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugEmail, setDebugEmail] = useState("");

    const fetchInvites = async () => {
        try {
            setError(null);
            setLoading(true);
            const res = await getPendingInvites();
            setInvites(res.data.data || []);
            if (res.data.debug?.currentUserEmail) {
                setDebugEmail(res.data.debug.currentUserEmail);
            }
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Alerts & Notifications</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage pending invites and notifications
                        {debugEmail && <span className="block text-xs text-blue-500 mt-1">Logged in as: {debugEmail}</span>}
                    </p>
                </div>
                <button
                    onClick={fetchInvites}
                    className="text-sm bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                    Refresh
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {loading && <p className="p-6 text-center text-slate-500">Loading alerts...</p>}

                {error && <p className="p-6 text-center text-red-500">{error}</p>}

                {!loading && !error && invites.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info size={24} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500">No new notifications or invites.</p>
                    </div>
                )}

                {invites.map((invite) => (
                    <div key={invite.id} className="p-6 flex items-start bg-blue-50/30">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-4 text-blue-600">
                            <UserPlus size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-slate-900">
                                    Caregiver Invitation
                                </h4>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {new Date(invite.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-slate-700 mt-1">
                                <span className="font-semibold">{invite.patientName}</span> ({invite.patientEmail}) has invited you to be their caregiver.
                            </p>
                            {invite.message && (
                                <p className="text-sm text-slate-500 italic mt-2">"{invite.message}"</p>
                            )}

                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => handleResponse(invite.id, 'accept')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                    <Check size={16} /> Accept
                                </button>
                                <button
                                    onClick={() => handleResponse(invite.id, 'reject')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                    <X size={16} /> Decline
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertsView;
