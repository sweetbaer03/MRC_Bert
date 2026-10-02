import { test } from "node:test";
import assert from "node:assert/strict";
import { complianceRate, findMissingItems, type ItemForCheck, type ResponseForCheck } from "../lib/validation";
import { toCsv } from "../lib/csv";

const item = (id: string, responseType: string, required = true): ItemForCheck => ({
  id, code: id, title: `항목 ${id}`, responseType, required,
});
const resp = (status: string | null, note: string | null = null, attachmentCount = 0): ResponseForCheck => ({
  status, note, attachmentCount,
});

test("필수 항목에 응답이 없으면 누락", () => {
  const items = [item("a", "STATUS"), item("b", "TEXT"), item("c", "FILE"), item("d", "STATUS_FILE")];
  const missing = findMissingItems(items, new Map());
  assert.deepEqual(missing.map((m) => m.item.id), ["a", "b", "c", "d"]);
});

test("선택 항목은 비어 있어도 통과", () => {
  const items = [item("a", "STATUS", false), item("b", "TEXT", false), item("c", "FILE", false), item("d", "STATUS_FILE", false)];
  assert.equal(findMissingItems(items, new Map()).length, 0);
});

test("STATUS_FILE: 이행·부분이행은 증적 필요, 미이행·해당없음은 불필요", () => {
  const items = [item("a", "STATUS_FILE"), item("b", "STATUS_FILE"), item("c", "STATUS_FILE"), item("d", "STATUS_FILE")];
  const responses = new Map([
    ["a", resp("COMPLIANT")],
    ["b", resp("PARTIAL", null, 1)],
    ["c", resp("NON_COMPLIANT")],
    ["d", resp("NOT_APPLICABLE")],
  ]);
  assert.deepEqual(findMissingItems(items, responses).map((m) => m.item.id), ["a"]);
});

test("선택 STATUS_FILE이라도 이행 선택 시 증적 필요", () => {
  const missing = findMissingItems([item("a", "STATUS_FILE", false)], new Map([["a", resp("COMPLIANT")]]));
  assert.equal(missing.length, 1);
});

test("TEXT는 공백만 입력하면 누락", () => {
  const missing = findMissingItems([item("a", "TEXT")], new Map([["a", resp(null, "   ")]]));
  assert.equal(missing.length, 1);
});

test("이행률: 해당없음 제외, 부분이행 0.5", () => {
  assert.equal(complianceRate(["COMPLIANT", "PARTIAL", "NON_COMPLIANT", "NOT_APPLICABLE", null]), 0.5);
  assert.equal(complianceRate(["NOT_APPLICABLE", null]), null);
});

test("CSV: BOM, 따옴표 이스케이프, 수식 주입 방지", () => {
  const csv = toCsv([["a,b", 'say "hi"', "=SUM(A1)", null, 3]]);
  assert.equal(csv, '﻿"a,b","say ""hi""",\'=SUM(A1),,3\r\n');
});
