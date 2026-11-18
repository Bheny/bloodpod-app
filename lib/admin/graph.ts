import { adb as prisma } from "@/lib/admin/db";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import type { GraphData, GraphLink, GraphNode } from "@/lib/admin/graph-types";

const MAX_PEOPLE = 3000;

export async function getNetworkGraph(): Promise<GraphData> {
  const [totalDonors, users, pods, hospitals] = await Promise.all([
    prisma.user.count({ where: { hospitalId: null } }),
    prisma.user.findMany({
      where: { hospitalId: null },
      orderBy: { createdAt: "desc" },
      take: MAX_PEOPLE,
      select: {
        id: true,
        name: true,
        email: true,
        bloodType: true,
        city: true,
        isEligible: true,
        onboardingComplete: true,
        _count: { select: { pushSubscriptions: true } },
      },
    }),
    prisma.pod.findMany({
      take: MAX_PEOPLE,
      select: {
        id: true,
        name: true,
        ownerId: true,
        members: { select: { userId: true, invitedById: true } },
      },
    }),
    prisma.hospital.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true, city: true } }),
  ]);

  const people = new Set(users.map((u) => u.id));
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  for (const u of users) {
    nodes.push({
      id: `u:${u.id}`,
      kind: "user",
      label: u.name ?? u.email.split("@")[0],
      href: `/admin/users/${u.id}`,
      blood: u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : null,
      city: u.city,
      eligible: u.isEligible,
      onboarded: u.onboardingComplete,
      alerts: u._count.pushSubscriptions > 0,
    });
  }

  // How many Pods each person is in (owning counts), and which of those have company.
  const podCount = new Map<string, number>();
  const hasCompany = new Set<string>();
  const seenInvite = new Set<string>();
  let invites = 0;

  for (const p of pods) {
    const size = p.members.length + 1;
    nodes.push({ id: `p:${p.id}`, kind: "pod", label: p.name, href: null, size });

    const bump = (userId: string) => {
      podCount.set(userId, (podCount.get(userId) ?? 0) + 1);
      if (size > 1) hasCompany.add(userId);
    };

    if (people.has(p.ownerId)) {
      links.push({ source: `u:${p.ownerId}`, target: `p:${p.id}`, kind: "owner" });
      bump(p.ownerId);
    }
    for (const m of p.members) {
      if (!people.has(m.userId)) continue;
      links.push({ source: `u:${m.userId}`, target: `p:${p.id}`, kind: "member" });
      bump(m.userId);

      if (m.invitedById && people.has(m.invitedById) && m.invitedById !== m.userId) {
        const key = `${m.invitedById}>${m.userId}`;
        if (!seenInvite.has(key)) {
          seenInvite.add(key);
          links.push({ source: `u:${m.invitedById}`, target: `u:${m.userId}`, kind: "invite" });
          invites++;
        }
      }
    }
  }

  // A hospital reaches the donors in its own city.
  const byCity = new Map<string, string[]>();
  for (const u of users) {
    if (!u.city) continue;
    const key = u.city.trim().toLowerCase();
    byCity.set(key, [...(byCity.get(key) ?? []), u.id]);
  }
  for (const h of hospitals) {
    nodes.push({ id: `h:${h.id}`, kind: "hospital", label: h.name, href: "/admin/hospitals", city: h.city });
    for (const userId of byCity.get(h.city.trim().toLowerCase()) ?? []) {
      links.push({ source: `h:${h.id}`, target: `u:${userId}`, kind: "catchment" });
    }
  }

  return {
    nodes,
    links,
    stats: {
      people: users.length,
      pods: pods.length,
      hospitals: hospitals.length,
      bridges: [...podCount.values()].filter((n) => n >= 2).length,
      isolated: users.filter((u) => !hasCompany.has(u.id)).length,
      invites,
    },
    truncated: totalDonors > MAX_PEOPLE,
  };
}
