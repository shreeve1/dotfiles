# Scenario: Create a Runbook from Incident Resolution

You are the infra-ops documenter. An incident has been resolved and the dispatcher has asked you to create a runbook so any team member can handle this if it recurs.

---

## Incident Summary

**Client:** Acme Corp
**Host:** mail-01 (192.168.1.20) — Ubuntu 20.04, Postfix + Dovecot + Let's Encrypt
**Incident:** Email delivery failures. External recipients reported bounced emails with TLS errors. Internal mail between users was unaffected.

## Resolution Timeline (from responder and analyst reports)

**09:12 UTC** — Client reports external emails bouncing. Error in bounce message: `TLS handshake failed: certificate expired`

**09:18 UTC** — Responder SSHs into mail-01. Confirms:
```
$ sudo certbot certificates
Certificate Name: mail.clientsite.com
  Expiry Date: 2026-03-28 (EXPIRED)
  Certificate Path: /etc/letsencrypt/live/mail.clientsite.com/fullchain.pem
  Private Key Path: /etc/letsencrypt/live/mail.clientsite.com/privkey.pem
```

**09:22 UTC** — Responder attempts manual renewal:
```
$ sudo certbot renew --cert-name mail.clientsite.com
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for mail.clientsite.com
Failed: Challenge failed for domain mail.clientsite.com
  HTTP-01 challenge: Connection refused on port 80
```

**09:25 UTC** — Analyst investigates port 80. Finds nginx is not running (it handles the ACME challenge):
```
$ systemctl status nginx
nginx.service - A high performance web server
   Active: inactive (dead) since 2026-03-25
$ journalctl -u nginx --since "2026-03-25"
Mar 25 02:15:03 mail-01 systemd: nginx.service: Failed with result 'exit-code'
Mar 25 02:15:03 mail-01 nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
```

**09:28 UTC** — Analyst finds the conflict: a test container was started on March 25 that bound to port 80:
```
$ docker ps
CONTAINER ID  IMAGE       PORTS                 NAMES
a1b2c3d4e5f6  nginx:test  0.0.0.0:80->80/tcp    test-webserver
```

**09:30 UTC** — Responder stops the test container, starts nginx:
```
$ docker stop test-webserver && docker rm test-webserver
$ sudo systemctl start nginx
```

**09:32 UTC** — Responder renews the certificate:
```
$ sudo certbot renew --cert-name mail.clientsite.com
Renewing an existing certificate for mail.clientsite.com
Congratulations! Certificate renewed successfully.
```

**09:34 UTC** — Responder restarts Postfix to pick up the new certificate:
```
$ sudo systemctl restart postfix
```

**09:36 UTC** — Verified: test email to external address delivered successfully. TLS handshake confirmed working.

**Root cause:** A test Docker container bound to port 80, preventing nginx from starting. Nginx handles the ACME HTTP-01 challenge for Let's Encrypt. Without nginx, certbot couldn't renew. Certificate expired 3 days after nginx went down.

---

Create a runbook for this failure mode that any team member can follow without additional context.
