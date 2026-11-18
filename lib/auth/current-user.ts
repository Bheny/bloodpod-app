import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// cache() de-duplicates the lookup within one request, so a layout and the page
// under it can both ask for the user without hitting Supabase and the DB twice.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  return prisma.user.findUnique({ where: { supabaseId: data.user.id } });
});
