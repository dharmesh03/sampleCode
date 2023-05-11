import { Button } from "@mui/material";
import "../PrimaryButton/primary-button.css";


type btnProps = {
    label?: String;
    borderColor?: any;
    color?: any;
    svgIcon?: any;
    disabled?: boolean;
    onClick?: any;
    isLoading?: boolean;
    backgroundColor?: any;
    borderRadius?: any;
    iconClassName?: any;
};

export default function ButtonBox(
    {
        label,
        borderColor,
        color,
        svgIcon,
        disabled,
        onClick,
        isLoading,
        backgroundColor,
        borderRadius,
        iconClassName,
    }: btnProps) {
    const loadIcon = () => (
        <svg className="circular-loader" viewBox="25 25 50 50">
            <circle
                className="loader-path"
                cx="50"
                cy="50"
                r="20"
                fill="none"
                stroke="#000000"
                strokeWidth="2"
            />
        </svg>
    );

    return (
        <div>
            <Button
                fullWidth
                style={{
                    padding: "10px 0",
                    textTransform: "capitalize",
                    fontSize: 16,
                    fontWeight: 600,
                    border: `1px solid ${borderColor}`,
                    borderRadius: `${borderRadius}`,
                    color: `${color}`,
                    fontFamily: "Montserrat",
                    backgroundColor: `${backgroundColor}`,
                }}
                disabled={disabled}
                onClick={onClick}
            >
                <div className={iconClassName}>
                    {isLoading && loadIcon}
                    <span style={{color:"blue"}}>{svgIcon}</span>
                    {label}
                </div>
            </Button>
        </div>
    );
}
