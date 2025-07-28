import { keccak256 } from '@ethersproject/keccak256';

export const getRecId = (signature) => {
  const rec = signature.slice(-2)
  return parseInt(rec, 16) - 27
}

export const formatSignature = (signature) => {
  return signature
    .substring(1, 130)
    .substring(1, 130);
}

export const getSerializedClaim = (proof) => {
  return proof.signedClaim.claim.identifier +
    "\n" +
    proof.signedClaim.claim.owner +
    "\n" +
    proof.signedClaim.claim.timestampS +
    "\n" +
    proof.signedClaim.claim.epoch;
}

export const getHash = (serializedClaim) => {
  let ethPrefix = "\x19Ethereum Signed Message:\n";
  ethPrefix = ethPrefix + serializedClaim.length;

  const message = ethPrefix + serializedClaim;
  let digest = keccak256(Buffer.from(message));
  
  digest = digest.substring(2);
  return Buffer.from(digest, "hex");
}
