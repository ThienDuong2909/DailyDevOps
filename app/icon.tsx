import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
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
                    overflow: 'hidden', // Cắt bỏ những phần dư ở viền
                }}
            >
                {/* Scale ảnh to lên 135% để khử padding/margin màu trắng dư thừa ở viền ngoài */}
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
