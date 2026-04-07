(function() {
    const { config, state, buildQuestions, loadSession, saveSession, getCurrentQuestion, getCurrentAnswer, getAnsweredCount } = window.FXExamCore;
    const { renderQuestion, updateHeaderTitle, updateStatus, toggleMap, updateBookmarkBtn, showResumeBanner } = window.FXExamRender;
    const { openGemini, closeGemini, sendChat } = window.FXExamGemini;

    function check(index) {
        if (config.m === 'practice' && getCurrentAnswer() === getCurrentQuestion().answer) return;
        state.userAnswers[state.curIdx] = index;
        saveSession();
        renderQuestion();
        updateStatus();
    }

    function resetCurrent() {
        if (getCurrentAnswer() === null) return;
        state.userAnswers[state.curIdx] = null;
        saveSession();
        renderQuestion();
        updateStatus();
    }

    function nextQuestion() {
        if (state.curIdx >= state.currentQuestions.length - 1) return;
        state.curIdx += 1;
        saveSession();
        renderQuestion();
        window.scrollTo(0, 0);
    }

    function prevQuestion() {
        if (state.curIdx <= 0) return;
        state.curIdx -= 1;
        saveSession();
        renderQuestion();
        window.scrollTo(0, 0);
    }

    function toggleBookmark() {
        const question = getCurrentQuestion();
        const saved = FXStorage.getSavedQuestions();
        if (!saved[config.sub]) saved[config.sub] = [];

        const existingIdx = saved[config.sub].findIndex((item) =>
            String(item.id) === String(question.id) && String(item.session) === String(question.session)
        );

        if (existingIdx === -1) {
            saved[config.sub].push({ id: question.id, session: question.session });
        } else {
            saved[config.sub].splice(existingIdx, 1);
        }

        FXStorage.setSavedQuestions(saved);
        updateBookmarkBtn();
    }

    function goHome() {
        if (!confirm('離開作答頁會清除這次進度，確定要回首頁嗎？')) return;
        FXStorage.clearExamSession(config);
        window.location.href = 'index.html';
    }

    function finish() {
        const answeredCount = getAnsweredCount();
        const unanswered = state.currentQuestions.length - answeredCount;
        const confirmed = unanswered > 0
            ? confirm(`目前還有 ${unanswered} 題未作答，確定要交卷嗎？`)
            : confirm('確定要交卷並查看結果嗎？');

        if (!confirmed) return;

        const mistakes = FXStorage.getMistakeBank();
        if (!mistakes[config.sub]) mistakes[config.sub] = [];

        let correctCount = 0;
        state.currentQuestions.forEach((question, index) => {
            if (state.userAnswers[index] === question.answer) {
                correctCount += 1;
                return;
            }

            if (state.userAnswers[index] === null) return;

            const exists = mistakes[config.sub].some((item) =>
                String(item.id) === String(question.id) && String(item.session) === String(question.session)
            );

            if (!exists) mistakes[config.sub].push({ id: question.id, session: question.session });
        });

        FXStorage.setMistakeBank(mistakes);

        const scorePerQuestion = config.sub === 'trade' ? 1.25 : 2;
        const finalScore = Math.round(correctCount * scorePerQuestion * 10) / 10;

        FXStorage.setLastResult({
            correct: correctCount,
            total: state.currentQuestions.length,
            score: finalScore,
            subject: FXConstants.getSubjectLabel(config.sub),
            session: config.s,
            mode: FXConstants.getModeLabel(config.m)
        });

        FXStorage.setLastExamFull({
            questions: state.currentQuestions.map((question) => ({ ...question, _s: question.session })),
            answers: state.userAnswers
        });

        if (config.s !== 'saved') {
            const history = FXStorage.getExamHistory();
            history.unshift({
                id: Date.now(),
                timestamp: new Date().toLocaleString(),
                correct: correctCount,
                total: state.currentQuestions.length,
                score: finalScore,
                subject: FXConstants.getSubjectLabel(config.sub),
                session: config.s,
                mode: FXConstants.getModeLabel(config.m)
            });
            FXStorage.setExamHistory(history);
        }

        FXStorage.clearExamSession(config);
        window.location.href = `result.html?score=${finalScore}&correct=${correctCount}&total=${state.currentQuestions.length}`;
    }

    function bindUI() {
        document.getElementById('nav-modal-close').addEventListener('click', toggleMap);
        document.getElementById('go-home-btn').addEventListener('click', goHome);
        document.getElementById('finish-btn').addEventListener('click', finish);
        document.getElementById('reset-current-btn').addEventListener('click', resetCurrent);
        document.getElementById('bookmark-btn').addEventListener('click', toggleBookmark);
        document.getElementById('ask-gemini-btn').addEventListener('click', openGemini);
        document.getElementById('prev-btn').addEventListener('click', prevQuestion);
        document.getElementById('nav-pos-btn').addEventListener('click', toggleMap);
        document.getElementById('next-btn').addEventListener('click', nextQuestion);
        document.getElementById('close-gemini-btn').addEventListener('click', closeGemini);
        document.getElementById('chat-send').addEventListener('click', sendChat);
        FXCommon.bindEnterToSend(document.getElementById('chat-input'), sendChat);
    }

    function init() {
        bindUI();
        updateHeaderTitle();

        if (loadSession()) {
            renderQuestion();
            updateStatus();
            showResumeBanner();
            return;
        }

        if (!buildQuestions()) return;

        saveSession();
        renderQuestion();
        updateStatus();
    }

    window.FXExamApp = {
        init,
        check,
        resetCurrent,
        nextQuestion,
        prevQuestion,
        toggleBookmark,
        finish,
        goHome
    };

    window.onload = init;
})();
