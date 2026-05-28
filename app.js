(function () {
  "use strict";

  var words = window.WORDS || [];
  if (!words.length) {
    console.error("WORDS не загружены");
    return;
  }

  var els = {
    word:    document.getElementById("wordDisplay"),
    pos:     document.getElementById("partOfSpeech"),
    choices: document.getElementById("choices"),
    feedback:document.getElementById("feedback"),
    verdict: document.getElementById("verdict"),
    fullWord:document.getElementById("fullWord"),
    ruleText:document.getElementById("ruleText"),
    nextBtn: document.getElementById("nextBtn"),
    right:   document.getElementById("rightCount"),
    wrong:   document.getElementById("wrongCount"),
    streak:  document.getElementById("streakCount"),
    reset:   document.getElementById("resetBtn"),
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

  function render() {
    state.current = nextWord();
    state.answered = false;

    els.pos.textContent = state.current.pos;
    els.word.innerHTML =
      escapeHtml(state.current.prefix) +
      '<span class="gap" id="gap">__</span>' +
      escapeHtml(state.current.suffix);

    Array.prototype.forEach.call(els.choices.querySelectorAll(".choice"), function (b) {
      b.disabled = false;
      b.classList.remove("is-right", "is-wrong");
    });

    els.feedback.hidden = true;
    els.feedback.classList.remove("is-right", "is-wrong");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlightInWord(answer, isRight) {
    var marker = "<b>" + answer + "</b>";
    var full = escapeHtml(state.current.word);
    // Заменим первую "нн" или "н" перед буквами суффикса на выделенную.
    // Для надёжности — соберём заново по prefix/answer/suffix:
    var rebuilt =
      escapeHtml(state.current.prefix) +
      '<b style="color:' + (isRight ? "#2eb872" : "#e0533d") + '">' + state.current.answer + "</b>" +
      escapeHtml(state.current.suffix);
    return rebuilt;
  }

  function answer(choice) {
    if (state.answered) return;
    state.answered = true;

    var correct = choice === state.current.answer;
    var gap = document.getElementById("gap");
    if (gap) {
      gap.textContent = choice;
      gap.classList.add("gap--filled", correct ? "gap--right" : "gap--wrong");
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
    } else {
      state.wrong++;
      state.streak = 0;
      els.feedback.classList.add("is-wrong");
      els.verdict.textContent = "Ошибка. Правильно: " + state.current.answer + ".";
    }

    els.fullWord.innerHTML = "Слово: " + highlightInWord(state.current.answer, correct);
    els.ruleText.textContent = state.current.rule;
    els.feedback.hidden = false;

    updateScores();
  }

  function randomPraise() {
    var p = ["Верно! 👍", "Точно! ✨", "Молодец! 🌟", "Так держать! 🎯", "Правильно! ✅"];
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
    state.queue = shuffle(words.slice());
    state.cursor = 0;
    updateScores();
    render();
  }

  // ── Привязка событий
  els.choices.addEventListener("click", function (e) {
    var btn = e.target.closest(".choice");
    if (!btn) return;
    answer(btn.dataset.answer);
  });

  els.nextBtn.addEventListener("click", render);
  els.reset.addEventListener("click", reset);

  document.addEventListener("keydown", function (e) {
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
})();
