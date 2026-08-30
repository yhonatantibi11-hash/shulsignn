export type PrayerTime = {
  id: string;
  name: string;
  time: string;
  notes: string | null;
  days: string[];
  sort_order: number;
};

export type TorahLesson = {
  id: string;
  title: string;
  speaker: string;
  schedule_type: "weekly" | "one_time";
  days: string[];
  one_time_date: string | null;
  time: string | null;
  location: string | null;
  image_url: string | null;
};

export type SynagogueEvent = {
  id: string;
  name: string;
  date: string;
  time: string | null;
  description: string | null;
  image_url: string | null;
};

export type DisplayTheme = {
  id: string;
  name: string;
  bg_type: "color" | "image_url";
  bg_value: string | null;
  color_primary: string | null;
  color_card_bg: string | null;
  color_text: string | null;
  color_text_muted: string | null;
  color_border: string | null;
  widget_order: string[];
  widget_visible: string[];
};

export type PublicDisplayData = {
  synagogue: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    elevation_m: number | null;
    timezone: string;
    candle_lighting_minutes: number;
    havdalah_minutes: number;
  };
  settings: {
    custom_message?: string | null;
    secondary_message?: string | null;
    display_theme?: string;
    zmanim_keys?: string[];
  };
  prayer_times: PrayerTime[];
  lessons: TorahLesson[];
  events: SynagogueEvent[];
  themes: DisplayTheme[];
};

export type DisplayResult =
  | { status: "ready"; data: PublicDisplayData }
  | { status: "not-configured" }
  | { status: "not-found" }
  | { status: "error" };

export async function getPublicDisplay(slug: string): Promise<DisplayResult> {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !publishableKey) return { status: "not-configured" };

  try {
    const response = await fetch(`${baseUrl}/rest/v1/rpc/get_public_display`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_slug: slug }),
      cache: "no-store",
    });

    if (!response.ok) return { status: "error" };
    const data = (await response.json()) as PublicDisplayData | null;
    if (!data) return { status: "not-found" };
    return { status: "ready", data };
  } catch {
    return { status: "error" };
  }
}
