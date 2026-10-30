import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { BlindDataError, MAX_DATA_BYTES, parseBlindData } from "../scripts/lib/blind-data";

// 형식 검사 전용 픽스처. 독립 평가 데이터나 탐지 품질의 정답으로 사용하지 않는다.
// 탐지 함수는 호출하지 않으며 임시 JSON은 각 테스트가 끝나면 삭제한다.
function fixture(size = 24): Record<string, unknown>[] {
  return Array.from({ length: size }, (_, index) => ({
    id: `TEST_${index + 1}`,
    expected: index < 10 ? "scam" : index < 20 ? "benign" : "borderline",
    category: "형식 검사 전용",
    message: "[형식 검사 전용 문장]"
  }));
}

function parse(value: unknown) {
  return parseBlindData(Buffer.from(JSON.stringify(value)));
}

function invalid(value: unknown, reason: RegExp) {
  assert.throws(() => parse(value), error => error instanceof BlindDataError && reason.test(error.message));
}

test("평가 형식: 24건과 200건 허용, 라벨별 집계", () => {
  assert.deepEqual(parse(fixture()).counts, { scam: 10, benign: 10, borderline: 4 });
  assert.equal(parse(fixture(200)).cases.length, 200);
});

test("평가 형식: 잘못된 JSON·UTF-8·크기 상한 거부", () => {
  for (const raw of [Buffer.from('[{"message":"비공개 검사 문구",}]'), Buffer.from([0xff])]) {
    assert.throws(() => parseBlindData(raw), /UTF-8/);
  }
  assert.throws(() => parseBlindData(Buffer.alloc(MAX_DATA_BYTES + 1, " ")), /256KiB/);
});

test("평가 형식: 최상위 배열과 24~200건 조건 강제", () => {
  for (const value of [null, {}, "문자열"]) invalid(value, /배열/);
  for (const size of [0, 23, 201]) invalid(fixture(size), /24~200/);
});

test("평가 형식: 각 라벨 최소 구성 미달 거부", () => {
  for (const [index, label] of [[0, "benign"], [10, "borderline"], [20, "scam"]] as const) {
    const data = fixture();
    data[index].expected = label;
    invalid(data, /분류 구성 부족/);
  }
});

test("평가 형식: 행 객체·필수 필드·추가 필드 검사", () => {
  for (const value of [null, [], "문장"]) {
    const data: unknown[] = fixture();
    data[23] = value;
    invalid(data, /사례 24: JSON 객체/);
  }
  for (const field of ["id", "expected", "category", "message"]) {
    const data = fixture();
    delete data[0][field];
    invalid(data, /필수 필드/);
  }
  const data = fixture();
  data[0].result = "임의 결과 금지";
  invalid(data, /허용 필드/);
});

test("평가 형식: ID 형식·길이·중복 검사", () => {
  for (const id of [null, 1, "x", "EX 01", "lowercase", "X".repeat(33)]) {
    const data = fixture();
    data[0].id = id;
    invalid(data, /id는/);
  }
  const data = fixture();
  data[23].id = data[0].id;
  invalid(data, /사례 24: 중복 ID/);
});

test("평가 형식: 라벨·범주·메시지 타입과 길이 검사", () => {
  for (const [field, values, reason] of [
    ["expected", [null, true, "SCAM", "unknown"], /expected는/],
    ["category", [null, 1, " ", "가", "가".repeat(81)], /category는/],
    ["message", [null, [], "", " \n ", "가".repeat(2001)], /message는/]
  ] as const) {
    for (const value of values) {
      const data = fixture();
      data[0][field] = value;
      invalid(data, reason);
    }
  }
  const data = fixture();
  data[0].category = "가".repeat(80);
  data[0].message = "가".repeat(2000);
  assert.equal(parse(data).cases.length, 24);
});

test("평가 형식: 합성 번호·이메일·URL 형식 거부, 원문 값은 오류에 미포함", () => {
  // 실제 개인정보가 아닌 무효·검사용 값들이다.
  const values = [
    "000-0000-0000", "000.0000.0000", "02-000-0000", "000 0000 0000",
    "000000-0000000", "0000000000000", "schema-test@example.invalid",
    "000-00-000000", "0000 0000 0000 0000", "０００－００００－００００",
    "https://example.invalid/path", "www.example.invalid"
  ];
  for (const field of ["category", "message"]) {
    for (const value of values) {
      const data = fixture();
      data[0][field] = value;
      assert.throws(() => parse(data), error => {
        assert.ok(error instanceof BlindDataError);
        assert.match(error.message, /형식이 있습니다/);
        assert.ok(!error.message.includes(value));
        return true;
      });
    }
  }
  const data = fixture();
  data[0].id = "0000000000000";
  invalid(data, /id에.*형식/);
});

test("평가 형식: 문자 대체 표시와 날짜 허용", () => {
  const data = fixture();
  data[0].message = "[가상연락처] [가상계좌] [가상링크] [가상비밀번호] 2026-10-30";
  assert.equal(parse(data).cases.length, 24);
});

function withTemp(run: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "k-safe-blind-format-"));
  try { run(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

function cli(...args: string[]) {
  const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/evaluate-blind.ts", ...args], {
    cwd: process.cwd(), encoding: "utf8", timeout: 20_000
  });
  assert.ifError(result.error);
  return result;
}

function noEvaluation(output: string) {
  assert.doesNotMatch(output, /true_positive|false_positive_rate|sensitivity_recall|node:internal|\n\s+at /);
}

test("평가 CLI: 없는 파일에 경로·작성 안내·다음 명령 출력, 평가 미실행", () => {
  withTemp(dir => {
    const path = join(dir, "missing.json");
    const result = cli(path);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    for (const expected of ["DATA_FILE=NOT_FOUND", path, "BLIND-EVALUATOR-GUIDE", "--validate-only", "EVALUATION=NOT_RUN", "EVALUATOR_READY / DATA_PENDING"]) {
      assert.ok(result.stderr.includes(expected));
    }
    noEvaluation(result.stderr);
  });
});

test("평가 CLI: 잘못된 JSON·빈 양식·마지막 행 오류도 평가 없이 거부", () => {
  withTemp(dir => {
    const path = join(dir, "invalid.json");
    const badLastRow = fixture();
    badLastRow[23].expected = "unknown";
    for (const contents of ['{"private":"출력하면 안 되는 원문",}', "[]", JSON.stringify(badLastRow)]) {
      writeFileSync(path, contents);
      const result = cli(path);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /DATA_FILE=INVALID/);
      assert.match(result.stderr, /VALIDATION=FAIL/);
      assert.match(result.stderr, /EVALUATION=NOT_RUN/);
      assert.doesNotMatch(result.stderr, /출력하면 안 되는 원문/);
      assert.equal(result.stdout, "");
      noEvaluation(result.stderr);
    }
  });
});

test("평가 CLI: 형식 검증 전용 모드는 해시·건수만 제공, 점수·원문 없음", () => {
  withTemp(dir => {
    const path = join(dir, "format only 'quoted'.json");
    const raw = JSON.stringify(fixture());
    writeFileSync(path, raw);
    const result = cli("--validate-only", path);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    const report = JSON.parse(result.stdout);
    assert.equal(report.validation, "PASS");
    assert.equal(report.evaluation, "NOT_RUN");
    assert.equal(report.sample_size, 24);
    assert.equal(report.data_sha256, createHash("sha256").update(raw).digest("hex"));
    assert.match(report.human_review, /REQUIRED/);
    assert.doesNotMatch(result.stdout, /형식 검사 전용 문장/);
    noEvaluation(result.stdout);
    assert.equal(readFileSync(path, "utf8"), raw);
  });
});

test("평가 CLI: 디렉터리·큰 파일·확장자·잘못된 인수도 스택 없이 안내", () => {
  withTemp(dir => {
    const directory = join(dir, "directory.json");
    mkdirSync(directory);
    const large = join(dir, "large.json");
    writeFileSync(large, Buffer.alloc(MAX_DATA_BYTES + 1));
    for (const args of [[directory], [large], [join(dir, "file.txt")], ["--unknown"], ["one.json", "two.json"]]) {
      const result = cli(...args);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /EVALUATION=NOT_RUN/);
      assert.equal(result.stdout, "");
      noEvaluation(result.stderr);
    }
    assert.equal(cli("--help").status, 0);
  });
});
