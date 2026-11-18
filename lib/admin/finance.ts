import { adb as prisma } from "@/lib/admin/db";
import { monthLabel } from "@/lib/admin/format";

const DAY = 86_400_000;
export const OPENING_BALANCE_KEY = "opening_balance_pesewas";

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export async function getFinance() {
  const now = new Date();
  const ninetyAgo = new Date(now.getTime() - 90 * DAY);
  const fourteenAgo = new Date(now.getTime() - 14 * DAY);
  const thisMonth = startOfMonth(now);

  const [opening, entries, contracts, hospitals] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: OPENING_BALANCE_KEY } }),
    prisma.ledgerEntry.findMany({
      orderBy: { date: "desc" },
      include: { hospital: { select: { id: true, name: true } } },
    }),
    prisma.contract.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { hospital: { select: { id: true, name: true } } },
    }),
    prisma.hospital.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const openingPesewas = opening ? parseInt(opening.value, 10) || 0 : 0;
  const sum = (list: typeof entries) => list.reduce((s, e) => s + e.amountPesewas, 0);

  const paidIncome = entries.filter((e) => e.type === "INCOME" && e.status === "PAID");
  const paidExpense = entries.filter((e) => e.type === "EXPENSE" && e.status === "PAID");
  const pendingIncome = entries.filter((e) => e.type === "INCOME" && e.status === "PENDING");
  const pendingExpense = entries.filter((e) => e.type === "EXPENSE" && e.status === "PENDING");

  const cash = openingPesewas + sum(paidIncome) - sum(paidExpense);
  const mrr = contracts.filter((c) => c.status === "ACTIVE").reduce((s, c) => s + c.monthlyPesewas, 0);

  const monthlyIncome90 = sum(paidIncome.filter((e) => e.date >= ninetyAgo)) / 3;
  const monthlyExpense90 = sum(paidExpense.filter((e) => e.date >= ninetyAgo)) / 3;
  const netBurn = monthlyExpense90 - monthlyIncome90; // positive means cash is shrinking
  const runwayMonths = netBurn > 0 && cash > 0 ? Math.round((cash / netBurn) * 10) / 10 : null;

  // Last 6 calendar months, oldest first.
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const within = (e: { date: Date }) => e.date >= d && e.date < next;
    return {
      label: monthLabel(d),
      income: sum(paidIncome.filter(within)),
      expense: sum(paidExpense.filter(within)),
    };
  });

  const byHospital = new Map<string, { name: string; value: number }>();
  for (const e of paidIncome) {
    if (!e.hospital) continue;
    const cur = byHospital.get(e.hospital.id) ?? { name: e.hospital.name, value: 0 };
    cur.value += e.amountPesewas;
    byHospital.set(e.hospital.id, cur);
  }

  const byCategory = new Map<string, number>();
  for (const e of paidExpense.filter((e) => e.date >= ninetyAgo)) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountPesewas);
  }

  return {
    openingPesewas,
    cash,
    mrr,
    arr: mrr * 12,
    collectedThisMonth: sum(paidIncome.filter((e) => e.date >= thisMonth)),
    spentThisMonth: sum(paidExpense.filter((e) => e.date >= thisMonth)),
    receivables: sum(pendingIncome),
    overdue: sum(pendingIncome.filter((e) => e.date < fourteenAgo)),
    overdueCount: pendingIncome.filter((e) => e.date < fourteenAgo).length,
    payables: sum(pendingExpense),
    monthlyExpense90,
    netBurn,
    runwayMonths,
    months,
    revenueByHospital: [...byHospital.values()].sort((a, b) => b.value - a.value),
    expenseByCategory: [...byCategory.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    entries: entries.slice(0, 40),
    contracts,
    hospitals,
  };
}

export type FinanceData = Awaited<ReturnType<typeof getFinance>>;
