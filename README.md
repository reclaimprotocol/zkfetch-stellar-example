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

This will fetch a proof for accessing the latest XML price over Coin Gecko's API. The price is to be found in `Proof.extractedParameterValues`, example:
```
"extractedParameterValues": { "price": "0.426629" }
```

In the same directory:
```
node verifyProof
```

This will read the proof, build a transaction, and submit it to the blockchain. 

## Exploration:

Another example:

```js
const proof = await reclaimClient.zkFetch(
  "https://www.goal.com/en-in/live-scores",
  {
    method: "GET",
  },
  {
    responseMatches: [
      {
        type: "regex",
        value:
          '<div class="fco-match-team-and-score">.*?<div class="fco-team-name fco-long-name">(?<team1>.*?)</div>.*?<div class="fco-team-name fco-long-name">(?<team2>.*?)</div>.*?<div class="fco-match-score" data-side="team-a">(?<score1>\\d+)</div>\\s*<div class="fco-match-score" data-side="team-b">(?<score2>\\d+)</div>',
      },
    ],
    responseRedactions: [
      {
        regex:
          '<div class="fco-match-team-and-score">.*?<div class="fco-team-name fco-long-name">(?<team1>.*?)</div>.*?<div class="fco-team-name fco-long-name">(?<team2>.*?)</div>.*?<div class="fco-match-score" data-side="team-a">(?<score1>\\d+)</div>\\s*<div class="fco-match-score" data-side="team-b">(?<score2>\\d+)</div>',
      },
    ],
  },
);
```

More data feeds to try:

https://tradingeconomics.com/api/?source=footer

https://www.pandascore.co/

https://publicapis.io/panda-score-api

https://www.thesports.com/

https://open-meteo.com/

https://www.census.gov/data/developers/data-sets/economic-census.html 