import React from 'react';
import { connect } from 'react-redux';
import Chart from 'react-google-charts';
import { Helmet } from 'react-helmet';
import loadable from '@loadable/component';
import find from 'lodash/find';
import { getItemNameByCode } from '../../routes/admin/action/index';

const Alerts = loadable(() => import('../Widget/Alerts'));
const AESpinner = loadable(() => import('../../Core/Spinner/Spinner'));

if (window && !window.gapi) {
  // Start - Google Analytics chart
  // eslint-disable-next-line func-names
  (function (w, d, s, g, js, fjs) {
    g = w.gapi || (w.gapi = {});
    g.analytics = {
      q: [],
      // eslint-disable-next-line object-shorthand, func-names
      ready: function (cb) {
        this.q.push(cb);
      },
    };
    js = d.createElement(s);
    fjs = d.getElementsByTagName(s)[0];
    js.src = 'https://apis.google.com/js/platform.js';
    fjs.parentNode.insertBefore(js, fjs);
    // eslint-disable-next-line func-names
    js.onload = function () {
      g.load('analytics');
    };
  })(window, document, 'script');
}

class GoogleAnalyticItemTrafficChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      message: '',
      isError: false,
      tableData: [],
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.getGoogleAnaylicsItemData(nextProps);
  }

  componentWillUnmount() {
    if (this.TempTimeout) {
      clearTimeout(this.TempTimeout);
      this.TempTimeout = null;
    }
  }

  getGoogleAnaylicsItemData = (props) => {
    const { GAAccessToken, views } = props;
    if (!(GAAccessToken && views)) {
      return null;
    }
    this.setState({ loading: true });
    // eslint-disable-next-line no-undef
    gapi?.analytics?.ready(() => {
      // eslint-disable-next-line no-undef
      window?.gapi?.analytics.auth.authorize({
        serverAuth: {
          access_token: GAAccessToken,
        },
      });
      // eslint-disable-next-line no-undef
      const dataChart = new gapi.analytics.report.Data({
        query: views.query,
      });
      dataChart.on('success', (resultsAsObject) => this.handleCoreAPIResponse(resultsAsObject));
      dataChart.on('error', () => {
        this.showErrorMessage();
      });
      dataChart.execute();
    });
    return null;
  };

  handleCoreAPIResponse = (resultsAsObject) => {
    const tableData = [['Item Name', 'Item Code', 'Page View']];
    if (resultsAsObject.totalResults > 0 && resultsAsObject.rows.length > 0) {
      const itemCodeList = [];
      resultsAsObject.rows.forEach((row) => {
        itemCodeList.push(row[0].split('/').pop());
      });
      this.props.getItemNameByCode(itemCodeList).then((response) => {
        if (response && response.data) {
          const isDuplicateCodes = [];
          resultsAsObject.rows.forEach((row) => {
            const code = row[0].split('/').pop();
            const pageCount = parseInt(row[1], 10) || 0;
            const itemInfo = find(response.data, (o) => o.itemCode === code);
            const index = isDuplicateCodes.indexOf(code);
            if (itemInfo && itemInfo.itemName && index === -1) {
              isDuplicateCodes.push(code);
              row[0] = { v: itemInfo.itemName };
              row[1] = { v: code };
              row[2] = { v: pageCount };
              tableData.push([row[0], row[1], row[2]]);
            } else if (tableData[index] && tableData[index][2]) {
              for (let i = 1; i < isDuplicateCodes.length; i++) {
                if (tableData[i][1] && tableData[i][1].v === code) {
                  tableData[i][2] = { v: tableData[i][2].v + pageCount };
                }
              }
            }
          });
          this.setState({ tableData, loading: false });
        } else {
          this.setState({ tableData, loading: false });
        }
      });
    } else {
      this.setState({ tableData, loading: false });
    }
  };

  showErrorMessage = (text) => {
    this.setState(
      {
        loading: false,
        isError: true,
        message: text || 'Something went to Wrong',
      },
      () => {
        this.TempTimeout = setTimeout(() => {
          this.setState({
            message: '',
          });
        }, 4000);
      },
    );
  };

  render() {
    const { GAAccessToken } = this.props;
    if (!GAAccessToken) return null;
    const { tableData, message, loading, isError } = this.state;
    const options = {
      showRowNumber: true,
      width: '100%',
      height: '15%',
      // cssClassNames: { tableCell: 'customChartStyle', headerCell: 'customChartStyle' },
      sortColumn: 2,
      sortAscending: false,
      sort: 'enable',
      page: 'enable',
      pageSize: 25,
      pagingSymbols: {
        prev: 'prev',
        next: 'next',
      },
    };
    return (
      <div className="white-box col-md-6 m-t-15">
        <Helmet>
          <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js" />
        </Helmet>
        <div className="">
          <label className="box-lable">Top Items with Traffic</label>
        </div>
        <Alerts message={message} loading={loading} isError={isError} />
        {!loading ? (
          <div className="m-t-10">
            {tableData.length > 1 ? (
              <Chart chartType="Table" width="100%" data={tableData} options={options} />
            ) : (
              <h5 className="text-center mrg-t-lg mrg-b-0 alert alert-danger">No data found</h5>
            )}
          </div>
        ) : (
          <div className="text-center">
            <AESpinner type="SpinnerExtraSmall" />
          </div>
        )}
      </div>
    );
  }
}
const mapDispatchToProps = {
  getItemNameByCode,
};

export default connect(null, mapDispatchToProps)(GoogleAnalyticItemTrafficChart);
