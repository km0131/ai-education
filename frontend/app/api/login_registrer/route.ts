import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, images } = body;

        // Mock validation
        // In a real app, we would check if 'images' matches the stored password for 'username'
        if (images && images.length === 3) {
            return NextResponse.json({
                password: true
            });
        }

        return NextResponse.json({
            password: false,
            error: "パスワードが ちがいます"
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'エラーが発生しました' },
            { status: 500 }
        );
    }
}
