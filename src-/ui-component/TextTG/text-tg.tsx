import "./text-tg.css";
import React from "react";

function TextTG(
    {
        type,
        bold,
        children,
        innerClass,
        isPrimary
    }: {
        type: 'info' | 'small-text' | 'text' | 'sub-title' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
        bold?: boolean,
        children: React.ReactNode,
        innerClass?: string,
        isPrimary?: boolean
    }) {
    return (
        <>
            {type === 'h1' && (<h1 className={innerClass}>{children}</h1>)}
            {type === 'h2' && (<h2 className={innerClass}>{children}</h2>)}
            {type === 'h3' && (<h3 className={innerClass}> {children}</h3>)}
            {type === 'h4' && (<h4 className={innerClass}>{children}</h4>)}
            {type === 'sub-title' && (
                <p className={`sub-title ${bold && 'bold'} ${innerClass} ${isPrimary && 'c-primary'}`}>{children}</p>)}
            {type === 'text' && (
                <p className={`text ${bold && 'bold'} ${innerClass} ${isPrimary && 'c-primary'}`}>{children}</p>)}
            {type === 'small-text' && (
                <p className={`small-text ${innerClass} ${bold && 'bold'} ${isPrimary && 'c-primary'}`}>{children}</p>)}
            {type === 'info' && (<p className={`info ${innerClass} ${isPrimary && 'c-primary'}`}>{children}</p>)}
        </>
    );
}

export default TextTG;
