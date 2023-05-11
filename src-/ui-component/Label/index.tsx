import "./index.css";

type labelProps = {
    onClick?: any;
    classes?: any;
    color?: string;
    header?: any;
    labelClassName?: any;
    styles?: any;
    labelIdName?: any;
    className?: any;
    required?: string;
    requiredClassName?: any;
    icon?: any;
    [key: string]: any;
};

function Label({
                   onClick,
                   labelClassName,
                   styles,
                   header,
                   labelIdName,
                   className,
                   requiredClassName,
                   required,
                   color,
                   icon,
                   ...props
               }: labelProps) {
    return (
        <div className={`'ae-label', ${className}`} onClick={onClick}>{icon}
            <label
                className={labelClassName}
                id={labelIdName}
                style={styles}
                {...props}>
                {header}
                <span className={requiredClassName}>{required}</span>
            </label>
        </div>
    );
}

export default Label;
