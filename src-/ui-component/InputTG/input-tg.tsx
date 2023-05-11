import "./input-tg.css";
import InputBox from "../InputBox";
import errorIcon from "../../assets/icons/error.svg";

function InputTG(
    {
        placeholder,
        errorMessage,
        icon,
        value,
        setValue,
        type,
        label,
        isRequired,
        innerClass,
        dashboardMode
    }: {
        placeholder?: string,
        errorMessage?: string,
        icon?: any,
        type?: string,
        value?: string,
        setValue?: any,
        isRequired?: boolean,
        label?: string,
        innerClass?: string,
        dashboardMode?: boolean
    }) {
    return (
        <div className={`input-container ${dashboardMode && 'dashboard-mode'} ${!dashboardMode && 'm-t-20 m-b-20'} ${innerClass}`}>
            {label && (<label className={'label'}>{label}{isRequired && (<span className='required'>*</span>)}</label>)}
            <InputBox
                placeholder={placeholder}
                className={`input ${errorMessage ? "errored" : ""}`}
                type={type}
                value={value}
                onChange={(e: any) => setValue(e.target.value)}
                svgIcon={icon && <img src={icon} alt=""/>}
            />
            {errorMessage && (
                <div className="error">
                    <img src={errorIcon} alt=""/>
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

export default InputTG;
