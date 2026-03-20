import React, { useState, useEffect } from 'react';
import { UserPlus, MoreVertical, ShieldCheck, Mail, Trash2 } from 'lucide-react';
import AddCaregiverModal from './AddCaregiverModal';
import { getMyCaregivers, deleteCaregiver } from '../api';

const CaregiverList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCaregivers = async () => {
        try {
            const res = await getMyCaregivers();
            setCaregivers(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch caregivers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCaregivers();
    }, []);

    const handleCaregiverAdded = () => {
        fetchCaregivers();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this caregiver?")) return;
        try {
            await deleteCaregiver(id);
            fetchCaregivers();
        } catch (error) {
            console.error("Failed to delete caregiver", error);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-indigo-600 flex items-center gap-2">
                    <ShieldCheck size={24} />
                    My Caregivers
                </h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                    <UserPlus size={16} />
                    Add New
                </button>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <p className="text-center text-slate-400 text-sm">Loading caregivers...</p>
                ) : caregivers.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p>No caregivers linked yet.</p>
                    </div>
                ) : (
                    caregivers.map((caregiver) => (
                        <div key={caregiver.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${caregiver.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {caregiver.name ? caregiver.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{caregiver.name || caregiver.email}</p>
                                    <p className="text-xs text-slate-500 flex items-center">
                                        <span className="mr-2">{caregiver.relationship}</span>
                                        {caregiver.status === 'Pending' && <span className="text-orange-500 bg-orange-50 px-1.5 rounded text-[10px]">Pending</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer"
                                    title="Contact"
                                    onClick={() => window.location.href = `mailto:${caregiver.email}`}
                                >
                                    <Mail size={16} />
                                </button>
                                <button
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                                    title="Remove"
                                    onClick={() => handleDelete(caregiver.id)}
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
                onSuccess={handleCaregiverAdded}
            />
        </>
    );
};

export default CaregiverList;
