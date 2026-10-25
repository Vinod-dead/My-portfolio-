/**
 * Background music configuration.
 *
 * By default the site plays an original, generative ambient soundtrack that is
 * synthesised in the browser with the Web Audio API (no audio files, no
 * licensing concerns). To use your own licensed or original track instead, put
 * an MP3/OGG in /public/audio and set `musicSrc` below, e.g. "/audio/ambient.mp3".
 */
export const audioConfig = {
  musicSrc: null as string | null,
  /** Default music volume (0..1) once the visitor turns sound on. */
  defaultMusicVolume: 0.5,
};
