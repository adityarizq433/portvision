import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded-md border-gray-300 text-primary-600 shadow-sm focus:ring-primary-400 focus:ring-offset-0 ' +
                className
            }
        />
    );
}
