import { render, screen, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/solid/agent";
import { afterEach, expect, test, vi } from "vitest";
import { CalculatorProvider, useCalculator } from "@/state/calculator";
import { Credit } from "@/components/app/Credit";
import { ShareButtons } from "@/components/app/ShareButtons";
import { Controls } from "./Controls";
import { Currencies } from "./Currencies";
import { DeductionRow } from "./DeductionRow";
import { EmploymentSwitch } from "./EmploymentSwitch";
import { Header } from "./Header";
import { Tax } from "./Tax";
import { TaxBands } from "./TaxBands";

afterEach(() => window.history.replaceState(null, "", "/"));

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
        pinned: calc.pinned(),
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
      <Tax />
      <DeductionProbe />
      <ShareButtons />
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

test("a shared URL restores the whole scenario", async () => {
  window.history.replaceState(
    null,
    "",
    "/?amount=3500&currency=KRW&period=month&hours=180&weeks=4&employment=contractor&deductions=shif%2Cahl&pinned=KES%2CEUR&rates=USD%3A1%2CKES%3A130%2CKRW%3A1300%2CEUR%3A0.9",
  );
  render(() => <Fixture />);

  await waitFor(() =>
    expect(state()).toMatchObject({
      amount: 3500,
      currency: "KRW",
      period: "month",
      hours: 180,
      employment: "contractor",
      nssf: false,
      pinned: ["KES", "EUR"],
    }),
  );
});

test("clears the boot splash once shared state is applied", async () => {
  window.history.replaceState(null, "", "/?amount=42");
  document.documentElement.dataset.booting = "share";
  render(() => <Fixture />);

  await waitFor(() => expect(state().amount).toBe(42));
  await waitFor(() => expect(document.documentElement.dataset.booting).toBeUndefined());
});

test("control changes are written back to the URL", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/");
  render(() => <Fixture />);

  await waitFor(() => expect(window.location.search).toContain("rates="));
  await user.click(screen.getByRole("button", { name: "170 hrs" }));

  await waitFor(() => expect(new URLSearchParams(window.location.search).get("hours")).toBe("170"));
});

test("the copy button shares the current URL", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  render(() => (
    <CalculatorProvider>
      <Header />
    </CalculatorProvider>
  ));

  await waitFor(() => expect(window.location.search).toContain("rates="));
  await user.click(screen.getByRole("button", { name: "Copy share link" }));

  expect(writeText).toHaveBeenCalledWith(
    expect.stringContaining(new URLSearchParams(window.location.search).toString()),
  );
});

test("clearing filters resets the scenario and the URL", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/?amount=3500&currency=KRW&period=month&pinned=KES%2CEUR");
  render(() => <Fixture />);

  await waitFor(() =>
    expect(state()).toMatchObject({ amount: 3500, currency: "KRW", period: "month" }),
  );
  await user.click(screen.getByRole("button", { name: "Clear filters" }));

  await waitFor(() =>
    expect(state()).toMatchObject({ amount: 10, currency: "USD", period: "hour", pinned: ["KES"] }),
  );
  await waitFor(() => expect(window.location.search).toBe(""));
});

test("the bottom share button copies the current link", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  render(() => <Fixture />);

  await waitFor(() => expect(window.location.search).toContain("rates="));
  await user.click(screen.getByRole("button", { name: "Copy link" }));

  expect(writeText).toHaveBeenCalledWith(
    expect.stringContaining(`${window.location.origin}${window.location.pathname}?`),
  );
});

test("the footer credits the author and links the repository", () => {
  render(() => <Credit />);

  expect(screen.getByRole("link", { name: /tigawanna/ }).getAttribute("href")).toContain(
    "npmjs.com",
  );
  expect(screen.getByRole("link", { name: "Repository" }).getAttribute("href")).toBe(
    "https://github.com/tigawanna/adulting/tree/master/apps/calc-paye-kenya",
  );
});

test("pinned rates can be removed and re-added from the lower sections", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/?pinned=KES%2CEUR&rates=KES%3A130%2CUSD%3A1%2CEUR%3A0.9");
  render(() => <Fixture />);

  await waitFor(() => expect(state().pinned).toEqual(["KES", "EUR"]));
  await user.click(screen.getByRole("button", { name: "Remove EUR rate" }));
  await waitFor(() => expect(state().pinned).not.toContain("EUR"));
  expect(screen.queryByRole("button", { name: "Remove EUR rate" })).toBeNull();

  await user.click(screen.getByRole("button", { name: "Add rate" }));
  expect(await screen.findByRole("dialog", { name: "Currencies" })).toBeTruthy();
});
