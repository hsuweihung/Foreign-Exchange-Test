function bindSelectionGroups() {
    document.querySelectorAll('.pill').forEach((pill) => {
        pill.addEventListener('click', () => {
            pill.parentElement.querySelectorAll('.pill').forEach((item) => item.classList.remove('active'));
            pill.classList.add('active');
        });
    });
}

function getSelection(groupId) {
    return document.querySelector(`#${groupId} .active`)?.dataset.val;
}

function start() {
    const session = getSelection('session-group');
    const subject = getSelection('subject-group');
    const mode = getSelection('mode-group');
    window.location.href = `exam.html?s=${session}&sub=${subject}&m=${mode}`;
}

function initPage() {
    document.title = '初階外匯考古題練習網站';
    bindSelectionGroups();
    document.getElementById('start-btn').addEventListener('click', start);
}

initPage();
