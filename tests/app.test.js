import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../src/config.js';

const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const zkFetchMock = vi.hoisted(() => vi.fn());
const ReclaimClientMock = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({ zkFetch: zkFetchMock }))
);

const transformForOnchainMock = vi.hoisted(() => vi.fn());
const walletMock = vi.hoisted(() => ({
  getSecret: vi.fn().mockReturnValue('SSECRET'),
}));
const fromMnemonicMock = vi.hoisted(() =>
  vi.fn().mockReturnValue(walletMock)
);

const loadAccountMock = vi.hoisted(() => vi.fn());
const prepareTransactionMock = vi.hoisted(() => vi.fn());
const sendTransactionMock = vi.hoisted(() => vi.fn());
const contractCallMock = vi.hoisted(() => vi.fn());

vi.mock('fs', () => ({
  default: fsMocks,
  ...fsMocks,
}));

vi.mock('@reclaimprotocol/zk-fetch', () => ({
  ReclaimClient: ReclaimClientMock,
}));

vi.mock('@reclaimprotocol/js-sdk', () => ({
  transformForOnchain: transformForOnchainMock,
}));

vi.mock('stellar-hd-wallet', () => ({
  default: {
    fromMnemonic: fromMnemonicMock,
  },
}));

vi.mock('@stellar/stellar-sdk', () => ({
  Horizon: {
    Server: class {
      constructor() {
        return { loadAccount: loadAccountMock };
      }
    },
  },
  Keypair: {
    fromSecret: vi.fn(() => ({
      publicKey: () => 'GTESTPUBLICKEY',
    })),
  },
  Account: class {
    constructor(publicKey, sequence) {
      this.publicKey = publicKey;
      this.sequence = sequence;
    }
  },
  Contract: class {
    call(...args) {
      return contractCallMock(...args);
    }
  },
  TransactionBuilder: class {
    constructor() {
      this.addOperation = vi.fn().mockReturnThis();
      this.setTimeout = vi.fn().mockReturnThis();
      this.build = vi.fn().mockReturnValue({});
    }
  },
  TimeoutInfinite: 'TimeoutInfinite',
  nativeToScVal: vi.fn((value) => value),
  rpc: {
    Server: class {
      constructor() {
        this.prepareTransaction = prepareTransactionMock;
        this.sendTransaction = sendTransactionMock;
      }
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SEEDPHRASE = 'test seed phrase';

  fsMocks.existsSync.mockReturnValue(true);
  fsMocks.statSync.mockReturnValue({ isDirectory: () => true });
  fsMocks.writeFileSync.mockImplementation(() => {});
  fsMocks.readFileSync.mockImplementation(() =>
    JSON.stringify({ signatures: ['0xabc'] })
  );

  zkFetchMock.mockResolvedValue({
    extractedParameterValues: { price: '1.23' },
  });

  loadAccountMock.mockResolvedValue({
    sequence: '1',
    balances: [{ balance: '10' }],
  });
  prepareTransactionMock.mockResolvedValue({ sign: vi.fn() });
  sendTransactionMock.mockResolvedValue({ hash: 'txhash' });
  contractCallMock.mockReturnValue({ op: 'call' });

  transformForOnchainMock.mockReturnValue({
    signedClaim: {
      signatures: [`0x${'a'.repeat(128)}1b`],
      claim: {
        identifier: 'id',
        owner: 'owner',
        timestampS: 1,
        epoch: 1,
      },
    },
  });
});

describe('requestProof', () => {
  it('throws for invalid output path', async () => {
    const { requestProof } = await import('../src/requestProof.js');
    await expect(requestProof(null)).rejects.toThrow(
      'Output path must be a valid string'
    );
  });

  it('throws when output directory is missing', async () => {
    fsMocks.existsSync.mockReturnValue(false);
    const { requestProof } = await import('../src/requestProof.js');
    await expect(requestProof('./missing/proof.json')).rejects.toThrow(
      'Directory does not exist'
    );
  });

  it('throws when output path is not a directory', async () => {
    fsMocks.statSync.mockReturnValue({ isDirectory: () => false });
    const { requestProof } = await import('../src/requestProof.js');
    await expect(requestProof('./src/proof.json')).rejects.toThrow(
      'Path is not a directory'
    );
  });

  it('throws for unknown proof type', async () => {
    const { requestProof } = await import('../src/requestProof.js');
    await expect(requestProof('./src/proof.json', 'unknown')).rejects.toThrow(
      'Unknown proof type'
    );
  });

  it('throws when reclaim client cannot be created', async () => {
    ReclaimClientMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const { requestProof } = await import('../src/requestProof.js');
    await expect(requestProof('./src/proof.json', 'stellar')).rejects.toThrow(
      'Failed to create Reclaim client'
    );
  });

  it('throws when proof generation fails', async () => {
    zkFetchMock.mockRejectedValueOnce(new Error('network down'));
    const { requestProof } = await import('../src/requestProof.js');
    await expect(requestProof('./src/proof.json', 'stellar')).rejects.toThrow(
      'Failed to generate proof'
    );
  });

  it('generates a stellar proof and saves it', async () => {
    const { requestProof } = await import('../src/requestProof.js');
    const proof = await requestProof('./src/proof.json', 'stellar');

    expect(proof).toEqual(
      expect.objectContaining({
        extractedParameterValues: { price: '1.23' },
      })
    );
    expect(ReclaimClientMock).toHaveBeenCalledWith(
      CONFIG.RECLAIM.APP_ID,
      CONFIG.RECLAIM.APP_SECRET
    );
    expect(zkFetchMock).toHaveBeenCalledWith(
      CONFIG.API.COINGECKO_STELLAR_PRICE,
      { method: 'GET' },
      expect.any(Object)
    );
    expect(fsMocks.writeFileSync).toHaveBeenCalledWith(
      './src/proof.json',
      expect.any(String)
    );
  });

  it('writes proof data and fails if saving throws', async () => {
    fsMocks.writeFileSync.mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    const { requestProof } = await import('../src/requestProof.js');
    await expect(requestProof('./src/proof.json', 'stellar')).rejects.toThrow(
      'Failed to save proof'
    );
  });

  it('routes additional proof types through zkFetch', async () => {
    const { requestProof } = await import('../src/requestProof.js');
    await requestProof('./src/proof.json', 'forbes');

    expect(zkFetchMock).toHaveBeenCalledWith(
      CONFIG.API.FORBES_BILLIONAIRES,
      expect.any(Object),
      expect.any(Object)
    );
  });
});

describe('verifyProof', () => {
  it('throws if proof file is missing', async () => {
    fsMocks.existsSync.mockReturnValue(false);
    const { verifyProof } = await import('../src/verifyProof.js');
    await expect(verifyProof('./missing.json')).rejects.toThrow(
      'Proof file not found'
    );
  });

  it('throws if wallet creation fails', async () => {
    fromMnemonicMock.mockImplementationOnce(() => {
      throw new Error('no wallet');
    });
    const { verifyProof } = await import('../src/verifyProof.js');
    await expect(verifyProof('./src/proof.json')).rejects.toThrow(
      'Failed to create Stellar wallet'
    );
  });

  it('throws if proof signatures are missing', async () => {
    fsMocks.readFileSync.mockImplementationOnce(() =>
      JSON.stringify({ signatures: [] })
    );
    const { verifyProof } = await import('../src/verifyProof.js');
    await expect(verifyProof('./src/proof.json')).rejects.toThrow(
      'Invalid proof: missing signatures'
    );
  });

  it('throws if proof data is invalid', async () => {
    transformForOnchainMock.mockReturnValueOnce({
      signedClaim: {
        signatures: ['0x1234'],
        claim: {
          identifier: 'id',
          owner: 'owner',
          timestampS: 1,
          epoch: 1,
        },
      },
    });
    const { verifyProof } = await import('../src/verifyProof.js');
    await expect(verifyProof('./src/proof.json')).rejects.toThrow(
      'Failed to prepare proof data'
    );
  });

  it('throws if submitting transaction fails', async () => {
    sendTransactionMock.mockRejectedValueOnce(new Error('rpc down'));
    const { verifyProof } = await import('../src/verifyProof.js');
    await expect(verifyProof('./src/proof.json')).rejects.toThrow(
      'Failed to submit transaction'
    );
  });

  it('verifies proof and returns transaction hash', async () => {
    const { verifyProof } = await import('../src/verifyProof.js');
    const txHash = await verifyProof('./src/proof.json');

    expect(txHash).toBe('txhash');
    expect(transformForOnchainMock).toHaveBeenCalled();
    expect(prepareTransactionMock).toHaveBeenCalled();
    expect(sendTransactionMock).toHaveBeenCalled();
  });
});

describe('ZkFetchStellarApp', () => {
  it('routes to the correct proof type', async () => {
    vi.resetModules();
    const requestProofMock = vi.fn();
    const verifyProofMock = vi.fn();

    vi.doMock('../src/requestProof.js', () => ({
      requestProof: requestProofMock,
    }));
    vi.doMock('../src/verifyProof.js', () => ({
      verifyProof: verifyProofMock,
    }));

    const { ZkFetchStellarApp } = await import('../src/index.js');
    const app = new ZkFetchStellarApp();
    await app.requestTradingEconomicsProof('./out.json');

    expect(requestProofMock).toHaveBeenCalledWith(
      './out.json',
      'trading-economics'
    );
  });

  it('runs complete workflow successfully', async () => {
    vi.resetModules();
    const requestProofMock = vi.fn().mockResolvedValue({ ok: true });
    const verifyProofMock = vi.fn().mockResolvedValue('txhash');

    vi.doMock('../src/requestProof.js', () => ({
      requestProof: requestProofMock,
    }));
    vi.doMock('../src/verifyProof.js', () => ({
      verifyProof: verifyProofMock,
    }));

    const { ZkFetchStellarApp } = await import('../src/index.js');
    const app = new ZkFetchStellarApp();
    const result = await app.runCompleteWorkflow('./proof.json');

    expect(result).toEqual({
      proof: { ok: true },
      transactionHash: 'txhash',
      success: true,
    });
  });

  it('returns error result when workflow fails', async () => {
    vi.resetModules();
    const requestProofMock = vi.fn().mockRejectedValue(new Error('fail'));
    const verifyProofMock = vi.fn();

    vi.doMock('../src/requestProof.js', () => ({
      requestProof: requestProofMock,
    }));
    vi.doMock('../src/verifyProof.js', () => ({
      verifyProof: verifyProofMock,
    }));

    const { ZkFetchStellarApp } = await import('../src/index.js');
    const app = new ZkFetchStellarApp();
    const result = await app.runCompleteWorkflow('./proof.json');

    expect(result).toEqual({ error: 'fail', success: false });
    expect(verifyProofMock).not.toHaveBeenCalled();
  });
});

