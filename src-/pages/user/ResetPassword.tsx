import talentGem from "../../assets/icons/talentgem.svg";
import showPasswordIcon from "../../assets/icons/eyes.svg";
import { useState } from "react";
import TextTG from "../../ui-component/TextTG/text-tg";
import InputTG from "../../ui-component/InputTG/input-tg";
import PrimaryButton from "../../ui-component/PrimaryButton/primary-button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/user/resetPassword";

function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState({} as any);
    const [searchParams] = useSearchParams();

    const submit = async () => {
        setIsLoading(true);
        let resetError: any = {};
        if (!password) {
            resetError.password = "Password is required";
        } else if (!confirmPassword) {
            resetError.confirmPassword = "Confirm password is required";
        }
        if (Object.keys(resetError).length === 0) {
            setError({});
            let result = await resetPassword({password, token: searchParams.get("token")});
            if (result) {
                setPassword("");
                setConfirmPassword("");
                navigate("/login");
            }
        } else {
            setError(resetError);
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
                    <TextTG innerClass={'text-center w-full'} type='h1'>Reset Password</TextTG>
                    <TextTG innerClass={'text-center w-full m-b-20'} type='sub-title'>Enter your new password which
                        should be different from previous used passwords.</TextTG>
                    <InputTG label={'Password'} placeholder={'Enter your password'} icon={showPasswordIcon}
                             isRequired={true}
                             value={password}
                             errorMessage={error.password}
                             setValue={(e: any) => setPassword(e)}
                             type='password'/>
                    <InputTG label={'Confirm Password'} placeholder={'Enter your password'}
                             isRequired={true}
                             type='password'
                             value={confirmPassword}
                             errorMessage={error.confirmPassword}
                             setValue={(e: any) => setConfirmPassword(e)}
                             icon={showPasswordIcon}/>
                    <div className="m-t-20">
                        <PrimaryButton onClick={submit} isLoading={isLoading}>Reset Password</PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
