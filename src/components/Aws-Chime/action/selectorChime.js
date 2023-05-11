import { createSelector } from 'reselect';
import get from 'lodash/get';

export const selectorChimeSettings = (state) => state.chimeSettings;
export const selectorChime = createSelector(selectorChimeSettings, (chime) => get(chime, 'chime'));
export const selectorChimeTranscription = createSelector(selectorChime, (chime) => get(chime, 'transcription'));
