import React from 'react';

const context = React.createContext({
  meetingStatus: 'Loading',
});

export default function getMeetingStatusContext() {
  return context;
}
