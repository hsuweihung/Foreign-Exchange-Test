let geminiHistory = [];
let geminiLoading = false;

function initPage() {
    const data = FXStorage.getLastResult();
    const full = FXStorage.getLastExamFull();

    if (!data) {
        setTimeout(() => {
            location.href = 'index.html';
        }, 1000);
        return;
    }

    bindUI();
    animateScore(data.score);
    document.getElementById('res-correct').textContent = data.correct;
    document.getElementById('res-total').textContent = data.total;

    if (full?.questions?.length) {
        renderWrongQuestions(full);
    }
}

function animateScore(targetScore) {
    const scoreEl = document.getElementById('score-val');
    const target = parseFloat(targetScore);

    if (target === 0) {
        scoreEl.textContent = '0';
        return;
    }

    let current = 0;
    const timer = setInterval(() => {
        current += Math.ceil(target / 15);
        if (current >= target) {
            scoreEl.textContent = String(target);
            clearInterval(timer);
        } else {
            scoreEl.textContent = String(Math.floor(current));
        }
    }, 35);
}

function renderWrongQuestions(full) {
    const list = document.getElementById('wrong-list');
    let hasWrong = false;

    full.questions.forEach((question, index) => {
        const userAnswer = full.answers[index];
        if (userAnswer === null || userAnswer === question.answer) return;

        hasWrong = true;
        const div = document.createElement('div');
        div.className = 'wrong-item';
        div.innerHTML = `
            <div class="wrong-item-meta">${FXConstants.getSessionLabel(question._s || question.session)} / 題號 ${question.id}</div>
            <div class="wrong-item-text">${question.text}</div>
            <span class="ans-correct">正確答案：${question.options[question.answer]}</span>
            <span class="ans-user">你的答案：${question.options[userAnswer]}</span>
            <div class="analysis-box"><b class="analysis-title">解析：</b><br>${question.analysis || FXConstants.fallbackAnalysis}</div>
        `;
        list.appendChild(div);
    });

    if (hasWrong) {
        document.getElementById('wrong-section').classList.remove('hidden');
        fetchRecommendation(full);
    }
}

function appendResultMsg(role, text) {
    return FXCommon.appendMsg(document.getElementById('recommend-body'), role, text);
}

function typewriterResultMsg(text) {
    FXCommon.typewriterMsg(document.getElementById('recommend-body'), text);
}

async function fetchRecommendation(full) {
    const wrongItems = full.questions
        .map((question, index) => ({ question, userAnswer: full.answers[index] }))
        .filter(({ question, userAnswer }) => userAnswer !== null && userAnswer !== question.answer);

    if (!wrongItems.length) return;

    document.getElementById('gemini-recommend').style.display = 'block';

    const prompt = [
        '你是考前教練，請用繁體中文做精簡摘要。',
        '請整理為 3 點：1. 最該補強的觀念 2. 最常見的錯因 3. 下次作答提醒。',
        '每點最多 2 句，不要長篇解析。',
        wrongItems.map(({ question, userAnswer }) => {
            return [
                `- 題目：${question.text}`,
                `  你的答案：${question.options[userAnswer]}`,
                `  正確答案：${question.options[question.answer]}`
            ].join('\n');
        }).join('\n')
    ].join('\n\n');

    geminiHistory = [];
    document.getElementById('recommend-body').innerHTML = '';
    document.getElementById('result-chat-row').classList.add('hidden');

    await callGemini(prompt, { maxOutputTokens: 320, isInitial: true });
    document.getElementById('result-chat-row').classList.remove('hidden');
}

async function callGemini(userText, { maxOutputTokens = 1200, isInitial = false } = {}) {
    geminiLoading = true;

    await FXCommon.requestGemini({
        bodyEl: document.getElementById('recommend-body'),
        sendBtn: document.getElementById('result-chat-send'),
        inputEl: document.getElementById('result-chat-input'),
        history: geminiHistory,
        userText,
        temperature: 0.2,
        maxOutputTokens,
        onReply: (reply) => {
            if (isInitial) typewriterResultMsg(reply);
            else typewriterResultMsg(reply);
        },
        onError: (message) => appendResultMsg('gemini', `${FXConstants.gemini.errorPrefix}${message}`),
        onFinally: () => {
            geminiLoading = false;
            document.getElementById('result-chat-input').focus();
        }
    });
}

async function sendChat() {
    const input = document.getElementById('result-chat-input');
    const text = input.value.trim();
    if (!text || geminiLoading) return;

    input.value = '';
    appendResultMsg('user', text);
    await callGemini(text, { maxOutputTokens: 1200 });
}

function bindUI() {
    document.getElementById('result-chat-send').addEventListener('click', sendChat);
    FXCommon.bindEnterToSend(document.getElementById('result-chat-input'), sendChat);
}

window.onload = initPage;
