// src/components/campaigns/CampaignDetail.jsx
import React, { useState } from 'react';
import api from '../../api/client';
import { Edit, Trash2, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import StatusBadge from '../common/StatusBadge';
import EditModal from '../modals/EditModal';
import DeleteModal from '../modals/DeleteModal';
import OutlineRegisterModal from '../modals/OutlineRegisterModal';
import TopicRegisterModal from '../modals/TopicRegisterModal';
import LinkRegisterModal from '../modals/LinkRegisterModal';

const CampaignDetail = ({ campaign, onBack, setCampaigns }) => {
  const [posts, setPosts] = useState(campaign.posts || []);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isOutlineModalOpen, setOutlineModalOpen] = useState(false);
  const [isTopicModalOpen, setTopicModalOpen] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [modalType, setModalType] = useState('topic');
  const [selectedPost, setSelectedPost] = useState(null);

  // 부모(AdminUI)의 campaigns 상태를 업데이트
  const updateParentCampaign = (updatedPosts) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, posts: updatedPosts } : c))
    );
  };

  // --- 핸들러 ---
  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [id] // 단일 선택
    );
  };
  const handleSelectAll = (e) => {
    setSelectedRows(e.target.checked ? posts.map((p) => p.id) : []);
  };
  const openEditModal = (post, type) => {
    setSelectedPost(post);
    setModalType(type);
    setEditModalOpen(true);
  };
  const handleDeleteClick = (post) => {
    setSelectedPost(post);
    setDeleteModalOpen(true);
  };

  // 재요청(주제/목차 다시 올리기)
  const handleReRequest = async (updatedContent) => {
    const postToUpdate = posts.find((p) => p.id === selectedPost.id);
    if (!postToUpdate) return;

    const payload =
      modalType === 'topic'
        ? { title: updatedContent, topicStatus: '주제 승인 대기', outline: null, outlineStatus: null }
        : { outline: updatedContent, outlineStatus: '목차 승인 대기' };

    try {
      const { data: updated } = await api.put(`/api/posts/${postToUpdate.id}`, payload);
      const updatedPosts = posts.map((p) => (p.id === selectedPost.id ? updated : p));
      setPosts(updatedPosts);
      updateParentCampaign(updatedPosts);
    } catch (error) {
      console.error(error);
      alert('재요청 실패');
    }
    setEditModalOpen(false);
    setSelectedPost(null);
  };

  // 목차 등록
  const handleRegisterOutline = async (outlineContent) => {
    const postId = selectedRows[0];
    if (!postId) return;

    try {
      const { data: updated } = await api.put(`/api/posts/${postId}`, {
        outline: outlineContent,
        outlineStatus: '목차 승인 대기',
      });
      const updatedPosts = posts.map((p) => (p.id === postId ? updated : p));
      setPosts(updatedPosts);
      updateParentCampaign(updatedPosts);
    } catch (error) {
      console.error(error);
      alert('목차 등록 실패');
    }
    setOutlineModalOpen(false);
    setSelectedRows([]);
  };

  // 주제 등록
  const handleRegisterTopic = async (topicTitle) => {
    if (!topicTitle?.trim()) return;
    try {
      const { data: created } = await api.post(`/api/campaigns/${campaign.id}/posts`, {
        title: topicTitle,
      });
      const updatedPosts = [...(posts || []), created];
      setPosts(updatedPosts);
      updateParentCampaign(updatedPosts);
    } catch (error) {
      console.error(error);
      alert('주제 등록 실패');
    }
    setTopicModalOpen(false);
  };

  // 발행 링크 등록/수정
  const handleRegisterLink = async (url) => {
    const postId = selectedRows[0];
    if (!postId) return;

    try {
      const { data: updated } = await api.put(`/api/posts/${postId}`, { publishedUrl: url });
      const updatedPosts = posts.map((p) => (p.id === postId ? updated : p));
      setPosts(updatedPosts);
      updateParentCampaign(updatedPosts);
    } catch (error) {
      console.error(error);
      alert('링크 등록 실패');
    }
    setLinkModalOpen(false);
    setSelectedRows([]);
  };

  // 삭제
  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/api/posts/${selectedPost.id}`);
      const updatedPosts = posts.filter((p) => p.id !== selectedPost.id);
      setPosts(updatedPosts);
      updateParentCampaign(updatedPosts);
    } catch (error) {
      console.error(error);
      alert('삭제 실패');
    }
    setDeleteModalOpen(false);
    setSelectedPost(null);
  };

  const selected = posts.find((p) => p.id === selectedRows[0]);
  const canRegisterOutline =
    selectedRows.length === 1 && selected?.topicStatus === '주제 승인' && !selected?.outline;
  const canRegisterLink = selectedRows.length === 1;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-shrink-0">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-2">
          &larr; 전체 캠페인 목록으로
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{campaign.name}</h2>
      </div>

      <div className="flex-grow bg-white p-6 rounded-xl border border-gray-200 flex flex-col mt-4">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">콘텐츠 기획 및 승인</h3>
          <div className="space-x-2">
            <button
              onClick={() => setTopicModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              주제 등록
            </button>
            <button
              onClick={() => setOutlineModalOpen(true)}
              disabled={!canRegisterOutline}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
            >
              목차 등록
            </button>
            <button
              onClick={() => setLinkModalOpen(true)}
              disabled={!canRegisterLink}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700"
            >
              {selected?.publishedUrl ? '링크 수정' : '링크 등록'}
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="p-2 w-4">
                  <input type="checkbox" onChange={handleSelectAll} />
                </th>
                <th className="p-2">주제</th>
                <th className="p-2">승인 상태</th>
                <th className="p-2">목차 내용 검토</th>
                <th className="p-2">목차 승인 상태</th>
                <th className="p-2">발행 링크</th>
                <th className="p-2">작성 시간</th>
                <th className="p-2">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => {
                const created = post.creationTime || post.createdAt;
                return (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(post.id)}
                        onChange={() => handleRowSelect(post.id)}
                      />
                    </td>
                    <td className="p-2 font-medium text-gray-900">{post.title}</td>
                    <td className="p-2">
                      <StatusBadge status={post.topicStatus} />
                    </td>
                    <td className="p-2">
                      {post.outline ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate max-w-xs">{post.outline}</span>
                          <button
                            onClick={() => openEditModal(post, 'outline')}
                            className="text-gray-400 hover:text-blue-600 ml-2 shrink-0"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2">{post.outlineStatus ? <StatusBadge status={post.outlineStatus} /> : '-'}</td>
                    <td className="p-2">
                      {post.publishedUrl ? (
                        <a
                          href={post.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <LinkIcon size={14} className="inline" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {created ? new Date(created).toLocaleString() : '-'}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(post, 'topic')}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(post)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center mt-4 flex-shrink-0">
          <nav className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">1</button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </div>

      {isEditModalOpen && (
        <EditModal
          post={selectedPost}
          type={modalType}
          onSave={handleReRequest}
          onClose={() => setEditModalOpen(false)}
        />
      )}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        itemType="콘텐츠"
        itemName={selectedPost?.title}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
      {isOutlineModalOpen && (
        <OutlineRegisterModal onSave={handleRegisterOutline} onClose={() => setOutlineModalOpen(false)} />
      )}
      {isTopicModalOpen && (
        <TopicRegisterModal onSave={handleRegisterTopic} onClose={() => setTopicModalOpen(false)} />
      )}
      {isLinkModalOpen && (
        <LinkRegisterModal
          onSave={handleRegisterLink}
          onClose={() => setLinkModalOpen(false)}
          initialUrl={selected?.publishedUrl}
        />
      )}
    </div>
  );
};

export default CampaignDetail;
