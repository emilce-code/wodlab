import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contactActions,
  contactHref,
  boxDestination,
} from "../lib/box-details.ts";

test("contacts follow approved priority and preserve every configured method", () => {
  const { actions, notes } = contactActions({
    whatsapp: "+595981123456",
    phone: "+5511987654321",
    email: "hello@example.com",
    instagram: "@box",
    website: "https://example.com",
    supportContact:
      "WhatsApp: +595 (981) 123-456\nhello@example.com\nAsk for Ana",
  });
  assert.deepEqual(
    actions.map((a) => a.channel),
    ["whatsapp", "phone", "email", "instagram", "website"],
  );
  assert.equal(notes, "Ask for Ana");
  assert.equal(actions[0].href, "https://wa.me/595981123456");
  assert.equal(actions[1].href, "tel:+5511987654321");
  assert.equal(actions[2].href, "mailto:hello%40example.com");
});
test("missing and malformed optional channels are hidden", () => {
  assert.deepEqual(contactActions({}), { actions: [], notes: "" });
  assert.deepEqual(
    contactActions({
      website: "javascript:alert(1)",
      phone: "bad",
      email: "bad",
      instagram: "https://evil.example/box",
    }).actions,
    [],
  );
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "https://user:secret@example.com",
    "https://example.com\nattack",
  ])
    assert.equal(contactHref("website", value), null);
});
test("legacy multiline instructions remain usable without treating arbitrary text as Instagram", () => {
  const result = contactActions({
    supportContact: "Email: legacy@example.com\n@legacy_box\nCall after class",
  });
  assert.deepEqual(
    result.actions.map((a) => a.channel),
    ["email", "instagram"],
  );
  assert.equal(result.notes, "Call after class");
});
test("directions prefer valid coordinates including zero", () => {
  const result = boxDestination({
    latitude: 0,
    longitude: 0,
    address: "Other address",
  });
  assert.equal(result.coordinates, true);
  assert.equal(result.destination, "0,0");
  assert.match(result.google, /destination=0%2C0$/);
  assert.match(result.apple, /daddr=0%2C0$/);
});
test("invalid or missing coordinates fall back to address, and no location means no actions", () => {
  assert.equal(
    boxDestination({ latitude: 91, longitude: 0, address: "Main & First" })
      .destination,
    "Main & First",
  );
  assert.match(
    boxDestination({ address: "Main & First" }).google,
    /Main%20%26%20First/,
  );
  assert.equal(
    boxDestination({ name: "Name is not a destination" }).google,
    null,
  );
  assert.equal(
    boxDestination({ latitude: NaN, longitude: 0 }).coordinates,
    false,
  );
});
