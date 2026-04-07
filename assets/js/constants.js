const FXConstants = {
    workerUrl: 'https://emini-proxy.19970923william.workers.dev',
    storageKeys: {
        savedQuestions: 'saved_questions',
        savedPracticeQueue: 'saved_practice_queue',
        examHistory: 'exam_history',
        mistakeBank: 'mistake_bank',
        lastResult: 'last_result',
        lastExamFull: 'last_exam_full'
    },
    subjects: {
        remittance: '外匯匯款',
        trade: '進出口外匯'
    },
    modes: {
        practice: '練習模式',
        exam: '測驗模式'
    },
    gemini: {
        loading: 'Gemini 思考中...',
        noReply: '目前沒有取得回覆。',
        errorPrefix: '發生錯誤：',
        drawerTitle: 'Gemini 題目解析',
        weaknessTitle: 'Gemini 弱點分析',
        recommendationLoading: '正在整理你的弱點與建議...'
    },
    fallbackAnalysis: '目前沒有提供解析。',
    emptyState: {
        saved: '目前還沒有收藏題目。',
        history: '目前還沒有作答紀錄。'
    },
    historyPassScore: 70,
    getOptionLabels() {
        return Array.isArray(window.LABELS) ? window.LABELS : ['(1)', '(2)', '(3)', '(4)'];
    },
    getSubjectLabel(subjectKey) {
        return this.subjects[subjectKey] || subjectKey || '未分類';
    },
    getModeLabel(modeKey) {
        return this.modes[modeKey] || modeKey || '未指定模式';
    },
    getHistorySubjectLabel(tabKey) {
        return tabKey === 'exchange' ? this.subjects.remittance : this.subjects.trade;
    },
    getSessionLabel(sessionKey) {
        if (!sessionKey || sessionKey === 'all') return '全部年度';
        if (sessionKey === 'saved') return '收藏題庫';
        return `第 ${sessionKey} 屆`;
    },
    getExamSessionKey(config) {
        return `exam_session_${config.s}_${config.sub}_${config.m}`;
    }
};

window.FXConstants = FXConstants;
