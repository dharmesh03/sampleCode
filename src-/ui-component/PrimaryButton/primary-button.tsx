import { Button } from "@mui/material";
import React from "react";
import "./primary-button.css";

export default function PrimaryButton(
    {
        children,
        onClick,
        isLoading,
        svgIcon,
        disabled
    }: {
        children: React.ReactNode,
        onClick: any,
        isLoading?: boolean,
        svgIcon?: any,
        disabled?: boolean
    }) {

    return (
        <div>
            <Button
                fullWidth
                style={{
                    padding: 10,
                    textTransform: "capitalize",
                    fontSize: 16,
                    fontWeight: 600,
                    border: `1px solid var(--color-primary)`,
                    borderRadius: `50px`,
                    color: `#FFF`,
                    fontFamily: "Montserrat",
                    backgroundColor: `var(--color-primary)`,
                }}
                disabled={disabled}
                onClick={onClick}
            >
                <div>
                    {isLoading && (
                        <svg className="circular-loader" viewBox="25 25 50 50">
                            <circle
                                className="loader-path"
                                cx="50"
                                cy="50"
                                r="20"
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="2"
                            />
                        </svg>)
                    }
                    <span>{svgIcon}</span>
                    {children}
                </div>
            </Button>
        </div>
    );
}
