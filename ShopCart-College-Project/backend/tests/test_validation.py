import json
import sys
import unittest
from email.message import Message
from io import BytesIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import run_server


class PhoneValidationTests(unittest.TestCase):
    def test_supported_phone_formats_are_normalized(self):
        for supplied in ("9876543210", "+91 98765-43210", "( +91 ) 98765 43210", "6123456789"):
            with self.subTest(supplied=supplied):
                self.assertIsNotNone(run_server.normalize_indian_phone(supplied))
        self.assertEqual(run_server.normalize_indian_phone("+91 98765-43210"), "+919876543210")

    def test_malformed_short_and_overlong_numbers_are_rejected(self):
        for supplied in ("98765", "1234", "phone123", "+91 98765", "19876543210", "98765432100", "+9198765432100"):
            with self.subTest(supplied=supplied):
                self.assertIsNone(run_server.normalize_indian_phone(supplied))


class RegistrationApiTests(unittest.TestCase):
    def setUp(self):
        self.db_path = Path(__file__).resolve().parent / ".validation_test.sqlite"
        self.original_db_path = run_server.DB_PATH
        run_server.DB_PATH = str(self.db_path)
        run_server.init_db()

    def tearDown(self):
        run_server.DB_PATH = self.original_db_path
        if self.db_path.exists():
            self.db_path.unlink()

    def post_json(self, path, payload, authenticated=False):
        handler = object.__new__(run_server.ApiHandler)
        handler.path = path
        body = json.dumps(payload).encode()
        handler.headers = Message()
        handler.headers["Content-Length"] = str(len(body))
        handler.rfile = BytesIO(body)
        handler.wfile = BytesIO()
        result = {}
        handler.send_response = lambda status: result.update(status=status)
        handler.send_header = lambda *_args: None
        handler.end_headers = lambda: None
        if authenticated:
            handler._current_user = lambda _cur: {"name": "Test Shopper", "email": "test@example.test"}
        handler.do_POST()
        return result["status"], json.loads(handler.wfile.getvalue().decode())

    def test_registration_rejects_invalid_phone_and_short_password(self):
        payload = {"name": "Test Shopper", "email": "bad@example.test", "password": "long-enough", "phone": "98765", "address": "Test address"}
        status, _ = self.post_json("/api/auth/register", payload)
        self.assertEqual(status, 400)
        payload.update(phone="9876543210", password="short")
        status, _ = self.post_json("/api/auth/register", payload)
        self.assertEqual(status, 400)

    def test_registration_accepts_and_normalizes_valid_number(self):
        payload = {"name": "Test Shopper", "email": "valid@example.test", "password": "eight888", "phone": "+91 (98765) 43210", "address": "Test address"}
        status, response = self.post_json("/api/auth/register", payload)
        self.assertEqual(status, 201)
        self.assertEqual(response["user"]["phone"], "+919876543210")

    def test_order_api_rejects_invalid_number_for_authenticated_customer(self):
        payload = {"delivery_address": "Test address", "phone": "phone123", "items": [{"product_id": 1, "quantity": 1}]}
        status, response = self.post_json("/api/orders", payload, authenticated=True)
        self.assertEqual(status, 400)
        self.assertIn("valid 10-digit", response["error"])


if __name__ == "__main__":
    unittest.main()
