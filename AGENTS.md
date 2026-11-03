<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules

- Homepage editable content (marquee text/color/speed and hero photo/title/tagline/description) lives in the `public.site_settings` table (key/value JSONB), read publicly and written only by admins; the admin UI is `/dashboard/tampilan` and the shared reader is `useSiteSettings`. Keep new editable homepage fields as new keys in that table rather than hardcoding them in routes.
- Uploaded hero/photo assets go to the private `school-images` bucket; store the object path (not a URL) in the database and resolve it with `resolveImageSrc`.
- Background music is stored in the private `site-audio` bucket with its setting under the `music` key in `public.site_settings` (`{audio, enabled}`); only admins upload or disable it, and the player (`BackgroundMusic`) is rendered once in `src/routes/__root.tsx` so it keeps playing across page navigation (including the dashboard) instead of restarting per page. Non-admin users cannot mute it.
- User avatars, story images, and direct-message images are stored in the private `chat-images` bucket under `<userId>/<random>` paths and resolved with `resolveImageSrc("chat-images", path)`.
- `public.stories` rows carry an `expires_at` default `now() + interval '24 hours'`; visibility (query and RLS SELECT policy) filters on `expires_at > now()`, so stories disappear automatically after 24 hours without a cleanup job.
- Private one-to-one chat uses `public.direct_messages` (sender_id/recipient_id reference `public.profiles`); UI page is `/dashboard/pesan` with realtime channels filtered per participant.
- Rotating banners live in `public.banners` (public read, admin write; images in `school-images` bucket). `BannerCarousel` shows them on the homepage and above the dashboard nav in `_authenticated/route.tsx`, rotating every `BANNER_INTERVAL_MS`; admins manage them in `/dashboard/tampilan`. Why: one source so homepage and dashboards stay in sync.
- The site uses a single dark navy/neon-cyan theme defined in `:root` of `src/styles.css`; restyle via tokens, not per-page colors. The school logo is `SchoolLogo` (CDN asset) and the favicon/app icons live in `public/`.
