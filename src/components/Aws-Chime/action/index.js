export function storeChimeTranscription(data) {
  return {
    type: 'TRANSCRIPTION',
    data,
  };
}

export function setChimeTranscription(data) {
  return async (dispatch) => {
    await dispatch(storeChimeTranscription(data));
  };
}
