"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { nearestCity } from "@/lib/nearest-city";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function Step6Location({
  onLocated,
  onNext,
}: {
  onLocated: (city: string) => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);
  const [city, setCity] = useState("");
  const [success, setSuccess] = useState<{ city: string; nearbyDonors: number } | null>(null);

  async function submitLocation(body: { city: string; latitude?: number; longitude?: number }) {
    try {
      const res = await fetch("/api/onboarding/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return data as { nearbyDonors: number; nearbyHospitals: number };
    } catch {
      return { nearbyDonors: 0, nearbyHospitals: 3 };
    }
  }

  function handleEnableLocation() {
    if (!("geolocation" in navigator)) {
      setShowCityInput(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const resolvedCity = nearestCity(latitude, longitude);
        const { nearbyDonors } = await submitLocation({ city: resolvedCity, latitude, longitude });
        setLoading(false);
        setSuccess({ city: resolvedCity, nearbyDonors });
        onLocated(resolvedCity);
        setTimeout(onNext, 1000);
      },
      () => {
        // denied or unavailable — never block progress, just fall back gracefully
        setLoading(false);
        setShowCityInput(true);
      },
      { timeout: 8000 },
    );
  }

  async function handleCitySubmit() {
    const trimmed = city.trim();
    if (!trimmed) return;
    setLoading(true);
    await submitLocation({ city: trimmed });
    setLoading(false);
    onLocated(trimmed);
    onNext();
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10 text-center">
      <div className="flex-1">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-light">
          <MapPin className="size-7 text-red" />
        </span>

        <h1 className="mt-5 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
          See what&apos;s near you.
        </h1>
        <p className="mx-auto mt-2 max-w-[300px] text-sm text-ink-muted">
          BloodPod uses your location to show nearby donors, hospitals, and
          active emergencies in your area.
        </p>

        {success ? (
          <div className="mx-auto mt-5 max-w-[280px] rounded-xl bg-surface p-3">
            <p className="text-sm font-bold text-ink">
              📍 {success.city} — {success.nearbyDonors} donors nearby
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-5 max-w-[280px] rounded-xl bg-surface p-3 text-left">
            <p className="text-[10px] text-ink-muted">Near you</p>
            <p className="text-sm font-bold text-ink">See active donors nearby</p>
            <p className="text-xs text-ink-muted">3 hospitals partnered</p>
          </div>
        )}

        {showCityInput && !success && (
          <div className="mx-auto mt-5 flex max-w-[280px] gap-2">
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className="flex-1"
            />
            <Button onClick={handleCitySubmit} loading={loading} disabled={!city.trim()}>
              Save
            </Button>
          </div>
        )}
      </div>

      {!success && (
        <div className="w-full max-w-[320px]">
          {!showCityInput && (
            <Button onClick={handleEnableLocation} loading={loading} size="lg" className="w-full">
              Enable location
            </Button>
          )}
          {!showCityInput && (
            <button
              type="button"
              onClick={() => setShowCityInput(true)}
              className="mt-3 text-sm font-semibold text-red"
            >
              Enter my city instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
