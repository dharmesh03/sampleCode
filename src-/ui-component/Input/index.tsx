import { InputAdornment, Input } from "@mui/material";

type inputProps = {
    label?: String;
    placeholder?: string;
    svgIcon?: any;
    className?: any;
    type?: any;
    onChange?: any;
    value?: String;
    DropDown?: any;
};

function InputBox({
                      placeholder,
                      svgIcon,
                      className,
                      type,
                      onChange,
                      value,
                      DropDown,
                  }: inputProps) {
    return (
        <div>
            <Input
                className={`${className}`}
                disableUnderline
                placeholder={`${placeholder}`}
                type={type}
                value={value}
                onChange={onChange}
                style={{padding: "12px 15px", width: "100%", color: "var(--color-secondary1)"}}
                sx={{
                    border: 1,
                    borderColor: "#E1DFEC",
                    borderRadius: 50,
                    fontSize: 13,
                }}
                endAdornment={<InputAdornment position="end">{svgIcon}{DropDown}</InputAdornment>}
            />
        </div>
    );
}

export default InputBox;
