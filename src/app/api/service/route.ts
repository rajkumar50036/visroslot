import { NextResponse } from "next/server";
import { z } from "zod";

const ServiceSchema = z.object({
  restaurantId: z.string(),
  branchId: z.string().optional(),
  tableNumber: z.string(),
  type: z.enum(["CALL_WAITER", "REQUEST_BILL", "EMERGENCY"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = ServiceSchema.parse(body);

    const alertItem = {
      id: `alert-${Date.now()}`,
      restaurant_id: validated.restaurantId,
      branch_id: validated.branchId,
      table_number: validated.tableNumber,
      type: validated.type,
      status: "PENDING",
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `${validated.type} request dispatched to restaurant dashboard.`,
      alert: alertItem,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
