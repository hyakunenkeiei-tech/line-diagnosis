let appData = null;

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 甲子日の基準
const BASE_DATE_JST = "1984-02-02";

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

function calculateDayKanshi(dateString) {
  const target = parseDateAsJST(dateString);
  const base = parseDateAsJST(BASE_DATE_JST);

  if (!target || !base) return null;

  const diffMs = target.getTime() - base.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const cycleIndex = mod(diffDays, 60);

  const stem = STEMS[mod(cycleIndex, 10)];
  const branch = BRANCHES[mod(cycleIndex, 12)];

  return stem + branch;
}

function parseDateAsJST(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function mod(n, m) {
  return ((n % m) + m) % m;
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
  document.getElementById("detailNote").textContent =
    `十干象意：${stemData?.symbol || "-"} ／ 十二支象意：${branchData?.symbol || "-"}`;

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
