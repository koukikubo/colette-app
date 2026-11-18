import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// npmの推移依存をたどり、moderate以上の判定の根拠となった告知を集める。
// 依存グラフや結果が欠けている場合は、安全と推定せず検査を停止する。
export function auditAdvisories(report) {
  if (
    report.error ||
    report.auditReportVersion !== 2 ||
    !report.vulnerabilities
  ) {
    throw new Error("npm監査の正常な結果を取得できませんでした");
  }
  const total = report.metadata?.vulnerabilities?.total;
  if (
    !Number.isInteger(total) ||
    total < 0 ||
    total !== Object.keys(report.vulnerabilities).length
  ) {
    throw new Error("監査の検出総数と明細が一致しません");
  }
  const advisories = new Map();
  const walk = (name, visiting = new Set()) => {
    if (visiting.has(name)) return false;
    const item = report.vulnerabilities[name];
    if (!item || !Array.isArray(item.via) || !item.via.length) {
      throw new Error(`監査の依存経路が不完全です: ${name}`);
    }
    const next = new Set(visiting).add(name);
    let found = false;
    for (const via of item.via) {
      if (typeof via === "string") found = walk(via, next) || found;
      else if (via?.url && via?.title) {
        advisories.set(via.url, via);
        found = true;
      } else throw new Error("監査の告知情報が不完全です");
    }
    return found;
  };
  for (const [name, item] of Object.entries(report.vulnerabilities)) {
    if (["moderate", "high", "critical"].includes(item.severity)) {
      if (!walk(name)) throw new Error(`監査の根拠告知がありません: ${name}`);
    } else if (!["info", "low"].includes(item.severity)) {
      throw new Error(`監査の深刻度が不明です: ${name}`);
    }
  }
  if (
    Object.values(report.vulnerabilities).some((v) =>
      ["moderate", "high", "critical"].includes(v.severity),
    ) &&
    !advisories.size
  ) {
    throw new Error("監査の根拠となる告知を解決できませんでした");
  }
  return [...advisories.values()];
}

// npm側への撤回情報の反映が遅れる場合だけ、公式GitHub告知で撤回を照合する。
// 個別CVEの無条件除外や期限なしの許可リストは設けない。
export async function isWithdrawn(url, request = fetch) {
  const match = /^https:\/\/github\.com\/advisories\/(GHSA-[a-z0-9-]+)$/.exec(
    url,
  );
  if (!match) return false;
  const response = await request(
    `https://api.github.com/advisories/${match[1]}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(`公式告知の照合に失敗しました: HTTP ${response.status}`);
  const advisory = await response.json();
  if (advisory.ghsa_id !== match[1])
    throw new Error("公式告知のIDが一致しません");
  if (advisory.withdrawn_at == null) return false;
  const withdrawn = Date.parse(advisory.withdrawn_at);
  if (!Number.isFinite(withdrawn) || withdrawn > Date.now())
    throw new Error("撤回日時が不正です");
  return true;
}

// 監査そのものの失敗と脆弱性の検出を区別し、撤回済み以外は従来どおり失敗させる。
export async function checkAudit(report, withdrawn = isWithdrawn) {
  const advisories = auditAdvisories(report);
  const active = [];
  for (const advisory of advisories) {
    if (await withdrawn(advisory.url))
      console.log(`公式撤回済み: ${advisory.url}`);
    else active.push(advisory);
  }
  return active;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const result = spawnSync(
      "npm",
      ["audit", "--json", "--audit-level=moderate"],
      {
        encoding: "utf8",
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    if (process.env.NPM_AUDIT_REPORT)
      writeFileSync(process.env.NPM_AUDIT_REPORT, result.stdout ?? "");
    if (result.error || ![0, 1].includes(result.status))
      throw new Error("npm監査の実行に失敗しました");
    const report = JSON.parse(result.stdout);
    const active = await checkAudit(report);
    console.log(`npm監査: 撤回されていない要対応告知 ${active.length}件`);
    for (const item of active)
      console.error(`${item.severity}: ${item.title} ${item.url}`);
    process.exitCode = active.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
