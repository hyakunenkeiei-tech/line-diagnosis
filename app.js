let appData = null;

const STEM_BRANCHES = [
  "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
  "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
  "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
  "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
  "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
  "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥"
];

// 以前の公開版で使っていた基準日（甲子日）
const BASE_JDN = gregorianToJDN(1912, 2, 18);

document.addEventListener("DOMContentLoaded", async () => {
  await loadAppData();
  document.getElementById("diagnoseBtn").addEventListener("click", diagnose);
});

async function loadAppData() {
  try {
    const response = await fetch("./rokkujikkanshi_app_data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("JSONファイルの読み込みに失敗しました。");
    }
    appData = await response.json();
  } catch (error) {
    showMessage("データの読み込みに失敗しました。3ファイルが同じ場所にあるか確認してください。");
    console.error(error);
  }
}

function diagnose() {
  clearMessage();

  if (!appData) {
    showMessage("診断データがまだ読み込まれていません。");
    return;
  }

  const birthdate = document.getElementById("birthdate").value;
  if (!birthdate) {
    showMessage("生年月日を入力してください。");
    return;
  }

  const kanshi = calculateDayKanshi(birthdate);
  if (!kanshi) {
    showMessage("日干支の計算に失敗しました。");
    return;
  }

  const resultData = appData.rokkujikkanshi.find(item => item.kanshi === kanshi);
  if (!resultData) {
    showMessage(`「${kanshi}」のデータが見つかりませんでした。`);
    return;
  }

  const stemData = appData.jikkan.find(item => item.kanji === resultData.stem);
  const branchData = appData.junishi.find(item => item.kanji === resultData.branch);

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
  document.getElementById("headline").textContent = resultData.headline || "";
  document.getElementById("profile").textContent = resultData.profile || "";

  document.getElementById("nikkan").textContent = resultData.stem || "";
  document.getElementById("kanshi").textContent = resultData.kanshi || "";
  document.getElementById("gogyo").textContent = `${resultData.stem_element || ""} × ${resultData.branch_element || ""}`;

  document.getElementById("behavior").textContent =
    branchData?.core || resultData.branch_core || "";

  document.getElementById("thinking").textContent =
    stemData?.core || resultData.stem_core || "";

  document.getElementById("relationship").textContent = makeRelationshipText(stemData, branchData, resultData);

  const strengthsEl = document.getElementById("strengths");
  strengthsEl.innerHTML = "";
  (resultData.strengths || []).forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    strengthsEl.appendChild(li);
  });

  document.getElementById("caution").textContent = resultData.caution || "";
  document.getElementById("advice").textContent = resultData.advice || "";

  const detailNoteEl = document.getElementById("detailNote");
  if (detailNoteEl) {
    detailNoteEl.textContent =
      `十干象意：${stemData?.symbol || "-"} ／ 十二支象意：${branchData?.symbol || "-"}`;
  }

  document.getElementById("result").style.display = "block";
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

function showMessage(text) {
  document.getElementById("message").textContent = text;
}

function clearMessage() {
  document.getElementById("message").textContent = "";
}
