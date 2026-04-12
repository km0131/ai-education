import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { qr_data } = body;

        console.log("Received QR Data:", qr_data);

        // Mock validation logic
        if (!qr_data) {
            return NextResponse.json(
                { error: 'QRコードのデータがありません' },
                { status: 400 }
            );
        }

        // Here you would check the DB
        // For now, we mock a successful login if the QR data contains "login"
        // or just accept anything for the demo

        // Example: Direct login
        return NextResponse.json({
            status: 'success',
            password: true, // Login success flag
            username: 'ゲスト'
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
