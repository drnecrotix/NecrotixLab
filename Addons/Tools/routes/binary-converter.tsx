import type { Metadata } from 'next';
import { BinaryConverter } from '@addons/Tools/components/BinaryConverter';
import { ToolShell } from '@addons/Tools/components/ToolShell';

export const metadata: Metadata = { title: 'Binary Converter', description: 'Convert values between binary, octal, decimal and hexadecimal locally in your browser.' };
export default function BinaryConverterPage() { return <ToolShell title="Binary Converter" description="Convert large integer values between base 2, 8, 10 and 16 without sending the input to a server."><BinaryConverter /></ToolShell>; }
