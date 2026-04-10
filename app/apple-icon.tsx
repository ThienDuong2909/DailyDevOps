import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const runtime = 'nodejs';

export default async function Icon() {
    // Read file natively via Node.js to bypass Webpack's sharp loader which fails on older Jenkins CI CPUs
    const iconPath = path.join(process.cwd(), 'public', 'icon.png');
    const iconData = fs.readFileSync(iconPath);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'white', // Apple Icon luôn nên có nền trắng phía sau cho an toàn
                }}
            >
                {/* Scale ảnh to lên 135% để tự động crop lề */}
                {/* @ts-ignore */}
                <img 
                    src={iconData as any} 
                    style={{ 
                        width: '135%', 
                        height: '135%', 
                    }} 
                />
            </div>
        ),
        { ...size }
    );
}
