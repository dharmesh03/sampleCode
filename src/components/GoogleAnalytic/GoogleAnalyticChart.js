import React from 'react';
import { GoogleDataChart, GoogleProvider } from 'react-analytics-widget';

if (window && !window.gapi) {
// Start - Google Analytics chart
;(function(w, d, s, g, js, fjs) {
  g = w.gapi || (w.gapi = {})
  g.analytics = {
    q: [],
    ready: function(cb) {
      this.q.push(cb)
    }
  }
  js = d.createElement(s)
  fjs = d.getElementsByTagName(s)[0]
  js.src = "https://apis.google.com/js/platform.js"
  fjs.parentNode.insertBefore(js, fjs)
  js.onload = function() {
    g.load("analytics")
  }
})(window, document, "script")
}

const last7days = {
  reportType: 'ga',
  query: {
    dimensions: 'ga:date',
    metrics: 'ga:pageviews',
    'start-date': '7daysAgo',
    'end-date': 'today',
  },
  chart: {
    type: 'LINE',
    options: {
      title: '',
      curveType: 'function',
      legend: { position: 'unset' },
      pointShape: 'circle',
      width: '100%',
      height: '290',
      vAxis: { format: '#,###' },
      colors: ['#5fa0db', '#f7f8fd'],
      position: 'bottom',
    },
  },
};
// End
class GoogleAnalyticChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps) {
    const { GAAccessToken } = this.props;
    return !(nextProps.GAAccessToken === GAAccessToken);
  }

  render() {
    const { GAAccessToken, views } = this.props;
    if (!GAAccessToken) return null;
    return (
      <div>
        <GoogleProvider accessToken={GAAccessToken}>
          <GoogleDataChart views={views} config={last7days} />
        </GoogleProvider>
      </div>
    );
  }
}

export default GoogleAnalyticChart;
