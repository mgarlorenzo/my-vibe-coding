# Terraform Modules

This directory contains reusable Terraform modules for the infrastructure.

## Module Structure

Each module should follow this structure:

```
modules/
  module-name/
    main.tf          # Main resource definitions
    variables.tf     # Input variables
    outputs.tf       # Output values
    versions.tf      # Provider version constraints (if needed)
    README.md        # Module documentation
```

## Planned Modules

- `network` - VPC, subnets, firewall rules
- `gke` - Google Kubernetes Engine cluster
- `cloud-run` - Cloud Run service
- `cloud-sql` - Cloud SQL instance
- `storage` - GCS buckets
- `iam` - IAM roles and service accounts

## Usage

```hcl
module "network" {
  source = "../../modules/network"

  project_id  = var.project_id
  region      = var.region
  env         = var.env
  name_prefix = local.name_prefix
  labels      = local.common_labels
}
```

## Best Practices

1. **Keep modules focused** - One module = one logical resource group
2. **Use consistent naming** - Follow the naming convention in variables.tf
3. **Document outputs** - Every output should have a description
4. **Version constraints** - Pin provider versions in versions.tf if module-specific
5. **Validation** - Add variable validation where appropriate
