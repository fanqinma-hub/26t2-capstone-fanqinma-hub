/**
 * @file stt.service.ts
 * @description Speech-to-Text service layer for converting audio recording file URIs into full transcripts.
 * Provides both a simulated mock adapter for local offline testing and an Azure Cognitive Services STT REST adapter.
 *
 * Compliance Guidelines (Dr. Marium Malik / PROJ-12):
 * - Full utterance transcripts (FULL utterance transcripts) are preserved for final NDIS clinical report generation.
 * - Speech scoring relies strictly on deterministic front-end rules (no ML model scoring).
 * - Underlying audio recording resources are completely unloaded/cleaned up to prevent memory leaks.
 *
 * Owner: Role 5 (STT & Scoring Lead)
 */

/**
 * ISTTAdapter
 * @description Core interface that defines the STT transcription contract.
 */
export interface ISTTAdapter {
  /**
   * Transcribes the audio file specified by the local URI.
   * @param uri The local file URI of the audio recording (e.g., file:///...).
   * @returns A promise that resolves to the complete transcript string.
   * @throws Error if transcription fails or permission is denied.
   */
  transcribeAudio(uri: string): Promise<string>;
}

/**
 * MockSTTAdapter
 * @description Local offline adapter simulating network request latencies and returning pre-configured transcripts.
 */
export class MockSTTAdapter implements ISTTAdapter {
  private readonly mockSentences = [
    'Look at the gigantic watermelon',
    'It is a small strawberry',
    'I see a bird',
    'There is a cup on the table',
    'Look at the picture',
    'I can see a tiny cup',
    'The elephant is huge',
    'Look at the medium glass',
    'I see a little flower',
    'There is a large box',
    'I found a giant banana',
    'The enormous tree is in the middle',
    'A teeny little bug is on the table',
    'The watermelon is big',
  ];

  /**
   * Simulates transcribing audio.
   * @param uri The local audio URI.
   * @returns Promise resolving to a randomly selected child utterance.
   */
  async transcribeAudio(uri: string): Promise<string> {
    // Validate URI input to simulate potential error handling
    if (!uri) {
      throw new Error('MockSTTAdapter: Invalid or empty audio file URI provided.');
    }

    // Simulate network delay between 1.0s and 2.0s
    const delay = Math.floor(Math.random() * 1000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Choose a random English sentence from the preset array
    const randomIndex = Math.floor(Math.random() * this.mockSentences.length);
    return this.mockSentences[randomIndex];
  }
}

/**
 * AzureSTTAdapter
 * @description Standard Azure Cognitive Services Speech-to-Text REST API implementation.
 */
export class AzureSTTAdapter implements ISTTAdapter {
  private readonly apiKey: string;
  private readonly region: string;
  private readonly language: string;

  /**
   * Initializes the Azure STT Adapter.
   * @param apiKey The Azure Cognitive Services Speech API Key.
   * @param region The Azure Cognitive Services Resource Region (e.g. eastus, southeastasia).
   * @param language The default language locale for voice recognition (defaults to en-AU).
   */
  constructor(
    apiKey = process.env.EXPO_PUBLIC_AZURE_STT_KEY || '',
    region = process.env.EXPO_PUBLIC_AZURE_REGION || 'eastus',
    language = 'en-AU'
  ) {
    this.apiKey = apiKey;
    this.region = region;
    this.language = language;
  }

  /**
   * Uploads local audio file to Azure Speech Service REST API and returns transcription.
   * Uses React Native Fetch blob conversion for local file system compatibility.
   *
   * @param uri Local path URI to the recorded audio.
   * @returns Complete transcript text returned by Azure.
   */
  async transcribeAudio(uri: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AzureSTTAdapter: API subscription key is missing. Please check your environment variables.');
    }

    try {
      // 1. Fetch local file URI and convert to a binary Blob
      const fileResponse = await fetch(uri);
      if (!fileResponse.ok) {
        throw new Error(`Failed to read audio file from path: ${uri}`);
      }
      const audioBlob = await fileResponse.blob();

      // 2. Identify the recording mime-type from filename extension
      let contentType = 'audio/wav';
      if (uri.endsWith('.m4a') || uri.endsWith('.mp4')) {
        contentType = 'audio/m4a';
      } else if (uri.endsWith('.ogg')) {
        contentType = 'audio/ogg; codecs=opus';
      }

      // 3. Formulate the Azure Short Audio Speech REST API endpoint
      const endpoint = `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.language}`;

      // 4. Dispatch REST request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': contentType,
          'Accept': 'application/json',
        },
        body: audioBlob,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure STT endpoint returned status code ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // 5. Parse response status
      if (data.RecognitionStatus === 'Success' && data.DisplayText) {
        return data.DisplayText;
      } else if (data.RecognitionStatus === 'NoMatch') {
        throw new Error('AzureSTTAdapter: Speech could not be recognized. Try speaking closer to the microphone.');
      } else {
        throw new Error(`AzureSTTAdapter: Recognition failed with status "${data.RecognitionStatus}"`);
      }
    } catch (err: any) {
      throw new Error(`AzureSTTAdapter: ${err?.message || err}`);
    }
  }
}

/**
 * getSTTService
 * @description Factory function returning the configured STT service adapter.
 * Defaults to the MockSTTAdapter to support offline workflow and sandbox testing.
 *
 * @param useMock Whether to return the simulated offline adapter. Defaults to true.
 */
export function getSTTService(useMock: boolean = true): ISTTAdapter {
  if (useMock) {
    return new MockSTTAdapter();
  }
  return new AzureSTTAdapter();
}
