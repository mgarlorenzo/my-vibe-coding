# Infrastructure as Code

Terraform configuration for Google Cloud Platform.

## Structure

```
infra/
├── environments/
│   └── dev/                    # Development environment
│       ├── main.tf             # Main resource definitions
│       ├── variables.tf        # Input variables
│       ├── outputs.tf          # Output values
│       ├── versions.tf         # Provider versions
│       ├── backend.tf          # Remote state config
│       └── terraform.tfvars.example
├── modules/                    # Reusable modules
│   └── README.md
├── .gitignore
└── README.md
```

## Prerequisites

### 1. GCP Project Setup

```bash
# Create a GCS bucket for Terraform state
gsutil mb -p ${PROJECT_ID} -l europe-west1 gs://${PROJECT_ID}-tfstate

# Enable versioning for state protection
gsutil versioning set on gs://${PROJECT_ID}-tfstate
```

### 2. Workload Identity Federation (WIF) for GitHub Actions

```bash
# Create a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create a Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create a Service Account for Terraform
gcloud iam service-accounts create "terraform-github" \
  --project="${PROJECT_ID}" \
  --display-name="Terraform GitHub Actions"

# Grant necessary roles to the Service Account
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:terraform-github@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/editor"

# Allow GitHub Actions to impersonate the Service Account
gcloud iam service-accounts add-iam-policy-binding \
  "terraform-github@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/mgarlorenzo/my-vibe-coding"
```

### 3. GitHub Repository Configuration

Add these secrets and variables to your GitHub repository:

#### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Description | Example |
|--------|-------------|---------|
| `GCP_WIF_PROVIDER` | Workload Identity Provider | `projects/123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SA_EMAIL` | Service Account email | `terraform-github@project-id.iam.gserviceaccount.com` |

#### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Description | Example |
|----------|-------------|---------|
| `GCP_PROJECT_ID` | GCP Project ID | `my-project-id` |
| `GCP_REGION` | Default GCP region | `europe-west1` |
| `TF_STATE_BUCKET` | GCS bucket for state | `my-project-id-tfstate` |

## GitHub Actions Workflows

### terraform_plan.yml

Runs on **pull requests** to `infra/**`:

1. ✅ `terraform fmt -check` - Verifies formatting
2. ✅ `terraform init` - Initializes providers
3. ✅ `terraform validate` - Validates configuration
4. ✅ `terraform plan` - Creates execution plan
5. 📤 Uploads plan as artifact
6. 💬 Comments results on PR

### terraform_apply.yml

Runs on **push to main** or **manual dispatch**:

1. 🔐 Authenticates via OIDC
2. 📥 Downloads plan artifact (or creates new plan)
3. ✅ `terraform apply` - Applies changes
4. 📊 Outputs summary

## Local Development (Optional)

> **Note:** The workflows are designed to run from GitHub Actions. Local execution is optional for debugging.

```bash
cd infra/environments/dev

# Authenticate to GCP
gcloud auth application-default login

# Initialize (with remote backend)
terraform init \
  -backend-config="bucket=${PROJECT_ID}-tfstate" \
  -backend-config="prefix=infra/dev"

# Plan
terraform plan \
  -var="project_id=${PROJECT_ID}" \
  -var="region=europe-west1"

# Apply
terraform apply \
  -var="project_id=${PROJECT_ID}" \
  -var="region=europe-west1"
```

## Adding New Environments

1. Copy `environments/dev` to `environments/staging` or `environments/prod`
2. Update `backend.tf` prefix: `prefix = "infra/staging"`
3. Update default values in `variables.tf`
4. Add environment-specific workflows or update existing ones

## Security Best Practices

- ✅ State stored in GCS with versioning enabled
- ✅ No credentials in code (OIDC authentication)
- ✅ Least privilege IAM roles
- ✅ Plan review before apply (PR workflow)
- ✅ `.tfvars` files excluded from git
