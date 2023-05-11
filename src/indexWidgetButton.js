/* eslint-disable */
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import client from './components/WrapperComponents/WithProvider';
import i18n from './translation/i18n';
// import BuyTicketButton from './components/Widget/BuyTicketButton';
import EmbededApp from './components/EmbededApp';
// Find all widget divs
// Inject our React App into each
const store = configureStore();

// eslint-disable-next-line no-unused-vars

let NSconfig = null;

export default {
  config(config) {
    // eslint-disable-next-line no-unused-vars
    NSconfig = config;
  },
  widgets: {
    myWidget: {
      new: (config) => {
        // const uid = uuidv4()({ prefix: 'widget_ns_' });
        return {
          render: () => {
            ReactDOM.render(
              <I18nextProvider i18n={i18n}>
                <ApolloProvider client={client}>
                  <Provider store={store}>
                    <EmbededApp embed widget widgetConfig={config} />
                  </Provider>
                </ApolloProvider>
              </I18nextProvider>,
              document.querySelector(config.selector),
            );
          },

          /*   on: (event, callback) => {
            Emitter.on.apply(Emitter, [uid + '.' + event, callback]);
          }, */

          /*  off: (event, callback) => {
            Emitter.removeListener.apply(Emitter, [uid + '.' + event, callback]);
          },

          offAll: (event) => {
            Emitter.removeAllListeners.apply(Emitter, [uid + '.' + event]);
          },

          once: (event, callback) => {
            Emitter.once.apply(Emitter, [uid + '.' + event, callback]);
          },

          unmount() {
            ReactDOM.unmountComponentAtNode(document.querySelector(config.selector));
            alt.recycle(MyStore);
            Emitter.removeAllListeners();
          },

          getState: () => {
            return MyStore.getState()[uid];
          },

          back: () => {
            actions.back(uid);
          },

          forward: () => {
            actions.forward(uid);
          }, */
        };
      },
    },
  },
};
