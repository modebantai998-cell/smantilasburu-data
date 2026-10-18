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
