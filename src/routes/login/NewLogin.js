import Media from 'react-media';
import React from 'react';
import { connect } from 'react-redux';
import { Col, Carousel } from 'react-bootstrap';
import cx from 'classnames';
import $ from 'jquery';
import { sessionService } from 'redux-react-session';
import '../../sass/carousel.css';
import TriangleDesign from '../register/TriangleDesign';

import {
  APP_ENV,
  GOOGLE_EVENTS_TRACKING_ID,
  GOOGLE_TRACKING_ID,
  FACEBOOK_APP_ID as appId,
  serverUrl,
  cloudinary_name,
  cloudinary_url,
  imgUrl as IMAGE_URL,
  TOP_LOGO_IMAGE_BLACK,
  ACCELEVENTS_DEFAULT_EVENT_ICON,
} from '../../clientConfig';
import AEImage from '../../Core/Image';
import {
  doLogin,
  doLoginWl,
  doSignUp,
  getRedirectUrl,
  storeRedirectPath,
  whiteLabelURL,
  doFacebookLoginAdmin,
  setFooterText,
  storeUserEmailForPasswordResetPage,
  getOktaConfigurationForWL,
  loginByOktaAccessToken,
  validateIfUserAndPasswordPresent,
} from '../event/action/index';
import { onFormSubmit, storeLoginData, storeToken } from './action/index';
import { getUserByUserKeyForLogin } from '../myProfile/action/signup_action';
import Link from '../../components/Link/Link';
import IntercomWidget from '../../components/IntercomWidget';
import { createNewEventRegular } from '../admin/event/action';
import WithParams from '../../components/WrapperComponents/WithParams';
import PopupModel from '../../components/PopupModal';
import LoginForm from '../../components/Widget/Okta/LoginForm';
import AEFacebookLoginContainer from '../../Core/FacebookLoginContainer';
import AEGoogleLoginContainer from '../../Core/GoogleLoginContainer';
import AELinkedInLoginContainer from '../../Core/LinkedinLoginContainer';
import AEAppleLoginContainer from '../../Core/AppleLoginContainer';
import AEInputField from '../../Core/Input';
import AESpinner from '../../Core/Spinner/Spinner';
import AEButton from '../../Core/Button/Button';
import AELabel from '../../Core/Label/label';
import { checkEmailCon, validateUnicode } from '../../utils/common';
import SeoHelmet from '../../components/Layout/SeoHelmet';
import PasswordTooltip from '../../components/PasswordTooltip/PasswordTooltip';
import { clearLocalStorage, getLocalStorage } from '../../components/Widget/Utility/Utility';
import AETooltip from '../../Core/Tooltip';

const baseDomainUrl =
  window &&
  window.location &&
  `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
class NewLogin extends React.Component {
  constructor() {
    super();
    this.state = {
      isValidData: false,
      email: null,
      password: null,
      passwordFeedBack: false,
      loading: false,
      fbAppId: undefined,
      whiteLabelName: undefined,
      rememberMe: true,
      showErrorMessage: false,
      intercomActivated: false,
      showPopup: false,
      clientId: null,
      targetUrl: null,
      isLoad: false,
      errorMsgEmail: '',
      passwordExist: true,
      socialLoading: false,
      isNetworkError: false,
      isServerDownError: false,
      isPassword: false,
      isShowPassDetails: true,
      hidePassword: true,
      passwordValidationMessage: '',
    };
    this.showLoading = this.showLoading.bind(this);
    this.showSuccessMessage = this.showSuccessMessage.bind(this);
    this.showErrorMessage = this.showErrorMessage.bind(this);
  }

  async componentDidMount() {
    // this.hasFBCallback();
    const url = window.location.href;
    const userType = url.includes('?userType=');
    const userKey = url.includes('?userKey=');
    const urlParams = new URLSearchParams(window.location.search);
    const { history, authenticated, loginType, params } = this.props;
    if (userType) {
      const userEmail = urlParams.get('userEmail');
      this.email.value = userEmail;
      this.emailValidateHandler();
    }
    if (userKey) {
      this.checkIsKeyOrNot();
      if (urlParams.has('userKey')) {
        const resp = await this.props.getUserByUserKeyForLogin(
          urlParams.get('userKey'),
          urlParams.get('eventUrl'),
          true,
        );
        if (resp && resp.data && resp.data.redirectUrl) {
          history.push(resp.data.redirectUrl);
        } else {
          window.location = url.substr(0, url.indexOf('?userKey'));
        }
      }
    }
    this.setInitState();
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      // eslint-disable-next-line no-undef
      ga('create', GOOGLE_TRACKING_ID, 'auto');
      // eslint-disable-next-line no-undef
      ga('send', 'pageview');
    }
    const token = getLocalStorage('token');
    if (authenticated && token) {
      let whiteLabel = '';
      if (loginType === 'whiteLabel') {
        whiteLabel = params && params.params;
      }
      if (!userType) {
        this.props.getRedirectUrl(whiteLabel).then((resp) => {
          if (resp && resp.redirectUrl) {
            history.push(resp.redirectUrl);
          } else {
            history.push('/u/superadmin/events');
          }
        });
      }
    } else {
      clearLocalStorage();
      sessionService.deleteSession();
      sessionService.deleteUser();
    }
  }

  checkIsKeyOrNot = () => {
    const token = getLocalStorage('token');
    if (token === null) {
      this.setState({
        isLoad: true,
      });
    }
  };

  componentDidUpdate() {
    // this.hasFBCallback();
    this.onLoginBtnEnable();
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      // eslint-disable-next-line no-undef
      ga('set', 'page', window.location.pathname);
      // eslint-disable-next-line no-undef
      ga('send', 'pageview');
    }
  }

  UNSAFE_componentWillMount() {
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      const userId = getLocalStorage('userId');
      // eslint-disable-next-line no-undef
      ga('create', GOOGLE_EVENTS_TRACKING_ID, 'auto', 'eventTracker');
      // eslint-disable-next-line no-undef
      ga('set', '&uid', userId);
      // eslint-disable-next-line no-undef
      ga('eventTracker.send', 'pageview');
    }
  }

  hasFBCallback = () => {
    const hasCallback = window.location && window.location.search;
    if (hasCallback && hasCallback !== '') {
      $('.login-wrap').addClass('hide');
      $('.host-footer').addClass('hide');
    }
  };

  setInitState = () => {
    const { loginType, params } = this.props;
    if (loginType === 'whiteLabel') {
      this.props.whiteLabelURL(params && params.params).then((resp) => {
        if (resp && resp.errorCode === '4040201') {
          window.location.replace('/notFound');
        } else {
          this.props.setFooterText(resp && resp.footerText);
          this.setState({
            intercomActivated: resp && resp.intercomActivated,
            intercomId: resp?.intercomId,
            fbAppId: resp.fbAppId || undefined,
            whiteLabelName: resp.firmName,
            hideCreateEventButton: resp && resp.hideCreateEventButton,
          });
        }
      });
      this.props
        .getOktaConfigurationForWL(params && params.params)
        .then((resp) => {
          if (resp && resp.data) {
            const { clientId, targetUrl } = resp.data;
            this.setState({
              clientId,
              targetUrl,
            });
          }
        })
        .catch(() => {
          this.setState({
            clientId: null,
            targetUrl: null,
          });
        });
    } else {
      this.setState({ fbAppId: appId });
      this.props.setFooterText('AccelEventsFooter');
    }
  };

  showLoading = () => {
    this.setState({
      loading: true,
    });
  };

  showSuccessMessage = () => {
    this.setState({
      loading: false,
    });
  };

  showErrorMessage = () => {
    this.setState({
      loading: false,
    });
  };

  togglePopup = (showPopup) => {
    this.setState({
      showPopup,
    });
  };

  onFormClick = (e) => {
    e.preventDefault();
    const { rememberMe } = this.state;
    const { loginType, params } = this.props;
    let isValidEmailAndPassword = true;
    if (this.email.value && this.email.value.trim() === '') {
      isValidEmailAndPassword = false;
      this.setState({
        email: false,
      });
    }
    if (this.password.value && this.password.value.trim() === '') {
      isValidEmailAndPassword = false;
      this.setState({
        password: false,
      });
    }
    let { email } = this.state;
    if (!email && this.email.value && this.email.value.trim() !== '') {
      const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      email = re.test(this.email.value.trim());
      this.setState({ email });
    }
    if (this.email.value && this.email.value.trim() !== '') {
      email = !validateUnicode(this.email.value.trim());
      this.setState({ email });
    }
    if (email && this.password.value && isValidEmailAndPassword) {
      this.setState({ loading: true });
      if (loginType === 'whiteLabel') {
        this.props
          .doLoginWl(this.email.value.trim(), this.password.value.trim(), rememberMe, params.params)
          .then((resp) => {
            if (resp && resp.data) {
              this.setState({ message: 'Login Successful' });
              this.TempTimeout = setTimeout(() => {
                const url = window.location.href;
                const userType = url.includes('?userType=');
                if (userType) {
                  const urlParams = new URLSearchParams(window.location.search);
                  if (urlParams.has('userType')) {
                    urlParams.get('userType');
                    this.props.createNewEventRegular(params.params).then(() => {
                      window.location.replace(
                        `/host/eventsetup/${window.location.search}&whiteLabelUrl=${params.params}`,
                      );
                    });
                  }
                } else {
                  this.setState({ loading: false });
                  if (resp.data.redirectUrl === '/host/dashboard/home') {
                    window.location.replace(`/host/dashboard/home?whiteLabelUrl=${params.params}`);
                  } else {
                    window.location.replace(resp.data.redirectUrl);
                  }
                }
              }, 2000);
            } else if (resp && resp.errorCode === '4010102') {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: true,
                errorMessage: resp.errorMessage,
              });
            } else if (resp) {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: false,
                isNetworkError: false,
                isServerDownError: false,
              });
            } else if (window.navigator.onLine) {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: false,
                isNetworkError: false,
                isServerDownError: true,
              });
            } else {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: false,
                isNetworkError: true,
                isServerDownError: false,
              });
            }
          });
      } else {
        let currentDomain = '';
        if (baseDomainUrl !== serverUrl) {
          currentDomain = baseDomainUrl;
        }
        this.props
          .doLogin(this.email.value.trim(), this.password.value.trim(), rememberMe, '', currentDomain)
          .then((resp) => {
            if (resp && resp.data) {
              if (APP_ENV === 'production' || APP_ENV === 'stage') {
                // eslint-disable-next-line no-undef
                ga('send', {
                  hitType: 'event',
                  eventCategory: 'Login',
                  eventAction: 'login',
                  eventLabel: 'Login Successful',
                });
                // eslint-disable-next-line no-undef
                ga('eventTracker.send', {
                  hitType: 'event',
                  eventCategory: 'Login',
                  eventAction: 'login',
                  eventLabel: 'Login Successful',
                });
              }
              this.setState({ message: 'Login Successful' });
              this.TempTimeout = setTimeout(() => {
                this.setState({ loading: false });
                if (this.userType) {
                  window.location.replace(`/host/eventsetup/home?whiteLabelUrl=${this.props.params.params}`);
                }
                window.location.replace(resp.data.redirectUrl);
              }, 2000);
            } else if (resp && resp.errorCode === '4010102') {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: true,
                errorMessage: resp.errorMessage,
                isNetworkError: false,
                isServerDownError: false,
              });
            } else if (resp) {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: false,
                isNetworkError: false,
                isServerDownError: false,
              });
            } else if (window.navigator.onLine) {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: false,
                isNetworkError: false,
                isServerDownError: true,
              });
            } else {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: false,
                isNetworkError: true,
                isServerDownError: false,
              });
            }
          });
      }
    }
  };

  redirectOnSignUp = () => {
    const { params, loginType } = this.props;
    if (loginType === 'whiteLabel') {
      return `/u/wl-signup/${params && params.params}`;
    }
    return '/u/signup/';
  };

  emailValidateHandler = () => {
    this.setState({
      emailFeedBack: true,
    });
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (this.password.value && this.email.value.trim() === '') {
      this.setState({
        email: false,
      });
    } else if (checkEmailCon(this.email.value.trim())) {
      this.setState({
        email: false,
        errorMsgEmail: `You typed ".con". Did you mean ".com"?`,
      });
    } else if (validateUnicode(this.email.value.trim())) {
      this.setState({
        email: false,
        errorMsgEmail: `Unicode characters are not allowed`,
      });
    } else {
      this.setState({
        email: re.test(this.email.value.trim()),
        errorMsgEmail: '',
      });
    }
    this.setState({ isValidData: !!this.email.value && !!this.password.value });
    const { emailVal } = this.state;
    if (this.email?.value && re.test(this.email.value.trim()))
      this.props.validateIfUserAndPasswordPresent(emailVal).then((resp) => {
        if (resp?.userPresent) this.setState({ passwordExist: resp.passwordPresent });
      });
  };

  hidePasswordCharacter = () => {
    const { hidePassword } = this.state;
    this.setState({ hidePassword: !hidePassword });
  };

  onFocusPassword = () => {
    this.setState({
      isShowPassDetails: true,
      passwordValidationMessage: 'PasswordTooltip',
      passwordFeedBack: true,
      password: true,
    });
  };

  onBlurPassword = () => {
    const { passVal } = this.state;
    passVal ? this.setState({ isPassword: true }) : this.setState({ isShowPassDetails: false });
  };

  passwordValidateHandler = () => {
    const { passwordExist } = this.state;
    this.setState({
      passwordFeedBack: true,
      passVal: `${this.password.value || ''}`,
      isExisting: false,
      hasError: false,
      emailVal: this.email.value,
      isValidData: !!this.email.value && !!this.password.value,
      password: this.password.value.trim() !== '',
    });
    const newPassword = `${this.password.value || ''}`;
    if (newPassword.trim() === '') {
      return this.setState({
        password: false,
        passwordValidationMessage: newPassword?.length === 0 ? 'Password can not be empty' : 'This value is not valid',
      });
    }

    const pswValidationRegEx = /^(?=.*\d)(?=.*[_=!@#$%^&*+-])(?=.*[a-z])(?=.*[A-Z]).{}$/;
    if (!pswValidationRegEx.test(newPassword) && !passwordExist) {
      return this.setState({
        password: false,
        passwordValidationMessage: 'PasswordTooltip',
      });
    }

    return this.setState({
      passwordValidationMessage: '',
      isValidData: !!this.email.value && !!this.password.value,
      password: true,
    });
  };

  onLoginBtnEnable = () => {
    if (!this.state.isValidData && this.email && !!this.email.value && this.password.value) {
      this.setState({ isValidData: !!this.email.value && this.password.value });
    }
  };

  facebookLoginResponse = (response) => {
    if (response.accessToken && response.status !== 'not_authorized' && response.status !== 'unknown') {
      this.props.doFacebookLoginAdmin(response.accessToken).then((resp) => {
        if (resp && resp.data) {
          this.setState({ loading: false });
          window.location.replace(resp.data.redirectUrl);
        } else {
          this.setState({ hasError: true, loading: false });
        }
      });
    }
  };

  resetErrorMessages = () => {
    this.setState({
      isExisting: false,
      hasError: false,
      emailVal: this.email.value,
      passVal: this.password.value,
      isValidData: !!this.email.value && !!this.password.value,
      password: this.password.value.trim() !== '',
    });
  };

  componentWillUnmount() {
    if (this.TempTimeout) {
      clearTimeout(this.TempTimeout);
      this.TempTimeout = null;
    }
  }

  getVovels = (letter) => {
    switch (letter.toLowerCase()) {
      case 'a':
        return 'an';
      case 'e':
        return 'an';
      case 'i':
        return 'an';
      case 'o':
        return 'an';
      case 'u':
        return 'an';
      default:
        return 'a';
    }
  };

  render() {
    const {
      clientId,
      targetUrl,
      whiteLabelName,
      hideCreateEventButton,
      isLoad,
      emailVal,
      email,
      emailFeedBack,
      errorMsgEmail,
      intercomActivated,
      fbAppId,
      message,
      loading,
      isError,
      showErrorMessage,
      hasError,
      isExisting,
      errorMessage,
      showPopup,
      isValidData,
      password,
      passwordFeedBack,
      passVal,
      passwordExist,
      isEnabled,
      socialLoading,
      isNetworkError,
      isServerDownError,
      intercomId,
      isPassword,
      isShowPassDetails,
      hidePassword,
      passwordValidationMessage,
    } = this.state;
    const { params, signupType, loginType, loginByOktaAccessToken } = this.props;
    const svgObj1 = [
      {
        svgIcon: 'eye-closed-icon-pwd',
        width: '20',
        height: '16',
        viewBox: '0 0 20 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        color: '#4B4D5F',
      },
    ];
    const svgObj2 = [
      {
        svgIcon: 'eye-open-icon-pwd',
        width: '20',
        height: '14',
        viewBox: '0 0 20 14',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        color: '#4B4D5F',
      },
    ];
    return (
      <div className="new-login-page new-login-wrap new-signup-design">
        <SeoHelmet
          seoData={{
            faviconUrl: `${cloudinary_url}/${IMAGE_URL}${ACCELEVENTS_DEFAULT_EVENT_ICON}`,
            description: `${whiteLabelName || 'Accelevents'} Login Page`,
          }}
        />
        {!isLoad && getLocalStorage('token') === null ? (
          <div>
            <Col md={6} sm={12} xs={12} lg={6} className="light-theme">
              <div className="login-container">
                <div className="login-page-logo-position-fix">
                  <div className=" login-logo">
                    <Media query="(max-width: 720px)">
                      {(matches) =>
                        matches ? (
                          <>
                            <AEImage
                              className={cx('normal-logo has-custom', 'accel-events-logo accel-events-logo-top')}
                              dpr="auto"
                              crop="scale"
                              sizes="100vw"
                              cloudName={cloudinary_name}
                              type="fetch"
                              fetchFormat="auto"
                              quality="auto"
                              secure
                              responsive
                              publicId={`${IMAGE_URL}${TOP_LOGO_IMAGE_BLACK}`}
                            />
                          </>
                        ) : (
                          <>
                            <AEImage
                              className={cx('normal-logo has-custom', 'accel-events-logo-top')}
                              dpr="auto"
                              crop="scale"
                              sizes="50vw"
                              cloudName={cloudinary_name}
                              type="fetch"
                              fetchFormat="auto"
                              quality="auto"
                              secure
                              responsive
                              publicId={`${IMAGE_URL}${TOP_LOGO_IMAGE_BLACK}`}
                            />
                            {signupType === 'whiteLabel' && (
                              <div className="welcome-text p-t-20">
                                {signupType !== 'whiteLabel' ? '' : `Welcome to ${whiteLabelName}`}
                              </div>
                            )}
                          </>
                        )
                      }
                    </Media>
                  </div>
                </div>
                {loginType === 'whiteLabel' ? (
                  <div className="text-center" id="wlLogin">
                    <h5 className="text-center">
                      Log In to
                      {whiteLabelName ? (
                        ` ${whiteLabelName}`
                      ) : (
                        <div className="text-center" id="loginAttempt">
                          <h5>Log In to Accelevents</h5>
                        </div>
                      )}
                    </h5>
                  </div>
                ) : (
                  <div className="m-b-5 login-text ">Sign In</div>
                )}
                {loginType === 'whiteLabel'
                  ? !hideCreateEventButton && (
                      <h5>
                        {`Need ${this.getVovels(whiteLabelName ? whiteLabelName.charAt(0) : '')} `}
                        {whiteLabelName}
                        {`  account?`}
                        <Link to={params && `/u/wl-signup/${params.params}`} className="color-prime outline_offset_2">
                          {` Create an account.`}
                        </Link>
                      </h5>
                    )
                  : ''}
                <AELabel
                  header={'Welcome back, sign in with your credentials below'}
                  variant="body2"
                  className="font-400-label p-t-10 p-b-10"
                  color="#6d6f7d"
                />
                {loginType !== 'whiteLabel' && (
                  <>
                    <div className=" not-account pt-1 m-t-2 text-center pb-2">
                      <div className="d-flex align-items-center justify-content-space-between mt-3">
                        <AEFacebookLoginContainer
                          fixWidth
                          fbAppId={fbAppId}
                          loading={socialLoading}
                          setLoading={(socialLoading) => this.setState({ socialLoading })}
                          isFrom="Login"
                          fields="name,email,cell,other_phone"
                        />
                        <AEGoogleLoginContainer
                          loading={socialLoading}
                          setLoading={(socialLoading) => this.setState({ socialLoading })}
                          isFrom="Login"
                        />
                        <AELinkedInLoginContainer
                          loading={socialLoading}
                          setLoading={(socialLoading) => this.setState({ socialLoading })}
                          isFrom="Login"
                        />
                        <AEAppleLoginContainer
                          loading={socialLoading}
                          setLoading={(socialLoading) => this.setState({ socialLoading })}
                          isFrom="Login"
                        />
                      </div>
                      <div className="or login-or">
                        <p>
                          <div className="line line-1" />
                          <span className="login-Or"> Or </span> <div className="line  line-2" />
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {hasError && showErrorMessage ? (
                  <div
                    id="errormessage"
                    className="js-notification notification-signup mrg-t-md"
                    dangerouslySetInnerHTML={{ __html: errorMessage }}
                  />
                ) : (
                  ''
                )}
                {hasError && !isExisting && !showErrorMessage ? (
                  <div id="alertmessage" className="js-notification alert-danger notification-signup mrg-t-md mb-2">
                    {isServerDownError
                      ? 'Something went wrong. Please try again.'
                      : isNetworkError
                      ? 'You are not connected to the Internet'
                      : 'Your email and/or password is incorrect'}
                  </div>
                ) : (
                  ''
                )}

                {message && (
                  <div className={cx('ajax-msg-box text-center mrg-b-lg', !isError ? 'text-success' : 'text-danger')}>
                    {message}
                  </div>
                )}
                {loading ? (
                  <div className="ajax-msg-box text-center mrg-b-lg">
                    <div>
                      <AESpinner type="SpinnerExtraSmall" />
                    </div>
                    <span className="resp-message">Please wait...</span>
                  </div>
                ) : (
                  ''
                )}
                <form
                  className="ajax-form  validated fv-form fv-form-bootstrap"
                  onSubmit={this.onFormClick}
                  autoComplete="off"
                >
                  <div className={cx('mrg-t-sm form-group')}>
                    <AEInputField
                      name="username"
                      id="loginEmail"
                      autoComplete="off"
                      type="text"
                      inputRef={(ref) => {
                        this.email = ref;
                      }}
                      value={emailVal}
                      onChange={this.resetErrorMessages}
                      onBlur={this.emailValidateHandler}
                      size="normal"
                      valid={emailFeedBack && email}
                      feedBackText={errorMsgEmail || 'The informed email address is not valid'}
                      isFeedBackShow={emailFeedBack && !email}
                      message="Email Address"
                      maxLength={75}
                    />
                  </div>
                  <div className={cx('mrg-t-sm form-group mb-1')}>
                    <AEInputField
                      name="password"
                      id="inputLoginPassword"
                      type={hidePassword ? 'password' : 'text'}
                      autoComplete="new-password"
                      inputRef={(ref) => {
                        this.password = ref;
                      }}
                      value={passVal}
                      onChange={this.passwordValidateHandler}
                      onBlur={this.onBlurPassword}
                      onFocus={this.onFocusPassword}
                      size="normal"
                      valid={(passwordFeedBack && password) || (!passwordExist && isEnabled)}
                      feedBackText={
                        passwordValidationMessage === 'PasswordTooltip'
                          ? ''
                          : passwordValidationMessage ||
                            'Your password does not meet the requirements below. Please, try again.'
                      }
                      isFeedBackShow={passwordFeedBack && !password && (passwordExist || (!passwordExist && !password))}
                      message="Password"
                      withIcon
                      allowIconAction="click"
                      svgObj={passwordExist ? '' : hidePassword ? svgObj1 : svgObj2}
                      hidePasswordCharacter={this.hidePasswordCharacter}
                    />
                    {passwordValidationMessage === 'PasswordTooltip' && !passwordExist && (
                      <PasswordTooltip
                        password={passVal}
                        enablePasswordSubmit={(isEnabled) => this.setState({ isEnabled })}
                        isPassword={isPassword}
                        isShowPassDetails={isShowPassDetails}
                      />
                    )}
                  </div>
                  {loginType === 'whiteLabel' ? (
                    <Link
                      className="pull-right text-sm m-b-32 forgot-pwd-text outline_offset_2"
                      onClick={() => {
                        this.props.storeRedirectPath(window.location.href);
                        this.props.storeUserEmailForPasswordResetPage(this?.email?.value?.trim());
                      }}
                      to={`/u/wl-password-reset/${params && params.params}`}
                      id="forgotPassword"
                    >
                      Forgot Password ?
                    </Link>
                  ) : (
                    <Link
                      className="pull-right text-sm m-b-32  forgot-pwd-text outline_offset_2"
                      onClick={() => {
                        this.props.storeRedirectPath(window.location.href);
                        this.props.storeUserEmailForPasswordResetPage(this?.email?.value?.trim());
                      }}
                      to="/u/password-reset"
                      id="forgotLoginPassword"
                    >
                      Forgot Password ?
                    </Link>
                  )}
                  <div className="mrg-t-sm m-b-20 simple-login-btn">
                    {!passwordExist && !isEnabled && passVal ? (
                      <AETooltip
                        tooltip={'Password does not meet requirements'}
                        tooltipProps={{ placement: 'top' }}
                        className="display-inline-block width-100-percent"
                      >
                        <AEButton
                          type="submit"
                          block
                          disabled={!isValidData || (!passwordExist && !isEnabled)}
                          id="logInAttempt"
                          className={'pointer-none'}
                        >
                          Sign In
                        </AEButton>
                      </AETooltip>
                    ) : (
                      <AEButton
                        type="submit"
                        block
                        disabled={!isValidData || (!passwordExist && !isEnabled)}
                        id="logInAttempt"
                      >
                        Sign In
                      </AEButton>
                    )}
                  </div>
                </form>
                {loginType === 'whiteLabel' ? (
                  !hideCreateEventButton && (
                    <h5 className=" not-account">
                      {`Need ${this.getVovels(whiteLabelName ? whiteLabelName.charAt(0) : '')} `}
                      {whiteLabelName}
                      {`  account?`}
                      <Link to={params && `/u/wl-signup/${params.params}`} className="color-prime outline_offset_2">
                        {` Create an account.`}
                      </Link>
                    </h5>
                  )
                ) : (
                  <div className=" not-account pt-1 text-center m-t-5 pb-2">
                    {"Don't have an account yet? "}
                    <span className="signup-text-login-page">
                      <Link to="/u/signup/" className="ae-subtitle2 outline_offset_2" id="signUpAttempt">
                        Sign up for free!
                      </Link>
                    </span>
                  </div>
                )}
                {loginType === 'whiteLabel' && clientId && targetUrl ? (
                  <>
                    <div className="text-center m-b-20">
                      <div className="line line-1" /> Or <div className="line  line-2" />
                    </div>
                    <div className="mrg-t-sm">
                      <AEButton block variant="secondary" onClick={() => this.togglePopup(true)} id="oktaLogin">
                        Log In with okta
                      </AEButton>
                    </div>
                    <PopupModel
                      id="oktaLoginPopup"
                      showModal={showPopup}
                      headerText={<p>Log In To {whiteLabelName || 'Accelevents'}</p>}
                      modelBody=""
                      onCloseFunc={() => this.togglePopup(false)}
                    >
                      <div>
                        <LoginForm
                          issuer={targetUrl}
                          clientId={clientId}
                          loginByOktaAccessToken={loginByOktaAccessToken}
                          whiteLabelURL={params.params}
                        />
                      </div>
                    </PopupModel>
                  </>
                ) : (
                  ''
                )}
              </div>
            </Col>
            <Media query="(min-width: 992px)">
              {(matches) =>
                matches ? (
                  <Col
                    lg={6}
                    md={6}
                    sm={12}
                    xs={12}
                    style={{
                      background: `url(${cloudinary_url}/q_auto,f_auto/${IMAGE_URL}default_ae_images/bg.png)`,
                    }}
                    className="new-dark-theme"
                  >
                    <div className="responsive-svg">
                      <svg
                        height="39vh"
                        width="35vw"
                        viewBox="0 0 331 443"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path />
                      </svg>
                      <div className="login-carousel">
                        {signupType === 'whiteLabel' ? null : (
                          <>
                            <Carousel interval={5000} className="carousel-fade">
                              <Carousel.Item>
                                <AEImage
                                  dpr="auto"
                                  crop="scale"
                                  sizes="100vw"
                                  cloudName={cloudinary_name}
                                  type="fetch"
                                  secure
                                  responsive
                                  className="d-block w-100"
                                  publicId={`${IMAGE_URL}default_ae_images/login_carousel_image_1.png`}
                                  alt="First slide"
                                />
                                <Carousel.Caption>
                                  <div className="dark-theme-div4" />
                                  <h3>Customer Support is in our DNA</h3>
                                  <p>Our dedicated support team always has your back,</p>
                                  <p>no matter the day or time (no bots here!)</p>
                                </Carousel.Caption>
                              </Carousel.Item>

                              <Carousel.Item>
                                <AEImage
                                  dpr="auto"
                                  crop="scale"
                                  sizes="100vw"
                                  cloudName={cloudinary_name}
                                  type="fetch"
                                  secure
                                  responsive
                                  className="d-block w-100"
                                  publicId={`${IMAGE_URL}default_ae_images/login_carousel_image_2.png`}
                                  alt="First slide"
                                />
                                <Carousel.Caption>
                                  <div className="dark-theme-div4" />
                                  <h3 className="text-center">Ticketing & Registration</h3>
                                  <p>Customize your registration form and landing page to</p>
                                  <p> tailor the event experience for each and every attendee </p>
                                </Carousel.Caption>
                              </Carousel.Item>
                              <Carousel.Item>
                                <AEImage
                                  dpr="auto"
                                  crop="scale"
                                  sizes="100vw"
                                  cloudName={cloudinary_name}
                                  type="fetch"
                                  secure
                                  responsive
                                  className="d-block w-100"
                                  publicId={`${IMAGE_URL}default_ae_images/login_carousel_image_3.png`}
                                  alt="First slide"
                                />
                                <Carousel.Caption>
                                  <div className="dark-theme-div4" />
                                  <h3>Workshops & Drop-in Lounges</h3>
                                  <p>A great solution for dynamic roundtable discussions,</p>
                                  <p> interactive games, or career-building activities </p>
                                </Carousel.Caption>
                              </Carousel.Item>
                            </Carousel>
                          </>
                        )}
                      </div>
                      <span className="triangle-design">
                        <TriangleDesign />
                      </span>
                    </div>
                  </Col>
                ) : (
                  ''
                )
              }
            </Media>
          </div>
        ) : (
          <div className="login-loader text-align-center">
            <AESpinner type="SpinnerSmall" />
          </div>
        )}
        <IntercomWidget
          whiteLabelUrl={params?.params}
          intercomId={intercomId}
          unauthorised
          intercomActivated={loginType === 'whiteLabel' ? intercomActivated : true}
        />
      </div>
    );
  }
}

const mapDispatchToProps = {
  onFormSubmit: () => onFormSubmit(),
  doLogin,
  doLoginWl: (email, password, rememberme, type) => doLoginWl(email, password, rememberme, type),
  doSignUp: (email, password) => doSignUp(email, password),
  storeLoginData: (data) => storeLoginData(data),
  storeToken: (data) => storeToken(data),
  whiteLabelURL: (url) => whiteLabelURL(url),
  getRedirectUrl: (whiteLabel) => getRedirectUrl(whiteLabel),
  storeRedirectPath: (url) => storeRedirectPath(url),
  doFacebookLoginAdmin: (token) => doFacebookLoginAdmin(token),
  setFooterText: (val) => setFooterText(val),
  getUserByUserKeyForLogin: (userKey, eventUrl) => getUserByUserKeyForLogin(userKey, eventUrl, true),
  createNewEventRegular,
  storeUserEmailForPasswordResetPage,
  getOktaConfigurationForWL,
  loginByOktaAccessToken,
  validateIfUserAndPasswordPresent,
};

const mapStateToProps = (state) => ({
  counter: state.counter,
  user: state.session && state.session.user,
  authenticated: state.session.authenticated,
});
export default connect(mapStateToProps, mapDispatchToProps)(WithParams(NewLogin));
