import { Meta, Title } from "@solidjs/meta";
import { Show } from "solid-js";
import { Credit } from "@/components/app/Credit";
import { ShareButtons } from "@/components/app/ShareButtons";
import { BreakdownView } from "@/components/calculator/Breakdown";
import { Controls } from "@/components/calculator/Controls";
import { Currencies } from "@/components/calculator/Currencies";
import { Deductions } from "@/components/calculator/Deductions";
import { Disclaimer } from "@/components/calculator/Disclaimer";
import { DisclaimerBanner } from "@/components/calculator/DisclaimerBanner";
import { EmploymentSwitch } from "@/components/calculator/EmploymentSwitch";
import { Header } from "@/components/calculator/Header";
import { Tax } from "@/components/calculator/Tax";
import { CalculatorProvider, useCalculator } from "@/state/calculator";
import "./styles.css";

const DESCRIPTION =
  "Convert any hourly rate across currencies and see Kenyan PAYE, NSSF, SHIF and housing levy deductions.";

function CalculatorPage() {
  const calc = useCalculator();

  return (
    <div class="min-h-screen">
      <div class="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 lg:py-14">
        <Header />
        <DisclaimerBanner />
        <EmploymentSwitch />

        <main class="mt-8 grid gap-12 lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)] lg:gap-16">
          <Controls />
          <div class="space-y-14">
            <BreakdownView />
            <Tax />
          </div>
        </main>

        <Deductions />
        <Disclaimer />

        <footer class="mt-8 flex flex-col gap-4 border-t border-border pt-4 text-[10px] text-muted-foreground lg:flex-row lg:items-start lg:justify-between">
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap gap-x-4 gap-y-1">
              <p>Exchange rates: open.er-api.com · refreshed on demand.</p>
              <Show when={calc.updatedAt() > 0}>
                <p>Updated {new Date(calc.updatedAt()).toLocaleTimeString()}</p>
              </Show>
            </div>
            <ShareButtons />
          </div>
          <Credit />
        </footer>

        <Currencies />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <div class="boot-splash" aria-hidden="true">
        <img src="/logo.svg" alt="" />
        <p>Loading your calculation</p>
      </div>
      <Title>Calc Paye Kenya — Rate &amp; KRA calculator</Title>
      <Meta name="description" content={DESCRIPTION} />
      <Meta property="og:title" content="Calc Paye Kenya — Rate & KRA calculator" />
      <Meta property="og:description" content={DESCRIPTION} />
      <Meta property="og:image" content="/og.png" />
      <Meta property="og:image:width" content="1200" />
      <Meta property="og:image:height" content="630" />
      <Meta property="og:type" content="website" />
      <Meta name="twitter:card" content="summary_large_image" />
      <CalculatorProvider>
        <CalculatorPage />
      </CalculatorProvider>
    </>
  );
}
