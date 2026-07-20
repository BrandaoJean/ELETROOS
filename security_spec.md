# Security Specification & "Dirty Dozen" Threat Vectors

## 1. Data Invariants
1. **Client Ownership & Integrity:** Users can only view or manage clients if they are authenticated. Client CPFs must be validated or bounded.
2. **Order Lifecycle Locking:** Once a Service Order status reaches a terminal phase (e.g., 'entregue' or 'orcamento_rejeitado'), users should not arbitrarily edit historical fields without valid administrative privileges.
3. **Admin Exclusivity on Company Settings:** Only authenticated admins (checked via lookup in users/$(request.auth.uid) where role == 'administrador') can overwrite company profile data.
4. **Financial Records Non-Tamperability:** Completed financial transactions cannot be modified or deleted.

---

## 2. The "Dirty Dozen" Malicious Payloads (Designed to Fail Validation)

### Payload 1: Admin Role Hijacking (Identity Spoofing)
An unverified or standard technician tries to create or update their own User document to make themselves an administrator.
```json
{
  "id": "malicious-user-uid",
  "name": "Standard Tech",
  "username": "tech1",
  "email": "hacker@domain.com",
  "role": "administrador",
  "companyCnpj": "12.345.678/0001-90"
}
```

### Payload 2: Company Info Overwrite by Stranger (Identity Spoofing)
An unauthenticated or unauthorized user tries to rewrite the main corporate profile CNPJ or banking info.
```json
{
  "cnpj": "99.999.999/9999-99",
  "razaoSocial": "Malicious Corp",
  "nomeFantasia": "Hijacked EletroOS"
}
```

### Payload 3: Orphaned Service Order (Relationship Invariant Violation)
Attempting to create a service order that points to a non-existent or invalid client ID.
```json
{
  "id": "OS-9999",
  "clientId": "non-existent-client-id",
  "clientName": "Ghost Customer",
  "equipment": "Malicious Router",
  "brand": "Cisco",
  "model": "ISR4331",
  "totalCost": 500.0,
  "status": "aguardando_orcamento"
}
```

### Payload 4: Arbitrary Pricing Manipulation on Order (Privilege Escalation)
A standard attendant attempts to change the total service cost or labor cost on an approved budget without authorization.
```json
{
  "totalCost": 0.01,
  "status": "pronto"
}
```

### Payload 5: Terminal State Shortcutting (State Machine Hijack)
Directly marking an unpaid service order as "entregue" without receiving payment or having an approved budget.
```json
{
  "status": "entregue",
  "isPaid": false
}
```

### Payload 6: Negative Cost Injection (Value Poisoning)
Adding an inventory product with negative prices or negative stocks to corrupt the ledger.
```json
{
  "id": "PROD-999",
  "name": "Corrupt Resistor",
  "sku": "RES-001",
  "costPrice": -50.00,
  "sellingPrice": -100.00,
  "stock": -5
}
```

### Payload 7: Giant ID Poisoning (Wallet Exhaustion Guard)
Attempting to create a client with a 10KB string ID to trigger index-building CPU exhaustions.
```json
{
  "id": "CLIENT_REPEATED_A_TEN_THOUSAND_TIMES..."
}
```

### Payload 8: Immutable Creation Date Manipulation (Temporal Integrity Breach)
Changing the `createdAt` timestamp of a client account to backdate records.
```json
{
  "createdAt": "1999-01-01T00:00:00Z"
}
```

### Payload 9: Empty/Malformed Field Injector (Type Safety Failure)
Creating a Service Order where the equipment field is a Boolean instead of a String, bypassing form restrictions.
```json
{
  "id": "OS-1212",
  "clientId": "C-001",
  "clientName": "Val",
  "equipment": true
}
```

### Payload 10: Anonymous Unauthorized Write (Auth Bypass)
Attempting to write a new financial account payable directly while not logged in at all.
```json
{
  "id": "ACC-999",
  "type": "pagar",
  "description": "Furtive Payment",
  "category": "Theft",
  "amount": 10000.00,
  "dueDate": "2026-07-20",
  "status": "pendente"
}
```

### Payload 11: Malicious SQL-Injection String as ID (Input Sanitization Guard)
Using raw SQL command queries as Firestore Document IDs.
```json
{
  "id": "DROP TABLE clients; --"
}
```

### Payload 12: Ghost Fields Shadow Insertion (Shadow Update Attack)
Attempting to update an existing client document with a system-only or non-existent key `isGoldMember: true` to bypass payment tiers.
```json
{
  "name": "Updated Name",
  "isGoldMember": true
}
```
