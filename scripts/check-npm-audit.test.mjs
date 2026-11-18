import assert from "node:assert/strict";
import test from "node:test";
import {
  auditAdvisories,
  checkAudit,
  isWithdrawn,
} from "./check-npm-audit.mjs";
const url = "https://github.com/advisories/GHSA-fc5q-39xc-vjpf";
const report = () => ({
  auditReportVersion: 2,
  metadata: { vulnerabilities: { total: 2 } },
  vulnerabilities: {
    parent: { severity: "high", via: ["child"] },
    child: { severity: "high", via: [{ title: "ReDoS", url }] },
  },
});
test("推移依存の同じ告知を一度だけ照合する", async () => {
  let calls = 0;
  assert.deepEqual(
    await checkAudit(report(), async () => {
      calls++;
      return true;
    }),
    [],
  );
  assert.equal(calls, 1);
});
test("有効な告知はmoderate以上で失敗対象に残す", async () => {
  const data = report();
  data.vulnerabilities.child.severity = "moderate";
  assert.equal((await checkAudit(data, async () => false)).length, 1);
});
test("公式確認の通信障害を成功扱いしない", async () => {
  await assert.rejects(
    checkAudit(report(), async () => {
      throw new Error("network");
    }),
  );
});
test("監査自体のエラー・不完全なグラフ・不明な深刻度を拒否する", () => {
  assert.throws(() => auditAdvisories({ error: { code: "E500" } }));
  const data = report();
  delete data.vulnerabilities.child;
  assert.throws(() => auditAdvisories(data));
  const unknown = report();
  unknown.vulnerabilities.child.severity = "unknown";
  assert.throws(() => auditAdvisories(unknown));
});
test("循環だけで根拠告知が存在しない監査を拒否する", () => {
  const data = report();
  data.vulnerabilities.child.via = ["parent"];
  assert.throws(() => auditAdvisories(data));
});
const response =
  (body, ok = true) =>
  async () => ({ ok, status: ok ? 200 : 429, json: async () => body });
test("公式告知のIDと撤回日時が一致する場合だけ撤回済みとする", async () => {
  assert.equal(
    await isWithdrawn(
      url,
      response({
        ghsa_id: "GHSA-fc5q-39xc-vjpf",
        withdrawn_at: "2026-01-01T00:00:00Z",
      }),
    ),
    true,
  );
  assert.equal(
    await isWithdrawn(
      url,
      response({ ghsa_id: "GHSA-fc5q-39xc-vjpf", withdrawn_at: null }),
    ),
    false,
  );
  await assert.rejects(
    isWithdrawn(
      url,
      response({ ghsa_id: "other", withdrawn_at: "2026-01-01" }),
    ),
  );
  await assert.rejects(
    isWithdrawn(
      url,
      response({ ghsa_id: "GHSA-fc5q-39xc-vjpf", withdrawn_at: "invalid" }),
    ),
  );
  await assert.rejects(isWithdrawn(url, response({}, false)));
});
test("GitHub公式以外のURLは撤回済みと推測しない", async () => {
  assert.equal(
    await isWithdrawn("https://example.com/GHSA-test", () => {
      throw new Error("must not fetch");
    }),
    false,
  );
});
test("検出がない正常な監査は追加通信せず成功する", async () => {
  assert.deepEqual(
    await checkAudit(
      {
        auditReportVersion: 2,
        metadata: { vulnerabilities: { total: 0 } },
        vulnerabilities: {},
      },
      () => {
        throw new Error("must not fetch");
      },
    ),
    [],
  );
});

test("別の撤回告知があっても根拠不明な循環依存を見逃さない", () => {
  const data = report();
  data.vulnerabilities.child.via = ["parent"];
  data.vulnerabilities.other = {
    severity: "high",
    via: [{ title: "Withdrawn", url }],
  };
  data.metadata.vulnerabilities.total = 3;
  assert.throws(() => auditAdvisories(data));
});
