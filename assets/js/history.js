let myChart = null;
let currentTab = 'exchange';
let fullHistory = [];
let geminiHistory = [];
let geminiLoading = false;

const chartLimitLinePlugin = {
    id: 'chartLimitLine',
    afterDraw(chart, args, options) {
        const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
        if (!options.value) return;

        const yValue = y.getPixelForValue(options.value);
        if (yValue < top || yValue > bottom) return;

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#8b2020';
        ctx.setLineDash([6, 4]);
        ctx.moveTo(left, yValue);
        ctx.lineTo(right, yValue);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = 'bold 11px Noto Serif TC, serif';
        ctx.fillStyle = '#8b2020';
        ctx.textAlign = 'right';
        ctx.fillText(options.label || '及格線', right, yValue - 5);
        ctx.restore();
    }
};
Chart.register(chartLimitLinePlugin);

function initPage() {
    bindUI();
    fullHistory = FXStorage.getExamHistory();
    if (fullHistory.length > 0) {
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('empty-state').classList.add('hidden');
        renderPage();
    }
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === tab);
    });
    renderPage();
}

function renderPage() {
    const filterKey = FXConstants.getHistorySubjectLabel(currentTab);
    const filteredData = fullHistory.filter((item) => item.subject.includes(filterKey));
    document.getElementById('current-subject-label').textContent = `${filterKey}最高分`;

    const scores = filteredData.map((item) => item.score);
    document.getElementById('top-score').textContent = scores.length ? Math.max(...scores) : 0;

    const tbody = document.getElementById('history-body');
    tbody.innerHTML = filteredData.length > 0
        ? filteredData.map((item) => {
            const sessionLabel = FXConstants.getSessionLabel(item.session);
            const resultLabel = item.score >= FXConstants.historyPassScore ? '通過' : '未通過';
            return `
                <tr>
                    <td>${item.timestamp.split(' ')[0].slice(5)}</td>
                    <td class="history-mode-cell">${item.mode} / ${sessionLabel}</td>
                    <td class="history-score-cell">${item.score}</td>
                    <td class="${item.score >= FXConstants.historyPassScore ? 'history-pass' : 'history-fail'}">${resultLabel}</td>
                </tr>
            `;
        }).join('')
        : '<tr><td colspan="4" class="history-empty-row">這個科目還沒有作答紀錄。</td></tr>';

    renderChart(filteredData);
}

function renderChart(data) {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    if (myChart) myChart.destroy();

    const chartData = [...data].reverse();
    const color = currentTab === 'exchange' ? '#b8860b' : '#2a5a8a';

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map((item) => item.timestamp.split(' ')[0].slice(5)),
            datasets: [{
                data: chartData.map((item) => item.score),
                borderColor: color,
                backgroundColor: `${color}15`,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: '#eee' }, ticks: { font: { family: 'DM Mono' } } },
                x: { grid: { display: false }, ticks: { font: { family: 'DM Mono', size: 10 } } }
            },
            plugins: {
                legend: { display: false },
                chartLimitLine: { value: FXConstants.historyPassScore, label: `及格線 ${FXConstants.historyPassScore}` }
            }
        }
    });
}

function clearAll() {
    if (!confirm('確定要清空所有作答紀錄嗎？')) return;
    FXStorage.remove(FXConstants.storageKeys.examHistory);
    FXStorage.remove(FXConstants.storageKeys.mistakeBank);
    location.reload();
}

function buildWeaknessPrompt() {
    const mistakes = FXStorage.getMistakeBank();
    const subjectKey = currentTab === 'exchange' ? 'remittance' : 'trade';
    const subjectName = FXConstants.getSubjectLabel(subjectKey);
    const refs = mistakes[subjectKey] || [];
    if (!refs.length) return null;

    const wrongTexts = [];
    refs.forEach((ref) => {
        const questions = DATA[subjectKey]?.[ref.session] || [];
        const question = questions.find((item) => String(item.id) === String(ref.id));
        if (question) {
            wrongTexts.push(`- ${FXConstants.getSessionLabel(ref.session)} / 題號 ${question.id}：${question.text}`);
        }
    });

    if (!wrongTexts.length) return null;

    return FXCommon.buildWeaknessPrompt({ subjectName, wrongTexts });
}

async function analyzeWeakness() {
    const prompt = buildWeaknessPrompt();
    if (!prompt) {
        alert('目前沒有足夠的錯題資料可以分析。');
        return;
    }

    FXCommon.openDrawer();
    document.getElementById('chat-body').innerHTML = '';
    geminiHistory = [];
    await callGemini(prompt);
}

function closeDrawer() {
    FXCommon.closeDrawer();
}

function appendMsg(role, text) {
    return FXCommon.appendMsg(document.getElementById('chat-body'), role, text);
}

function typewriterMsg(text) {
    FXCommon.typewriterMsg(document.getElementById('chat-body'), text);
}

async function callGemini(userText) {
    geminiLoading = true;

    await FXCommon.requestGemini({
        bodyEl: document.getElementById('chat-body'),
        sendBtn: document.getElementById('chat-send'),
        inputEl: document.getElementById('chat-input'),
        history: geminiHistory,
        userText,
        temperature: 0.3,
        maxOutputTokens: 2048,
        onReply: (reply) => typewriterMsg(reply),
        onError: (message) => appendMsg('gemini', `${FXConstants.gemini.errorPrefix}${message}`),
        onFinally: () => {
            geminiLoading = false;
            document.getElementById('chat-input').focus();
        }
    });
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || geminiLoading) return;

    input.value = '';
    appendMsg('user', text);
    await callGemini(text);
}

function bindUI() {
    document.getElementById('clear-history-btn').addEventListener('click', clearAll);
    document.getElementById('analyze-weakness-btn').addEventListener('click', analyzeWeakness);
    document.getElementById('close-drawer-btn').addEventListener('click', closeDrawer);
    document.getElementById('chat-send').addEventListener('click', sendChat);
    FXCommon.bindEnterToSend(document.getElementById('chat-input'), sendChat);
    document.querySelectorAll('.tab').forEach((button) => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
}

window.onload = initPage;
