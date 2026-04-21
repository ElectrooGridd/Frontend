# DNS Runbook — electrogrid.ng

How DNS is set up for `electrogrid.ng` and how to verify/fix it if something breaks.

## Where DNS is managed

- **Registrar / DNS host:** qservers.net (DNS Manager UI)
- **Nameservers:** `ns1.qservers.net`, `ns2.qservers.net`
- **Website host:** Vercel (Frontend project)
- **Mail host:** qservers shared mail server at `154.16.200.39`

DNS and web hosting are split: qservers hosts DNS + email, Vercel hosts the website. The records below connect them.

## Required zone records

| Host | Type | Value | Purpose |
|------|------|-------|---------|
| `electrogrid.ng.` | A | `216.198.79.1` | Apex points to Vercel |
| `www` | CNAME | `3ebc761f14580e3a.vercel-dns-017.com.` | www points to Vercel (project-specific hostname) |
| `mail` | A | `154.16.200.39` | Mail server |
| `electrogrid.ng.` | MX (pri 10) | `mail.electrogrid.ng` | Incoming mail routing |
| `electrogrid.ng.` | TXT | `v=spf1 +mx +ip4:154.16.200.39 ~all` | SPF — only authorize the mail server |
| `default._domainkey` | TXT | `v=DKIM1; k=rsa; p=...` | DKIM signing key (from mail provider) |
| `_dmarc` | TXT | `v=DMARC1; p=none;` | DMARC monitoring (lenient) |

### Notes on specific records

**Apex A record** — In the qservers UI, the apex is created by leaving the Host Name field **blank** (not `@`). The preview should read `.electrogrid.ng.` or `electrogrid.ng.`.

**www CNAME** — The `3ebc761f14580e3a.vercel-dns-017.com.` target is project-specific to the Vercel project. If the project is recreated, this value changes — always copy it from Vercel → Settings → Domains.

**Legacy Vercel values that still work** — Vercel is mid-migration on IP ranges. These older values also work and can be used as a fallback:
- Apex A: `76.76.21.21`
- www CNAME: `cname.vercel-dns.com.`

**SPF `+a` pitfall** — SPF must NOT contain `+a` because the apex A record now resolves to Vercel. `+a` would authorize Vercel's infrastructure to send mail as `@electrogrid.ng`. Only include `+mx` and the explicit mail-server IP.

## How to verify DNS is healthy

Run from any terminal:

```bash
# Should return 216.198.79.1
dig @8.8.8.8 electrogrid.ng A +short

# Should return the vercel-dns-017 CNAME followed by Vercel IPs
dig @8.8.8.8 www.electrogrid.ng +short

# Should return 200 (or a 307 redirect to www) — with a valid Vercel TLS cert
curl -sI https://electrogrid.ng/ | head -5
curl -sI https://www.electrogrid.ng/ | head -5

# Mail records
dig @8.8.8.8 electrogrid.ng MX +short
dig @8.8.8.8 electrogrid.ng TXT +short    # SPF
dig @8.8.8.8 _dmarc.electrogrid.ng TXT +short
dig @8.8.8.8 default._domainkey.electrogrid.ng TXT +short
```

To bypass all caches and query the authoritative nameserver directly:

```bash
dig @ns1.qservers.net electrogrid.ng A +short
dig @ns1.qservers.net www.electrogrid.ng +short
```

## Common failure modes

### Site down / TLS error / wrong IP

**Symptom:** `curl` connects to `208.75.151.205` or some non-Vercel IP, or TLS handshake fails with `tlsv1 alert protocol version`.

**Cause:** Apex A record is missing or pointing to qservers' shared server (happens when qservers does zone edits — they sometimes overwrite A/CNAME records while "fixing" email records).

**Fix:**
1. Log into qservers DNS Manager.
2. Verify the apex A record exists and points to `216.198.79.1` (or fallback `76.76.21.21`).
3. Verify `www` CNAME points to the Vercel project hostname (or fallback `cname.vercel-dns.com.`).
4. Remove any stray A records on the apex pointing to `208.75.151.205` or other qservers IPs.
5. Wait 5–15 min, flush local DNS cache, retest.

### Vercel dashboard says "Invalid Configuration"

1. Confirm DNS is correct via `dig @8.8.8.8` (above).
2. In Vercel → Project → Settings → Domains, click **Refresh** on each domain.
3. Cert issuance (Let's Encrypt) takes 1–3 minutes after DNS validates.

### Local machine still hits the old IP

Even after fixing DNS, your Mac or ISP may cache the old answer until the TTL expires.

```bash
# Flush macOS DNS cache
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Force-connect to the correct IP, bypassing DNS
curl -vI --resolve electrogrid.ng:443:216.198.79.1 https://electrogrid.ng/
```

If the `--resolve` version works, DNS config is correct — you're just waiting on caches.

### Email stops working after DNS changes

Never delete or modify these while editing website records:
- `mail` A record
- `electrogrid.ng.` MX record
- SPF / DKIM / DMARC TXT records

If email breaks, verify those four record types still exist and match the values in the table above.

## Order of operations when editing DNS

Always **add new records before deleting old ones**, so the apex is never without an A record. If you delete first, the site goes dark until the new record is added AND caches expire.

Example — switching the apex IP:
1. Add new apex A record with the new value.
2. Save. Confirm it appears in the zone list alongside the old one.
3. Delete the old apex A record.
4. Wait for propagation.

## Reference

- Vercel domains docs: https://vercel.com/docs/projects/domains
- SPF/DKIM/DMARC primer: https://dmarc.org/overview/
- Check propagation externally: https://dnschecker.org/
