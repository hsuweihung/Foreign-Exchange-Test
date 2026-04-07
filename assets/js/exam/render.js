(function() {
    const { config, state, getCurrentQuestion, getCurrentAnswer, getAnsweredCount, saveSession } = window.FXExamCore;

    function updateHeaderTitle() {
        const subjectLabel = FXConstants.getSubjectLabel(config.sub);
        document.getElementById('header-title').textContent = config.s === 'saved' ? `收藏練習 - ${subjectLabel}` : subjectLabel;
    }

    function renderNavGrid() {
        const grid = document.getElementById('nav-grid');
        grid.innerHTML = '';

        state.currentQuestions.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'nav-dot';
            if (state.userAnswers[index] !== null) dot.classList.add('answered');
            if (index === state.curIdx) dot.classList.add('current');
            dot.textContent = String(index + 1);
            dot.addEventListener('click', () => {
                state.curIdx = index;
                saveSession();
                renderQuestion();
                toggleMap();
            });
            grid.appendChild(dot);
        });
    }

    function renderQuestion() {
        const labels = FXConstants.getOptionLabels();
        const question = getCurrentQuestion();
        const answer = getCurrentAnswer();

        document.getElementById('q-meta').textContent = `${FXConstants.getSessionLabel(question.session)} / 題號 ${question.id}`;
        document.getElementById('q-text').textContent = question.text;

        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';

        question.options.forEach((optionText, index) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'option';
            option.innerHTML = `<span class="option-label">${labels[index]}</span><span>${optionText}</span>`;

            if (answer !== null) {
                if (config.m === 'practice') {
                    if (index === question.answer) option.classList.add('correct');
                    else if (index === answer) option.classList.add('wrong');
                } else if (index === answer) {
                    option.classList.add('selected');
                }
            }

            option.addEventListener('click', () => window.FXExamApp.check(index));
            grid.appendChild(option);
        });

        const analysisInfo = document.getElementById('analysis-info');
        analysisInfo.innerHTML = '';
        analysisInfo.style.display = 'none';

        document.getElementById('prev-btn').disabled = state.curIdx === 0;
        document.getElementById('next-btn').disabled = state.curIdx === state.currentQuestions.length - 1;
        document.getElementById('nav-pos-btn').textContent = `${state.curIdx + 1} / ${state.currentQuestions.length}`;
        document.getElementById('ask-gemini-btn').style.display = 'inline-block';

        updateBookmarkBtn();
        window.FXExamGemini.resetForQuestion();
    }

    function updateStatus() {
        const answered = getAnsweredCount();
        document.getElementById('stat-answered').textContent = `${answered} / ${state.currentQuestions.length}`;
        document.getElementById('progress-bar').style.width = `${(answered / state.currentQuestions.length) * 100}%`;
    }

    function toggleMap() {
        const modal = document.getElementById('nav-modal');
        const isOpen = modal.style.display === 'block';
        modal.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) renderNavGrid();
    }

    function isCurrentSaved() {
        const question = getCurrentQuestion();
        const saved = FXStorage.getSavedQuestions();
        const list = saved[config.sub] || [];
        return list.some((item) => String(item.id) === String(question.id) && String(item.session) === String(question.session));
    }

    function updateBookmarkBtn() {
        const btn = document.getElementById('bookmark-btn');
        if (isCurrentSaved()) {
            btn.textContent = '已收藏';
            btn.classList.add('saved');
        } else {
            btn.textContent = '收藏';
            btn.classList.remove('saved');
        }
    }

    function showResumeBanner() {
        const banner = document.createElement('div');
        banner.id = 'resume-banner';
        banner.className = 'resume-banner';
        banner.innerHTML = `
            <span>已恢復上次進度，目前在第 ${state.curIdx + 1} 題。</span>
            <button class="resume-banner-close" type="button">知道了</button>
        `;
        document.body.appendChild(banner);
        banner.querySelector('.resume-banner-close').addEventListener('click', () => banner.remove());
        setTimeout(() => {
            if (banner.parentNode) banner.remove();
        }, 4000);
    }

    window.FXExamRender = {
        updateHeaderTitle,
        renderQuestion,
        renderNavGrid,
        updateStatus,
        toggleMap,
        isCurrentSaved,
        updateBookmarkBtn,
        showResumeBanner
    };
})();
