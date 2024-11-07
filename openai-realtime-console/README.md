# OpenAI Realtime Console

The OpenAI Realtime Console is intended as an inspector and interactive API reference
for the OpenAI Realtime API. It comes packaged with two utility libraries,
[openai/openai-realtime-api-beta](https://github.com/openai/openai-realtime-api-beta)
that acts as a **Reference Client** (for browser and Node.js) and
[`/src/lib/wavtools`](./src/lib/wavtools) which allows for simple audio
management in the browser.

<img src="/readme/realtime-console-demo.png" width="800" />

# Starting the console

This is a React project created using `create-react-app` that is bundled via Webpack.
Install it by extracting the contents of this package and using;

```shell
$ npm i
```

Start your server with:

```shell
$ npm start
```

It should be available via `localhost:3000`.

# Table of contents

1. [Using the console](#using-the-console)
   1. [Using a relay server](#using-a-relay-server)
1. [Realtime API reference client](#realtime-api-reference-client)
   1. [Sending streaming audio](#sending-streaming-audio)
   1. [Adding and using tools](#adding-and-using-tools)
   1. [Interrupting the model](#interrupting-the-model)
   1. [Reference client events](#reference-client-events)
1. [Wavtools](#wavtools)
   1. [WavRecorder quickstart](#wavrecorder-quickstart)
   1. [WavStreamPlayer quickstart](#wavstreamplayer-quickstart)
1. [Acknowledgements and contact](#acknowledgements-and-contact)

# Using the console

The console requires an OpenAI API key (**user key** or **project key**) that has access to the
Realtime API. You'll be prompted on startup to enter it. It will be saved via `localStorage` and can be
changed at any time from the UI.

To start a session you'll need to **connect**. This will require microphone access.
You can then choose between **manual** (Push-to-talk) and **vad** (Voice Activity Detection)
conversation modes, and switch between them at any time.

There are two functions enabled;

- `get_weather`: Ask for the weather anywhere and the model will do its best to pinpoint the
  location, show it on a map, and get the weather for that location. Note that it doesn't
  have location access, and coordinates are "guessed" from the model's training data so
  accuracy might not be perfect.
- `set_memory`: You can ask the model to remember information for you, and it will store it in
  a JSON blob on the left.

You can freely interrupt the model at any time in push-to-talk or VAD mode.

## Using a relay server

If you would like to build a more robust implementation and play around with the reference
client using your own server, we have included a Node.js [Relay Server](/relay-server/index.js).

```shell
$ npm run relay
```

It will start automatically on `localhost:8081`.

**You will need to create a `.env` file** with the following configuration:

```conf
OPENAI_API_KEY=YOUR_API_KEY
REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
```

You will need to restart both your React app and relay server for the `.env.` changes
to take effect. The local server URL is loaded via [`ConsolePage.tsx`](/src/pages/ConsolePage.tsx).
To stop using the relay server at any time, simply delete the environment
variable or set it to empty string.

```javascript
/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL: string =
  process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';
```

This server is **only a simple message relay**, but it can be extended to:

- Hide API credentials if you would like to ship an app to play with online
- Handle certain calls you would like to keep secret (e.g. `instructions`) on
  the server directly
- Restrict what types of events the client can receive and send

You will have to implement these features yourself.

# Realtime API reference client

The latest reference client and documentation are available on GitHub at
[openai/openai-realtime-api-beta](https://github.com/openai/openai-realtime-api-beta).

You can use this client yourself in any React (front-end) or Node.js project.
For full documentation, refer to the GitHub repository, but you can use the
guide here as a primer to get started.

```javascript
import { RealtimeClient } from '/src/lib/realtime-api-beta/index.js';

const client = new RealtimeClient({ apiKey: process.env.OPENAI_API_KEY });

// Can set parameters ahead of connecting
client.updateSession({ instructions: 'You are a great, upbeat friend.' });
client.updateSession({ voice: 'alloy' });
client.updateSession({ turn_detection: 'server_vad' });
client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

// Set up event handling
client.on('conversation.updated', ({ item, delta }) => {
  const items = client.conversation.getItems(); // can use this to render all items
  /* includes all changes to conversations, delta may be populated */
});

// Connect to Realtime API
await client.connect();

// Send an item and triggers a generation
client.sendUserMessageContent([{ type: 'text', text: `How are you?` }]);
```

## Sending streaming audio

To send streaming audio, use the `.appendInputAudio()` method. If you're in `turn_detection: 'disabled'` mode,
then you need to use `.generate()` to tell the model to respond.

```javascript
// Send user audio, must be Int16Array or ArrayBuffer
// Default audio format is pcm16 with sample rate of 24,000 Hz
// This populates 1s of noise in 0.1s chunks
for (let i = 0; i < 10; i++) {
  const data = new Int16Array(2400);
  for (let n = 0; n < 2400; n++) {
    const value = Math.floor((Math.random() * 2 - 1) * 0x8000);
    data[n] = value;
  }
  client.appendInputAudio(data);
}
// Pending audio is committed and model is asked to generate
client.createResponse();
```

## Adding and using tools

Working with tools is easy. Just call `.addTool()` and set a callback as the second parameter.
The callback will be executed with the parameters for the tool, and the result will be automatically
sent back to the model.

```javascript
// We can add tools as well, with callbacks specified
client.addTool(
  {
    name: 'get_weather',
    description:
      'Retrieves the weather for a given lat, lng coordinate pair. Specify a label for the location.',
    parameters: {
      type: 'object',
      properties: {
        lat: {
          type: 'number',
          description: 'Latitude',
        },
        lng: {
          type: 'number',
          description: 'Longitude',
        },
        location: {
          type: 'string',
          description: 'Name of the location',
        },
      },
      required: ['lat', 'lng', 'location'],
    },
  },
  async ({ lat, lng, location }) => {
    const result = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`
    );
    const json = await result.json();
    return json;
  }
);
```

## Interrupting the model

You may want to manually interrupt the model, especially in `turn_detection: 'disabled'` mode.
To do this, we can use:

```javascript
// id is the id of the item currently being generated
// sampleCount is the number of audio samples that have been heard by the listener
client.cancelResponse(id, sampleCount);
```

This method will cause the model to immediately cease generation, but also truncate the
item being played by removing all audio after `sampleCount` and clearing the text
response. By using this method you can interrupt the model and prevent it from "remembering"
anything it has generated that is ahead of where the user's state is.

## Reference client events

There are five main client events for application control flow in `RealtimeClient`.
Note that this is only an overview of using the client, the full Realtime API
event specification is considerably larger, if you need more control check out the GitHub repository:
[openai/openai-realtime-api-beta](https://github.com/openai/openai-realtime-api-beta).

```javascript
// errors like connection failures
client.on('error', (event) => {
  // do thing
});

// in VAD mode, the user starts speaking
// we can use this to stop audio playback of a previous response if necessary
client.on('conversation.interrupted', () => {
  /* do something */
});

// includes all changes to conversations
// delta may be populated
client.on('conversation.updated', ({ item, delta }) => {
  // get all items, e.g. if you need to update a chat window
  const items = client.conversation.getItems();
  switch (item.type) {
    case 'message':
      // system, user, or assistant message (item.role)
      break;
    case 'function_call':
      // always a function call from the model
      break;
    case 'function_call_output':
      // always a response from the user / application
      break;
  }
  if (delta) {
    // Only one of the following will be populated for any given event
    // delta.audio = Int16Array, audio added
    // delta.transcript = string, transcript added
    // delta.arguments = string, function arguments added
  }
});

// only triggered after item added to conversation
client.on('conversation.item.appended', ({ item }) => {
  /* item status can be 'in_progress' or 'completed' */
});

// only triggered after item completed in conversation
// will always be triggered after conversation.item.appended
client.on('conversation.item.completed', ({ item }) => {
  /* item status will always be 'completed' */
});
```

# Wavtools

Wavtools contains easy management of PCM16 audio streams in the browser, both
recording and playing.

## WavRecorder Quickstart

```javascript
import { WavRecorder } from '/src/lib/wavtools/index.js';

const wavRecorder = new WavRecorder({ sampleRate: 24000 });
wavRecorder.getStatus(); // "ended"

// request permissions, connect microphone
await wavRecorder.begin();
wavRecorder.getStatus(); // "paused"

// Start recording
// This callback will be triggered in chunks of 8192 samples by default
// { mono, raw } are Int16Array (PCM16) mono & full channel data
await wavRecorder.record((data) => {
  const { mono, raw } = data;
});
wavRecorder.getStatus(); // "recording"

// Stop recording
await wavRecorder.pause();
wavRecorder.getStatus(); // "paused"

// outputs "audio/wav" audio file
const audio = await wavRecorder.save();

// clears current audio buffer and starts recording
await wavRecorder.clear();
await wavRecorder.record();

// get data for visualization
const frequencyData = wavRecorder.getFrequencies();

// Stop recording, disconnects microphone, output file
await wavRecorder.pause();
const finalAudio = await wavRecorder.end();

// Listen for device change; e.g. if somebody disconnects a microphone
// deviceList is array of MediaDeviceInfo[] + `default` property
wavRecorder.listenForDeviceChange((deviceList) => {});
```

## WavStreamPlayer Quickstart

```javascript
import { WavStreamPlayer } from '/src/lib/wavtools/index.js';

const wavStreamPlayer = new WavStreamPlayer({ sampleRate: 24000 });

// Connect to audio output
await wavStreamPlayer.connect();

// Create 1s of empty PCM16 audio
const audio = new Int16Array(24000);
// Queue 3s of audio, will start playing immediately
wavStreamPlayer.add16BitPCM(audio, 'my-track');
wavStreamPlayer.add16BitPCM(audio, 'my-track');
wavStreamPlayer.add16BitPCM(audio, 'my-track');

// get data for visualization
const frequencyData = wavStreamPlayer.getFrequencies();

// Interrupt the audio (halt playback) at any time
// To restart, need to call .add16BitPCM() again
const trackOffset = await wavStreamPlayer.interrupt();
trackOffset.trackId; // "my-track"
trackOffset.offset; // sample number
trackOffset.currentTime; // time in track
```

# Acknowledgements and contact

Thanks for checking out the Realtime Console. We hope you have fun with the Realtime API.
Special thanks to the whole Realtime API team for making this possible. Please feel free
to reach out, ask questions, or give feedback by creating an issue on the repository.
You can also reach out and let us know what you think directly!

- OpenAI Developers / [@OpenAIDevs](https://x.com/OpenAIDevs)
- Jordan Sitkin / API / [@dustmason](https://x.com/dustmason)
- Mark Hudnall / API / [@landakram](https://x.com/landakram)
- Peter Bakkum / API / [@pbbakkum](https://x.com/pbbakkum)
- Atty Eleti / API / [@athyuttamre](https://x.com/athyuttamre)
- Jason Clark / API / [@onebitToo](https://x.com/onebitToo)
- Karolis Kosas / Design / [@karoliskosas](https://x.com/karoliskosas)
- Keith Horwood / API + DX / [@keithwhor](https://x.com/keithwhor)
- Romain Huet / DX / [@romainhuet](https://x.com/romainhuet)
- Katia Gil Guzman / DX / [@kagigz](https://x.com/kagigz)
- Ilan Bigio / DX / [@ilanbigio](https://x.com/ilanbigio)
- Kevin Whinnery / DX / [@kevinwhinnery](https://x.com/kevinwhinnery)

   

  

Ministry of Agriculture & Farmers Welfare

![azadi ka amrit mahotsav](https://static.pib.gov.in/WriteReadData/specificdocs/photo/2021/aug/ph202183101.png)

Schemes for Welfare of Farmers  

---------------------------------

Posted On: 02 FEB 2024 6:48PM by PIB Delhi

Details of schemes being run by Department of Agriculture and Farmers’ Welfare for welfare/increasing incomes of farmers and the achievements made therein, scheme-wise are attached in Annexure:

**Brief of major schemes implemented by the** **Department of Agriculture and Farmers Welfare**

|     |     |     |
| --- | --- | --- |
| **S**<br><br>**No** | **Name       of       the Scheme** | **Purpose** |
| **I.** | **Central Sector Schemes** |     |
| 1.  | Pradhan        Mantri<br><br>Kisan         Samman Nidhi (PM-KISAN) | PM-KISAN is a central sector scheme launched on 24th February 2019 to supplement financial needs of land holding farmers, subject to exclusions. Under the scheme, financial benefit of Rs. 6000/- per year is transferred in three equal four-monthly installments into the bank accounts of farmers’ families across the country, through Direct Benefit Transfer (DBT) mode. Till now, Rs.<br><br>2.81 lakh crores have been transferred through Direct Benefit Transfer (DBT) to more than 11 crores beneficiaries (Farmers) through various instalments. |
| 2.  | Pradhan Mantri Kisan MaanDhan Yojana (PM-KMY) | Pradhan Mantri Kisan Maandhan Yojna (PMKMY) is a central sector scheme launched on 12th September 2019 to provide security to the most vulnerable farmer families. PM-KMY is contributory scheme, small and marginal farmers (SMFs), subject to exclusion criteria, can opt to become member of the scheme by paying monthly subscription to the Pension Fund. Similar, amount will be contributed by the Central Government.<br><br>The applicants between the age group of 18 to 40 years will have to contribute between Rs. 55 to Rs. 200 per month till they attain the age of 60. PMKMY is taking care of the farmers during their old age and provides Rs. 3,000 monthly pension to the enrolled farmers once they attain 60 years of age, subject to exclusion criteria.<br><br>Life Insurance Corporation (LIC) is pension fund manager and registration of beneficiaries is done through CSC and State Govts.<br><br>So far 23.38 lakh farmers have enrolled under the scheme. |
| 3.  | Pradhan Mantri Fasal Bima Yojana (PMFBY) | PMFBY was launched in 2016 in order to provide a simple and affordable crop insurance product to ensure comprehensive risk cover for crops to farmers against all non-preventable natural risks from pre-sowing to post-harvest and to provide adequate claim amount. The scheme is demand driven and available for all farmers A total of 5549.40 lakh farmer applications were insured under the<br><br>scheme since 2016-17 and Rs 150589.10 crore has been paid as claim. |
| 4.  | Modified Interest Subvention Scheme (MISS) | The Interest Subvention Scheme (ISS) provides concessional short term agri-loans to the farmers practicing crop husbandry and other allied activities like animal husbandry, dairying and fisheries. ISS is available to farmers availing short term crop loans up to<br><br>Rs.3.00 lakh at an interest rate of 7% per annum for one year. Additional 3% subvention is also given to the farmers for prompt and<br><br>timely repayment of loans thus reducing the effective rate of interest to 4% per annum. The benefit of ISS is also available for post-harvest loans against Negotiable Warehouse Receipts (NWRs) on crop loans for a further period of six months post-harvest to small and marginal farmers having Kisan Credit Cards (KCCs), on occurrence of natural calamities and severe natural calamities. As on 05-01-2024, 465.42<br><br>lakh new KCC applications have been sanctioned with a sanctioned credit limit of Rs. 5,69,974 crore as part of the drive. |
| 5.  | Agriculture Infrastructure Fund (AIF) | In order to address the existing infrastructure gaps and mobilize investment in agriculture infrastructure, Agri Infra Fund was launched under Aatmanirbhar Bharat Package. AIF was introduced with a vision to transform the agriculture infrastructure landscape of the country. The Agriculture Infrastructure Fund is a medium - long term debt financing facility for investment in viable projects for post- harvest management infrastructure and community farming assets through interest subvention and credit guarantee support. The Fund of Rs. 1 lakh crore under the scheme will be disbursed from FY 2020-21 to FY2025-26 and the support under the scheme will be provided for the duration of FY2020-21 to FY2032-33.<br><br>Under the scheme, Rs. 1 Lakh Crore will be provided by banks and financial institutions as loans with interest subvention of 3% per annum and credit guarantee coverage under CGTMSE for loans up to Rs. 2 Crores. Further, each entity is eligible to get the benefit of the scheme for up to 25 projects located in different LGD codes.<br><br>Eligible beneficiaries include Farmers, Agri-entrepreneurs, Start-ups, Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, Farmer Producers Organizations(FPOs), Self Help Group (SHG), Joint Liability Groups (JLG), Multipurpose Cooperative Societies, Central/State agency or Local Body sponsored Public Private Partnership Projects, State Agencies, Agricultural Produce Market Committees (Mandis), National & State Federations of Cooperatives, Federations of FPOs (Farmer Produce Organizations) and Federations of Self Help Groups (SHGs).<br><br>As on 31-12-2023, Rs.33.209 Crores have been sanctioned for 44,912 projects under AIF, out of this total sanctioned amount, Rs 25,504 Crores is covered under scheme benefits. These sanctioned projects have mobilized an investment of Rs 56.471 Crores in agriculture sector. |
| 6.  | Formation             & Promotion of new 10,000 FPOs | The Government of India launched the Central Sector Scheme (CSS) for “Formation and Promotion of 10,000 Farmer Producer Organizations (FPOs)” in the year 2020. The scheme has a total budgetary outlay of Rs.6865 crores. Formation & promotion of FPOs are to be done through Implementing Agencies (IAs), which further engage Cluster Based Business Organizations (CBBOs) to form & provide professional handholding support to FPOs for a<br><br>period of 5 years. |

|     |     |     |
| --- | --- | --- |
|     |     | FPOs get a financial assistance upto Rs 18.00 lakh per FPO for a period of 03 years. In addition to this, provision has been made for matching equity grant upto Rs. 2,000 per farmer member of FPO with a limit of Rs. 15.00 lakh per FPO and a credit guarantee facility upto Rs. 2 crore of project loan per FPO from eligible lending institution to ensure institutional credit accessibility to FPOs. Suitable provisions have been made for training and skill development of FPOs.<br><br>Further, FPOs are onboarded on National Agriculture Market (e-NAM) platform which facilitate online trading of their agricultural commodities through transparent price discovery method to enable FPOs to realize better remunerative prices for their produce.<br><br>As on 31.12.2023, total 7,774 FPOs were registered under the scheme in the country. |
| 7.  | National beekeeping        and Honey         Mission (NBHM) | Keeping in view the importance of beekeeping, a new Central Sector Scheme entitled National Beekeeping & Honey Mission (NBHM) was launched in 2020 under Atma Nirbhar Bharat Abhiyan for its implementation in the field for overall promotion and development of scientific beekeeping & to achieve the goal of “Sweet Revolution”. Some of the achievements include;<br><br>*   Honeybees/ beekeeping have been approved as 5th Input for Agriculture.<br>*   4 World Class State of the Art Honey Testing Labs and 35 Mini Honey Testing Labs have been sanctioned under National Beekeeping & Honey Mission (NBHM) for testing of honey.<br>*   Madhukranti portal has been launched for online registration of Beekeepers/ Honey Societies/ Firms/ Companies.<br>*   Till date 23 lakhs bee colonies registered on Portal.<br>*   100 Honey FPOs targeted under 10,000 FPOs scheme in the country. 88 FPOs have been registered by NAFED, NDDB & TRIFED.<br>*   25 States/UTs have been covered under NBHM under MM-I, II & III.<br>*   160 Projects sanctioned under MM- I, II & III of Rs. 202.00 crores. |
| 8.  | Market Intervention Scheme and Price support Scheme (MIS-PSS) | Ministry of Agriculture & Farmers Welfare implements the Price Support Scheme (PSS) for procurement of pulses, oilseeds and copra. Market Intervention Scheme (MIS) for procurement of agricultural and horticultural commodities which are perishable in nature and are not covered under the Price Support Scheme (PSS). The objective of intervention is to protect the growers of these commodities from making distress sale in the event of a bumper crop during the peak arrival period when the prices tend to fall below<br><br>economic levels and cost of production. |
| 9.  | Namo Drone Didi | The Government has recently approved a Central Sector Scheme for<br><br>providing drones to the Women Self Help Group (SHGs) for the |

|     |     |     |
| --- | --- | --- |
|     |     | period from 2024-25 to 2025-26 with an outlay of Rs. 1261 Crores. The scheme aims to provide drones to 15000 selected Women Self Help Group (SHGs) for providing rental services to farmers for agriculture purpose (application of fertilizers and pesticides). Under this Scheme, Central Financial Assistance @ 80% of the cost of drone and accessories/ancillary charges upto a maximum of Rs. 8.0 Lakhs will be provided to the women SHGs for purchase of drones. The Cluster Level Federations (CLFs) of SHGs may raise the balance amount (total cost of procurement minus subsidy) as loan under National Agriculture Infra Financing Facility (AIF). Interest subvention @ 3% on the AIF loan will be provided to the CLFs. The scheme will also provide sustainable business and livelihood support<br><br>to SHGs and they would be able to earn additional income of at least of Rs. 1.0 lakh per annum. |
| **II** | **Centrally Sponsored Schemes** |     |
| II. (i) Rashtriya Krishi Vikas Yojana |     |     |
| 10. | Rastriya        Krishi<br><br>Vikas         Yojana-<br><br>Detailed       Project<br><br>Report            based schemes (RKVY- DPR) | The scheme focuses on creation of pre & post-harvest infrastructure in agriculture and allied sectors that help in supply of quality inputs, market facilities, etc to farmers. It provides flexibility and autonomy to states to implement projects as per the local farmers’ needs and priorities from a bouquet of activities in agriculture and allied sectors. The scheme aims to fill the resources gap of agriculture and allied sectors by providing financial support to states for undertaking various activities to increase in overall growth of agriculture and allied sectors and farmers’ income.<br><br>Under RKVY Agri-startup Programme, since 2019-20, 1524 Start-ups have been selected and Rs. Rs. 106.25 crore released as grants-in-aid for funding the Start-ups. |
| 11. | Soil    Health    Card (SHC) | Soil health card provides information to farmers on nutrient status of their soil along with recommendation on appropriate dosage of nutrients to be applied for improving soil health and its fertility. The indicators are typically based on farmers' practical experience and knowledge of local natural resources. The card lists soil health indicators that can be assessed without the aid of technical or laboratory equipment. The Scheme rolls out a decentralized system of soil testing which will help in developing a nationwide soil fertility map on a GIS platform that can easily be integrated with the real time decision support systems being developed. In order to develop the soil fertility map, Government of India has decided to conduct 5 Crore Soil Samples across the country during year 2023-<br><br>24 to 2025-26. |
| 12. | Rainfed           Area Development (RAD) | RAD is being implemented since 2014-15. RAD adopts an area based approach in cluster mode for promoting Integrated Farming System (IFS) which focuses on multi-cropping, rotational<br><br>cropping, inter-cropping, mixed cropping practices with allied activities like horticulture, livestock, fishery, apiculture etc. to |

|     |     |     |
| --- | --- | --- |
|     |     | enable farmers not only in maximizing the farm returns for sustaining livelihood, but also to mitigate the impacts of drought, flood or other extremes weather events. An amount of Rs. 1673.58<br><br>crores has been released and an area of 7.13 lakh hectare has been covered under RAD programme from the year 2014-15 to till date. |
| 13. | Per     Drop     More Crop (PDMC) | In order to increase water use efficiency at the farm level through Micro Irrigation technologies i.e. drip and sprinkler irrigation systems, Per Drop More Crop (PDMC) scheme was launched during 2015-16. The Micro Irrigation helps in water saving as well as reduced fertilizer usage through fertigation, labour expenses, other input costs and overall income enhancement of farmers.<br><br>It also supports micro level water harvesting, storage, management etc. activities as Other Interventions (OI) to supplement source creation for Micro Irrigation. OI activities allowed on need basis up to 40% of the total allocation for North East States, Himalayan States, Jammu & Kashmir, Ladakh and up to 20% for other States.<br><br>An area of 78 lakh hectare has been covered under Micro irrigation through the PDMC scheme from 2015-16 to 2022-23. |
| 14. | Micro        Irrigation Fund (MIF) | A Micro Irrigation Fund (MIF) of initial corpus Rs 5000 crore has been created with NABARD with major objective to facilitate the States in mobilizing the resources for expanding coverage of Micro Irrigation. Under the funding arrangement, NABARD lends to the States/UTs at 3% lower interest rate than the corresponding cost of fund mobilized by NABARD from the market. The interest subvention on the loan under MIF is borne by Centre under PDMC. Projects with loans under MIF worth Rs 4710.96 crore have been approved so far. Loans amounting Rs.2812.24 crore has been disbursed to States of Andhra Pradesh, Tamil Nadu, Gujarat, Punjab, Haryana and Rajasthan. The Ministry provides interest subvention on the loan availed by the States which is met from PDMC Scheme. As per the Budget 2021-22, the corpus of the fund is to be doubled to Rs.10000 crores. MIF is now merged with<br><br>PDMC. |
| 15. | Paramparagat Krishi             Vikas Yojana (PKVY) | Paramparagat Krishi Vikas Yojana (PKVY) aims to increase soil fertility and thereby helps in production of healthy food through organic practices without the use of agro-chemicals. The scheme is implemented in a cluster mode with unit cluster size of 20 hectares. A group shall comprise minimum 20 farmers (may be more if individual holdings are less). Farmers in a group can avail benefit of maximum of 2 ha as per provision of PKVY. 25 such clusters are converted into one large cluster of about 500 ha area to facilitate marketing of organic produce. The scheme provides for an assistance of Rs. 31,500 per ha to states, out of which i.e., Rs. 15,000 is given<br><br>as incentives to a farmer directly through DBT. |

|     |     |     |
| --- | --- | --- |
| 16. | Sub-Mission        on Agriculture Mechanization (SMAM) | Sub Mission on Agricultural Mechanization (SMAM) is being implemented w.e.f April, 2014 which aims at catalyzing an accelerated but inclusive growth of agricultural mechanization in India with the objectives of Increasing the reach of farm mechanization to small and marginal farmers and to the regions where availability of farm power is low, promoting ‘Custom Hiring Centres’ to offset the adverse economies of scale arising due to small landholding and high cost of individual ownership, creating hubs for hi-tech& high value farm equipments, creating awareness among stakeholders through demonstration and capacity building activities and Ensuring performance testing and certification at designated testing centers located all over the country. Till date Rs. 6748.78 Crore have been released to State Governments, distributed more than 15,75,719 agricultural machinery & equipment’s including Tractors, Power Tillers, Self-Propelled Machineries and Plant Protection Equipment and established 23472 nos of Custom Hiring Centres, 504 nos of Hi-Tech Hubs and 20597 nos. of Farm Machinery Banks.<br><br>**Promotion of Drone Technology under SMAM**<br><br>Looking into the unique advantages of Drone technologies in agriculture, a Standard Crop Specific Operating Procedures (SOPs) released the for use of drones in pesticide and nutrient application in public domain on 20.04.2023, which provides concise instructions for effective and safe operations of drones.<br><br>From within the funds of SMAM, so far an amount of Rs.<br><br>138.82 crores have been released towards Kisan drone promotion, which include purchase of 317 Drones for their demonstration in 79070 hectares of land and supply of 461 drones to the farmers on subsidy and also supply of 1595 drones to the CHCs for providing drone services to the farmers on rental basis. |
| 17. | Crop           Residue Management | Crop Residue Management was implemented from 2018-19 in Punjab, Haryana, Uttar Pradesh and NCT of Delhi. Its objectives include protecting environment from air pollution and preventing loss of nutrients and soil micro-organisms caused by burning of crop residue through promoting in-situ management of crop residue. In this regard, it proposes to set up Farm Machinery Banks for custom hiring of in-situ crop residue management machinery. It also aims to creating awareness among stakeholders through demonstration, capacity building activities and differentiated information, education and communication strategies for effective utilization and management of crop residue. Rs. 3333.17 crore has been released under the scheme since inception and distributed more than 2,95,845 CRM machinery. CRM is now merged with<br><br>SMAM. |
| 18. | Agro-forestry | Agro-forestry was conceived on the recommendation of the National Agro-forestry Policy 2014 to promote plantation on farmlands. The<br><br>restructured agro-forestry under RKVY is aimed to provide Quality |

|     |     |     |
| --- | --- | --- |
|     |     | Planting Materials (QPM) and the certification in order to promote<br><br>planting of trees on farm land for improving the livelihood of farmers. |
| **II (ii). Krishonnati Yojana** |     |     |
| 19. | National Food Security Mission (NFSM) | The Mission aims at increasing production of rice, wheat, pulses, coarse cereals (Maize and Barley) and Nutri-Cereals through area expansion and productivity enhancement in a sustainable manner in the identified districts of 28 States and 2 UTs (i.e., J&K and Ladakh). Other objectives include restoring Soil fertility and productivity at the individual farm level, enhancing farm level economy to restore confidence amongst the farmers and post harvest value addition at farm gate.<br><br>Since the declaration of the International Year of Millets (IYM) 2023 by the UNGA in 2021, Government has taken a proactive multi stakeholder engagement approach to achieve the aim of IYM 2023 and taking Indian millets globally. 25 seed-hubs have been established to ensure availability of quality seed of latest improved varieties of Nutri cereals in the country. Millet missions have been launched across 13 states including Odisha, Tamil Nadu, Chhattisgarh, Assam, Karnataka, Madhya Pradesh, Maharashtra, Uttarakhand, Uttar Pradesh, Bihar, Himachal Pradesh, Gujarat and Rajasthan. More than 500 start-ups and 350 FPOs have been<br><br>established and are operational in the millet ecosystem as of now. |
| 20. | Sub-Mission on Seed and Planting Material (SMSP) | SMSP covers the entire gamut of seed production chain, from production of nucleus seed to supply of certified seeds to the farmers, to provide support for creation of infrastructure conducive for development of the seed sector, support to the public seed producing organisations for improving their capacity and quality of seed production, create dedicated seed bank to meet unforeseen circumstances of natural calamities, etc. For effective monitoring, efficiency and transparency covering Seed chain from Nucleus- Breeder-Foundation-Certified Seed, first phase of Seed Authentication, Traceability & Holistic Inventory (SATHI) portal<br><br>was launched on 19th April, 2023. SMSP is now merged with NFSM. |
| 21. | National Mission on Edible                Oils (NMEO)-Oil Palm | A new Centrally Sponsored Scheme namely, National Mission on Edible Oil (NMEO)-Oil Palm (NMEO-OP) has been launched by Government of India in 2021 in order to promote oil palm cultivation for making the country Aatamnirbhar in edible oils with special focus on North-Eastern States and A&N Islands. The Mission will bring additional area of 6.5 lakh ha under Oil Palm plantation with<br><br>3.28 lakh ha in north-eastern states and 3.22 in rest of India in next 5 years from 2021-22 to 2025-26. |
| 22  | Mission               for Integrated Development       of Horticulture (MIDH) | Mission for Integrated Development of Horticulture (MIDH), a Centrally Sponsored Scheme was launched during 2014-15 for holistic growth of the horticulture sector covering fruits, vegetables, root and tuber crops, mushrooms, spices, flowers, aromatic plants, coconut, cashew, cocoa and Bamboo. Major components include |

|     |     |     |
| --- | --- | --- |
|     |     | plantation infrastructure development, establishment of new orchards and gardens for fruits, vegetables, spices and flowers, rejuvenation of unproductive, old, and senile orchards, protected cultivation, promotion of organic farming, pollination support through bee keeping, horticulture mechanization, post-harvest management (phm) and marketing infrastructure etc.<br><br>Under MIDH since 2014-15 to 2023-24 (as on 31.10.2023) an additional area of 12.95 lakh ha. of identified horticulture crops has been covered, 872 nurseries established for production of quality planting material, 1.41 lakh ha. of old and senile orchards has been rejuvenated, 52069 ha. been covered under organic practices and<br><br>3.07 lakh ha. has been covered under Protected Cultivation. |
| 23  | National     Bamboo Mission (NBM) | The Scheme is implemented in 23 States and 1 UT (J&K) through the State Bamboo Missions (SBM)/ State Bamboo Development Agency (SBDA).NBM mainly focus on the development of complete value chain of the bamboo sector. It is envisaged to link growers with consumers with a cluster approach mode.<br><br>Under NBM, 367 Bamboo Nurseries established, 212 bamboo Nurseries Accredited by the State Level Accreditation Committees, 46000 ha bamboo plantations established in non-forest Government & private lands, 81 units for bamboo primary processing established, 416 units established for value addition and product development, and capacity building for 15000 persons including farmers, artisans<br><br>and entrepreneurs. NBM is now merged with MIDH. |
| 24  | Integrated Scheme for Agriculture Marketing (ISAM) | ISAM supports state governments in governing the agricultural produce marketing through creation and improvement of market structures, capacity building and generating access to market information. During 2017-18, National Agriculture Market Scheme popularly known as e-NAM scheme has also been made part of the same. National Agriculture Market (e-NAM) is a pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities. 1389 mandis of 23 States and 04 UTs have been integrated to e- NAM platform and more than 1.76 Crore Farmers & 2.5 Lakh traders<br><br>have been registered on e-NAM portal. |
| 25  | Mission     Organic<br><br>Value              Chain Development for North           Eastern Region | The MOVCDNER aims at development of commodity specific, concentrated, certified organic production clusters in value chain mode to link growers with consumers and to support the development of entire value chain starting from inputs, seeds, certification, to the creation of facilities for collection, aggregation, processing, marketing and brand building initiative in Northeast Region (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura). Since 2015-16 (as on 06.12.2023), Rs 1035.17 crore has been released, 379 FPO/FPCs created covering<br><br>189039 farmers and 172966 ha area. |

|     |     |     |
| --- | --- | --- |
| 26  | Sub-Mission         on Agriculture Extension (SMAE) | The scheme aims at making the extension system farmer driven and farmer accountable by disseminating technology to farmers through new institutional arrangements viz. Agricultural Technology Management Agency (ATMA) at district level to operationalize extension reforms in a participatory mode. Digital initiatives taken up in agricultural extension include;<br><br>*   VISTAAR - Virtually integrated Systems To Access Agricultural Resourcs being developed as a DPI for Agriculture Extension<br>*   Apurva AI- Capturing farmer innovations- Acts as a peer to peer learning Platform and provide content for advisory retrieval through VISTAAR Bot and also for impact Assessment of schemes (AIF completed)<br>*   Wadhwani- Krishi 24X7 for Realtime News monitoring, Tamil language and image-based cotton pest identification to be plugged in with FLEW/farmer profile mapping<br>*   Kisan Call Centre - Integration with VISTAAR and other IT applications and with Kisan Sarathi (ICAR) for direct contact with Agri experts<br>*   RAWE- Integration of Agri students for behavioral interaction through VISTAAR Bot and Feedback system<br>*   IMD- Weather forecast integrated through DAMU along with advisory delivery through VISTAAR<br>*   NRLM- Decentralised Extension Mechanism ( Krishi Sakhi, Pashu Sakhi , Matsya Sakhi etc) - Capacity building on Digital Extension -VISTAAR |
| 27  | Digital Agriculture | The scheme aims to improve the existing National e- Governance Plan in Agriculture (NeGPA) by developing a digital public infrastructure for agriculture that will be built as an open source, open standard and interoperable public good to enable inclusive, farmer-centric solutions through relevant information services for crop planning and health, improved access to farm inputs, credit and insurance, help for crop estimation, market intelligence, and support for the growth of Agri Techs industry and start-ups.<br><br>AgriStack architecture has the following foundational layers: -<br><br>*   Core registries<br>*   Base databases<br>*   Farmers Database: Farmers ID linked with land records<br>*   Geo-referencing of plots<br>*   Crop Survey, Crop planning and<br>*   Soil Mapping, Soil Fertility<br>*   Unified Farmers Service Interface for state, Pvt. Players<br>*   Data Exchange |

This information was given by the Union Minister of Agriculture and Farmers’ Welfare, Shri Arjun Munda in a written reply in Rajya Sabha today.

**\*\*\*\*\*\***

**SK/SM/17**

  
  
(Release ID: 2002012) Visitor Counter : 112873  
  
  

Read this release in: [Urdu](https://pib.gov.in/PressReleasePage.aspx?PRID=2016783)

  

  

---

  

Ministry of Agriculture & Farmers Welfare

Schemes for Welfare of Farmers

Posted On: 02 FEB 2024 6:48PM by PIB Delhi

Details of schemes being run by Department of Agriculture and Farmers’ Welfare for welfare/increasing incomes of farmers and the achievements made therein, scheme-wise are attached in Annexure:

**Brief of major schemes implemented by the** **Department of Agriculture and Farmers Welfare**

|     |     |     |
| --- | --- | --- |
| **S**<br><br>**No** | **Name       of       the Scheme** | **Purpose** |
| **I.** | **Central Sector Schemes** |     |
| 1.  | Pradhan        Mantri<br><br>Kisan         Samman Nidhi (PM-KISAN) | PM-KISAN is a central sector scheme launched on 24th February 2019 to supplement financial needs of land holding farmers, subject to exclusions. Under the scheme, financial benefit of Rs. 6000/- per year is transferred in three equal four-monthly installments into the bank accounts of farmers’ families across the country, through Direct Benefit Transfer (DBT) mode. Till now, Rs.<br><br>2.81 lakh crores have been transferred through Direct Benefit Transfer (DBT) to more than 11 crores beneficiaries (Farmers) through various instalments. |
| 2.  | Pradhan Mantri Kisan MaanDhan Yojana (PM-KMY) | Pradhan Mantri Kisan Maandhan Yojna (PMKMY) is a central sector scheme launched on 12th September 2019 to provide security to the most vulnerable farmer families. PM-KMY is contributory scheme, small and marginal farmers (SMFs), subject to exclusion criteria, can opt to become member of the scheme by paying monthly subscription to the Pension Fund. Similar, amount will be contributed by the Central Government.<br><br>The applicants between the age group of 18 to 40 years will have to contribute between Rs. 55 to Rs. 200 per month till they attain the age of 60. PMKMY is taking care of the farmers during their old age and provides Rs. 3,000 monthly pension to the enrolled farmers once they attain 60 years of age, subject to exclusion criteria.<br><br>Life Insurance Corporation (LIC) is pension fund manager and registration of beneficiaries is done through CSC and State Govts.<br><br>So far 23.38 lakh farmers have enrolled under the scheme. |
| 3.  | Pradhan Mantri Fasal Bima Yojana (PMFBY) | PMFBY was launched in 2016 in order to provide a simple and affordable crop insurance product to ensure comprehensive risk cover for crops to farmers against all non-preventable natural risks from pre-sowing to post-harvest and to provide adequate claim amount. The scheme is demand driven and available for all farmers A total of 5549.40 lakh farmer applications were insured under the<br><br>scheme since 2016-17 and Rs 150589.10 crore has been paid as claim. |
| 4.  | Modified Interest Subvention Scheme (MISS) | The Interest Subvention Scheme (ISS) provides concessional short term agri-loans to the farmers practicing crop husbandry and other allied activities like animal husbandry, dairying and fisheries. ISS is available to farmers availing short term crop loans up to<br><br>Rs.3.00 lakh at an interest rate of 7% per annum for one year. Additional 3% subvention is also given to the farmers for prompt and<br><br>timely repayment of loans thus reducing the effective rate of interest to 4% per annum. The benefit of ISS is also available for post-harvest loans against Negotiable Warehouse Receipts (NWRs) on crop loans for a further period of six months post-harvest to small and marginal farmers having Kisan Credit Cards (KCCs), on occurrence of natural calamities and severe natural calamities. As on 05-01-2024, 465.42<br><br>lakh new KCC applications have been sanctioned with a sanctioned credit limit of Rs. 5,69,974 crore as part of the drive. |
| 5.  | Agriculture Infrastructure Fund (AIF) | In order to address the existing infrastructure gaps and mobilize investment in agriculture infrastructure, Agri Infra Fund was launched under Aatmanirbhar Bharat Package. AIF was introduced with a vision to transform the agriculture infrastructure landscape of the country. The Agriculture Infrastructure Fund is a medium - long term debt financing facility for investment in viable projects for post- harvest management infrastructure and community farming assets through interest subvention and credit guarantee support. The Fund of Rs. 1 lakh crore under the scheme will be disbursed from FY 2020-21 to FY2025-26 and the support under the scheme will be provided for the duration of FY2020-21 to FY2032-33.<br><br>Under the scheme, Rs. 1 Lakh Crore will be provided by banks and financial institutions as loans with interest subvention of 3% per annum and credit guarantee coverage under CGTMSE for loans up to Rs. 2 Crores. Further, each entity is eligible to get the benefit of the scheme for up to 25 projects located in different LGD codes.<br><br>Eligible beneficiaries include Farmers, Agri-entrepreneurs, Start-ups, Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, Farmer Producers Organizations(FPOs), Self Help Group (SHG), Joint Liability Groups (JLG), Multipurpose Cooperative Societies, Central/State agency or Local Body sponsored Public Private Partnership Projects, State Agencies, Agricultural Produce Market Committees (Mandis), National & State Federations of Cooperatives, Federations of FPOs (Farmer Produce Organizations) and Federations of Self Help Groups (SHGs).<br><br>As on 31-12-2023, Rs.33.209 Crores have been sanctioned for 44,912 projects under AIF, out of this total sanctioned amount, Rs 25,504 Crores is covered under scheme benefits. These sanctioned projects have mobilized an investment of Rs 56.471 Crores in agriculture sector. |
| 6.  | Formation             & Promotion of new 10,000 FPOs | The Government of India launched the Central Sector Scheme (CSS) for “Formation and Promotion of 10,000 Farmer Producer Organizations (FPOs)” in the year 2020. The scheme has a total budgetary outlay of Rs.6865 crores. Formation & promotion of FPOs are to be done through Implementing Agencies (IAs), which further engage Cluster Based Business Organizations (CBBOs) to form & provide professional handholding support to FPOs for a<br><br>period of 5 years. |

|     |     |     |
| --- | --- | --- |
|     |     | FPOs get a financial assistance upto Rs 18.00 lakh per FPO for a period of 03 years. In addition to this, provision has been made for matching equity grant upto Rs. 2,000 per farmer member of FPO with a limit of Rs. 15.00 lakh per FPO and a credit guarantee facility upto Rs. 2 crore of project loan per FPO from eligible lending institution to ensure institutional credit accessibility to FPOs. Suitable provisions have been made for training and skill development of FPOs.<br><br>Further, FPOs are onboarded on National Agriculture Market (e-NAM) platform which facilitate online trading of their agricultural commodities through transparent price discovery method to enable FPOs to realize better remunerative prices for their produce.<br><br>As on 31.12.2023, total 7,774 FPOs were registered under the scheme in the country. |
| 7.  | National beekeeping        and Honey         Mission (NBHM) | Keeping in view the importance of beekeeping, a new Central Sector Scheme entitled National Beekeeping & Honey Mission (NBHM) was launched in 2020 under Atma Nirbhar Bharat Abhiyan for its implementation in the field for overall promotion and development of scientific beekeeping & to achieve the goal of “Sweet Revolution”. Some of the achievements include;<br><br>*   Honeybees/ beekeeping have been approved as 5th Input for Agriculture.<br>*   4 World Class State of the Art Honey Testing Labs and 35 Mini Honey Testing Labs have been sanctioned under National Beekeeping & Honey Mission (NBHM) for testing of honey.<br>*   Madhukranti portal has been launched for online registration of Beekeepers/ Honey Societies/ Firms/ Companies.<br>*   Till date 23 lakhs bee colonies registered on Portal.<br>*   100 Honey FPOs targeted under 10,000 FPOs scheme in the country. 88 FPOs have been registered by NAFED, NDDB & TRIFED.<br>*   25 States/UTs have been covered under NBHM under MM-I, II & III.<br>*   160 Projects sanctioned under MM- I, II & III of Rs. 202.00 crores. |
| 8.  | Market Intervention Scheme and Price support Scheme (MIS-PSS) | Ministry of Agriculture & Farmers Welfare implements the Price Support Scheme (PSS) for procurement of pulses, oilseeds and copra. Market Intervention Scheme (MIS) for procurement of agricultural and horticultural commodities which are perishable in nature and are not covered under the Price Support Scheme (PSS). The objective of intervention is to protect the growers of these commodities from making distress sale in the event of a bumper crop during the peak arrival period when the prices tend to fall below<br><br>economic levels and cost of production. |
| 9.  | Namo Drone Didi | The Government has recently approved a Central Sector Scheme for<br><br>providing drones to the Women Self Help Group (SHGs) for the |

|     |     |     |
| --- | --- | --- |
|     |     | period from 2024-25 to 2025-26 with an outlay of Rs. 1261 Crores. The scheme aims to provide drones to 15000 selected Women Self Help Group (SHGs) for providing rental services to farmers for agriculture purpose (application of fertilizers and pesticides). Under this Scheme, Central Financial Assistance @ 80% of the cost of drone and accessories/ancillary charges upto a maximum of Rs. 8.0 Lakhs will be provided to the women SHGs for purchase of drones. The Cluster Level Federations (CLFs) of SHGs may raise the balance amount (total cost of procurement minus subsidy) as loan under National Agriculture Infra Financing Facility (AIF). Interest subvention @ 3% on the AIF loan will be provided to the CLFs. The scheme will also provide sustainable business and livelihood support<br><br>to SHGs and they would be able to earn additional income of at least of Rs. 1.0 lakh per annum. |
| **II** | **Centrally Sponsored Schemes** |     |
| II. (i) Rashtriya Krishi Vikas Yojana |     |     |
| 10. | Rastriya        Krishi<br><br>Vikas         Yojana-<br><br>Detailed       Project<br><br>Report            based schemes (RKVY- DPR) | The scheme focuses on creation of pre & post-harvest infrastructure in agriculture and allied sectors that help in supply of quality inputs, market facilities, etc to farmers. It provides flexibility and autonomy to states to implement projects as per the local farmers’ needs and priorities from a bouquet of activities in agriculture and allied sectors. The scheme aims to fill the resources gap of agriculture and allied sectors by providing financial support to states for undertaking various activities to increase in overall growth of agriculture and allied sectors and farmers’ income.<br><br>Under RKVY Agri-startup Programme, since 2019-20, 1524 Start-ups have been selected and Rs. Rs. 106.25 crore released as grants-in-aid for funding the Start-ups. |
| 11. | Soil    Health    Card (SHC) | Soil health card provides information to farmers on nutrient status of their soil along with recommendation on appropriate dosage of nutrients to be applied for improving soil health and its fertility. The indicators are typically based on farmers' practical experience and knowledge of local natural resources. The card lists soil health indicators that can be assessed without the aid of technical or laboratory equipment. The Scheme rolls out a decentralized system of soil testing which will help in developing a nationwide soil fertility map on a GIS platform that can easily be integrated with the real time decision support systems being developed. In order to develop the soil fertility map, Government of India has decided to conduct 5 Crore Soil Samples across the country during year 2023-<br><br>24 to 2025-26. |
| 12. | Rainfed           Area Development (RAD) | RAD is being implemented since 2014-15. RAD adopts an area based approach in cluster mode for promoting Integrated Farming System (IFS) which focuses on multi-cropping, rotational<br><br>cropping, inter-cropping, mixed cropping practices with allied activities like horticulture, livestock, fishery, apiculture etc. to |

|     |     |     |
| --- | --- | --- |
|     |     | enable farmers not only in maximizing the farm returns for sustaining livelihood, but also to mitigate the impacts of drought, flood or other extremes weather events. An amount of Rs. 1673.58<br><br>crores has been released and an area of 7.13 lakh hectare has been covered under RAD programme from the year 2014-15 to till date. |
| 13. | Per     Drop     More Crop (PDMC) | In order to increase water use efficiency at the farm level through Micro Irrigation technologies i.e. drip and sprinkler irrigation systems, Per Drop More Crop (PDMC) scheme was launched during 2015-16. The Micro Irrigation helps in water saving as well as reduced fertilizer usage through fertigation, labour expenses, other input costs and overall income enhancement of farmers.<br><br>It also supports micro level water harvesting, storage, management etc. activities as Other Interventions (OI) to supplement source creation for Micro Irrigation. OI activities allowed on need basis up to 40% of the total allocation for North East States, Himalayan States, Jammu & Kashmir, Ladakh and up to 20% for other States.<br><br>An area of 78 lakh hectare has been covered under Micro irrigation through the PDMC scheme from 2015-16 to 2022-23. |
| 14. | Micro        Irrigation Fund (MIF) | A Micro Irrigation Fund (MIF) of initial corpus Rs 5000 crore has been created with NABARD with major objective to facilitate the States in mobilizing the resources for expanding coverage of Micro Irrigation. Under the funding arrangement, NABARD lends to the States/UTs at 3% lower interest rate than the corresponding cost of fund mobilized by NABARD from the market. The interest subvention on the loan under MIF is borne by Centre under PDMC. Projects with loans under MIF worth Rs 4710.96 crore have been approved so far. Loans amounting Rs.2812.24 crore has been disbursed to States of Andhra Pradesh, Tamil Nadu, Gujarat, Punjab, Haryana and Rajasthan. The Ministry provides interest subvention on the loan availed by the States which is met from PDMC Scheme. As per the Budget 2021-22, the corpus of the fund is to be doubled to Rs.10000 crores. MIF is now merged with<br><br>PDMC. |
| 15. | Paramparagat Krishi             Vikas Yojana (PKVY) | Paramparagat Krishi Vikas Yojana (PKVY) aims to increase soil fertility and thereby helps in production of healthy food through organic practices without the use of agro-chemicals. The scheme is implemented in a cluster mode with unit cluster size of 20 hectares. A group shall comprise minimum 20 farmers (may be more if individual holdings are less). Farmers in a group can avail benefit of maximum of 2 ha as per provision of PKVY. 25 such clusters are converted into one large cluster of about 500 ha area to facilitate marketing of organic produce. The scheme provides for an assistance of Rs. 31,500 per ha to states, out of which i.e., Rs. 15,000 is given<br><br>as incentives to a farmer directly through DBT. |

|     |     |     |
| --- | --- | --- |
| 16. | Sub-Mission        on Agriculture Mechanization (SMAM) | Sub Mission on Agricultural Mechanization (SMAM) is being implemented w.e.f April, 2014 which aims at catalyzing an accelerated but inclusive growth of agricultural mechanization in India with the objectives of Increasing the reach of farm mechanization to small and marginal farmers and to the regions where availability of farm power is low, promoting ‘Custom Hiring Centres’ to offset the adverse economies of scale arising due to small landholding and high cost of individual ownership, creating hubs for hi-tech& high value farm equipments, creating awareness among stakeholders through demonstration and capacity building activities and Ensuring performance testing and certification at designated testing centers located all over the country. Till date Rs. 6748.78 Crore have been released to State Governments, distributed more than 15,75,719 agricultural machinery & equipment’s including Tractors, Power Tillers, Self-Propelled Machineries and Plant Protection Equipment and established 23472 nos of Custom Hiring Centres, 504 nos of Hi-Tech Hubs and 20597 nos. of Farm Machinery Banks.<br><br>**Promotion of Drone Technology under SMAM**<br><br>Looking into the unique advantages of Drone technologies in agriculture, a Standard Crop Specific Operating Procedures (SOPs) released the for use of drones in pesticide and nutrient application in public domain on 20.04.2023, which provides concise instructions for effective and safe operations of drones.<br><br>From within the funds of SMAM, so far an amount of Rs.<br><br>138.82 crores have been released towards Kisan drone promotion, which include purchase of 317 Drones for their demonstration in 79070 hectares of land and supply of 461 drones to the farmers on subsidy and also supply of 1595 drones to the CHCs for providing drone services to the farmers on rental basis. |
| 17. | Crop           Residue Management | Crop Residue Management was implemented from 2018-19 in Punjab, Haryana, Uttar Pradesh and NCT of Delhi. Its objectives include protecting environment from air pollution and preventing loss of nutrients and soil micro-organisms caused by burning of crop residue through promoting in-situ management of crop residue. In this regard, it proposes to set up Farm Machinery Banks for custom hiring of in-situ crop residue management machinery. It also aims to creating awareness among stakeholders through demonstration, capacity building activities and differentiated information, education and communication strategies for effective utilization and management of crop residue. Rs. 3333.17 crore has been released under the scheme since inception and distributed more than 2,95,845 CRM machinery. CRM is now merged with<br><br>SMAM. |
| 18. | Agro-forestry | Agro-forestry was conceived on the recommendation of the National Agro-forestry Policy 2014 to promote plantation on farmlands. The<br><br>restructured agro-forestry under RKVY is aimed to provide Quality |

|     |     |     |
| --- | --- | --- |
|     |     | Planting Materials (QPM) and the certification in order to promote<br><br>planting of trees on farm land for improving the livelihood of farmers. |
| **II (ii). Krishonnati Yojana** |     |     |
| 19. | National Food Security Mission (NFSM) | The Mission aims at increasing production of rice, wheat, pulses, coarse cereals (Maize and Barley) and Nutri-Cereals through area expansion and productivity enhancement in a sustainable manner in the identified districts of 28 States and 2 UTs (i.e., J&K and Ladakh). Other objectives include restoring Soil fertility and productivity at the individual farm level, enhancing farm level economy to restore confidence amongst the farmers and post harvest value addition at farm gate.<br><br>Since the declaration of the International Year of Millets (IYM) 2023 by the UNGA in 2021, Government has taken a proactive multi stakeholder engagement approach to achieve the aim of IYM 2023 and taking Indian millets globally. 25 seed-hubs have been established to ensure availability of quality seed of latest improved varieties of Nutri cereals in the country. Millet missions have been launched across 13 states including Odisha, Tamil Nadu, Chhattisgarh, Assam, Karnataka, Madhya Pradesh, Maharashtra, Uttarakhand, Uttar Pradesh, Bihar, Himachal Pradesh, Gujarat and Rajasthan. More than 500 start-ups and 350 FPOs have been<br><br>established and are operational in the millet ecosystem as of now. |
| 20. | Sub-Mission on Seed and Planting Material (SMSP) | SMSP covers the entire gamut of seed production chain, from production of nucleus seed to supply of certified seeds to the farmers, to provide support for creation of infrastructure conducive for development of the seed sector, support to the public seed producing organisations for improving their capacity and quality of seed production, create dedicated seed bank to meet unforeseen circumstances of natural calamities, etc. For effective monitoring, efficiency and transparency covering Seed chain from Nucleus- Breeder-Foundation-Certified Seed, first phase of Seed Authentication, Traceability & Holistic Inventory (SATHI) portal<br><br>was launched on 19th April, 2023. SMSP is now merged with NFSM. |
| 21. | National Mission on Edible                Oils (NMEO)-Oil Palm | A new Centrally Sponsored Scheme namely, National Mission on Edible Oil (NMEO)-Oil Palm (NMEO-OP) has been launched by Government of India in 2021 in order to promote oil palm cultivation for making the country Aatamnirbhar in edible oils with special focus on North-Eastern States and A&N Islands. The Mission will bring additional area of 6.5 lakh ha under Oil Palm plantation with<br><br>3.28 lakh ha in north-eastern states and 3.22 in rest of India in next 5 years from 2021-22 to 2025-26. |
| 22  | Mission               for Integrated Development       of Horticulture (MIDH) | Mission for Integrated Development of Horticulture (MIDH), a Centrally Sponsored Scheme was launched during 2014-15 for holistic growth of the horticulture sector covering fruits, vegetables, root and tuber crops, mushrooms, spices, flowers, aromatic plants, coconut, cashew, cocoa and Bamboo. Major components include |

|     |     |     |
| --- | --- | --- |
|     |     | plantation infrastructure development, establishment of new orchards and gardens for fruits, vegetables, spices and flowers, rejuvenation of unproductive, old, and senile orchards, protected cultivation, promotion of organic farming, pollination support through bee keeping, horticulture mechanization, post-harvest management (phm) and marketing infrastructure etc.<br><br>Under MIDH since 2014-15 to 2023-24 (as on 31.10.2023) an additional area of 12.95 lakh ha. of identified horticulture crops has been covered, 872 nurseries established for production of quality planting material, 1.41 lakh ha. of old and senile orchards has been rejuvenated, 52069 ha. been covered under organic practices and<br><br>3.07 lakh ha. has been covered under Protected Cultivation. |
| 23  | National     Bamboo Mission (NBM) | The Scheme is implemented in 23 States and 1 UT (J&K) through the State Bamboo Missions (SBM)/ State Bamboo Development Agency (SBDA).NBM mainly focus on the development of complete value chain of the bamboo sector. It is envisaged to link growers with consumers with a cluster approach mode.<br><br>Under NBM, 367 Bamboo Nurseries established, 212 bamboo Nurseries Accredited by the State Level Accreditation Committees, 46000 ha bamboo plantations established in non-forest Government & private lands, 81 units for bamboo primary processing established, 416 units established for value addition and product development, and capacity building for 15000 persons including farmers, artisans<br><br>and entrepreneurs. NBM is now merged with MIDH. |
| 24  | Integrated Scheme for Agriculture Marketing (ISAM) | ISAM supports state governments in governing the agricultural produce marketing through creation and improvement of market structures, capacity building and generating access to market information. During 2017-18, National Agriculture Market Scheme popularly known as e-NAM scheme has also been made part of the same. National Agriculture Market (e-NAM) is a pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities. 1389 mandis of 23 States and 04 UTs have been integrated to e- NAM platform and more than 1.76 Crore Farmers & 2.5 Lakh traders<br><br>have been registered on e-NAM portal. |
| 25  | Mission     Organic<br><br>Value              Chain Development for North           Eastern Region | The MOVCDNER aims at development of commodity specific, concentrated, certified organic production clusters in value chain mode to link growers with consumers and to support the development of entire value chain starting from inputs, seeds, certification, to the creation of facilities for collection, aggregation, processing, marketing and brand building initiative in Northeast Region (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura). Since 2015-16 (as on 06.12.2023), Rs 1035.17 crore has been released, 379 FPO/FPCs created covering<br><br>189039 farmers and 172966 ha area. |

|     |     |     |
| --- | --- | --- |
| 26  | Sub-Mission         on Agriculture Extension (SMAE) | The scheme aims at making the extension system farmer driven and farmer accountable by disseminating technology to farmers through new institutional arrangements viz. Agricultural Technology Management Agency (ATMA) at district level to operationalize extension reforms in a participatory mode. Digital initiatives taken up in agricultural extension include;<br><br>*   VISTAAR - Virtually integrated Systems To Access Agricultural Resourcs being developed as a DPI for Agriculture Extension<br>*   Apurva AI- Capturing farmer innovations- Acts as a peer to peer learning Platform and provide content for advisory retrieval through VISTAAR Bot and also for impact Assessment of schemes (AIF completed)<br>*   Wadhwani- Krishi 24X7 for Realtime News monitoring, Tamil language and image-based cotton pest identification to be plugged in with FLEW/farmer profile mapping<br>*   Kisan Call Centre - Integration with VISTAAR and other IT applications and with Kisan Sarathi (ICAR) for direct contact with Agri experts<br>*   RAWE- Integration of Agri students for behavioral interaction through VISTAAR Bot and Feedback system<br>*   IMD- Weather forecast integrated through DAMU along with advisory delivery through VISTAAR<br>*   NRLM- Decentralised Extension Mechanism ( Krishi Sakhi, Pashu Sakhi , Matsya Sakhi etc) - Capacity building on Digital Extension -VISTAAR |
| 27  | Digital Agriculture | The scheme aims to improve the existing National e- Governance Plan in Agriculture (NeGPA) by developing a digital public infrastructure for agriculture that will be built as an open source, open standard and interoperable public good to enable inclusive, farmer-centric solutions through relevant information services for crop planning and health, improved access to farm inputs, credit and insurance, help for crop estimation, market intelligence, and support for the growth of Agri Techs industry and start-ups.<br><br>AgriStack architecture has the following foundational layers: -<br><br>*   Core registries<br>*   Base databases<br>*   Farmers Database: Farmers ID linked with land records<br>*   Geo-referencing of plots<br>*   Crop Survey, Crop planning and<br>*   Soil Mapping, Soil Fertility<br>*   Unified Farmers Service Interface for state, Pvt. Players<br>*   Data Exchange |

This information was given by the Union Minister of Agriculture and Farmers’ Welfare, Shri Arjun Munda in a written reply in Rajya Sabha today.

