# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately via GitHub Security Advisories or email. Do NOT create a public issue.

## Security Measures in This Repository

### Automated Protections

| Protection | Status | Description |
|------------|--------|-------------|
| **Gitleaks** | ✅ Enabled | Scans for secrets in commits |
| **Dependency Review** | ✅ Enabled | Blocks PRs with vulnerable dependencies |
| **OIDC Auth** | ✅ Enabled | No static credentials for GCP |
| **Fork Protection** | ✅ Enabled | Workflows don't run on fork PRs |
| **CODEOWNERS** | ✅ Enabled | Requires review for infra changes |

### Manual Configuration Required

Configure these settings in GitHub repository settings:

#### 1. Branch Protection (Settings → Branches → Add rule for `main`)

- [x] Require a pull request before merging
- [x] Require approvals (1+)
- [x] Dismiss stale PR approvals when new commits are pushed
- [x] Require status checks to pass (Security Scan, Terraform Plan)
- [x] Require branches to be up to date
- [x] Do not allow bypassing the above settings

#### 2. Environment Protection (Settings → Environments → `dev`)

- [x] Required reviewers (for production environments)
- [x] Wait timer (optional, for production)
- [x] Deployment branches: only `main`

#### 3. Actions Permissions (Settings → Actions → General)

- [x] "Require approval for first-time contributors"
- [x] "Require approval for all outside collaborators"

#### 4. Secrets (Settings → Secrets and variables → Actions)

All secrets are stored in GitHub Secrets, never in code:
- `GCP_WIF_PROVIDER` - Workload Identity Federation provider
- `GCP_SA_EMAIL` - Service Account email

#### 5. Variables (Settings → Secrets and variables → Actions → Variables)

Non-sensitive configuration stored in GitHub Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `GCP_PROJECT_ID` | GCP project ID | `my-project-123` |
| `GCP_REGION` | GCP region | `europe-west3` |
| `TF_STATE_BUCKET` | GCS bucket for Terraform state | `my-project-tfstate` |
| `APP_NAME` | Application name | `employee-platform` |
| `DB_INSTANCE_NAME` | Cloud SQL instance name | `employee-platform-db` |
| `DB_NAME` | Database name | `employee-platform` |
| `DB_USER` | Database user | `employee_platform_app` |

### What's Safe to Be Public

| Item | Why It's OK |
|------|-------------|
| Terraform structure | Standard IaC patterns |
| Workflow files | No secrets embedded |
| App source code | Business logic only |

### What Must NEVER Be Committed

| Item | Alternative |
|------|-------------|
| API keys | Use GitHub Secrets |
| Passwords | Use Secret Manager |
| Private keys | Use OIDC/WIF |
| .env files | Use .env.example |
| tfvars with real values | Use CI/CD variables |
| Service account JSON | Use OIDC instead |

## Security Checklist for Contributors

Before committing:

1. [ ] Run `git diff` and check for sensitive values
2. [ ] Never commit `.env`, `*.tfvars` (only `.example` versions)
3. [ ] Use variables/secrets for all environment-specific values
4. [ ] Don't log sensitive values in workflows

## GCP Security Best Practices

1. **Least Privilege**: Service Account has only required permissions
2. **WIF Restriction**: OIDC only accepts tokens from this specific repo
3. **State Encryption**: GCS bucket has default encryption
4. **Audit Logging**: Enable Cloud Audit Logs for the project
