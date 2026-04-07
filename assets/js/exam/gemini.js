(function() {
    const { config, state, getCurrentQuestion } = window.FXExamCore;

    function closeGemini() {
        FXCommon.closeDrawer();
    }

    function appendMsg(role, text) {
        return FXCommon.appendMsg(document.getElementById('chat-body'), role, text);
    }

    function typewriterMsg(text) {
        FXCommon.typewriterMsg(document.getElementById('chat-body'), text);
    }

    function resetForQuestion() {
        closeGemini();
        state.geminiHistory = [];
        state.geminiOpenedForIdx = -1;
    }

    async function callGemini(userText) {
        state.geminiLoading = true;

        await FXCommon.requestGemini({
            bodyEl: document.getElementById('chat-body'),
            sendBtn: document.getElementById('chat-send'),
            inputEl: document.getElementById('chat-input'),
            history: state.geminiHistory,
            userText,
            temperature: 0.3,
            maxOutputTokens: 900,
            onReply: (reply) => typewriterMsg(reply),
            onError: (message) => appendMsg('gemini', `${FXConstants.gemini.errorPrefix}${message}`),
            onFinally: () => {
                state.geminiLoading = false;
            }
        });
    }

    function openGemini() {
        FXCommon.openDrawer();

        if (state.geminiOpenedForIdx === state.curIdx) return;

        const question = getCurrentQuestion();
        state.geminiOpenedForIdx = state.curIdx;
        state.geminiHistory = [];
        document.getElementById('chat-body').innerHTML = '';

        const prompt = FXCommon.buildQuestionPrompt({
            questionText: question.text,
            options: question.options,
            answerIndex: question.answer,
            mode: config.m,
            detailLevel: 'full'
        });

        callGemini(prompt);
    }

    async function sendChat() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || state.geminiLoading) return;

        input.value = '';
        appendMsg('user', text);
        await callGemini(text);
    }

    window.FXExamGemini = {
        openGemini,
        closeGemini,
        sendChat,
        resetForQuestion
    };
})();
