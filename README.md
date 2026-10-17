# Advertising & More — Careers / Job Vacancy Page (design concept)

A job vacancy page plus a refreshed header and footer, designed to match the
Advertising & More brand (navy + coffee orange, coffee-cup logo, "Click For Coffee").
Plain HTML, CSS and JavaScript with no build step and no dependencies.

> **Design concept.** The application form validates fully in the browser but does
> **not** send data anywhere. Connect it to the site's backend before going live
> (see "Going live").

## Structure

```
index.html            Page markup (header, hero, open roles, application form, footer)
css/styles.css        All styles (tokens, layout, responsive rules)
js/main.js            Menu, role filter, date picker, CV upload, validation
assets/coffee-cup.png Logo
assets/fonts/         Poppins (self-hosted, SIL Open Font License)
```

## Application form

| Field | Validation |
|---|---|
| Position applying for | Required (pre-filled when an "Apply" button is clicked) |
| Full Name (as per IC) | Required, letters plus `@ / . ' -` (supports names like "bin", "a/l") |
| Passport Number (for foreigners) | Shown and required only when "Foreigner" is selected; 6–12 letters/numbers |
| Date of Birth | Calendar picker or typed DD/MM/YYYY; applicant must be 16–80 years old |
| Mobile Phone Number | Country code selector + 7–12 digits |
| Name of Current Employer | Required |
| Earliest Starting Date | Calendar picker; today up to 2 years ahead, past dates disabled |
| LinkedIn Profile URL | Must be a `linkedin.com/in/...` profile; `https://` added automatically |
| Upload Resume/CV | Drag & drop or browse; PDF, DOC, DOCX; max 5 MB |
| Consent | Required checkbox |

The calendar works with mouse, touch and keyboard (arrow keys, Esc), and opens upwards
when there is no room below the field.

## Publish with GitHub Pages

1. Push these files to the root of a GitHub repository.
2. Make the repository **Public**.
3. **Settings › Pages** → *Deploy from a branch* → `main` / `(root)` → **Save**.
4. The page is live at `https://<username>.github.io/<repo-name>/` after about a minute.

No compiling is needed.

## Going live on the real site (WordPress + Elementor)

- Rebuild the form with Elementor Pro Forms (or another WordPress form plugin) using the same
  fields and rules, or post this form to a WordPress REST endpoint.
- Store CV uploads outside the public uploads folder and restrict access.
- Remove the "Design concept" bar at the top of `index.html`.
- Replace the four sample roles with real vacancies.
