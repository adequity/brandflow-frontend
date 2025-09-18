import React from 'react';

const StatusBadge = React.memo(({ status }) => {
    const baseClasses = "px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm border transition-all duration-200 inline-block whitespace-nowrap";

    const getStatusStyles = (status) => {
        // 승인 관련 상태
        if (status === '승인' || status === '주제 승인' || status === '목차 승인') {
            return 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200';
        }
        // 거절/반려 관련 상태
        if (status === '반려' || status === '거절' || status === '주제 반려' || status === '목차 반려') {
            return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200';
        }
        // 대기 관련 상태
        if (status === '대기' || status === '주제 승인 대기' || status === '목차 승인 대기') {
            return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200';
        }
        // 제안 관련 상태
        if (status === '주제 제안') {
            return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200';
        }
        // 기본 상태
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200';
    };

    return <span className={`${baseClasses} ${getStatusStyles(status)}`}>{status}</span>;
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;