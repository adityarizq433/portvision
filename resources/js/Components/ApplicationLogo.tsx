import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect width="24" height="24" rx="6" fill="#1E55F0" />
            <path
                d="M13 10V3L4 14h7v7l9-11h-7z"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
