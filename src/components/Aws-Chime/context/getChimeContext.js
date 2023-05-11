import React from 'react';
import ChimeSdkWrapper from '../chime/ChimeSdkWrapper';

const context = React.createContext(new ChimeSdkWrapper());
export default function getChimeContext() {
  return context;
}
