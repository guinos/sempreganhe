import { describe, expect, it } from "vitest";
import { InvalidPhoneError, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("stores local Brazilian numbers in international format", () => {
    expect(normalizePhone("(11) 99999-9999")).toBe("5511999999999");
  });

  it("keeps an existing country code", () => {
    expect(normalizePhone("+55 11 99999-9999")).toBe("5511999999999");
  });

  it("rejects values without a valid digit count", () => {
    expect(() => normalizePhone("abcdefgh")).toThrow(InvalidPhoneError);
  });
});
