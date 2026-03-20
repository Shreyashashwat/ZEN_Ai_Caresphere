import React, { useState } from 'react';
import { UserPlus, X, HeartHandshake } from 'lucide-react';
import { inviteCaregiver } from '../api';

const AddCaregiverModal = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [relationship, setRelationship] = useState('Family Member');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await inviteCaregiver({ email, relationship, message });

            // Success
            if (onSuccess) onSuccess();
            onClose();

            // Reset form
            setEmail('');
            setMessage('');
            setRelationship('Family Member');
        } catch (err) {
            console.error("Failed to invite", err);
            setError(err.response?.data?.message || "Failed to invite caregiver");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            <HeartHandshake size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Add Caregiver</h3>
                            <p className="text-indigo-100 text-xs">Invite someone to help manage your health</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Caregiver Email</label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                required
                                placeholder="caregiver@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                        <select
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
                        >
                            <option>Family Member</option>
                            <option>Nurse / Professional</option>
                            <option>Friend</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Personal Message (Optional)</label>
                        <textarea
                            rows="3"
                            placeholder="Hi, I'd like to add you as my caregiver..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Sending Invite...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Send Invitation
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-slate-400 mt-3">
                            They will receive an email to confirm the connection.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCaregiverModal;
