import { expect, test } from "vitest";
import { readShare, shareQuery } from "./share";

test("reads a shared scenario from the query string", () => {
  const shared = readShare(
    "?amount=3500&currency=KRW&period=month&hours=160&weeks=4&employment=contractor&deductions=shif,ahl&pinned=KES,EUR&rates=USD:1,KES:130,KRW:1300,EUR:0.9",
  );

  expect(shared?.controls).toMatchObject({
    amount: 3500,
    inputCurrency: "KRW",
    period: "month",
    hoursPerMonth: 160,
    weeksPerMonth: 4,
    employment: "contractor",
  });
  expect(shared?.controls.deductions).toEqual({ nssf: false, shif: true, ahl: true });
  expect(shared?.pinned).toEqual(["KES", "EUR"]);
  expect(shared?.rates).toEqual({ USD: 1, KES: 130, KRW: 1300, EUR: 0.9 });
});

test("ignores invalid values and knows an empty query", () => {
  expect(readShare("")).toBeNull();
  expect(readShare("?amount=abc&currency=XYZ&period=year")).toBeNull();
  const shared = readShare("?amount=-5&hours=0&currency=USD");
  expect(shared?.controls.amount).toBe(10);
  expect(shared?.controls.hoursPerMonth).toBe(160);
  expect(shared?.controls.inputCurrency).toBe("USD");
});

test("contractor links default to the contractor deductions", () => {
  const shared = readShare("?employment=contractor");
  expect(shared?.controls.deductions).toEqual({ nssf: false, shif: true, ahl: true });
});

test("writes only non-default values and round-trips", () => {
  const query = shareQuery({
    controls: {
      amount: 3500,
      inputCurrency: "KRW",
      period: "month",
      hoursPerMonth: 160,
      weeksPerMonth: 4,
      employment: "contractor",
      deductions: { nssf: false, shif: true, ahl: true },
    },
    pinned: ["KES", "EUR"],
    rates: { USD: 1, KES: 130, KRW: 1300, EUR: 0.9 },
  });

  expect(query).toContain("amount=3500");
  expect(query).toContain("currency=KRW");
  expect(query).toContain("period=month");
  expect(query).toContain("employment=contractor");
  expect(query).toContain("deductions=shif%2Cahl");
  expect(query).toContain("pinned=KES%2CEUR");
  expect(query).toContain("rates=");
  expect(query).not.toContain("hours=");
  expect(query).not.toContain("weeks=");

  const shared = readShare(`?${query}`);
  expect(shared?.controls.amount).toBe(3500);
  expect(shared?.pinned).toEqual(["KES", "EUR"]);
});
