import { useState } from "react";
import { useNavigate } from "react-router-dom";
import talentGem from "../../assets/icons/talentgem.svg";
import emailIcon from "../../assets/icons/email.svg";
import ButtonBox from "ui-component/Button";
import { validateEmail } from "../../component/function";
import { forgetPassword } from "../../api/user/forgetPassword";
import PrimaryButton from "../../ui-component/PrimaryButton/primary-button";
import InputTG from "../../ui-component/InputTG/input-tg";
import TextTG from "../../ui-component/TextTG/text-tg";

function ForgetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [error, setError] = useState({} as any);
    const [isLoading, setIsLoading] = useState(false);


    const forget = async () => {
        setIsLoading(true);
        let loginError: any = {};
        if (!email) {
            loginError.email = "Email is required";
        } else if (email && !validateEmail(email)) {
            loginError.email = "Email is invalid";
        }
        if (Object.keys(loginError).length === 0) {
            setError({});
            let result = await forgetPassword({email});
            if (result) {
                setEmail("");
            }
        } else {
            setError(loginError);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-center flex-column m-auto w-512">
            <div className="m-b-20 text-center">
                <img src={talentGem} alt=""/>
            </div>
            <div className="container">
                <TextTG innerClass={'text-center w-full'} type='h1'>Forgot Password</TextTG>
                <TextTG innerClass={'text-center w-full m-b-20'} type='sub-title'>Enter your email and we will send you
                    instructions to reset your password</TextTG>
                <InputTG label={'Email'} icon={emailIcon} isRequired={true} setValue={(e: any) => setEmail(e)}
                         placeholder={'mail@talentgem.com'} errorMessage={error.email} type={'email'}
                         value={email}/>
                <div className="m-t-20">
                    <PrimaryButton isLoading={isLoading} onClick={forget}>Send</PrimaryButton>
                </div>
            </div>
            <div className="m-t-10">
                <ButtonBox
                    onClick={() => navigate("/login")}
                    label="Back to Login" color="var(--color-secondary1)"
                />
            </div>
        </div>
    );
}

export default ForgetPassword;
