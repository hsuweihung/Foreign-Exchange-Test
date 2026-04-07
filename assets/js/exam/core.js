(function() {
    const params = new URLSearchParams(window.location.search);
    const config = {
        s: params.get('s'),
        sub: params.get('sub'),
        m: params.get('m')
    };

    const state = {
        currentQuestions: [],
        userAnswers: [],
        curIdx: 0,
        geminiHistory: [],
        geminiLoading: false,
        geminiOpenedForIdx: -1
    };

    function saveSession() {
        FXStorage.setExamSession(config, {
            questions: state.currentQuestions,
            answers: state.userAnswers,
            idx: state.curIdx,
            savedAt: Date.now()
        });
    }

    function loadSession() {
        const saved = FXStorage.getExamSession(config);
        if (!saved?.questions?.length) return false;

        const expired = saved.savedAt && Date.now() - saved.savedAt > 7 * 24 * 60 * 60 * 1000;
        if (expired) {
            FXStorage.clearExamSession(config);
            return false;
        }

        state.currentQuestions = saved.questions;
        state.userAnswers = Array.isArray(saved.answers) ? saved.answers : new Array(saved.questions.length).fill(null);
        state.curIdx = Number.isInteger(saved.idx) ? saved.idx : 0;
        return true;
    }

    function buildQuestions() {
        if (typeof DATA === 'undefined' || !DATA[config.sub]) {
            window.location.href = 'index.html';
            return false;
        }

        if (config.s === 'saved') {
            const queue = FXStorage.getSavedPracticeQueue();
            if (!queue?.refs?.length) {
                window.location.href = 'saved.html';
                return false;
            }

            state.currentQuestions = queue.refs.flatMap((ref) => {
                const sessionQuestions = DATA[config.sub][ref.session] || [];
                const match = sessionQuestions.find((question) => String(question.id) === String(ref.id));
                return match ? [{ ...match, session: ref.session }] : [];
            });
        } else if (config.s === 'all') {
            const pool = Object.entries(DATA[config.sub]).flatMap(([session, questions]) =>
                questions.map((question) => ({ ...question, session }))
            );
            const limit = config.sub === 'trade' ? 80 : 50;
            state.currentQuestions = pool.sort(() => Math.random() - 0.5).slice(0, limit);
        } else {
            state.currentQuestions = (DATA[config.sub][config.s] || [])
                .map((question) => ({ ...question, session: config.s }))
                .sort(() => Math.random() - 0.5);
        }

        if (!state.currentQuestions.length) {
            window.location.href = 'index.html';
            return false;
        }

        state.userAnswers = new Array(state.currentQuestions.length).fill(null);
        return true;
    }

    function getCurrentQuestion() {
        return state.currentQuestions[state.curIdx];
    }

    function getCurrentAnswer() {
        return state.userAnswers[state.curIdx];
    }

    function getAnsweredCount() {
        return state.userAnswers.filter((item) => item !== null).length;
    }

    window.FXExamCore = {
        config,
        state,
        saveSession,
        loadSession,
        buildQuestions,
        getCurrentQuestion,
        getCurrentAnswer,
        getAnsweredCount
    };
})();
