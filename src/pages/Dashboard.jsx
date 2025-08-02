import React, { useState } from 'react';
import { FileText, ArrowRight, XCircle, CheckCircle, MessageSquare, Clock } from 'lucide-react';

const Card = ({ icon, title, value, subtitle }) => ( <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col"><div className="flex items-center justify-between mb-4"><div className="bg-blue-50 p-3 rounded-full">{icon}</div></div><h3 className="text-gray-500 text-sm font-medium">{title}</h3><p className="text-3xl font-bold text-gray-800 mt-1">{value}</p><p className="text-gray-400 text-xs mt-2">{subtitle}</p></div> );
const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap";
  const statusStyles = { '진행중': 'bg-blue-100 text-blue-800', '발행대기': 'bg-yellow-100 text-yellow-800', '반려': 'bg-red-100 text-red-800', '발행 완료': 'bg-green-100 text-green-800' };
  return <span className={`${baseClasses} ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const Dashboard = ({ setActivePage, campaigns, activities }) => {
    const [activeTab, setActiveTab] = useState('진행중');
    const getActivityIcon = (type) => {
        switch(type) {
            case 'reject': return <XCircle className="text-red-500" size={20}/>;
            case 'approve': return <CheckCircle className="text-green-500" size={20}/>;
            default: return <MessageSquare className="text-blue-500" size={20}/>;
        }
    };
    const tabs = ['진행중', '반려', '발행대기'];
    const filteredCampaigns = campaigns.filter(c => c.status === activeTab);

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card icon={<FileText size={24} className="text-blue-600"/>} title="진행 중인 캠페인" value={campaigns.filter(c=>c.status === '진행중').length} subtitle="전체 활성 캠페인" />
                <Card icon={<XCircle size={24} className="text-red-600"/>} title="반려된 캠페인" value={campaigns.filter(c=>c.status === '반려').length} subtitle="확인 및 수정 필요" />
                <Card icon={<Clock size={24} className="text-yellow-600"/>} title="발행 대기" value={campaigns.filter(c=>c.status === '발행대기').length} subtitle="주제/목차 승인 완료" />
                <Card icon={<CheckCircle size={24} className="text-green-600"/>} title="이번 달 발행 완료" value={campaigns.filter(c=>c.status === '발행 완료').length} subtitle="총 12개 캠페인" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex border-b">{tabs.map(tab => ( <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>))}</div>
                        <button onClick={() => setActivePage('campaigns')} className="text-sm text-blue-600 hover:underline flex items-center">전체보기 <ArrowRight size={14} className="ml-1" /></button>
                    </div>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase"><tr><th className="px-4 py-2">캠페인명</th><th className="px-4 py-2">클라이언트</th><th className="px-4 py-2">담당자</th><th className="px-4 py-2">상태</th><th className="px-4 py-2">최근 업데이트</th></tr></thead>
                        <tbody>{filteredCampaigns.map(campaign => ( <tr key={campaign.id} className="border-b hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-900">{campaign.name}</td><td className="px-4 py-3">{campaign.client}</td><td className="px-4 py-3">{campaign.User?.name || 'N/A'}</td><td className="px-4 py-3"><StatusBadge status={campaign.status} /></td><td className="px-4 py-3">{new Date(campaign.updatedAt).toLocaleDateString()}</td></tr>))}</tbody>
                    </table>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">최신 알림</h3>
                    <ul className="space-y-5">{activities.map((activity, index) => ( <li key={index} className="flex items-start"><div className="mr-3 mt-1">{getActivityIcon(activity.type)}</div><div><p className="text-sm text-gray-800"><span className="font-semibold">{activity.user}</span>{activity.action}</p><p className="text-xs text-gray-400 mt-0.5">{activity.time}</p></div></li>))}</ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
