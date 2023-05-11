import { MenuItem, Select } from "@mui/material";
import "./inline-select.css";
import arrow from "../../assets/icons/arrow.svg";

function InlineSelect(
    {
        options,
        className
    }: {
        options: any[],
        className?: string
    }) {
    return (
        <div className={`inline-select ${className}`}>
            <Select value={options[0]}>
                {
                    options.map((o) => (<MenuItem key={o} value={o}>{o}</MenuItem>))
                }
            </Select>
            <img src={arrow} alt={'arrow'} className={`arrow`}/>
        </div>
    );
}

export default InlineSelect;
