import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDiscoverDonors } from "@/lib/discover-data";
import { getFeaturedArticles, getPartners, getTopDonors } from "@/lib/discover-highlights";
import { VisibilityToggle } from "@/components/discover/VisibilityToggle";
import { DiscoverList } from "@/components/discover/DiscoverList";
import { Carousel } from "@/components/discover/Carousel";
import { FeaturedCard } from "@/components/discover/FeaturedCard";
import { TopDonorCard } from "@/components/discover/TopDonorCard";
import { PartnerCard } from "@/components/discover/PartnerCard";

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [result, featured, topDonors, partners] = await Promise.all([
    getDiscoverDonors(user.id, { city: user.city ?? undefined }),
    getFeaturedArticles(),
    getTopDonors(user.id),
    getPartners(),
  ]);
  if (!result) redirect("/sign-in");

  return (
    <div>
      <div className="border-b-[0.5px] border-hairline bg-white px-4 py-3.5 lg:px-6 lg:py-5">
        <h1 className="text-body-sm font-extrabold tracking-[-0.4px] text-ink lg:text-title">
          Discover
        </h1>
        <p className="text-label text-ink-muted">Find donors near you</p>
      </div>

      <VisibilityToggle initiallyPublic={result.viewer.isPublic} />

      {featured.length > 0 && (
        <Carousel title="Featured">
          {featured.map((article) => (
            <FeaturedCard key={article.id} article={article} />
          ))}
        </Carousel>
      )}

      {topDonors.length > 0 && (
        <Carousel title="Top donors">
          {topDonors.map((donor, i) => (
            <TopDonorCard key={donor.id} donor={donor} rank={i + 1} />
          ))}
        </Carousel>
      )}

      {partners.length > 0 && (
        <Carousel title="Partner labs & hospitals">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </Carousel>
      )}

      <div className="h-2 bg-surface" />

      <DiscoverList
        initialDonors={result.donors}
        initialTotal={result.total}
        myCity={result.viewer.city}
      />
    </div>
  );
}
