import { Button } from "@mui/material";
import SVG from 'react-inlinesvg';
import "./icon-button.css";

export default function IconButton(
    {
        onClick,
        icon,
        isActive,
        borderRadius
    }: {
        onClick: any,
        icon: string,
        isActive: boolean,
        borderRadius?: any
    }) {

    return (
        <Button
            className={'icon-button'}
            style={{
                padding: 15,
                backgroundColor: isActive ? 'var(--color-primary)' : '#FFFFFF',
                minWidth: 48,
                borderRadius: `${borderRadius}`
            }}
            onClick={onClick}>
            <div className={`${isActive && 'active'} icon`}>
                <SVG src={icon} width={18} height='auto'/>
            </div>
        </Button>
    );
}
