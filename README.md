# The ACT Almanac — 20-Session Course

Course content, grading, and the tutor UI live in `index.html`. Two small serverless
functions (`netlify/functions/`) power the AI tutor and student participation tracking.
`admin.html` is a password-protected dashboard so you can see who's actually doing the work.

## Use it locally
Double-click `index.html` to open it in any browser. Works offline for the lessons and
quizzes. The tutor and participation tracking need the site deployed (see below).

## Put it online — use GitHub, not Netlify Drop
**Important:** Netlify Drop (dragging a folder onto app.netlify.com/drop) creates a brand
new random site URL every time you drop it, which is why old links to students went dead.
Connecting to GitHub instead gives you one permanent URL that just updates in place.

1. Push this folder to a new GitHub repo (or ask Claude to do it for you if you're not
   comfortable with git).
2. In Netlify: **Add new site → Import an existing project → connect the GitHub repo.**
3. Build settings: leave "Build command" blank, "Publish directory" = `.` (already set in
   `netlify.toml`). Deploy.
4. You'll get one stable URL. Every future edit is just a `git push` — no more re-dropping
   folders, no more broken links.

## Turn on the AI Tutor
1. Get an API key at https://console.anthropic.com
2. In Netlify: Site settings → Environment variables → add `ANTHROPIC_API_KEY`
3. Redeploy.

## Turn on participation tracking + the dashboard
Uses [Supabase](https://supabase.com) (free tier, no credit card) as the database.

1. Create a free Supabase project at https://supabase.com/dashboard.
2. In the Supabase SQL Editor, run:
   ```sql
   create table progress (
     id bigint generated always as identity primary key,
     student_name text not null,
     session_id int not null,
     session_title text,
     completed boolean default true,
     completed_at timestamptz default now(),
     unique (student_name, session_id)
   );
   alter table progress enable row level security;
   ```
   (Row Level Security is on and no policies are added — this means the table is only
   reachable through the service key on the server side, never directly from the browser.)
3. In Supabase: Project Settings → API. Copy the **Project URL** and the **service_role**
   key (not the anon key — the service key stays server-side only).
4. In Netlify: Site settings → Environment variables, add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_KEY` = your service_role key
   - `ADMIN_PASSWORD` = a password of your choosing, for the dashboard
5. Redeploy.

Once this is live, students are prompted for their name the first time they open the
course, and every "Mark session complete" click logs to Supabase. Visit `/admin.html` on
your live site and enter your `ADMIN_PASSWORD` to see who's completed what, and when they
were last active.

## Editing lessons or questions
Open index.html in any text editor and search for `const COURSE`. Each session is an object;
edit the text or add questions (the `answer` field is the 0-based index of the correct choice).
