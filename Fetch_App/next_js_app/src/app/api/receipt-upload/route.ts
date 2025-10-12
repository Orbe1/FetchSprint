import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("receipt");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "A PDF receipt must be provided." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF uploads are supported in this prototype." },
        { status: 415 }
      );
    }

    const receiptText = `REAWAKN MARKET
123 Demo St, Madison, WI
Date: 2025-10-10   Time: 14:32

Milk                     $3.49
Bread                    $2.99
Eggs (12)                $4.29
Chicken Breast (2 lb)    $9.99
Pasta                    $1.89

Subtotal                 $22.65
Tax (8%)                 $1.81
TOTAL                    $24.46

Thank you for shopping with us!`;

    const items = [
      { name: "Milk", price: 3.49 },
      { name: "Bread", price: 2.99 },
      { name: "Eggs (12)", price: 4.29 },
      { name: "Chicken Breast (2 lb)", price: 9.99 },
      { name: "Pasta", price: 1.89 },
    ];

    return NextResponse.json({
      name: file.name,
      size: file.size,
      receiptText,
      items,
      summary: {
        subtotal: 22.65,
        tax: 1.81,
        total: 24.46,
        currency: "USD",
      },
    });
  } catch (error) {
    console.error("Receipt upload failed", error);
    return NextResponse.json(
      { error: "Unexpected error while processing upload." },
      { status: 500 }
    );
  }
}
