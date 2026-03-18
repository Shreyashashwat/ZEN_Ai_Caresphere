import React from "react";
import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";

function Patient() {
    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-center mb-8 text-3xl font-bold">
                Patient Dashboard
            </h1>

            {/* Dashboard grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left column */}
                <div className="space-y-6">
                    <MedicineForm />
                    <MedicineList />
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <DashboardChart />
                    <CalendarView />
                </div>
            </div>

            {/* History section */}
            <div className="mt-8">
                <HistoryTable />
            </div>
        </div>
    );
}

export default Patient;