import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './GCodeEditor.module.css';
export function GCodeButton({ children, icon, primary = false, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode; primary?: boolean }) {
    return <button type="button" {...props} className={`${styles.button} ${primary ? styles.primaryButton : ''} ${className}`}>{icon}{children}</button>;
}
