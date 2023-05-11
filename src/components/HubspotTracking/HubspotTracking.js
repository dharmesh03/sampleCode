import React from 'react';
import { connect } from 'react-redux';
import { APP_ENV, HUBSPOT_TRACKING_ID } from '../../clientConfig';
import { getUserSession } from '../../routes/login/action/selector';

const formId = `CollectedForms-${HUBSPOT_TRACKING_ID}`;
const hsScriptLoaderId = 'hs-script-loader';
class HubspotTracking extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillUnmount() {
    try {
      const hsScript = document.getElementById(hsScriptLoaderId);
      const collectedFormScript = document.getElementById(formId);
      const analyticScript = document.getElementById(`hs-analytics`);
      if (hsScript && collectedFormScript && analyticScript) {
        const headEle = document.getElementsByTagName('head');
        if (headEle && headEle[0]) {
          headEle[0].removeChild(hsScript);
          headEle[0].removeChild(collectedFormScript);
          headEle[0].removeChild(analyticScript);
        }
      }
    } catch (e) {
      console.log('Hubspot > Monitor Sentry an error :', e);
    }
  }

  shouldComponentUpdate(nextProps) {
    const { user } = this.props;
    const _hsq = window._hsq || [];
    _hsq.push([
      'identify',
      {
        email: user && user.email,
      },
    ]);
    if (
      !(nextProps?.path === this?.props?.path) &&
      (APP_ENV === 'production' || APP_ENV === 'stage' || APP_ENV === 'development')
    ) {
      this.hubspotTrackingCode(nextProps);
    }
    return false;
  }

  hubspotTrackingCode = (nextProps) => {
    try {
      const _hsq = window._hsq || [];
      const orinalTitle = document.title;
      document.title = nextProps?.title;
      _hsq.push(['setPath', window.location.pathname]);
      _hsq.push(['trackPageView']);
      document.title = orinalTitle;
    } catch (e) {
      console.log('Hubspot > Monitor Sentry an error :', e);
    }
  };

  hubspotScriptLoader = () => {
    try {
      const collectedformsData = {
        crossorigin: 'anonymous',
        'data-leadin-portal-id': '',
        'data-leadin-env': 'prod',
        'data-loader': 'hs-scriptloader',
        'data-hsjs-portal': '',
        'data-hsjs-env': 'prod',
      };
      const collectedformsScript = document.createElement('script');
      Object.keys(collectedformsData).map((key) => {
        collectedformsScript.setAttribute(key, collectedformsData[key]);
      });
      collectedformsScript.id = formId;

      const script = document.createElement('script');
      script.id = hsScriptLoaderId;
      script.src = `//js.hs-scripts.com/${HUBSPOT_TRACKING_ID}.js`;
      script.async = true;
      script.defer = true;

      const headEle = document.getElementsByTagName('head');
      if (headEle && headEle[0]) {
        headEle[0].appendChild(collectedformsScript);
        headEle[0].appendChild(script);
      }
    } catch (e) {
      console.log('Hubspot > Monitor Sentry an error :', e);
    }
  };

  render() {
    if (!document.getElementById(hsScriptLoaderId) && !document.getElementById(formId)) {
      this.hubspotScriptLoader();
    }
    return null;
  }
}
const mapStateToProps = (state) => ({
  user: getUserSession(state),
});
export default connect(mapStateToProps)(HubspotTracking);
