import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GUIDE_AUDIO } from "../src/app/use-guide-speech";

test("이미 송금 음성은 해당 상황으로 시작하고 앱 설치 주의사항은 뒤에 안내한다", () => {
  const manifest = JSON.parse(readFileSync("artifacts/ui/already-transferred-intro-20261104/audio-manifest.json", "utf8"));
  assert.match(manifest.script, /^이미 송금했다면,/);
  assert.match(manifest.script.split(".")[0], /즉시.*일 일 이.*금융회사.*지급정지/);
  assert.ok(manifest.script.indexOf("의심 앱도 설치했다면") > manifest.script.indexOf("지급정지를 요청하세요."));
  assert.match(manifest.script, /의심되는 휴대폰을 사용하지 말고 다른 안전한 전화/);
  assert.equal(GUIDE_AUDIO.already_transferred, "/" + manifest.asset.replace(/^public\//, ""));
  assert.notEqual(GUIDE_AUDIO.already_transferred, GUIDE_AUDIO.installed_app);
  assert.equal(createHash("sha256").update(readFileSync(manifest.asset)).digest("hex"), manifest.sha256);
});
