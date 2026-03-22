import React, { useState } from 'react';
import { UserPlus, X, Heart, Users } from 'lucide-react';
import { inviteCaregiver } from '../api';

const AddCaregiverModal = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [relationship, setRelationship] = useState('Parent');
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
            setRelationship('Parent');
        } catch (err) {
            console.error("Failed to invite", err);
            setError(err.response?.data?.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            <Heart size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Connect with Family</h3>
                            <p className="text-rose-100 text-xs">Invite a loved one to support your health journey</p>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Their Email Address</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                required
                                placeholder="family@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                        <select
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 cursor-pointer"
                        >
                            <option>Parent</option>
                            <option>Child</option>
                            <option>Spouse</option>
                            <option>Sibling</option>
                            <option>Grandparent</option>
                            <option>Friend</option>
                            <option>Other Family</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Personal Message (Optional)</label>
                        <textarea
                            rows="3"
                            placeholder="Hi! I'd love for you to be part of my health circle..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Sending Invite...
                                </>
                            ) : (
                                <>
                                    <Heart size={20} />
                                    Send Family Invite
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-slate-400 mt-3">
                            💌 They'll receive an email to join your family circle.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCaregiverModal;
