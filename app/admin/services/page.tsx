import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { parseLabTests } from "@/lib/service-tests";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { LabForm } from "@/components/admin/LabForm";
import { LabRow } from "@/components/admin/LabRow";
import { Card } from "@/components/ui/Card";

export default async function AdminServicesPage() {
  await requireAdmin();
  const labs = await prisma.lab.findMany({ orderBy: [{ town: "asc" }, { name: "asc" }],
    take: 300,
    include: { staff: { select: { id: true, email: true, name: true } } },
  });

  return (
    <div>
      <PageTitle
        title="Services"
        subtitle="Labs and clinics shown on the Services page. Nothing appears until you add it here."
      />

      <div className="mt-4">
        <Card>
          <LabForm />
        </Card>
      </div>

      <div className="mt-4 space-y-3">
        {labs.length === 0 ? (
          <EmptyState title="No labs yet" body="Add the first lab above and it shows up for users right away." />
        ) : (
          labs.map((lab) => {
            const tests = parseLabTests(lab.tests);
            return (
              <Card key={lab.id}>
                <LabRow
                  lab={{
                    active: lab.active,
                    tests,
                    staff: lab.staff,
                    form: {
                      id: lab.id,
                      name: lab.name,
                      town: lab.town,
                      address: lab.address ?? "",
                      phone: lab.phone ?? "",
                      latitude: lab.latitude?.toString() ?? "",
                      longitude: lab.longitude?.toString() ?? "",
                      tests: Object.fromEntries(
                        tests.map((t) => [t.id, t.pricePesewas === null ? "" : (t.pricePesewas / 100).toString()]),
                      ),
                    },
                  }}
                />
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
