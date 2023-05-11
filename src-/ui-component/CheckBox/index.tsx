import "./index.css";

type checkboxProps = {
    setValue?: any;
    classes?: any;
    styles?: any;
    className?: any;
    id?: string;
    inputRef?: string;
    check?: any;
    label?: string;
};

function CheckBox({
                      setValue,
                      className,
                      id,
                      inputRef,
                      check,
                      label,
                  }: checkboxProps) {
    return (
        <div className={`ae-label form-control ${className}`}>
            <label className={`check-button ${className}`}>
                <input
                    type="checkbox"
                    className="check-button__input"
                    ref={inputRef}
                    checked={check}
                    onClick={(e: any) => setValue(e.target.checked)}
                />
                <span className="check-button__control" id={`${id}_ae_checkbox`}></span>
                <span>{label}</span>
            </label>
        </div>
    );
}

export default CheckBox;
