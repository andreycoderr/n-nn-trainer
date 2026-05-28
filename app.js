(function () {
  "use strict";

  var words = window.WORDS || [];
  if (!words.length) {
    console.error("WORDS не загружены");
    return;
  }

  var SESSION_SIZE = 10;
  var STREAK_FIRE_FROM = 3;

  var els = {
    word:     document.getElementById("wordDisplay"),
    pos:      document.getElementById("partOfSpeech"),
    choices:  document.getElementById("choices"),
    feedback: document.getElementById("feedback"),
    verdict:  document.getElementById("verdict"),
    fullWord: document.getElementById("fullWord"),
    ruleText: document.getElementById("ruleText"),
    nextBtn:  document.getElementById("nextBtn"),
    right:    document.getElementById("rightCount"),
    wrong:    document.getElementById("wrongCount"),
    streak:   document.getElementById("streakCount"),
    streakWrap: document.querySelector(".stat--streak"),
    streakIcon: document.getElementById("streakIcon"),
    reset:    document.getElementById("resetBtn"),
    confetti: document.getElementById("confetti"),
    dots:     document.getElementById("progressDots"),
  };

  var state = {
    queue: shuffle(words.slice()),
    cursor: 0,
    right: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    answered: false,
    current: null,
    sessionResults: [],
  };

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function nextWord() {
    if (state.cursor >= state.queue.length) {
      state.queue = shuffle(words.slice());
      state.cursor = 0;
    }
    return state.queue[state.cursor++];
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderDots() {
    var html = "";
    for (var i = 0; i < SESSION_SIZE; i++) {
      var cls = "dot";
      if (i < state.sessionResults.length) {
        cls += state.sessionResults[i] ? " is-right" : " is-wrong";
      } else if (i === state.sessionResults.length) {
        cls += " is-current";
      }
      html += '<span class="' + cls + '"></span>';
    }
    els.dots.innerHTML = html;
  }

  function render() {
    if (state.sessionResults.length >= SESSION_SIZE) {
      state.sessionResults = [];
    }

    state.current = nextWord();
    state.answered = false;

    els.pos.textContent = state.current.pos;
    els.word.innerHTML =
      '<span class="part">' + escapeHtml(state.current.prefix) + '</span>' +
      '<span class="gap" id="gap">__</span>' +
      '<span class="part">' + escapeHtml(state.current.suffix) + '</span>';

    Array.prototype.forEach.call(els.choices.querySelectorAll(".choice"), function (b) {
      b.disabled = false;
      b.classList.remove("is-right", "is-wrong");
    });

    els.feedback.hidden = true;
    els.feedback.classList.remove("is-right", "is-wrong");

    renderDots();
  }

  function buildHighlightedWord(isRight) {
    var color = isRight ? "var(--right-ink)" : "var(--wrong-ink)";
    return escapeHtml(state.current.prefix) +
      '<b style="color:' + color + '">' + state.current.answer + "</b>" +
      escapeHtml(state.current.suffix);
  }

  function fireConfetti() {
    if (!els.confetti) return;
    var colors = ["#7d40ff", "#c25bff", "#ff6a3d", "#ffb84d", "#11b87a", "#28c5ff"];
    var pieces = 28;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < pieces; i++) {
      var piece = document.createElement("i");
      piece.style.left = (10 + Math.random() * 80) + "%";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      piece.style.animationDelay = (Math.random() * 0.15) + "s";
      piece.style.animationDuration = (1.1 + Math.random() * 0.6) + "s";
      frag.appendChild(piece);
    }
    els.confetti.innerHTML = "";
    els.confetti.appendChild(frag);
    setTimeout(function () { els.confetti.innerHTML = ""; }, 1800);
  }

  function updateStreakBadge() {
    if (state.streak >= STREAK_FIRE_FROM) {
      els.streakWrap.classList.add("is-fire");
      els.streakIcon.textContent = "🔥";
    } else {
      els.streakWrap.classList.remove("is-fire");
      els.streakIcon.textContent = "★";
    }
  }

  function answer(choice) {
    if (state.answered) return;
    state.answered = true;

    var correct = choice === state.current.answer;
    var gap = document.getElementById("gap");
    if (gap) {
      gap.textContent = choice;
      gap.classList.add(correct ? "is-right" : "is-wrong");
    }

    Array.prototype.forEach.call(els.choices.querySelectorAll(".choice"), function (b) {
      b.disabled = true;
      if (b.dataset.answer === state.current.answer) b.classList.add("is-right");
      if (!correct && b.dataset.answer === choice) b.classList.add("is-wrong");
    });

    if (correct) {
      state.right++;
      state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      els.feedback.classList.add("is-right");
      els.verdict.textContent = randomPraise();
      fireConfetti();
    } else {
      state.wrong++;
      state.streak = 0;
      els.feedback.classList.add("is-wrong");
      els.verdict.textContent = "Ошибка. Правильно: " + state.current.answer + ".";
    }

    state.sessionResults.push(correct);

    els.fullWord.innerHTML = "Слово: " + buildHighlightedWord(correct);
    els.ruleText.textContent = state.current.rule;
    els.feedback.hidden = false;

    updateScores();
    updateStreakBadge();
    renderDots();
  }

  function randomPraise() {
    var p = [
      "Верно! 👏",
      "Точно в цель ✨",
      "Молодец! 🌟",
      "Так держать! 🎯",
      "Превосходно ✅",
      "Чисто! 💫",
    ];
    return p[Math.floor(Math.random() * p.length)];
  }

  function updateScores() {
    els.right.textContent  = state.right;
    els.wrong.textContent  = state.wrong;
    els.streak.textContent = state.streak;
  }

  function reset() {
    state.right = 0;
    state.wrong = 0;
    state.streak = 0;
    state.sessionResults = [];
    state.queue = shuffle(words.slice());
    state.cursor = 0;
    updateScores();
    updateStreakBadge();
    render();
  }

  // ── События
  els.choices.addEventListener("click", function (e) {
    var btn = e.target.closest(".choice");
    if (!btn) return;
    answer(btn.dataset.answer);
  });

  els.nextBtn.addEventListener("click", render);
  els.reset.addEventListener("click", reset);

  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (state.answered) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        render();
      }
      return;
    }
    if (e.key === "1" || e.key.toLowerCase() === "н") answer("Н");
    else if (e.key === "2") answer("НН");
  });

  render();
  updateScores();
  updateStreakBadge();
})();
