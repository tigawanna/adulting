import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/solid/agent";
import { expect, test } from "vitest";
import { CalculatorProvider, useCalculator } from "@/state/calculator";
import { Controls } from "./Controls";
import { Currencies } from "./Currencies";
import { DeductionRow } from "./DeductionRow";
import { EmploymentSwitch } from "./EmploymentSwitch";
import { TaxBands } from "./TaxBands";

function StateProbe() {
  const calc = useCalculator();
  return (
    <output data-testid="state">
      {JSON.stringify({
        amount: calc.controls.amount,
        currency: calc.controls.inputCurrency,
        period: calc.controls.period,
        employment: calc.controls.employment,
        hours: calc.controls.hoursPerMonth,
        weeks: calc.controls.weeksPerMonth,
        nssf: calc.controls.deductions.nssf,
      })}
    </output>
  );
}

function DeductionProbe() {
  const calc = useCalculator();
  return (
    <DeductionRow
      label="NSSF"
      hint="Statutory pension contribution"
      amount={100}
      included={calc.controls.deductions.nssf}
      onToggle={() => calc.toggleDeduction("nssf")}
    />
  );
}

function Fixture() {
  return (
    <CalculatorProvider>
      <EmploymentSwitch />
      <Controls />
      <Currencies />
      <DeductionProbe />
      <StateProbe />
    </CalculatorProvider>
  );
}

const state = () => JSON.parse(screen.getByTestId("state").textContent ?? "{}");
const agent = createAgent();

test("names every calculator control and reports its values", () => {
  render(() => <Fixture />);

  expect(screen.getByLabelText("Amount")).toBeTruthy();
  expect(screen.getByLabelText("Currency")).toBeTruthy();
  expect(screen.getByLabelText("Period")).toBeTruthy();
  expect(screen.getByLabelText("Hours per week")).toBeTruthy();
  expect(screen.getByLabelText("Weeks per month")).toBeTruthy();
  expect(screen.getByLabelText("Hours per month")).toBeTruthy();
  expect(screen.getByRole("radiogroup", { name: "I am" })).toBeTruthy();
  expect(screen.getByRole("switch", { name: "Include NSSF" })).toBeTruthy();
  expect(state()).toMatchObject({ currency: "USD", period: "hour", employment: "salaried" });
});

test("keyboard changes a number, a select, the employment mode and a switch", async () => {
  const user = userEvent.setup();
  render(() => <Fixture />);

  const before = state().amount;
  await user.click(screen.getByLabelText("Amount"));
  await user.keyboard("{ArrowUp}");
  expect(state().amount).toBeGreaterThan(before);

  await user.click(screen.getByLabelText("Currency"));
  await user.click(await screen.findByRole("option", { name: /EUR/ }));
  expect(state().currency).toBe("EUR");

  await user.click(screen.getByRole("radio", { name: "Contractor" }));
  expect(state().employment).toBe("contractor");
  screen.getByRole("radio", { name: "Contractor" }).focus();
  await user.keyboard("{ArrowLeft}");
  expect(state().employment).toBe("salaried");

  await user.keyboard("{Tab}");
  const toggle = screen.getByRole("switch", { name: "Include NSSF" });
  toggle.focus();
  await user.keyboard(" ");
  expect(state().nssf).toBe(false);
});

test("the currency drawer filters, pins and returns focus on close", async () => {
  const user = userEvent.setup();
  render(() => <Fixture />);

  const trigger = screen.getByRole("button", { name: "Pin another currency" });
  await user.click(trigger);
  await screen.findByRole("dialog", { name: "Currencies" });
  const search = screen.getByLabelText("Search currencies");
  expect(document.activeElement).toBe(search);

  await user.keyboard("EUR");
  const rows = screen.getAllByRole("button", { name: /EUR/ });
  expect(rows.some((row) => row.textContent?.includes("Pin"))).toBe(true);

  await user.click(screen.getByRole("button", { name: "Close currencies" }));
  expect(screen.queryByRole("dialog", { name: "Currencies" })).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("the PAYE breakdown opens with the keyboard", async () => {
  const user = userEvent.setup();
  render(() => <TaxBands bands={[]} taxableAnnual={0} />);
  const trigger = screen.getByRole("button", { name: "How the PAYE was calculated" });
  await user.tab();
  expect(document.activeElement).toBe(trigger);
  await user.keyboard("{Enter}");
  expect(
    await screen.findByRole("button", {
      name: "How the PAYE was calculated",
      expanded: true,
    }),
  ).toBeTruthy();
});

test("typing filters the currency options", async () => {
  const user = userEvent.setup();
  render(() => <Fixture />);

  await user.click(screen.getByLabelText("Currency"));
  await user.type(await screen.findByLabelText("Search Currency"), "EUR");

  const options = screen.getAllByRole("option");
  expect(options).toHaveLength(1);
  expect(options[0].textContent).toContain("EUR");
});

test("an agent can find and change every calculator control", async () => {
  render(() => <Fixture />);

  const components = agent
    .snapshot()
    .filter((entry) => !entry.offPage && entry.component !== "more");
  for (const entry of components) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
  }
  const labels = components.map((entry) => entry.label);
  for (const label of [
    "Amount",
    "Currency",
    "Period",
    "Hours per week",
    "Weeks per month",
    "Hours per month",
    "I am",
    "Include NSSF",
    "Pin another currency",
  ]) {
    expect(labels, `${label} is missing from the snapshot`).toContain(label);
  }

  const result = await agent.act({
    steps: [
      { ref: "Amount", action: "setValue", args: ["250"] },
      { ref: "Currency", action: "setValue", args: ["EUR"] },
    ],
  });
  expect(result.ok, result.error?.message).toBe(true);
  expect(state()).toMatchObject({ amount: 250, currency: "EUR" });
});
