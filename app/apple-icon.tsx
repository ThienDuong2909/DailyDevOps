import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default async function Icon() {
    // Lấy ảnh gốc public/icon.png
    const iconData = await fetch(new URL('../public/icon.png', import.meta.url)).then((res) =>
        res.arrayBuffer()
    );

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
