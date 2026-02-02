import { forwardRef } from "react";
import { format } from "date-fns";

interface SaleItem {
  id: string;
  product: { name: string } | null;
  quantity: number;
  unit_price: number;
  discount: number | null;
  total_price: number;
}

interface Sale {
  id: string;
  sale_number: string;
  sale_date: string;
  customer: { name: string; phone?: string; email?: string; address?: string } | null;
  payment_method: string | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  notes: string | null;
  items: SaleItem[];
}

interface SaleReceiptProps {
  sale: Sale;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
}

const SaleReceipt = forwardRef<HTMLDivElement, SaleReceiptProps>(
  ({ sale, shopName = "Naeem Optics", shopAddress = "Circular-Road, Sheranwala Gate, Near Allied Bank", shopPhone = "+92 300 9839515", shopEmail = "saadk2953@gmail.com" }, ref) => {
    const subtotal = sale.items?.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0) || 0;
    const totalDiscount = sale.items?.reduce((sum, item) => sum + Number(item.discount || 0), 0) || 0;

    return (
      <div ref={ref} className="bg-white text-black p-6 w-[80mm] mx-auto font-mono text-xs print:w-full print:max-w-[80mm]">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
          <h1 className="text-lg font-bold uppercase tracking-wide">{shopName}</h1>
          <p className="text-[10px] mt-1">{shopAddress}</p>
          <p className="text-[10px]">Tel: {shopPhone}</p>
          <p className="text-[10px]">{shopEmail}</p>
        </div>

        {/* Receipt Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span className="font-semibold">Receipt #:</span>
            <span>{sale.sale_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{format(new Date(sale.sale_date), "dd/MM/yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Time:</span>
            <span>{format(new Date(sale.sale_date), "HH:mm:ss")}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Payment:</span>
            <span className="capitalize">{sale.payment_method || "Cash"}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <p className="font-semibold mb-1">Customer:</p>
          <p>{sale.customer?.name || "Walk-in Customer"}</p>
          {sale.customer?.phone && <p>Tel: {sale.customer.phone}</p>}
          {sale.customer?.email && <p>{sale.customer.email}</p>}
          {sale.customer?.address && <p>{sale.customer.address}</p>}
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-1 pr-1 max-w-[80px] truncate">
                    {item.product?.name || "Unknown"}
                  </td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">Rs.{Number(item.unit_price).toFixed(0)}</td>
                  <td className="text-right py-1">Rs.{Number(item.total_price).toFixed(0)}</td>
                </tr>
              ))}
              {sale.items?.filter(item => Number(item.discount) > 0).map((item) => (
                <tr key={`discount-${item.id}`} className="text-gray-600">
                  <td colSpan={3} className="py-0.5 text-right text-[10px]">
                    Discount on {item.product?.name?.substring(0, 10)}...
                  </td>
                  <td className="text-right py-0.5 text-[10px]">
                    -Rs.{Number(item.discount).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs.{subtotal.toFixed(0)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Total Discount:</span>
              <span>-Rs.{totalDiscount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1">
            <span>TOTAL:</span>
            <span>Rs.{Number(sale.total_amount).toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-green-700">
            <span>Paid:</span>
            <span>Rs.{Number(sale.paid_amount || 0).toFixed(0)}</span>
          </div>
          {Number(sale.balance || 0) > 0 && (
            <div className="flex justify-between font-bold text-red-600">
              <span>Balance Due:</span>
              <span>Rs.{Number(sale.balance).toFixed(0)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
            <p className="font-semibold">Notes:</p>
            <p className="text-[10px]">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] space-y-1">
          <p className="font-semibold">Thank you for your purchase!</p>
          <p>Please keep this receipt for your records.</p>
          <p>Returns accepted within 7 days with receipt.</p>
          <div className="mt-3 pt-2 border-t border-gray-300">
            <p className="text-[9px] text-gray-500">
              {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

SaleReceipt.displayName = "SaleReceipt";

export default SaleReceipt;
