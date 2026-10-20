# Core

Serviços transversais consumidos por todos os módulos.
Módulos **nunca** importam de outros módulos — apenas de `core/` ou `shared/`.

Estrutura alvo (criada incrementalmente):

- `auth/` — helpers de sessão e guards
- `tenancy/` — tenant atual, tipo de tenant, quotas
- `rbac/` — matriz central de permissões (`has_permission`)
- `entitlements/` — planos → features (`entitlements.can`)
- `billing/` — planos e assinaturas
- `credits/` — ledger de créditos
- `notifications/` — emissão + templates
- `audit/` — audit log
- `events/` — event bus interno
- `storage/` — helpers de upload
