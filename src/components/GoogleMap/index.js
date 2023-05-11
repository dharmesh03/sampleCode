import React from 'react';
import { connect } from 'react-redux';
import EmbededGoogleMap from '../GoogleMaps';
import './index.scss';

function GoogleMap({ eventData }) {
  const { address } = eventData || {};

  if (!address) {
    return '';
  }

  return (
    <div className="m-b-30 recurring-event-map">
      <EmbededGoogleMap eventAddress={address} height={`calc(100vh - 117px)`} />
    </div>
  );
}

const mapStateToProps = (state) => ({
  eventData: state.event && state.event.data,
});

export default connect(mapStateToProps, null)(GoogleMap);
