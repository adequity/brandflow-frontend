import React from 'react';

const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap";
    const statusStyles = {
        '주제 승인 대기': 'bg-yellow-100 text-yellow-800',
        '주제 제안': 'bg-blue-100 text-blue-800',
        '주제 승인': 'bg-green-100 text-green-800',
        '주제 반려': 'bg-red-100 text-red-800',
        '목차 승인 대기': 'bg-yellow-100 text-yellow-800',
        '목차 승인': 'bg-green-100 text-green-800',
        '목차 반려': 'bg-red-100 text-red-800'
    };
    return <span className={`${baseClasses} ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

export default StatusBadge;