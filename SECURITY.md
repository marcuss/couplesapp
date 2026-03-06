# Security Policy

## Secret Scanning

This repository uses **pre-commit** hooks with **gitleaks** to automatically detect secrets before they reach the repository.

### How it works

Every `git commit` triggers a gitleaks scan of the staged files. If a secret (API key, token, password, private key, etc.) is detected, the commit is **blocked**.

### Setup (required once per machine)

```bash
pip install pre-commit
pre-commit install
```

### Temporarily bypass (use with extreme caution)

```bash
git commit --no-verify -m "your message"
```

⚠️ Only bypass if you are 100% certain there are no secrets in the commit. Never bypass for files containing API keys, tokens, or passwords.

### If a secret is detected

1. **Do NOT commit it.** Remove it from the file.
2. Move it to an environment variable or secret manager.
3. If it was already committed: rotate the secret immediately, then remove from git history using `git filter-repo`.

### What counts as a secret

- AWS Access Keys (`AKIA...`)
- API keys (OpenAI `sk-...`, Supabase `eyJ...`, etc.)
- Private keys (`.pem`, `.key` files)
- Passwords hardcoded in source code
- Supabase service role keys or anon keys
- OAuth client secrets

### Fixing leaks

```bash
pip install git-filter-repo
git filter-repo --replace-text <(echo "SECRET_VALUE==>REDACTED")
git push --force --all
```

### Questions?

Contact the repository owner. Never log or paste secrets in issues or PRs.
