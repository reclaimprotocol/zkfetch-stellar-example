# Zkfetch on Stellar

Install packages:

```
npm i
```

Download ZK files:

```
node node_modules/@reclaimprotocol/zk-symmetric-crypto/lib/scripts/download-files 
```

Populate .env with your secret key:

```
SEEDPHRASE=
```

In `./src` run:

```
node requestProof
```

This will fetch a proof for accessing the latest XML price over Coin Gecko's API.

In the same directory:
```
node verifyProof
```

This will read the proof, build a transaction, and submit it to the blockchain. 

