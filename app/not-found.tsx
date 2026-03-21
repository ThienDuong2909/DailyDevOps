'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const commands = [
    { prompt: '$ curl -I https://blog.thienduong.info/unknown-page', delay: 0 },
    { output: 'HTTP/1.1 404 Not Found', delay: 800, class: 'text-[#fa6238]' },
    { output: 'Content-Type: text/html; charset=UTF-8', delay: 1000, class: 'text-[#586069]' },
    { output: 'X-Powered-By: DevOps Blog v2.4.0', delay: 1200, class: 'text-[#586069]' },
    { output: '', delay: 1400, class: '' },
    { output: 'Error: The requested resource was not found on this server.', delay: 1600, class: 'text-yellow-400' },
    { output: 'Suggestion: Check the URL or navigate to the homepage.', delay: 2000, class: 'text-[#0bda5b]' },
];

export default function NotFoundPage() {
    const [visibleLines, setVisibleLines] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        commands.forEach((cmd, i) => {
            setTimeout(() => setVisibleLines(i + 1), cmd.delay);
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setShowCursor(prev => !prev), 530);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Terminal Window */}
                <div className="rounded-xl overflow-hidden shadow-2xl border border-[#30363d]">
                    {/* Title Bar */}
                    <div className="bg-[#161b22] px-4 py-3 flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-[#ff5f56]" />
                            <div className="size-3 rounded-full bg-[#ffbd2e]" />
                            <div className="size-3 rounded-full bg-[#27c93f]" />
                        </div>
                        <span className="ml-4 text-[#8b949e] text-xs font-mono">bash — 404: page not found</span>
                    </div>

                    {/* Terminal Body */}
                    <div className="bg-[#0d1117] p-6 font-mono text-sm leading-relaxed min-h-[320px]">
                        {/* ASCII Art */}
                        <pre className="text-[#137fec] text-xs mb-6 select-none">
{`  _  _    ___  _  _   
 | || |  / _ \\| || |  
 | || |_| | | | || |_ 
 |__   _| | | |__   _|
    | | | |_| |  | |  
    |_|  \\___/   |_|  `}
                        </pre>

                        {/* Command Output */}
                        {commands.slice(0, visibleLines).map((line, i) => (
                            <div key={i} className={`${line.class || 'text-[#e6edf3]'} ${line.output === '' ? 'h-4' : ''}`}>
                                {line.prompt && (
                                    <span>
                                        <span className="text-[#0bda5b]">devops</span>
                                        <span className="text-[#8b949e]">@</span>
                                        <span className="text-[#137fec]">blog</span>
                                        <span className="text-[#8b949e]">:</span>
                                        <span className="text-[#c9d1d9]">~</span>
                                        <span className="text-[#8b949e]">$ </span>
                                        <span className="text-white">{line.prompt.replace('$ ', '')}</span>
                                    </span>
                                )}
                                {line.output !== undefined && !line.prompt && (
                                    <span>{line.output}</span>
                                )}
                            </div>
                        ))}

                        {/* Blinking cursor */}
                        {visibleLines >= commands.length && (
                            <div className="mt-2">
                                <span className="text-[#0bda5b]">devops</span>
                                <span className="text-[#8b949e]">@</span>
                                <span className="text-[#137fec]">blog</span>
                                <span className="text-[#8b949e]">:</span>
                                <span className="text-[#c9d1d9]">~</span>
                                <span className="text-[#8b949e]">$ </span>
                                <span className={`inline-block w-2 h-4 bg-[#0bda5b] align-middle ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg transition-colors shadow-lg shadow-[#137fec]/20"
                    >
                        <span className="material-symbols-outlined text-lg">home</span>
                        Go Home
                    </Link>
                    <Link
                        href="/blog"
                        className="flex items-center gap-2 px-6 py-3 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] font-bold rounded-lg border border-[#30363d] transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">article</span>
                        Read Blog
                    </Link>
                </div>

                <p className="text-center text-[#484f58] text-xs font-mono mt-6">
                    exit code: 404 | process exited with error
                </p>
            </div>
        </div>
    );
}
