import React from 'react';
import ChimeSdkWrapper from '../chime/ChimeSdkWrapper';
import getChimeContext from '../context/getChimeContext';

export default function ChimeProvider(props) {
  const { children } = props;
  const chimeSdkWrapper = new ChimeSdkWrapper();
  const ChimeContext = getChimeContext();
  return <ChimeContext.Provider value={chimeSdkWrapper}>{children}</ChimeContext.Provider>;
}
