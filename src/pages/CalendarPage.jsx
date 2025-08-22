import React from 'react';
import Calendar from '../components/calendar/Calendar';

const CalendarPage = ({ user }) => {
    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <Calendar user={user} />
            </div>
        </div>
    );
};

export default CalendarPage;