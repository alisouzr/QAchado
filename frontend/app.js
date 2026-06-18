const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const findingTextInput = document.getElementById("findingText");
const existingFindingsInput = document.getElementById("existingFindings");
const summarizeButton = document.getElementById("summarizeBtn");
const remediationButton = document.getElementById("remediationBtn");
const duplicateButton = document.getElementById("duplicateBtn");
const resultBox = document.getElementById("resultBox");
const statusBadge = document.getElementById("statusBadge");

function setStatus(message, isError = false) {
  statusBadge.textContent = message;
  statusBadge.style.color = isError ? "var(--danger)" : "var(--accent)";
  statusBadge.style.background = isError ? "rgba(255, 123, 123, 0.12)" : "rgba(89, 214, 166, 0.12)";
}

function setResult(message) {
  resultBox.textContent = message;
}

function normalizeBaseUrl() {
  return apiBaseUrlInput.value.trim().replace(/\/$/, "");
}

function parseExistingFindings() {
  return existingFindingsInput.value
    .split("\n")
    .map((finding) => finding.trim())
    .filter(Boolean);
}

async function callApi(path, payload) {
  const response = await fetch(`${normalizeBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Falha ao chamar a API.");
  }

  return data;
}

async function runAction(actionLabel, executor) {
  const findingText = findingTextInput.value.trim();
  if (!findingText && actionLabel !== "Checar duplicidade") {
    setStatus("Informe um achado.", true);
    setResult("O campo de achado não pode ficar vazio.");
    return;
  }

  setStatus(`${actionLabel} em andamento...`);
  setResult("Processando resposta da IA...");
  summarizeButton.disabled = true;
  remediationButton.disabled = true;
  duplicateButton.disabled = true;

  try {
    const result = await executor();
    setStatus("Concluído");
    setResult(result);
  } catch (error) {
    setStatus("Erro", true);
    setResult(error.message || String(error));
  } finally {
    summarizeButton.disabled = false;
    remediationButton.disabled = false;
    duplicateButton.disabled = false;
  }
}

summarizeButton.addEventListener("click", () =>
  runAction("Gerar resumo", async () => {
    const data = await callApi("/ai/summarize", { text: findingTextInput.value.trim() });
    return data.summary;
  }),
);

remediationButton.addEventListener("click", () =>
  runAction("Sugerir remediação", async () => {
    const data = await callApi("/ai/remediation", { text: findingTextInput.value.trim() });
    return data.remediation;
  }),
);

duplicateButton.addEventListener("click", () =>
  runAction("Checar duplicidade", async () => {
    const data = await callApi("/ai/duplicate-check", {
      candidate: findingTextInput.value.trim(),
      existing_findings: parseExistingFindings(),
    });

    return [
      `Duplicado: ${data.duplicate ? "sim" : "não"}`,
      `Score: ${data.score}`,
      `Melhor correspondência: ${data.best_match || "nenhuma"}`,
    ].join("\n");
  }),
);

setResult("Use os botões para testar a IA local.");