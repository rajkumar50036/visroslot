import { NextResponse } from "next/server";
import { z } from "zod";
import { generateOrderNumber } from "@/lib/utils";

const OrderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().positive(),
  totalPrice: z.number().positive(),
  variant: z.string().optional(),
  addons: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const CreateOrderSchema = z.object({
  restaurantId: z.string(),
  branchId: z.string().optional(),
  tableId: z.string(),
  tableNumber: z.string(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "Order must contain at least 1 food item"),
  specialInstructions: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateOrderSchema.parse(body);

    const subtotal = validated.items.reduce((sum, it) => sum + it.totalPrice, 0);
    const taxRate = 8.25; // standard restaurant tax rate
    const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

    const orderNumber = generateOrderNumber();
    const orderId = `ord-${Date.now()}`;

    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      restaurant_id: validated.restaurantId,
      branch_id: validated.branchId,
      table_id: validated.tableId,
      table_number: validated.tableNumber,
      customer_name: validated.customerName || `Table ${validated.tableNumber} Guest`,
      customer_phone: validated.customerPhone,
      order_status: "PENDING",
      payment_status: "UNPAID",
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      special_instructions: validated.specialInstructions,
      kitchen_station: "Hot Line",
      placed_at: new Date().toISOString(),
      items: validated.items.map((it, idx) => ({
        id: `item-${orderId}-${idx}`,
        order_id: orderId,
        menu_item_id: it.menuItemId,
        item_name: it.name,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        total_price: it.totalPrice,
        selected_variant: it.variant,
        selected_addons: it.addons,
        kitchen_notes: it.notes,
      })),
    };

    return NextResponse.json({
      success: true,
      message: "Order placed successfully. Pay at counter upon dining completion.",
      order: newOrder,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process order" },
      { status: 500 }
    );
  }
}
