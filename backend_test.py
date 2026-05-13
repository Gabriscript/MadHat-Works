#!/usr/bin/env python3
"""
Comprehensive backend test suite for MadHat Proposals system.
Tests: Database seed, POST /api/proposal/[token]/accept, GET /api/pdf/[id], token uniqueness.
"""

import requests
import sqlite3
import os
import sys
from pathlib import Path
import time

# Configuration
BASE_URL = "http://localhost:3000"
DB_PATH = "/app/prisma/dev.db"
TEST_IP = "203.0.113.42"  # Stable test IP for rate limiting

# ANSI colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def log_test(name):
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST: {name}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")

def log_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def log_failure(msg):
    print(f"{RED}❌ {msg}{RESET}")

def log_info(msg):
    print(f"{YELLOW}ℹ️  {msg}{RESET}")


class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
    
    def add_pass(self, test_name):
        self.passed.append(test_name)
        log_success(f"PASSED: {test_name}")
    
    def add_fail(self, test_name, reason):
        self.failed.append((test_name, reason))
        log_failure(f"FAILED: {test_name}")
        log_failure(f"Reason: {reason}")
    
    def summary(self):
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}TEST SUMMARY{RESET}")
        print(f"{BLUE}{'='*80}{RESET}")
        print(f"{GREEN}Passed: {len(self.passed)}{RESET}")
        print(f"{RED}Failed: {len(self.failed)}{RESET}")
        if self.failed:
            print(f"\n{RED}Failed tests:{RESET}")
            for name, reason in self.failed:
                print(f"  - {name}: {reason}")
        return len(self.failed) == 0


results = TestResults()


def test_database_seed():
    """Test A: Verify database seed - 4 templates + 4 TermsVersion rows"""
    log_test("Database Seed Verification")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Test 4 ProposalTemplate rows
        cursor.execute("SELECT name, oneTimePrice, monthlyFee, suggestedDuration FROM ProposalTemplate ORDER BY name")
        templates = cursor.fetchall()
        
        log_info(f"Found {len(templates)} templates in database")
        
        if len(templates) != 4:
            results.add_fail("Database Seed - Templates Count", f"Expected 4 templates, found {len(templates)}")
            conn.close()
            return
        
        # Verify specific templates
        expected_templates = {
            'Custom': (None, None, 'ONE_TIME'),
            'Full Service': (799.0, 599.0, 'MONTHS_12'),
            'Growth': (499.0, 199.0, 'MONTHS_6'),
            'Starter': (349.0, 29.0, 'ONE_TIME'),
        }
        
        for name, one_time, monthly, duration in templates:
            if name not in expected_templates:
                results.add_fail("Database Seed - Template Names", f"Unexpected template: {name}")
                conn.close()
                return
            
            exp_one, exp_monthly, exp_duration = expected_templates[name]
            if one_time != exp_one or monthly != exp_monthly or duration != exp_duration:
                results.add_fail(
                    f"Database Seed - Template {name}",
                    f"Expected ({exp_one}, {exp_monthly}, {exp_duration}), got ({one_time}, {monthly}, {duration})"
                )
                conn.close()
                return
            log_info(f"Template '{name}': {one_time}/{monthly}, {duration} ✓")
        
        # Test 4 TermsVersion rows
        cursor.execute("SELECT version, lang, hash FROM TermsVersion ORDER BY version, lang")
        terms_versions = cursor.fetchall()
        
        log_info(f"Found {len(terms_versions)} TermsVersion rows in database")
        
        if len(terms_versions) != 4:
            results.add_fail("Database Seed - TermsVersion Count", f"Expected 4 rows, found {len(terms_versions)}")
            conn.close()
            return
        
        # Verify all have non-empty hash
        for version, lang, hash_val in terms_versions:
            if not hash_val or len(hash_val) == 0:
                results.add_fail("Database Seed - TermsVersion Hash", f"Empty hash for {version}/{lang}")
                conn.close()
                return
            log_info(f"TermsVersion {version}/{lang}: hash={hash_val[:8]}... ✓")
        
        # Verify we have terms/privacy x EN/IT
        langs = set((v, l) for v, l, _ in terms_versions)
        expected_kinds = {('1.0.0', 'EN'), ('1.0.0', 'IT')}
        
        # Check if we have at least terms and privacy for both languages
        en_count = sum(1 for _, l, _ in terms_versions if l == 'EN')
        it_count = sum(1 for _, l, _ in terms_versions if l == 'IT')
        
        if en_count != 2 or it_count != 2:
            results.add_fail("Database Seed - TermsVersion Languages", f"Expected 2 EN and 2 IT, got {en_count} EN and {it_count} IT")
            conn.close()
            return
        
        conn.close()
        results.add_pass("Database Seed Verification")
        
    except Exception as e:
        results.add_fail("Database Seed Verification", str(e))


def create_test_proposal(status='PENDING'):
    """Helper: Create a test proposal via Prisma and return its token"""
    import subprocess
    import json
    
    # Use Node.js to create a proposal via Prisma
    script = f"""
const {{ PrismaClient }} = require('@prisma/client');
const {{ randomBytes }} = require('crypto');
const prisma = new PrismaClient();

async function main() {{
  const token = randomBytes(24).toString('base64url');
  const proposal = await prisma.proposal.create({{
    data: {{
      token,
      title: 'Test Proposal for Acceptance',
      clientName: 'Mario Rossi',
      clientEmail: 'mario.rossi@example.com',
      companyName: 'Rossi SRL',
      description: 'Test proposal description',
      deliverables: JSON.stringify(['Deliverable 1', 'Deliverable 2']),
      includedServices: JSON.stringify(['Service 1', 'Service 2']),
      excludedServices: JSON.stringify(['Excluded 1']),
      oneTimePrice: 1000,
      monthlyFee: 200,
      duration: 'MONTHS_6',
      status: '{status}',
    }},
  }});
  console.log(JSON.stringify({{ id: proposal.id, token: proposal.token }}));
}}

main().then(() => process.exit(0)).catch(e => {{ console.error(e); process.exit(1); }});
"""
    
    result = subprocess.run(
        ['node', '-e', script],
        cwd='/app',
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        raise Exception(f"Failed to create test proposal: {result.stderr}")
    
    return json.loads(result.stdout.strip())


def test_accept_happy_path():
    """Test B1: POST /api/proposal/[token]/accept - Happy path"""
    log_test("POST /api/proposal/[token]/accept - Happy Path")
    
    try:
        # Create a fresh proposal
        proposal = create_test_proposal('PENDING')
        token = proposal['token']
        proposal_id = proposal['id']
        
        log_info(f"Created test proposal with token: {token}")
        
        # POST acceptance
        url = f"{BASE_URL}/api/proposal/{token}/accept"
        payload = {
            "clientName": "Giovanni Bianchi",
            "clientEmail": "giovanni.bianchi@example.com",
            "typedSignature": "Giovanni Bianchi",
            "checkboxTerms": True,
            "checkboxPrivacy": True,
            "browserLanguage": "it-IT"
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": TEST_IP,
            "User-Agent": "Mozilla/5.0 Test Browser",
            "Accept-Language": "it-IT,it;q=0.9",
            "Host": "localhost:3000",
            "Origin": "http://localhost:3000"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 200:
            results.add_fail("Accept Happy Path - Status Code", f"Expected 200, got {response.status_code}: {response.text}")
            return
        
        data = response.json()
        if not data.get('ok'):
            results.add_fail("Accept Happy Path - Response OK", f"Expected ok=true, got {data}")
            return
        
        if not data.get('acceptanceId'):
            results.add_fail("Accept Happy Path - Acceptance ID", "Missing acceptanceId in response")
            return
        
        if not data.get('pdfId'):
            results.add_fail("Accept Happy Path - PDF ID", "Missing pdfId in response")
            return
        
        acceptance_id = data['acceptanceId']
        log_info(f"Acceptance ID: {acceptance_id}")
        
        # Verify database changes
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check proposal status
        cursor.execute("SELECT status FROM Proposal WHERE id = ?", (proposal_id,))
        status = cursor.fetchone()
        if not status or status[0] != 'ACCEPTED':
            results.add_fail("Accept Happy Path - Proposal Status", f"Expected ACCEPTED, got {status[0] if status else 'None'}")
            conn.close()
            return
        
        log_info("Proposal status updated to ACCEPTED ✓")
        
        # Check ProposalAcceptance row
        cursor.execute("""
            SELECT ipAddress, userAgent, browserLanguage, checkboxTerms, checkboxPrivacy,
                   acceptedTermsVersion, acceptedTermsHash, pdfPath
            FROM ProposalAcceptance WHERE id = ?
        """, (acceptance_id,))
        
        acceptance = cursor.fetchone()
        if not acceptance:
            results.add_fail("Accept Happy Path - Acceptance Row", "ProposalAcceptance row not found")
            conn.close()
            return
        
        ip, ua, lang, terms_cb, privacy_cb, terms_ver, terms_hash, pdf_path = acceptance
        
        # Verify fields
        if not ip or ip == '':
            results.add_fail("Accept Happy Path - IP Address", "IP address is empty")
            conn.close()
            return
        log_info(f"IP Address: {ip} ✓")
        
        if not ua or ua == '':
            results.add_fail("Accept Happy Path - User Agent", "User agent is empty")
            conn.close()
            return
        log_info(f"User Agent: {ua[:30]}... ✓")
        
        if lang != 'it-IT':
            results.add_fail("Accept Happy Path - Browser Language", f"Expected 'it-IT', got '{lang}'")
            conn.close()
            return
        log_info(f"Browser Language: {lang} ✓")
        
        if terms_cb != 1:
            results.add_fail("Accept Happy Path - Terms Checkbox", f"Expected true, got {terms_cb}")
            conn.close()
            return
        log_info("Terms checkbox: true ✓")
        
        if privacy_cb != 1:
            results.add_fail("Accept Happy Path - Privacy Checkbox", f"Expected true, got {privacy_cb}")
            conn.close()
            return
        log_info("Privacy checkbox: true ✓")
        
        if not terms_ver or not terms_ver.startswith('terms-'):
            results.add_fail("Accept Happy Path - Terms Version", f"Expected 'terms-...', got '{terms_ver}'")
            conn.close()
            return
        log_info(f"Terms Version: {terms_ver} ✓")
        
        if not terms_hash or len(terms_hash) != 32:
            results.add_fail("Accept Happy Path - Terms Hash", f"Expected 32-char hex, got '{terms_hash}'")
            conn.close()
            return
        log_info(f"Terms Hash: {terms_hash} ✓")
        
        if not pdf_path or not pdf_path.startswith('public/pdfs/'):
            results.add_fail("Accept Happy Path - PDF Path", f"Expected 'public/pdfs/...', got '{pdf_path}'")
            conn.close()
            return
        log_info(f"PDF Path: {pdf_path} ✓")
        
        # Verify PDF file exists
        pdf_file_path = f"/app/{pdf_path}"
        if not os.path.exists(pdf_file_path):
            results.add_fail("Accept Happy Path - PDF File", f"PDF file not found at {pdf_file_path}")
            conn.close()
            return
        
        # Check PDF starts with '%PDF-'
        with open(pdf_file_path, 'rb') as f:
            header = f.read(5)
            if header != b'%PDF-':
                results.add_fail("Accept Happy Path - PDF Header", f"PDF doesn't start with '%PDF-', got {header}")
                conn.close()
                return
        
        log_info(f"PDF file exists and is valid ✓")
        
        conn.close()
        results.add_pass("Accept Happy Path")
        
    except Exception as e:
        results.add_fail("Accept Happy Path", str(e))


def test_accept_replay():
    """Test B2: POST /api/proposal/[token]/accept - Replay (409)"""
    log_test("POST /api/proposal/[token]/accept - Replay (409)")
    
    try:
        # Use existing accepted proposal token
        token = "cAeSIHXfBBEXG5mDApBJSvjAr6lmEbms"
        
        url = f"{BASE_URL}/api/proposal/{token}/accept"
        payload = {
            "clientName": "Test User",
            "clientEmail": "test@example.com",
            "typedSignature": "Test User",
            "checkboxTerms": True,
            "checkboxPrivacy": True,
            "browserLanguage": "en-US"
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": "203.0.113.99",
            "Host": "localhost:3000",
            "Origin": "http://localhost:3000"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 409:
            results.add_fail("Accept Replay - Status Code", f"Expected 409, got {response.status_code}: {response.text}")
            return
        
        data = response.json()
        if 'already' not in data.get('error', '').lower():
            results.add_fail("Accept Replay - Error Message", f"Expected 'already accepted' message, got: {data.get('error')}")
            return
        
        results.add_pass("Accept Replay (409)")
        
    except Exception as e:
        results.add_fail("Accept Replay (409)", str(e))


def test_accept_missing_token():
    """Test B3: POST /api/proposal/[token]/accept - Missing token (404)"""
    log_test("POST /api/proposal/[token]/accept - Missing Token (404)")
    
    try:
        token = "nonexistent-token-12345"
        
        url = f"{BASE_URL}/api/proposal/{token}/accept"
        payload = {
            "clientName": "Test User",
            "clientEmail": "test@example.com",
            "typedSignature": "Test User",
            "checkboxTerms": True,
            "checkboxPrivacy": True,
            "browserLanguage": "en-US"
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": "203.0.113.100",
            "Host": "localhost:3000",
            "Origin": "http://localhost:3000"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 404:
            results.add_fail("Accept Missing Token - Status Code", f"Expected 404, got {response.status_code}: {response.text}")
            return
        
        results.add_pass("Accept Missing Token (404)")
        
    except Exception as e:
        results.add_fail("Accept Missing Token (404)", str(e))


def test_accept_missing_fields():
    """Test B4: POST /api/proposal/[token]/accept - Missing fields (400)"""
    log_test("POST /api/proposal/[token]/accept - Missing Fields (400)")
    
    try:
        # Create a fresh proposal
        proposal = create_test_proposal('PENDING')
        token = proposal['token']
        
        log_info(f"Created test proposal with token: {token}")
        
        # POST with missing fields
        url = f"{BASE_URL}/api/proposal/{token}/accept"
        payload = {
            "clientName": "Test User",
            # Missing clientEmail
            "typedSignature": "Test User",
            "checkboxTerms": True,
            "checkboxPrivacy": True,
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": "203.0.113.101",
            "Host": "localhost:3000",
            "Origin": "http://localhost:3000"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 400:
            results.add_fail("Accept Missing Fields - Status Code", f"Expected 400, got {response.status_code}: {response.text}")
            return
        
        results.add_pass("Accept Missing Fields (400)")
        
    except Exception as e:
        results.add_fail("Accept Missing Fields (400)", str(e))


def test_accept_unchecked_boxes():
    """Test B5: POST /api/proposal/[token]/accept - Unchecked boxes (400)"""
    log_test("POST /api/proposal/[token]/accept - Unchecked Boxes (400)")
    
    try:
        # Create a fresh proposal
        proposal = create_test_proposal('PENDING')
        token = proposal['token']
        
        log_info(f"Created test proposal with token: {token}")
        
        # POST with unchecked boxes
        url = f"{BASE_URL}/api/proposal/{token}/accept"
        payload = {
            "clientName": "Test User",
            "clientEmail": "test@example.com",
            "typedSignature": "Test User",
            "checkboxTerms": False,  # Unchecked
            "checkboxPrivacy": True,
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": "203.0.113.102",
            "Host": "localhost:3000",
            "Origin": "http://localhost:3000"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 400:
            results.add_fail("Accept Unchecked Boxes - Status Code", f"Expected 400, got {response.status_code}: {response.text}")
            return
        
        results.add_pass("Accept Unchecked Boxes (400)")
        
    except Exception as e:
        results.add_fail("Accept Unchecked Boxes (400)", str(e))


def test_accept_cross_origin():
    """Test B6: POST /api/proposal/[token]/accept - Cross-origin (403)"""
    log_test("POST /api/proposal/[token]/accept - Cross-Origin (403)")
    
    try:
        # Create a fresh proposal
        proposal = create_test_proposal('PENDING')
        token = proposal['token']
        
        log_info(f"Created test proposal with token: {token}")
        
        # POST with cross-origin header
        url = f"{BASE_URL}/api/proposal/{token}/accept"
        payload = {
            "clientName": "Test User",
            "clientEmail": "test@example.com",
            "typedSignature": "Test User",
            "checkboxTerms": True,
            "checkboxPrivacy": True,
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": "203.0.113.103",
            "Host": "localhost:3000",
            "Origin": "http://evil.com"  # Different origin
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 403:
            results.add_fail("Accept Cross-Origin - Status Code", f"Expected 403, got {response.status_code}: {response.text}")
            return
        
        results.add_pass("Accept Cross-Origin (403)")
        
    except Exception as e:
        results.add_fail("Accept Cross-Origin (403)", str(e))


def test_accept_rate_limit():
    """Test B7: POST /api/proposal/[token]/accept - Rate limit (429)"""
    log_test("POST /api/proposal/[token]/accept - Rate Limit (429)")
    
    try:
        rate_limit_ip = "203.0.113.200"
        
        log_info("Sending 6 successful requests (should all succeed)...")
        
        # Send 6 successful requests
        for i in range(6):
            proposal = create_test_proposal('PENDING')
            token = proposal['token']
            
            url = f"{BASE_URL}/api/proposal/{token}/accept"
            payload = {
                "clientName": f"Test User {i}",
                "clientEmail": f"test{i}@example.com",
                "typedSignature": f"Test User {i}",
                "checkboxTerms": True,
                "checkboxPrivacy": True,
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-Forwarded-For": rate_limit_ip,
                "Host": "localhost:3000",
                "Origin": "http://localhost:3000"
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                results.add_fail("Accept Rate Limit - Setup", f"Request {i+1} failed with {response.status_code}: {response.text}")
                return
            
            log_info(f"Request {i+1}/6: {response.status_code} ✓")
        
        log_info("Sending 7th request (should be rate limited)...")
        
        # 7th request should be rate limited
        proposal = create_test_proposal('PENDING')
        token = proposal['token']
        
        url = f"{BASE_URL}/api/proposal/{token}/accept"
        payload = {
            "clientName": "Test User 7",
            "clientEmail": "test7@example.com",
            "typedSignature": "Test User 7",
            "checkboxTerms": True,
            "checkboxPrivacy": True,
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": rate_limit_ip,
            "Host": "localhost:3000",
            "Origin": "http://localhost:3000"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 429:
            results.add_fail("Accept Rate Limit - Status Code", f"Expected 429, got {response.status_code}: {response.text}")
            return
        
        results.add_pass("Accept Rate Limit (429)")
        
    except Exception as e:
        results.add_fail("Accept Rate Limit (429)", str(e))


def test_pdf_download_success():
    """Test C1: GET /api/pdf/[id] - Success (200)"""
    log_test("GET /api/pdf/[id] - Success (200)")
    
    try:
        # Use existing acceptance id
        acceptance_id = "cmp3tcd280002jo9njuc5ladb"
        
        url = f"{BASE_URL}/api/pdf/{acceptance_id}"
        
        response = requests.get(url)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Content-Type: {response.headers.get('Content-Type')}")
        log_info(f"Content-Disposition: {response.headers.get('Content-Disposition')}")
        
        if response.status_code != 200:
            results.add_fail("PDF Download Success - Status Code", f"Expected 200, got {response.status_code}: {response.text}")
            return
        
        if response.headers.get('Content-Type') != 'application/pdf':
            results.add_fail("PDF Download Success - Content-Type", f"Expected 'application/pdf', got '{response.headers.get('Content-Type')}'")
            return
        
        content_disp = response.headers.get('Content-Disposition', '')
        if 'attachment' not in content_disp or 'MadHat_' not in content_disp:
            results.add_fail("PDF Download Success - Content-Disposition", f"Expected 'attachment; filename=\"MadHat_...\"', got '{content_disp}'")
            return
        
        # Check PDF content
        if not response.content.startswith(b'%PDF-'):
            results.add_fail("PDF Download Success - PDF Header", "PDF doesn't start with '%PDF-'")
            return
        
        log_info(f"PDF size: {len(response.content)} bytes ✓")
        
        results.add_pass("PDF Download Success (200)")
        
    except Exception as e:
        results.add_fail("PDF Download Success (200)", str(e))


def test_pdf_download_missing():
    """Test C2: GET /api/pdf/[id] - Missing ID (404)"""
    log_test("GET /api/pdf/[id] - Missing ID (404)")
    
    try:
        acceptance_id = "missing-id-12345"
        
        url = f"{BASE_URL}/api/pdf/{acceptance_id}"
        
        response = requests.get(url)
        
        log_info(f"Response status: {response.status_code}")
        log_info(f"Response body: {response.text}")
        
        if response.status_code != 404:
            results.add_fail("PDF Download Missing - Status Code", f"Expected 404, got {response.status_code}: {response.text}")
            return
        
        results.add_pass("PDF Download Missing (404)")
        
    except Exception as e:
        results.add_fail("PDF Download Missing (404)", str(e))


def test_token_uniqueness():
    """Test D: Token cryptographic uniqueness - Create 50 proposals and verify all tokens are unique"""
    log_test("Token Cryptographic Uniqueness")
    
    try:
        log_info("Creating 50 proposals to test token uniqueness...")
        
        tokens = []
        
        for i in range(50):
            proposal = create_test_proposal('DRAFT')
            token = proposal['token']
            tokens.append(token)
            
            if (i + 1) % 10 == 0:
                log_info(f"Created {i + 1}/50 proposals...")
        
        log_info(f"Created {len(tokens)} proposals")
        
        # Check all tokens are unique
        unique_tokens = set(tokens)
        if len(unique_tokens) != len(tokens):
            results.add_fail("Token Uniqueness - Duplicates", f"Found {len(tokens) - len(unique_tokens)} duplicate tokens")
            return
        
        log_info(f"All {len(tokens)} tokens are unique ✓")
        
        # Check all tokens are >= 32 chars
        short_tokens = [t for t in tokens if len(t) < 32]
        if short_tokens:
            results.add_fail("Token Uniqueness - Length", f"Found {len(short_tokens)} tokens shorter than 32 chars: {short_tokens[:5]}")
            return
        
        log_info(f"All tokens are >= 32 characters ✓")
        log_info(f"Sample tokens: {tokens[0]}, {tokens[1]}, {tokens[2]}")
        
        results.add_pass("Token Cryptographic Uniqueness")
        
    except Exception as e:
        results.add_fail("Token Cryptographic Uniqueness", str(e))


def main():
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}MadHat Proposals - Backend Test Suite{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"Base URL: {BASE_URL}")
    print(f"Database: {DB_PATH}")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    # Run all tests
    test_database_seed()
    test_accept_happy_path()
    test_accept_replay()
    test_accept_missing_token()
    test_accept_missing_fields()
    test_accept_unchecked_boxes()
    test_accept_cross_origin()
    test_accept_rate_limit()
    test_pdf_download_success()
    test_pdf_download_missing()
    test_token_uniqueness()
    
    # Print summary
    success = results.summary()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
