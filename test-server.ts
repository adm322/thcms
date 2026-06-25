import { test } from "node:test";
import assert from "node:assert/strict";

// We can bypass mocking by simply injecting a fake request with headers such that if we could inject a fake cookie for getSession to consume
