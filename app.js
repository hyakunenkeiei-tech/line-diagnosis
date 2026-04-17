let appData = null;

const STEM_BRANCHES = [
  "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
  "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
  "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
  "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
  "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
  "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥"
];

const BASE_JDN = gregorianToJDN(1912, 2, 18);

const shareMessages = [
  "自分を知ることは、自分をやさしく受け入れる第一歩です。",
  "あなたの本質は、もう十分に価値があります。",
  "頑張りすぎなくても、あなたらしさはちゃんと伝わります。",
  "今のあなたに必要なのは、無理ではなく調和かもしれません。",
  "答えは、外ではなく、まず自分の中にあります。",
  "あなたが自然体でいるほど、本来の魅力は輝きます。",
  "焦らなくても、あなたの流れはちゃんと育っています。",
  "今ここにある自分を大切にすることが、次の一歩につながります。"
];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAppData();

    const diagnoseBtn = document.getElementById("diagnoseBtn");
    if (diagnoseBtn) {
      diagnoseBtn.addEventListener("click", diagnose);
    }

    const retryBtn = document.getElementById("retryBtn");
    if (retryBtn) {
      retryBtn.addEventListener("click", resetDiagnosis);
    }
  } catch (error) {
    console.error("初期化エラー:", error);
    showMessage("初期化時にエラーが発生しました。app.js と JSON の配置を確認してください。");
  }
});

async function loadAppData() {
  try {
    const response = await fetch("./rokkujikkanshi_app_data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("JSONファイルの読み込みに失敗しました。");
    }
    appData = await response.json();
  } catch (error) {
    console.error("JSON読み込みエラー:", error);
    showMessage("診断データの読み込みに失敗しました。rokkujikkanshi_app_data.json が同じ場所にあるか確認してください。");
  }
}

function diagnose() {
  clearMessage();

  if (!appData) {
    showMessage("診断データがまだ読み込まれていません。JSONファイルを確認してください。");
    return;
  }

  const birthdateEl = document.getElementById("birthdate");
  const birthdate = birthdateEl ? birthdateEl.value : "";

  if (!birthdate) {
    showMessage("生年月日を入力してください。");
    return;
  }

  const kanshi = calculateDayKanshi(birthdate);
  if (!kanshi) {
    showMessage("日干支の計算に失敗しました。");
    return;
  }

  const resultData = appData.rokkujikkanshi?.find(item => item.kanshi === kanshi);
  if (!resultData) {
    showMessage(`「${kanshi}」のデータが見つかりませんでした。JSONデータを確認してください。`);
    return;
  }

  const stemData = appData.jikkan?.find(item => item.kanji === resultData.stem) || {};
  const branchData = appData.junishi?.find(item => item.kanji === resultData.branch) || {};

  renderResult(resultData, stemData, branchData);
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return day
    + Math.floor((153 * m + 2) / 5)
    + 365 * y
    + Math.floor(y / 4)
    - Math.floor(y / 100)
    + Math.floor(y / 400)
    - 32045;
}

function calculateDayKanshi(dateString) {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) return null;

  const jdn = gregorianToJDN(year, month, day);
  const index = mod(jdn - BASE_JDN, 60);
  return STEM_BRANCHES[index];
}

function renderResult(resultData, stemData, branchData) {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  };

  setText("headline", resultData.headline);
  setText("profile", resultData.profile);
  setText("nikkan", resultData.stem);
  setText("kanshi", resultData.kanshi);
  setText("gogyo", `${resultData.stem_element || ""} × ${resultData.branch_element || ""}`);
  setText("behavior", branchData.core || resultData.branch_core || "");
  setText("thinking", stemData.core || resultData.stem_core || "");
  setText("relationship", makeRelationshipText(stemData, branchData, resultData));
  setText("caution", resultData.caution);
  setText("advice", resultData.advice);
  setText("shareMessage", getRandomShareMessage());

  const strengthsEl = document.getElementById("strengths");
  if (strengthsEl) {
    strengthsEl.innerHTML = "";
    (resultData.strengths || []).forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      strengthsEl.appendChild(li);
    });
  }

  const resultEl = document.getElementById("result");
  if (resultEl) {
    resultEl.style.display = "block";
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function makeRelationshipText(stemData, branchData, resultData) {
  const stemTone = stemData?.core || resultData.stem_core || "";
  const branchTone = branchData?.core || resultData.branch_core || "";

  if (stemTone && branchTone) {
    return `${stemTone}を土台に、${branchTone}として人とかかわる傾向があります。`;
  }
  if (stemTone) {
    return `${stemTone}を土台に人とかかわる傾向があります。`;
  }
  if (branchTone) {
    return `${branchTone}として人とかかわる傾向があります。`;
  }
  return "人との関わりの中で、その人らしさが少しずつ表に出やすいタイプです。";
}

function getRandomShareMessage() {
  const index = Math.floor(Math.random() * shareMessages.length);
  return shareMessages[index];
}

function resetDiagnosis() {
  const birthdateEl = document.getElementById("birthdate");
  if (birthdateEl) {
    birthdateEl.value = "";
    birthdateEl.focus();
    birthdateEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const resultEl = document.getElementById("result");
  if (resultEl) {
    resultEl.style.display = "none";
  }

  clearMessage();
}

function showMessage(text) {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.textContent = text;
  }
}

function clearMessage() {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.textContent = "";
  }
}
