import React, { useState, useEffect } from 'react';
import { UserPlus, Heart, Mail, Trash2, Users } from 'lucide-react';
import AddCaregiverModal from './AddCaregiverModal';
import { getMyCaregivers, deleteCaregiver } from '../api';

const CaregiverList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFamilyMembers = async () => {
        try {
            const res = await getMyCaregivers();
            setFamilyMembers(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch family members", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamilyMembers();
    }, []);

    const handleFamilyMemberAdded = () => {
        fetchFamilyMembers();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this family member from your circle?")) return;
        try {
            await deleteCaregiver(id);
            fetchFamilyMembers();
        } catch (error) {
            console.error("Failed to remove family member", error);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-rose-600 flex items-center gap-2">
                    <Heart size={24} className="fill-rose-100" />
                    My Family Circle
                </h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                    <UserPlus size={16} />
                    Add Family
                </button>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <p className="text-center text-slate-400 text-sm">Loading family members...</p>
                ) : familyMembers.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 bg-rose-50/50 rounded-2xl border border-dashed border-rose-200">
                        <Users className="mx-auto mb-2 text-rose-300" size={32} />
                        <p>No family members connected yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Invite someone to join your health circle!</p>
                    </div>
                ) : (
                    familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-rose-50/30 rounded-xl border border-rose-100 hover:border-rose-200 hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${member.status === 'Active' ? 'bg-green-100 text-green-600' :
                                    member.status === 'Invited' ? 'bg-blue-100 text-blue-600' :
                                        'bg-orange-100 text-orange-600'
                                    }`}>
                                    {member.isEmailOnly ? '📧' : (member.name ? member.name.charAt(0).toUpperCase() : '?')}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">
                                        {member.isEmailOnly ? member.email : (member.name || member.email)}
                                    </p>
                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>{member.relationship}</span>
                                        {member.status === 'Pending' && (
                                            <span className="text-orange-500 bg-orange-50 px-1.5 rounded text-[10px] font-medium">⏳ Pending</span>
                                        )}
                                        {member.status === 'Invited' && (
                                            <span className="text-blue-500 bg-blue-50 px-1.5 rounded text-[10px] font-medium">📩 Awaiting Registration</span>
                                        )}
                                        {member.status === 'Active' && (
                                            <span className="text-green-500 bg-green-50 px-1.5 rounded text-[10px] font-medium">✓ Connected</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Contact"
                                    onClick={() => window.location.href = `mailto:${member.email}`}
                                >
                                    <Mail size={16} />
                                </button>
                                <button
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                                    title="Remove"
                                    onClick={() => handleDelete(member.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AddCaregiverModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleFamilyMemberAdded}
            />
        </>
    );
};

export default CaregiverList;
