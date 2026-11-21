# Cloud Portfolio

My cloud engineering portfolio: a static website hosted on AWS that lists the projects I build during my WGU Cloud Computing degree and on my own.

The site is also a project in its own right. When finished, it will be:

- **Hosted** on Amazon S3, served through CloudFront with HTTPS
- **Counting visitors** with a serverless backend: API Gateway → Lambda (Python) → DynamoDB
- **Defined as code** with Terraform
- **Deployed automatically** with GitHub Actions, connecting to AWS through OIDC (no stored access keys)

## Progress

| Phase | What | Status |
|---|---|---|
| 0 | Accounts, tools, AWS security baseline | ✅ Done |
| 1 | Build the site locally | ✅ Done |
| 2 | Host it on AWS by hand (learning pass) | ⏳ Next |
| 3 | Rebuild the infrastructure with Terraform | |
| 4 | Visitor counter (Lambda + DynamoDB) with tests | |
| 5 | CI/CD with GitHub Actions + OIDC | |
| 6 | Monitoring, diagram, write-up | |

## Project layout

```
site/                  ← everything that gets uploaded to S3
  index.html           One page: profile sidebar + About / Resume / Projects / Contact tabs
  css/styles.css       All styling (dark theme, light-blue accent; colors are variables at the top)
  js/main.js           Tabs, project cards and filters, skill bars, visitor counter
  js/config.js         Site settings (visitor counter API address)
  data/projects.json   ← the list of projects
```

## Run it locally

The Projects page loads `projects.json` with JavaScript, which browsers block when you open the HTML file directly. Serve the folder with Python's built-in web server instead:

```bash
python -m http.server 8000 --directory site
```

Then open <http://localhost:8000>. Press `Ctrl+C` in the terminal to stop the server.

## Adding a project

Add an entry to `site/data/projects.json`:

```json
{
  "id": "url-shortener",
  "title": "Serverless URL Shortener",
  "date": "2027-01",
  "source": "WGU",
  "status": "Completed",
  "summary": "One or two sentences: what it does and how it's built.",
  "tech": ["API Gateway", "Lambda", "DynamoDB", "Python"],
  "links": { "repo": "https://github.com/...", "live": "", "writeup": "" }
}
```

- `source` is `WGU` or `Personal` (this drives the filter buttons).
- `status` is `In progress` or `Completed`.
- `date` is `YYYY-MM`; projects are sorted newest first.
- Leave a link as `""` to hide it.
- Optional: add `"image": "images/url-shortener.png"` (put the file in `site/images/`) to show a screenshot instead of the cloud icon.

Technology filter buttons are created automatically from the `tech` lists.

## Notes and lessons learned

- **Identity Center was blocked on a free-plan account.** Enabling IAM Identity Center returned a service control policy denial. AWS Organizations, which Identity Center requires, would have moved the account to the paid plan and ended the free-tier credits. Instead I used an IAM admin user with MFA, and connected the CLI with `aws login`, which issues temporary credentials. No long-lived access keys are stored on my machine.
