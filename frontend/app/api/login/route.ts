import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { inputUsername } = body;

        if (!inputUsername) {
            return NextResponse.json(
                { error: 'なまえを いれてね' },
                { status: 400 }
            );
        }

        // Mock response
        // Using the icon.png for all options for now
        return NextResponse.json({
            status: "next_step",
            img_list: ["/icon.png", "/icon.png", "/icon.png", "/icon.png", "/icon.png", "/icon.png"], // 6 dummy images
            img_name: ["dog", "cat", "rabbit", "bear", "fox", "panda"]
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'エラーが発生しました' },
            { status: 500 }
        );
    }
}
