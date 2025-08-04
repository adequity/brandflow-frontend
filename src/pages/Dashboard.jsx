import React from 'react';
import { FileText, XCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const Dashboard = ({ campaigns, activities }) => {

    // ⭐️ [추가] 캠페인 데이터를 기반으로 통계를 계산하는 로직
    const allPosts = (campaigns || []).flatMap(c => c.Posts || []);

    const inProgressCount = (campaigns || []).length;
    const rejectedCount = allPosts.filter(p => p.topicStatus?.includes('반려') || p.outlineStatus?.includes('반려')).length;
    const pendingCount = allPosts.filter(p => p.topicStatus?.includes('대기') || p.outlineStatus?.includes('대기')).length;
    
    // 이번 달 발행 완료 건수 계산
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const publishedThisMonthCount = allPosts.filter(p => {
        if (!p.publishedUrl) return false;
        const updatedAt = new Date(p.updatedAt);
        return updatedAt >= firstDayOfMonth && updatedAt <= lastDayOfMonth;
    }).length;

    const stats = [
        { title: '진행 중인 캠페인', value: inProgressCount, icon: FileText, color: 'blue', description: '전체 활성 캠페인' },
        { title: '반려된 캠페인', value: rejectedCount, icon: XCircle, color: 'red', description: '확인 및 수정 필요' },
        { title: '발행 대기', value: pendingCount, icon: Clock, color: 'yellow', description: '주제/목차 승인 완료' },
        { title: '이번 달 발행 완료', value: publishedThisMonthCount, icon: CheckCircle, color: 'green', description: `총 ${allPosts.length}개 캠페인` },
    ];

    return (
        <div className="p-6 bg-gray-50">
            {/* 상단 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                            <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                        </div>
                        <div className={`p-2 rounded-full bg-${stat.color}-100`}>
                            <stat.icon size={20} className={`text-${stat.color}-600`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 하단 최근 활동 및 알림 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">진행중인 캠페인</h3>
                        <button className="text-sm text-blue-600 hover:underline flex items-center">
                            전체보기 <ArrowRight size={14} className="ml-1" />
                        </button>
                    </div>
                    {/* ... 테이블 내용은 기존과 동일하게 유지 ... */}
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">최신 알림</h3>
                    {/* ... 알림 내용은 기존과 동일하게 유지 ... */}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
