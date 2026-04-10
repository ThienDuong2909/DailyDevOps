import { ImageResponse } from 'next/og';

export const alt = 'Daily DevOps - Ghi chép của kỹ sư hệ thống';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default async function Image() {
    // Đọc file icon.png cùng cấp trong thư mục app để đưa vào OG Image
    const iconData = await fetch(new URL('./icon.png', import.meta.url)).then((res) =>
        res.arrayBuffer()
    );

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #0ea5e9 100%)', // Space đen mix Ocean Blue
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '80px',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '40px',
                    }}
                >
                    {/* @ts-ignore - ImageResponse supports array buffers */}
                    <img
                        src={iconData as any}
                        width="140"
                        height="140"
                        style={{
                            marginRight: '50px',
                            boxShadow: '0 0 50px rgba(14, 165, 233, 0.5)'
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            fontSize: '110px',
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                        }}
                    >
                        <span style={{ color: '#f8fafc' }}>Daily</span>
                        <span style={{ color: '#38bdf8', marginLeft: '30px' }}>DevOps</span>
                    </div>
                </div>

                <p
                    style={{
                        fontSize: '40px',
                        color: '#cbd5e1',
                        maxWidth: '900px',
                        lineHeight: 1.5,
                        fontWeight: 500,
                        marginTop: '20px',
                    }}
                >
                    Khám phá chuyên sâu về Kubernetes, CI/CD, Container & Cloud Native Architecture.
                </p>

                <div
                    style={{
                        display: 'flex',
                        position: 'absolute',
                        bottom: '40px',
                        borderTop: '2px solid rgba(255,255,255,0.15)',
                        width: '80%',
                        paddingTop: '30px',
                        justifyContent: 'center',
                    }}
                >
                    <span
                        style={{
                            color: '#f1f5f9',
                            fontSize: '32px',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em'
                        }}
                    >
                        dailydevops.blog
                    </span>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
