import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CheckBox from "ui-component/CheckBox";
import googleIcon from "../../assets/icons/google.svg";
import emailIcon from "../../assets/icons/email.svg";
import showPasswordIcon from "../../assets/icons/eyes.svg";
import talentGem from "../../assets/icons/talentgem.svg";
import { login, loginWithGoogle } from "../../api/user/login";
import { validateEmail } from "../../component/function";
import TextTG from "../../ui-component/TextTG/text-tg";
import SecondaryButton from "../../ui-component/SecondaryButton/secondary-button";
import InputTG from "../../ui-component/InputTG/input-tg";
import PrimaryButton from "../../ui-component/PrimaryButton/primary-button";
import LinkTG from "../../ui-component/LinkTG/link-tg";

function Login() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState({} as any);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();

    const redirect = () => {
        if (localStorage.getItem("user")) {
            if (window.location !== window.parent.location) {
                navigate({
                    pathname: "/candidate",
                    search: "?token=" + searchParams.get("token"),
                });
            } else {
                navigate("/dashboard/candidates");
            }
        }
    }

    useEffect(() => {
        redirect();
    }, [searchParams, navigate]);

    const googleLogin = async () => {
        setIsLoading(true);
        let loggedIn = await loginWithGoogle();
        if (loggedIn === true) {
            redirect();
        }
        setIsLoading(false);
    };

    const submit = async () => {
        setIsLoading(true);
        let loginError: any = {};
        if (!email) {
            loginError.email = "Email is required";
        } else if (email && !validateEmail(email)) {
            loginError.email = "Email is invalid";
        }
        if (!password) {
            loginError.password = "Password is required";
        } else if (password && password.length < 8) {
            loginError.password = "Password should be 8 characters";
        }
        if (Object.keys(loginError).length === 0) {
            setError({});
            let loggedIn = await login({email, password});
            if (loggedIn) {
                redirect();
            }
        } else {
            setError(loginError);
        }
        setIsLoading(false);
    };

    return (
        <div>
            <div className="flex flex-center flex-column m-auto w-512">
                <div className="m-b-20 text-center">
                    <img src={talentGem} alt=""/>
                </div>
                <div className="container">
                    <TextTG innerClass={'text-center w-full'} type='h1'>Login</TextTG>
                    <TextTG innerClass={'text-center w-full m-b-20'} type='sub-title'>Lorem ipsum dolor sitame.</TextTG>
                    <SecondaryButton isLoading={isLoading} icon={googleIcon} onClick={googleLogin}>Sign in with
                        Google</SecondaryButton>
                    <div className="flex gap-10 flex-align-center m-t-20">
                        <div className="line"/>
                        <TextTG type={'text'} innerClass='or-description'>or Sign in with Email</TextTG>
                        <div className="line"/>
                    </div>
                    <InputTG label={'Email'} icon={emailIcon} isRequired={true} setValue={(e: any) => setEmail(e)}
                             placeholder={'mail@talentgem.com'} errorMessage={error.email} type={'email'}
                             value={email}/>
                    <InputTG label={'Password'} placeholder={'Min. 8 Character'} icon={showPasswordIcon}
                             isRequired={true} errorMessage={error.password}
                             setValue={(e: any) => setPassword(e)} type='password'/>
                    <div className="m-t-20 m-b-20 flex flex-align-center flex-space-between">
                        <div>
                            <CheckBox
                                setValue={(e: boolean) => setRememberMe(e)}
                                label={"Remember Me"}
                                check={rememberMe}
                            />
                        </div>
                        <LinkTG onClick={() => {
                            navigate({
                                pathname: "/forget-password",
                                search: "?token=" + searchParams.get("token"),
                            });
                        }}>Forgot Password?</LinkTG>
                    </div>
                    <div className="m-t-20">
                        <PrimaryButton isLoading={isLoading} onClick={submit}>login</PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
