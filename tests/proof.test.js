import { describe, it, expect, beforeAll } from "vitest";
import { ethers } from "ethers";
import * as fs from "fs"

let proof;

describe("Proof validation tests", () => {
  beforeAll(async () => {
    const data = await fs.readFileSync("./src/proof.json");
    proof = JSON.parse(data);
  });

  it("should have required fields", () => {
    expect(proof).toHaveProperty("claimData");
    expect(proof).toHaveProperty("signatures");
    expect(proof.signatures.length).toBeGreaterThan(0);
    expect(proof).toHaveProperty("extractedParameterValues");
    expect(proof.extractedParameterValues).toHaveProperty("price");
  });

  it("should have a valid positive price", () => {
    const price = parseFloat(proof.extractedParameterValues.price);
    expect(price).toBeGreaterThan(0);
    expect(Number.isNaN(price)).toBe(false);
  });

  it("should verify the signature matches the owner", async () => {
    const message = proof.identifier +
      "\n" +
      proof.claimData.owner +
      "\n" +
      proof.claimData.timestampS +
      "\n" +
      proof.claimData.epoch;

    const signature = proof.signatures[0];
    const signerAddress = proof.witnesses[0].id;

    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    expect(recoveredAddress.toLowerCase()).toBe(signerAddress.toLowerCase());
  });

  it("should have a valid UNIX timestamp not in the future", () => {
    const timestamp = proof.claimData.timestampS;
    expect(typeof timestamp).toBe("number");
    // Basic sanity: timestamp should be less than current time + small allowance (e.g. 5 min)
    const nowInSeconds = Math.floor(Date.now() / 1000);
    expect(timestamp).toBeLessThanOrEqual(nowInSeconds + 300);
    expect(timestamp).toBeGreaterThan(0);
  });

  it("should have a valid provider (http or https)", () => {
    const provider = proof.claimData.provider;
    expect(typeof provider).toBe("string");
    expect(["http", "https"]).toContain(provider);
  });

  it("should have a positive integer epoch", () => {
    const epoch = proof.claimData.epoch;
    expect(Number.isInteger(epoch)).toBe(true);
    expect(epoch).toBeGreaterThan(0);
  });

  it("should have non-empty witnesses array with valid entries", () => {
    const witnesses = proof.witnesses;
    expect(Array.isArray(witnesses)).toBe(true);
    expect(witnesses.length).toBeGreaterThan(0);

    witnesses.forEach((witness) => {
      expect(witness).toHaveProperty("id");
      expect(typeof witness.id).toBe("string");
      // Basic check for hex string id starting with 0x
      expect(witness.id.startsWith("0x")).toBe(true);

      expect(witness).toHaveProperty("url");
      expect(typeof witness.url).toBe("string");
      expect(witness.url.startsWith("wss://")).toBe(true);
    });
  });

  it("should parse parameters JSON and contain expected keys", () => {
    const parametersStr = proof.claimData.parameters;
    let paramsObj;
    expect(typeof parametersStr).toBe("string");

    try {
      paramsObj = JSON.parse(parametersStr);
    } catch (e) {
      paramsObj = null;
    }
    expect(paramsObj).not.toBeNull();
    expect(paramsObj).toHaveProperty("method");
    expect(paramsObj).toHaveProperty("url");
    expect(paramsObj).toHaveProperty("responseMatches");
  });
});
