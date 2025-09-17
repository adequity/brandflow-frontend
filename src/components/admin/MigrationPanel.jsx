import React, { useState } from 'react';
import api from '../../api/client';

const MigrationPanel = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [migrationInfo, setMigrationInfo] = useState(null);

    // 마이그레이션 상태 확인
    const checkMigrationStatus = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/migration/migration-status');
            setMigrationInfo(response.data);
            console.log('마이그레이션 상태:', response.data);
        } catch (error) {
            console.error('마이그레이션 상태 확인 실패:', error);
            setStatus({ type: 'error', message: `상태 확인 실패: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    // 마이그레이션 실행
    const runMigration = async () => {
        if (!window.confirm('데이터베이스 마이그레이션을 실행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: '마이그레이션을 실행하고 있습니다...' });

        try {
            const response = await api.post('/api/migration/run-migration');
            setStatus({
                type: 'success',
                message: `마이그레이션 완료! ${response.data.message}`
            });

            // 상태 새로고침
            setTimeout(() => {
                checkMigrationStatus();
            }, 2000);

        } catch (error) {
            console.error('마이그레이션 실행 실패:', error);
            setStatus({
                type: 'error',
                message: `마이그레이션 실패: ${error.response?.data?.detail || error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        checkMigrationStatus();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">데이터베이스 마이그레이션</h3>

            {/* 상태 정보 */}
            {migrationInfo && (
                <div className="mb-4 p-4 bg-gray-50 rounded">
                    <h4 className="font-medium mb-2">현재 상태</h4>
                    <div className="space-y-1 text-sm">
                        <div>현재 버전: <code>{migrationInfo.current_version || 'unknown'}</code></div>
                        <div>새 DateTime 필드:
                            <span className={migrationInfo.new_datetime_columns_exist ? 'text-green-600' : 'text-red-600'}>
                                {migrationInfo.new_datetime_columns_exist ? ' ✅ 존재' : ' ❌ 없음'}
                            </span>
                        </div>
                        <div>마이그레이션 필요:
                            <span className={migrationInfo.migration_needed ? 'text-orange-600' : 'text-green-600'}>
                                {migrationInfo.migration_needed ? ' ⚠️ 필요함' : ' ✅ 완료됨'}
                            </span>
                        </div>
                        {migrationInfo.existing_columns?.length > 0 && (
                            <div>기존 컬럼: {migrationInfo.existing_columns.join(', ')}</div>
                        )}
                    </div>
                </div>
            )}

            {/* 상태 메시지 */}
            {status && (
                <div className={`mb-4 p-3 rounded ${
                    status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                    {status.message}
                </div>
            )}

            {/* 버튼들 */}
            <div className="flex gap-3">
                <button
                    onClick={checkMigrationStatus}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? '확인 중...' : '상태 새로고침'}
                </button>

                <button
                    onClick={runMigration}
                    disabled={loading || !migrationInfo?.migration_needed}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                    {loading ? '실행 중...' : '마이그레이션 실행'}
                </button>
            </div>

            {/* 안내 메시지 */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>주의:</strong> 마이그레이션은 다음 필드들을 추가합니다:
                <ul className="mt-2 ml-4 list-disc">
                    <li><code>posts.start_datetime</code> - 포스트 시작 일시</li>
                    <li><code>posts.due_datetime</code> - 포스트 마감 일시</li>
                    <li><code>campaigns.invoice_due_date</code> - 계산서 발행 마감일</li>
                    <li><code>campaigns.payment_due_date</code> - 결제 마감일</li>
                    <li><code>campaigns.project_due_date</code> - 프로젝트 완료 마감일</li>
                </ul>
            </div>
        </div>
    );
};

export default MigrationPanel;