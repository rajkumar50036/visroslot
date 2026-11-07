import { NextResponse } from "next/server";
import { z } from "zod";

const CollectSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  tableNumber: z.string(),
  restaurantId: z.string(),
  branchId: z.string().optional(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["CASH", "UPI", "CARD"]),
  collectedBy: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CollectSchema.parse(body);

    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const collection = {
      id: `col-${Date.now()}`,
      order_id: validated.orderId,
      order_number: validated.orderNumber,
      table_number: validated.tableNumber,
      restaurant_id: validated.restaurantId,
      branch_id: validated.branchId,
      amount: validated.amount,
      payment_method: validated.paymentMethod,
      receipt_number: receiptNumber,
      collected_by: validated.collectedBy,
      notes: validated.notes || `Counter ${validated.paymentMethod} verified`,
      collected_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Payment successfully recorded at counter.",
      collection,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
